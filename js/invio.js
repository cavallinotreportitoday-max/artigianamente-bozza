// Invio dei moduli al server (backend, Fase 1).
// Se la pagina non ha l'indirizzo del server (meta am-api), resta la prova: non parte niente.
// La richiesta si dice "ricevuta" solo quando il server risponde che l'ha salvata.

const $ = (s, r = document) => r.querySelector(s);
const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.content?.trim() || '';
const API = meta('am-api');
const REVISIONE = Number(meta('am-revisione')) || null;

const uuid = () => {
	if (crypto.randomUUID) return crypto.randomUUID();
	const b = crypto.getRandomValues(new Uint8Array(16));
	b[6] = (b[6] & 15) | 64;
	b[8] = (b[8] & 63) | 128;
	const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

// Foto grandi del telefono: rimpicciolite prima di inviarle (più veloce e senza superare i limiti)
const LATO = 2000;
async function riduci(f) {
	if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size < 1.5 * 1024 * 1024 || !window.createImageBitmap) return f;
	try {
		const img = await createImageBitmap(f);
		const k = Math.min(1, LATO / Math.max(img.width, img.height));
		const c = document.createElement('canvas');
		c.width = Math.round(img.width * k);
		c.height = Math.round(img.height * k);
		c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
		const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
		if (!blob || blob.size >= f.size) return f;
		return new File([blob], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
	} catch {
		return f;
	}
}

const euro = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* Il messaggio della richiesta (12/10, flussi guidati): prima i «Dettagli del progetto» scritti dal sito con le
   risposte di adesso (rifatti a ogni invio: niente accumuli), poi la «Nota del cliente». Le date hanno i loro campi;
   il periodo («Nel prossimo mese»…) va nei dettagli. Al massimo 4.000 caratteri, come nel database. */
export const MAX_MESSAGGIO = 4000;
export function messaggioDi(form) {
	const fd = new FormData(form);
	const g = (k) => String(fd.get(k) ?? '').trim();
	const am = form._am || null;
	const periodo = g('periodo') && g('periodo') !== 'Ho una data' ? `- Periodo preferito: ${g('periodo')}` : '';
	// il periodo con le altre risposte, prima della riga «Esito»
	const righe = (typeof am?.dettagli === 'function' ? am.dettagli() : '').split('\n').filter(Boolean);
	const k = righe.findIndex((r) => r.startsWith('Esito:'));
	if (periodo) righe.splice(k < 0 ? righe.length : k, 0, periodo);
	const dettagli = righe.join('\n');
	const nota = g('messaggio');
	return [dettagli && `Dettagli del progetto\n${dettagli}`, nota && `Nota del cliente\n${nota}`].filter(Boolean).join('\n\n');
}
function troppoLungo(form, n) {
	const nota = form.querySelector('textarea[name="messaggio"]');
	const quanto = n - MAX_MESSAGGIO;
	const testo = `La nota è troppo lunga: togli circa ${quanto} caratteri (al massimo 4.000 caratteri in tutto, con i dettagli del progetto).`;
	const avviso = form.querySelector('[data-pv-msg-limite]');
	if (avviso) {
		avviso.textContent = testo;
		avviso.hidden = false;
	}
	form._rr?.apriDettagli(true);
	nota?.setAttribute('aria-invalid', 'true');
	nota?.focus({ preventScroll: false });
	return Object.assign(new Error('lungo'), { messaggio: testo });
}

export function attivaModuli(moduli) {
	for (const form of moduli) {
		const ok = $('[data-conferma]', form);
		const esito = $('[data-esito]', form);
		const bottone = $('button[type="submit"]', form);
		const testoBottone = bottone?.textContent.trim() || 'Invia';
		let chiave = null;
		let conferma = null;
		let inviata = false;
		let occupato = false;

		const bott = (testo, attivo) => {
			if (!bottone) return;
			bottone.textContent = testo;
			bottone.disabled = !attivo;
		};
		const mostra = (tipo, testo, azioni = []) => {
			if (!esito) return;
			esito.className = `invio-esito invio-esito--${tipo}`;
			const p = document.createElement('p');
			p.textContent = testo;
			const figli = [p];
			if (azioni.length) {
				const riga = document.createElement('div');
				riga.className = 'btns';
				for (const [etichetta, classe, fai] of azioni) {
					const b = document.createElement('button');
					b.type = 'button';
					b.className = classe;
					b.textContent = etichetta;
					b.addEventListener('click', fai);
					riga.append(b);
				}
				figli.push(riga);
			}
			esito.replaceChildren(...figli);
			esito.hidden = false;
			esito.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		};
		const nascondi = () => {
			if (esito) esito.hidden = true;
		};

		form.addEventListener('input', (e) => {
			if (e.target?.name !== 'messaggio') return;
			const avviso = form.querySelector('[data-pv-msg-limite]');
			if (avviso && !avviso.hidden && messaggioDi(form).length <= MAX_MESSAGGIO) {
				avviso.hidden = true;
				e.target.removeAttribute('aria-invalid');
				nascondi();
			}
		});
		// Dopo l'invio, se il cliente cambia qualcosa, è una richiesta nuova
		form.addEventListener('input', () => {
			if (!inviata) return;
			inviata = false;
			chiave = null;
			conferma = null;
			if (ok) ok.hidden = true;
			bott(testoBottone, true);
		});

		async function prepara() {
			const fd = new FormData(form);
			const g = (k) => String(fd.get(k) ?? '').trim();
			const generale = form.hasAttribute('data-generale');
			const am = form._am || null; // lo scrivono i calcolatori: { lavoro, calcolo, modo, dettagli }
			const messaggio = generale ? g('messaggio') : messaggioDi(form);
			if (messaggio.length > MAX_MESSAGGIO) throw troppoLungo(form, messaggio.length);
			const dati = {
				chiave,
				origine: generale ? 'contatti' : form.closest('[data-pv]') ? 'preventivo' : 'pagina_servizio',
				servizio: generale ? g('servizio') : form.dataset.servizio || null,
				lavoro: am?.lavoro ?? null,
				nome: g('nome'),
				telefono: g('telefono'),
				email: g('email'),
				comune: g('comune'),
				// 12/10 (flussi guidati): «Dettagli del progetto» (tutte le risposte e il periodo) + «Nota del cliente»
				messaggio,
				riepilogo: g('riepilogo'),
				preferenza_sopralluogo: g('data-sopralluogo') || null,
				preferenza_inizio: g('inizio-desiderato') || null,
				privacy: fd.get('privacy') != null,
				sito_web: g('sito_web'),
				revisione: REVISIONE,
				calcolo: am?.modo === 'valutazione' ? null : (am?.calcolo ?? null),
				conferma
			};
			// richiesta di valutazione esplicita (senza stima): solo dal Preventivo, mai dai Contatti
			if (!generale && am?.modo === 'valutazione') dati.modo = 'valutazione';
			if (generale) dati.extra = { partenza: g('partenza'), arrivo: g('arrivo'), data: g('data'), locali: g('locali') };
			const corpo = new FormData();
			corpo.set('dati', JSON.stringify(dati));
			for (const campo of ['foto', 'foto-oggetti']) {
				for (const f of fd.getAll(campo)) {
					if (!(f instanceof File) || !f.size) continue;
					const r = await riduci(f);
					if (r.size > 10 * 1024 * 1024) throw Object.assign(new Error('pesante'), { messaggio: 'Una foto è troppo pesante (massimo 10 MB). Toglila o scegline una più leggera.' });
					corpo.append(campo, r, r.name);
				}
			}
			return corpo;
		}

		async function manda(rifatto = false) {
			if (occupato) return;
			occupato = true;
			chiave ??= uuid();
			bott('Invio in corso…', false);
			mostra('attesa', 'Invio in corso… Non chiudere la pagina.');
			try {
				const r = await fetch(API, { method: 'POST', body: await prepara(), credentials: 'omit' });
				const j = await r.json().catch(() => null);
				if (r.ok && j?.ok) {
					inviata = true;
					document.dispatchEvent(new CustomEvent('am:richiesta-inviata')); // le date preferite si usano una volta sola
					nascondi();
					if (ok) {
						const t = $('span', ok);
						if (t) t.textContent = `Richiesta ricevuta. Il tuo codice è ${j.codice}. Ti ricontattiamo per concordare il sopralluogo.`;
						ok.hidden = false;
						ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
					}
					bott('Richiesta inviata', false);
					return;
				}
				if (r.status === 409 && j?.errore === 'prezzo_aggiornato') {
					bott(testoBottone, true);
					const s = j.stima;
					mostra('avviso', j.messaggio || 'Abbiamo aggiornato le tariffe. Vuoi inviare la richiesta con la stima aggiornata?', [
						[
							s ? `Invia con ${euro(s.min)}–${euro(s.max)} €` : 'Invia così',
							'btn',
							() => {
								conferma = { revisione: j.revisione, min: s?.min ?? null, max: s?.max ?? null };
								occupato = false;
								manda();
							}
						],
						['Annulla', 'btn btn--line', nascondi]
					]);
					return;
				}
				if (r.status === 409 && j?.errore === 'chiave_riusata' && !rifatto) {
					chiave = uuid();
					occupato = false;
					return manda(true);
				}
				bott('Riprova', true);
				if (r.status === 400 && j?.campi) mostra('errore', Object.values(j.campi).join(' '));
				else mostra('errore', j?.messaggio || 'Non siamo riusciti a inviare la richiesta. Riprova tra poco oppure chiamaci.');
			} catch (e) {
				bott('Riprova', true);
				// Senza risposta non si sa se la richiesta è arrivata: il reinvio usa la stessa chiave, quindi niente doppioni
				mostra('errore', e?.messaggio || 'Connessione assente o lenta: non sappiamo se la richiesta è arrivata. Premi Riprova quando la rete torna: se era già arrivata non si crea un doppione. I dati restano qui.');
			} finally {
				occupato = false;
			}
		}

		form.addEventListener('submit', (e) => {
			e.preventDefault();
			if (!form.checkValidity()) {
				form.reportValidity();
				return;
			}
			// nota troppo lunga: si dice subito, prima di inviare (niente tagli in silenzio)
			if (!form.hasAttribute('data-generale') && messaggioDi(form).length > MAX_MESSAGGIO) {
				const e = troppoLungo(form, messaggioDi(form).length);
				mostra('errore', e.messaggio);
				return;
			}
			if (!API) {
				// bozza senza server: solo la prova
				if (ok) {
					ok.hidden = false;
					ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				}
				return;
			}
			if (!inviata) manda();
		});
	}
}
