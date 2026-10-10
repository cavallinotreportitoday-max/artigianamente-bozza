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
			const am = form._am || null; // lo scrivono i calcolatori: { lavoro, calcolo }
			const dati = {
				chiave,
				origine: generale ? 'contatti' : form.closest('[data-pv]') ? 'preventivo' : 'pagina_servizio',
				servizio: generale ? g('servizio') : form.dataset.servizio || null,
				lavoro: am?.lavoro ?? null,
				nome: g('nome'),
				telefono: g('telefono'),
				email: g('email'),
				comune: g('comune'),
				messaggio: g('messaggio'),
				riepilogo: g('riepilogo'),
				preferenza_sopralluogo: g('data-sopralluogo') || null,
				preferenza_inizio: g('inizio-desiderato') || null,
				privacy: fd.get('privacy') != null,
				sito_web: g('sito_web'),
				revisione: REVISIONE,
				calcolo: am?.calcolo ?? null,
				conferma
			};
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
				mostra('errore', e?.messaggio || 'Connessione assente o lenta: la richiesta non è partita. Controlla la rete e riprova, i dati restano qui.');
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
