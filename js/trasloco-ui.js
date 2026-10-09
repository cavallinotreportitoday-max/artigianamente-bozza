// Calcolatore del trasloco, una stanza alla volta: 5 passi, uno aperto alla volta.
// La logica dei prezzi sta in trasloco.js (la stessa usata per la prima visualizzazione della pagina).
import {
	calcolaTrasloco,
	statoIniziale,
	oggetti,
	tipo,
	esempi,
	pocheCose,
	zoneVenezia,
	magazzino,
	linea,
	euro,
	m3Testo,
	scatole,
	cercaOggetti,
	nomeStanza,
	voceOggetto,
	scatoloniStimati,
	inventario,
	comuniPronti
} from './trasloco.js?v=2026100914';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const norm = (t) =>
	String(t || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const VICINI = ['VE', 'TV', 'PD', 'RO', 'VI', 'VR', 'BL', 'UD', 'PN', 'GO', 'TS'];
const pianoTesto = (p) => (p === '' ? '' : Number(p) < 0 ? 'seminterrato' : Number(p) === 0 ? 'piano terra' : `${p}° piano`);

export function avviaTrasloco(box) {
	const form = $('[data-tr-form]', box);
	const aside = $('[data-tr-ris]', box);
	const barra = $('[data-tr-barra]', box);
	const sprite = $('[data-tr-icone]', box);
	const stimaBox = $('[data-tr-stima]', box);
	const riepilogo = document.querySelector('[data-riepilogo]');
	const header = document.querySelector('[data-header]');

	const s = statoIniziale();
	let km = null;
	let uid = 0;
	let aperta = null; // stanza aperta (una alla volta)
	let ultimo = null; // ultima stima calcolata
	const visti = new Set([1]); // passi già aperti almeno una volta
	const confermati = new Set(); // passi chiusi con "Avanti" (per "Nessun altro oggetto")
	let tipiAperti = false; // elenco delle stanze, riaperto con "Aggiungi un'altra stanza"
	const visibili = new Map(); // righe aggiunte con la ricerca: restano in vista anche a zero

	/* ---------- piccoli aiuti per disegnare ---------- */
	const el = (tag, cls, testo) => {
		const e = document.createElement(tag);
		if (cls) e.className = cls;
		if (testo != null) e.textContent = testo;
		return e;
	};
	const bottone = (cls, testo) => {
		const b = el('button', cls, testo);
		b.type = 'button';
		return b;
	};
	const icona = (nome, size) => {
		const svg = ($(`[data-icona="${nome}"] svg`, sprite) ?? $('[data-icona="info"] svg', sprite)).cloneNode(true);
		if (size) {
			svg.setAttribute('width', size);
			svg.setAttribute('height', size);
		}
		return svg;
	};
	const maiuscolaT = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
	const numero = (v) => {
		const x = Number(String(v ?? '').replace(',', '.'));
		return Number.isFinite(x) && x >= 0 ? x : 0;
	};
	const sopra = () => (header?.offsetHeight || 60) + (barra && !barra.hidden && barra.offsetHeight ? barra.offsetHeight + 8 : 0) + 12;
	const scorriA = (dove) => {
		const y = dove.getBoundingClientRect().top + scrollY - sopra();
		if (Math.abs(y - scrollY) > 8) scrollTo({ top: Math.max(0, y), behavior: ridotto ? 'auto' : 'smooth' });
	};

	/** + e − con il numero in mezzo */
	function stepper({ valore = 0, min = 0, max = 99, passo = 1, unita = '', etichetta, cambia }) {
		const wrap = el('div', 'numero');
		const inp = el('input');
		inp.type = 'number';
		inp.inputMode = passo % 1 ? 'decimal' : 'numeric';
		Object.assign(inp, { min, max, step: passo });
		inp.value = String(valore || 0);
		inp.setAttribute('aria-label', etichetta);
		const imposta = (v) => {
			v = Math.min(max, Math.max(min, Math.round(v / passo) * passo));
			inp.value = String(v);
			cambia(v);
		};
		const meno = bottone('');
		meno.setAttribute('aria-label', `Togli: ${etichetta}`);
		meno.append(icona('minus', 16));
		meno.addEventListener('click', () => imposta(numero(inp.value) - passo));
		const piu = bottone('');
		piu.setAttribute('aria-label', `Aggiungi: ${etichetta}`);
		piu.append(icona('plus', 16));
		piu.addEventListener('click', () => imposta(numero(inp.value) + passo));
		inp.addEventListener('input', () => cambia(Math.min(max, Math.max(min, numero(inp.value)))));
		// uscendo dal campo il numero torna dentro i limiti anche a vista (9999 → 40, -3 → 0)
		inp.addEventListener('change', () => imposta(numero(inp.value)));
		wrap.append(meno, inp, piu);
		if (unita) wrap.append(el('span', 'numero__unita', unita));
		return wrap;
	}

	/* ---------- Comuni: elenco caricato solo quando si scrive ---------- */
	let comuni = null;
	let caricamento = null;
	const caricaComuni = () =>
		(caricamento ??= fetch(new URL('../data/comuni.json', import.meta.url))
			.then((r) => r.json())
			.then((lista) => (comuni = lista.map(([nome, sigla, lat, lon]) => ({ nome, sigla, lat, lon, k: norm(nome) }))))
			.catch(() => (comuni = [])));
	const scelti = { partenza: null, arrivo: null };

	const trova = (testo) => {
		const q = norm(testo);
		if (!q || !comuni) return [];
		const inizio = [];
		const dentro = [];
		for (const c of comuni) {
			if (c.k.startsWith(q)) inizio.push(c);
			else if (q.length >= 3 && c.k.includes(q)) dentro.push(c);
		}
		const vicino = (c) => (VICINI.includes(c.sigla) ? 0 : 1);
		return [...inizio.sort((a, b) => vicino(a) - vicino(b) || a.nome.length - b.nome.length), ...dentro].slice(0, 6);
	};

	for (const input of $$('[data-tr-comune]', box)) {
		const lato = input.dataset.trComune;
		const lista = $(`[data-tr-lista="${lato}"]`, box);
		let voci = [];
		let attiva = -1;
		const chiudi = () => {
			lista.hidden = true;
			input.setAttribute('aria-expanded', 'false');
			attiva = -1;
		};
		const scegli = (c) => {
			scelti[lato] = c;
			input.value = c.nome;
			input.classList.add('is-ok');
			chiudi();
			strada();
			aggiorna();
		};
		const mostra = () => {
			voci = trova(input.value);
			lista.replaceChildren(
				...voci.map((c, i) => {
					const li = el('li');
					li.role = 'option';
					li.id = `${lista.id}-${i}`;
					li.append(el('span', '', c.nome), el('small', '', c.sigla));
					li.addEventListener('mousedown', (e) => e.preventDefault()); // Safari: non perdere il fuoco
					li.addEventListener('click', () => scegli(c));
					return li;
				})
			);
			lista.hidden = !voci.length;
			input.setAttribute('aria-expanded', String(voci.length > 0));
			attiva = -1;
		};
		input.addEventListener('focus', () => caricaComuni().then(() => input.value && document.activeElement === input && mostra()));
		input.addEventListener('input', () => {
			if (scelti[lato] && norm(input.value) !== scelti[lato].k) {
				scelti[lato] = null;
				input.classList.remove('is-ok');
				strada();
				aggiorna();
			}
			caricaComuni().then(mostra);
		});
		input.addEventListener('keydown', (e) => {
			const li = $$('li[role="option"]', lista);
			if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && li.length) {
				e.preventDefault();
				attiva = (attiva + (e.key === 'ArrowDown' ? 1 : -1) + li.length) % li.length;
				li.forEach((x, i) => x.classList.toggle('is-attiva', i === attiva));
				input.setAttribute('aria-activedescendant', li[attiva].id);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (voci.length) scegli(voci[Math.max(0, attiva)]);
			} else if (e.key === 'Escape') chiudi();
		});
		input.addEventListener('blur', () => {
			setTimeout(chiudi, 120);
			if (!scelti[lato] && comuni) {
				const esatto = comuni.find((c) => c.k === norm(input.value));
				if (esatto) scegli(esatto);
			}
		});
	}

	/* ---------- Km veri (OpenStreetMap); se non risponde, linea d'aria ---------- */
	let richiesta = 0;
	const cache = new Map();
	const radio = (nome) => $(`input[name="${nome}"]:checked`, form)?.value ?? '';
	const zona = (lato) => (scelti[lato]?.nome === 'Venezia' ? zoneVenezia.find((z) => z.id === radio(`${lato}-zona`)) : null);
	const punto = (lato) => zona(lato) ?? scelti[lato];
	async function strada() {
		if (!scelti.partenza || !scelti.arrivo) {
			km = null;
			return;
		}
		const pts = [magazzino, punto('partenza'), punto('arrivo'), magazzino];
		const chiave = pts.map((p) => `${p.lon.toFixed(4)},${p.lat.toFixed(4)}`).join(';');
		const n = ++richiesta;
		const stesso = scelti.partenza === scelti.arrivo && radio('partenza-zona') === radio('arrivo-zona');
		const sistema = ([mp, pa, am], stima) => {
			km = { mp, pa: stesso ? Math.max(pa, 3) : pa, am, stima };
			aggiorna();
		};
		if (cache.has(chiave)) return sistema(...cache.get(chiave));
		for (const url of [
			`https://routing.openstreetmap.de/routed-car/route/v1/driving/${chiave}?overview=false`,
			`https://router.project-osrm.org/route/v1/driving/${chiave}?overview=false`
		]) {
			try {
				const ctrl = new AbortController();
				const t = setTimeout(() => ctrl.abort(), 6000);
				const j = await fetch(url, { signal: ctrl.signal }).then((r) => r.json());
				clearTimeout(t);
				if (j.code !== 'Ok' || !j.routes?.[0]?.legs) throw new Error('strada');
				const legs = j.routes[0].legs.map((l) => Math.round(l.distance / 1000));
				cache.set(chiave, [legs, false]);
				if (n === richiesta) sistema(legs, false);
				return;
			} catch {
				// provo il servizio successivo
			}
		}
		const legs = [0, 1, 2].map((i) => Math.max(1, Math.round(linea(pts[i], pts[i + 1]) * 1.35)));
		cache.set(chiave, [legs, true]);
		if (n === richiesta) sistema(legs, true);
	}

	/* ---------- Passi: uno aperto alla volta ---------- */
	const passi = $$('[data-passo]', form);
	const passo = (n) => passi.find((p) => Number(p.dataset.passo) === n);
	function apri(n, scorri = true) {
		visti.add(n);
		for (const p of passi) {
			const si = Number(p.dataset.passo) === n;
			p.classList.toggle('is-aperto', si);
			$('[data-passo-corpo]', p).hidden = !si;
			$('[data-passo-apri]', p).setAttribute('aria-expanded', String(si));
		}
		sintesi();
		if (scorri && passo(n)) requestAnimationFrame(() => scorriA(passo(n)));
	}
	for (const p of passi) {
		const n = Number(p.dataset.passo);
		$('[data-passo-apri]', p).addEventListener('click', () => {
			if (p.classList.contains('is-aperto')) {
				p.classList.remove('is-aperto');
				$('[data-passo-corpo]', p).hidden = true;
				$('[data-passo-apri]', p).setAttribute('aria-expanded', 'false');
				sintesi();
			} else apri(n);
		});
		$('[data-passo-avanti]', p)?.addEventListener('click', () => {
			confermati.add(n);
			if (n === 2 && aperta) {
				// la stanza aperta si chiude e resta com'è
				chiudiStanza(false);
			}
			apri(n + 1);
		});
	}
	box.addEventListener('click', (e) => {
		const b = e.target.closest('[data-vai-passo]');
		if (b) vaiAlCampo(Number(b.dataset.vaiPasso), b.dataset.vaiCampo);
	});
	/** Apre il passo e porta al campo che manca, visibile sotto la barra */
	function vaiAlCampo(n, sel) {
		apri(n, !sel);
		if (!sel) return;
		if (n === 2 && sel === '[data-tipo]') tipiAperti = true;
		mostra();
		requestAnimationFrame(() => {
			const p = passo(n);
			const tutti = $$(sel, p).filter((x) => !x.closest('[hidden]'));
			const campo = tutti.find((x) => 'value' in x && !x.value && x.type !== 'radio') || tutti[0];
			if (!campo) return scorriA(p);
			const dove = campo.closest('fieldset.campo, .tr__lato .campo, .tr2-pers, .tr2-tipi-box, .tr2-stanza, .tr__ogg') || campo;
			scorriA(dove);
			campo.focus({ preventScroll: true });
		});
	}

	/** Riga sotto il titolo di un passo chiuso, e stato del passo: fatto (spunta), aperto (nero), da fare (grigio) */
	function sintesi() {
		const r = ultimo;
		const manca = (n) => (r?.mancano || []).some((m) => m.passo === n);
		const chiuso = (n) => !passo(n).classList.contains('is-aperto');
		const metti = (n, t, fatto) => {
			const p = passo(n);
			$('[data-passo-sintesi]', p).textContent = t;
			p.classList.toggle('ha-sintesi', Boolean(t));
			p.classList.toggle('is-fatto', Boolean(fatto));
			p.classList.toggle('is-dafare', /da completare$/i.test(t));
		};
		const daCompletare = (n) => (visti.has(n) && chiuso(n) ? 'Da completare' : '');
		const maiuscola = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
		// 1 · da dove a dove
		const lato = (l) => (l.comune ? [l.comune, pianoTesto(l.piano)].filter(Boolean).join(', ') : '');
		const a = lato(s.partenza);
		const b = lato(s.arrivo);
		if (!manca(1)) metti(1, `${a} → ${b}`, true);
		else metti(1, a || b ? `${a || '…'} → ${b || '…'} · da completare` : daCompletare(1), false);
		// 2 · cosa portiamo
		const righe = inventario(s);
		const conta = (dove) => righe.filter((x) => (dove ? x.dove !== 'Altri oggetti' : x.dove === 'Altri oggetti')).reduce((t, x) => t + (oggetti[x.id].unita === 'm' ? 1 : x.q), 0);
		const nCasa = conta(true);
		const ogg = (k) => `${k} ${k === 1 ? 'oggetto' : 'oggetti'}`;
		const sc = r && !r.vuoto ? r.nScatole : 0;
		const scTesto = sc ? `${r.scatoloniStimati ? 'circa ' : ''}${sc} scatoloni` : '';
		let t2 = '';
		if (s.cosa === 'casa' && s.stanze.length) {
			const es = s.stanze.filter((x) => x.esempio).length;
			const dentro = nCasa ? ogg(nCasa) : scTesto ? `solo ${scTesto}` : 'nessun oggetto';
			t2 = `${s.stanze.length} ${s.stanze.length === 1 ? 'stanza' : 'stanze'} · ${dentro}${es ? ' · esempio da controllare' : ''}`;
		} else if (s.cosa === 'poche' && nCasa) t2 = `Poche cose · ${ogg(nCasa)}`;
		else if (scTesto && !nCasa) t2 = `Solo ${scTesto}${manca(2) ? ' · da completare' : ''}`;
		else if (s.cosa === 'casa') t2 = visti.has(2) && chiuso(2) ? 'Aggiungi le stanze · da completare' : '';
		else t2 = daCompletare(2);
		metti(2, t2, !manca(2) && (nCasa > 0 || sc > 0));
		// 3 · manca qualcosa (facoltativo)
		const nTuoi = s.personali.filter((x) => String(x.nome || '').trim()).length;
		const nAltri = conta(false) + nTuoi;
		let t3 = nAltri ? `${ogg(nAltri)} in più` : confermati.has(3) ? 'Nessun altro oggetto' : '';
		if (manca(3)) t3 = t3 ? `${t3} · da completare` : 'Da completare';
		metti(3, t3, !manca(3) && (nAltri > 0 || confermati.has(3)));
		// 4 · scatoloni e imballo
		let t4 = '';
		if (s.chi === 'niente') t4 = 'Nessuno scatolone';
		else if (s.chi) {
			const chi = s.chi === 'noi' ? 'imballiamo noi' : 'imballi tu';
			t4 = maiuscola(scTesto ? `${scTesto} · ${chi}` : chi);
			if (manca(4)) t4 += ' · da completare';
		} else t4 = daCompletare(4);
		metti(4, t4, Boolean(s.chi) && !manca(4));
		metti(5, '', false);
	}

	/* ---------- Stanze ---------- */
	const listaStanze = $('[data-tr-stanze]', box);
	function nuovaStanza(t, ogg = {}, esempio = false) {
		const st = { uid: `s${++uid}`, tipo: t, oggetti: { ...ogg }, esempio };
		s.stanze.push(st);
		return st;
	}
	function apriStanza(id) {
		aperta = id;
		disegnaStanze();
		const ed = $(`[data-stanza="${id}"]`, listaStanze);
		if (ed) {
			$('.tr2-stanza__nome', ed)?.focus({ preventScroll: true });
			requestAnimationFrame(() => scorriA(ed));
		}
	}
	function chiudiStanza(controllata) {
		const st = s.stanze.find((x) => x.uid === aperta);
		if (st && controllata) st.esempio = false;
		aperta = null;
		disegnaStanze();
		return st;
	}
	function disegnaStanze() {
		listaStanze.replaceChildren(...s.stanze.map((st) => (st.uid === aperta ? editorStanza(st) : schedaStanza(st))));
		mostra();
	}
	function schedaStanza(st) {
		const nome = nomeStanza(s.stanze, st);
		const righe = Object.entries(st.oggetti).filter(([, q]) => numero(q) > 0);
		const card = el('div', 'tr2-stanza');
		card.dataset.stanza = st.uid;
		const b = bottone('tr2-stanza__apri');
		const testi = el('span', 'tr2-stanza__testi');
		const titolo = el('strong', '', nome);
		testi.append(titolo, el('small', '', righe.length ? righe.map(([id, q]) => voceOggetto(id, numero(q))).join(', ') : 'Nessun oggetto'));
		b.append(icona(tipo[st.tipo].icona, 30), testi);
		if (st.esempio) b.append(el('span', 'tr2-badge', 'Esempio da controllare'));
		b.append(el('span', 'tr2-stanza__modifica', 'Modifica'));
		b.addEventListener('click', () => apriStanza(st.uid));
		card.append(b);
		return card;
	}
	function editorStanza(st) {
		const nome = nomeStanza(s.stanze, st);
		const ed = el('div', 'tr2-stanza is-aperta');
		ed.dataset.stanza = st.uid;
		const t = el('div', 'tr2-stanza__testa');
		const h = el('h3', 'tr2-stanza__nome', nome);
		h.tabIndex = -1;
		t.append(icona(tipo[st.tipo].icona, 30), h);
		if (st.esempio) t.append(el('span', 'tr2-badge', 'Esempio da controllare'));
		ed.append(t);
		if (st.esempio) ed.append(el('p', 'tr2-aiuto', "Sono quantità d'esempio: correggile con le tue."));
		ed.append(gruppo({ chiave: st.uid, mappa: st.oggetti, base: tipo[st.tipo].oggetti }));
		const az = el('div', 'tr2-stanza__azioni');
		const fine = bottone('btn', `Termina ${nome.toLowerCase()}`);
		fine.addEventListener('click', () => {
			const chiusa = chiudiStanza(true);
			aggiorna();
			const card = chiusa && $(`[data-stanza="${chiusa.uid}"]`, listaStanze);
			if (card) {
				$('button', card)?.focus({ preventScroll: true });
				requestAnimationFrame(() => scorriA(card));
			}
		});
		const togli = bottone('tr2-link', 'Togli la stanza');
		togli.addEventListener('click', () => {
			s.stanze = s.stanze.filter((x) => x !== st);
			visibili.delete(st.uid);
			aperta = null;
			disegnaStanze();
			aggiorna();
			$('[data-tr-tipi-titolo]', box).focus({ preventScroll: true });
		});
		az.append(fine, togli);
		ed.append(az);
		return ed;
	}
	$('[data-tr-tipi-apri]', box).addEventListener('click', () => {
		tipiAperti = true;
		if (aperta) chiudiStanza(false); // la stanza aperta si chiude e resta com'è
		mostra();
		aggiorna();
		const t = $('[data-tr-tipi]', box);
		requestAnimationFrame(() => {
			scorriA(t);
			$('[data-tipo]', t)?.focus({ preventScroll: true });
		});
	});
	for (const b of $$('[data-tipo]', box)) {
		b.addEventListener('click', () => {
			tipiAperti = false;
			const st = nuovaStanza(b.dataset.tipo);
			apriStanza(st.uid);
			aggiorna();
		});
	}
	for (const b of $$('[data-esempio]', box)) {
		b.addEventListener('click', () => {
			if (s.stanze.length) return; // gli esempi si vedono solo con la lista vuota
			for (const [t, ogg] of esempi[b.dataset.esempio].stanze) nuovaStanza(t, ogg, true);
			aperta = null;
			disegnaStanze();
			aggiorna();
		});
	}

	/** Dove si trova già un oggetto: "Già 2 in Cucina" */
	const doveGia = (id) => {
		const r = inventario(s).filter((x) => x.id === id);
		if (!r.length) return '';
		const tot = r.reduce((t, x) => t + x.q, 0);
		return `Già ${String(tot).replace('.', ',')}${oggetti[id].unita === 'm' ? ' m' : ''} in ${[...new Set(r.map((x) => x.dove))].join(', ')}`;
	};

	/**
	 * Righe di oggetti con quantità + "Aggiungi un oggetto" (ricerca nel catalogo).
	 * chiave: per ricordare le righe aggiunte. mappa: { id: q } da modificare. base: righe sempre in vista.
	 */
	function gruppo({ chiave, mappa, base = [], cercaAperta = false, altri = false }) {
		const g = el('div', 'tr2-gruppo__in');
		const righe = el('div', 'tr2-righe');
		if (!visibili.has(chiave)) visibili.set(chiave, new Set());
		const viste = visibili.get(chiave);
		const riga = (id) => {
			const o = oggetti[id];
			const r = el('div', 'tr__ogg');
			r.dataset.ogg = id;
			const ic = el('span', 'tr__ogg-icona');
			ic.append(icona(o.icona, 28));
			const nm = el('span', 'tr__ogg-nome', o.nome);
			if (o.valuta) nm.append(el('small', 'tr2-valuta', 'Da valutare al sopralluogo'));
			else if (o.nota) nm.append(el('small', '', o.nota));
			r.append(
				ic,
				nm,
				stepper({
					valore: mappa[id] ?? 0,
					max: o.unita === 'm' ? 15 : 40,
					passo: o.passo ?? 1,
					unita: o.unita === 'm' ? 'm' : '',
					etichetta: o.nome,
					cambia: (v) => {
						if (v > 0) mappa[id] = v;
						else delete mappa[id];
						aggiorna();
					}
				})
			);
			return r;
		};
		const ids = [...new Set([...base, ...Object.keys(mappa).filter((id) => numero(mappa[id]) > 0), ...viste])].filter((id) => oggetti[id]);
		righe.append(...ids.map(riga));
		g.append(righe);

		// Ricerca nel catalogo, con le icone
		const cerca = el('div', 'tr2-cerca');
		const apriCerca = bottone('tr__aggiungi');
		apriCerca.append(icona('plus', 16), document.createTextNode('Aggiungi un oggetto'));
		const campo = el('div', 'tr2-cerca__campo');
		campo.hidden = !cercaAperta;
		apriCerca.hidden = cercaAperta;
		const lente = icona('search', 18);
		const inp = el('input', 'input');
		Object.assign(inp, { type: 'search', placeholder: 'Cerca: bici, specchio, frigo…', autocomplete: 'off', enterKeyHint: 'search' });
		inp.setAttribute('aria-label', 'Cerca un oggetto');
		const out = el('ul', 'tr2-cerca__ris');
		const vuoto = el('div', 'tr2-cerca__vuoto');
		vuoto.hidden = true;
		campo.append(lente, inp, out, vuoto);
		apriCerca.addEventListener('click', () => {
			apriCerca.hidden = true;
			campo.hidden = false;
			inp.focus();
		});
		const aggiungi = (o) => {
			mappa[o.id] = numero(mappa[o.id]) + 1;
			viste.add(o.id);
			let r = $(`[data-ogg="${o.id}"]`, righe);
			if (r) $('input', r).value = String(mappa[o.id]);
			else {
				r = riga(o.id);
				righe.append(r);
			}
			r.classList.remove('is-nuova');
			void r.offsetWidth;
			r.classList.add('is-nuova');
			inp.value = '';
			mostraRis();
			aggiorna();
		};
		function mostraRis() {
			const lista = cercaOggetti(inp.value, 6);
			out.replaceChildren(
				...lista.map((o) => {
					const li = el('li');
					const b = bottone('tr2-cerca__voce');
					const testi = el('span', 'tr2-cerca__testi');
					testi.append(el('span', '', o.nome));
					const gia = doveGia(o.id);
					if (gia) testi.append(el('small', '', gia));
					else if (o.valuta) testi.append(el('small', '', 'Da valutare al sopralluogo'));
					b.append(icona(o.icona, 26), testi, icona('plus', 16));
					b.addEventListener('click', () => aggiungi(o));
					li.append(b);
					return li;
				})
			);
			const nessuno = inp.value.trim().length >= 2 && !lista.length;
			vuoto.hidden = !nessuno;
			if (nessuno) {
				const testo = inp.value.trim();
				const tu = bottone('tr__aggiungi', 'Aggiungilo tu');
				tu.prepend(icona('plus', 16));
				tu.addEventListener('click', () => {
					inp.value = '';
					mostraRis();
					nuovoPersonale(testo);
					if (!altri) apri(3);
				});
				vuoto.replaceChildren(el('p', '', 'Non è nel catalogo.'), tu);
			}
		}
		inp.addEventListener('input', mostraRis);
		inp.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				$('button', out)?.click();
			} else if (e.key === 'Escape') {
				inp.value = '';
				mostraRis();
			}
		});
		cerca.append(apriCerca, campo);
		g.append(cerca);
		return g;
	}

	/* ---------- Poche cose e "Manca qualcosa?" ---------- */
	const boxPoche = $('[data-gruppo="poche"]', box);
	const boxAltri = $('[data-gruppo="altri"]', box);
	const disegnaPoche = () => boxPoche.replaceChildren(gruppo({ chiave: 'poche', mappa: s.poche, base: pocheCose }));
	const disegnaAltri = () => boxAltri.replaceChildren(gruppo({ chiave: 'altri', mappa: s.altri, cercaAperta: true, altri: true }));
	disegnaPoche();
	disegnaAltri();
	for (const b of $$('[data-aggiungi]', box)) {
		b.addEventListener('click', () => {
			const id = b.dataset.aggiungi;
			s.altri[id] = numero(s.altri[id]) + 1;
			visibili.get('altri')?.add(id);
			disegnaAltri();
			aggiorna();
		});
	}

	/* ---------- Oggetti che non sono nel catalogo: da valutare, senza prezzo ---------- */
	const boxPers = $('[data-tr-personali]', box);
	function nuovoPersonale(nome = '') {
		s.personali.push({ nome, q: 1, l: '', p: '', a: '', peso: '', foto: 0, files: [], note: '' });
		disegnaPersonali();
		aggiorna();
		const nuovo = boxPers.lastElementChild;
		if (nuovo)
			requestAnimationFrame(() => {
				scorriA(nuovo);
				$('input', nuovo)?.focus({ preventScroll: true });
			});
	}
	$('[data-tr-personale-nuovo]', box).addEventListener('click', () => nuovoPersonale());
	// i file scelti si rimettono nel campo con DataTransfer (Safari 14.1+, Chrome, Firefox)
	const mettiFile = (input, files) => {
		try {
			const dt = new DataTransfer();
			for (const f of files) dt.items.add(f);
			input.files = dt.files;
		} catch {
			// browser vecchio: il campo resta vuoto, le foto si possono riaggiungere
		}
	};
	// tutte le foto degli oggetti tuoi vanno anche nel modulo "Richiedi un sopralluogo"
	const fotoNelModulo = () => {
		const campo = document.querySelector('[data-pv-foto-oggetti]');
		if (campo) mettiFile(campo, s.personali.flatMap((p) => p.files || []));
	};
	function disegnaPersonali() {
		boxPers.replaceChildren(
			...s.personali.map((p, i) => {
				const r = el('div', 'tr2-pers');
				const testa = el('div', 'tr2-pers__testa');
				const titolo = el('p', 'tr2-pers__titolo', p.nome?.trim() || 'Oggetto tuo');
				const badge = el('span', 'tr2-badge');
				const stato = () => {
					const ok = Boolean(String(p.nome || '').trim());
					titolo.textContent = ok ? p.nome.trim() : 'Oggetto tuo';
					badge.textContent = ok ? 'Da valutare' : 'Da completare';
					badge.classList.toggle('tr2-badge--manca', !ok);
				};
				stato();
				testa.append(titolo, badge);
				const togli = bottone('tr__togli');
				togli.setAttribute('aria-label', 'Togli questo oggetto');
				togli.append(icona('close', 18));
				togli.addEventListener('click', () => {
					s.personali.splice(i, 1);
					fotoNelModulo();
					disegnaPersonali();
					aggiorna();
					$('[data-tr-personale-nuovo]', box).focus();
				});
				testa.append(togli);
				const campo = (etichetta, input) => {
					const c = el('label', 'campo');
					c.append(el('span', 'tr2-pers__etichetta', etichetta), input);
					return c;
				};
				const testo = (k, ph = '') => {
					const x = el('input', 'input');
					x.value = p[k] || '';
					x.placeholder = ph;
					x.addEventListener('input', () => {
						p[k] = x.value;
						if (k === 'nome') stato();
						aggiorna();
					});
					return x;
				};
				const nome = testo('nome', 'Es. statua, armadio antico');
				nome.dataset.persNome = '';
				const quanti = el('div', 'campo');
				quanti.append(el('span', 'tr2-pers__etichetta', 'Quanti'), stepper({ valore: p.q, min: 1, max: 40, etichetta: 'quantità', cambia: (v) => ((p.q = v), aggiorna()) }));
				const base = el('div', 'tr2-pers__base');
				base.append(campo("Che cos'è?", nome), quanti);
				const nota = el('p', 'tr2-pers__nota', 'Non è nella stima: lo valutiamo al sopralluogo.');
				// dettagli facoltativi
				const misure = el('div', 'campo tr2-pers__misure');
				misure.append(el('span', 'tr2-pers__etichetta', 'Misure in cm'));
				const tre = el('div', 'tr2-tre');
				for (const [k, ph, lab] of [
					['l', 'Lungh.', 'Lunghezza in cm'],
					['p', 'Largh.', 'Larghezza in cm'],
					['a', 'Alt.', 'Altezza in cm']
				]) {
					const x = testo(k, ph);
					Object.assign(x, { type: 'number', inputMode: 'numeric', min: 0 });
					x.setAttribute('aria-label', lab);
					tre.append(x);
				}
				misure.append(tre, el('small', 'tr2-aiuto', 'Lunghezza × larghezza × altezza'));
				const peso = el('select', 'input');
				for (const [v, lab] of [
					['', 'Non lo so'],
					['leggero', 'Fino a 30 kg'],
					['medio', 'Da 30 a 100 kg'],
					['pesante', 'Oltre 100 kg']
				]) {
					const o = el('option', '', lab);
					o.value = v;
					o.selected = p.peso === v;
					peso.append(o);
				}
				peso.addEventListener('change', () => ((p.peso = peso.value), aggiorna()));
				const foto = el('input', 'input');
				Object.assign(foto, { type: 'file', accept: 'image/*', multiple: true });
				if (p.files.length) mettiFile(foto, p.files);
				foto.addEventListener('change', () => {
					p.files = Array.from(foto.files);
					p.foto = p.files.length;
					fotoNelModulo();
					aggiorna();
				});
				const note = testo('note', 'Es. si smonta, è fragile');
				const dettagli = el('details', 'tr2-pers__dettagli');
				dettagli.open = Boolean(p.peso || p.foto || p.l || p.p || p.a || p.note);
				const sum = el('summary', '', 'Aggiungi dettagli');
				sum.prepend(icona('plus', 16));
				const griglia = el('div', 'tr2-pers__griglia');
				griglia.append(campo('Foto', foto), campo('Peso', peso));
				dettagli.append(sum, griglia, misure, campo('Altro da sapere?', note));
				r.append(testa, base, nota, dettagli);
				return r;
			})
		);
	}

	/* ---------- Scatoloni di altra misura (solo con i tuoi scatoloni) ---------- */
	const boxAltre = $('[data-tr-altre]', box);
	function disegnaAltre() {
		boxAltre.replaceChildren(
			...s.altreMisure.map((m, i) => {
				const r = el('div', 'tr__riga tr__riga--scatole');
				for (const [k, ph, lab] of [
					['l', 'Lungh.', 'Lunghezza in cm'],
					['p', 'Largh.', 'Larghezza in cm'],
					['a', 'Alt.', 'Altezza in cm'],
					['q', 'Quanti', 'Quanti scatoloni']
				]) {
					const x = el('input', 'input');
					Object.assign(x, { type: 'number', inputMode: 'numeric', min: 0, placeholder: ph, value: m[k] ?? '' });
					x.setAttribute('aria-label', lab);
					x.addEventListener('input', () => ((m[k] = x.value), aggiorna()));
					r.append(x);
				}
				const togli = bottone('tr__togli');
				togli.setAttribute('aria-label', 'Togli questa misura');
				togli.append(icona('close', 18));
				togli.addEventListener('click', () => {
					s.altreMisure.splice(i, 1);
					disegnaAltre();
					aggiorna();
				});
				r.append(togli);
				return r;
			})
		);
		if (s.altreMisure.length) boxAltre.prepend(el('p', 'tr2-aiuto', 'Lunghezza × larghezza × altezza, in cm'));
	}
	$('[data-tr-altra]', box).addEventListener('click', () => {
		s.altreMisure.push({ l: '', p: '', a: '', q: '' });
		disegnaAltre();
		$('input', boxAltre.lastElementChild)?.focus();
	});

	/* ---------- Campi fissi: si leggono a ogni modifica ---------- */
	const limitato = (x) => {
		const v = numero(x.value);
		const min = x.min === '' ? 0 : Number(x.min);
		const max = x.max === '' ? Infinity : Number(x.max);
		return Math.min(max, Math.max(min, v));
	};
	const valNum = (nome) => {
		const x = $(`[name="${nome}"]`, form);
		return x.value === '' ? '' : limitato(x);
	};
	function leggiCampi() {
		for (const k of ['partenza', 'arrivo']) {
			s[k].comune = scelti[k]?.nome || '';
			s[k].zona = radio(`${k}-zona`);
			s[k].piano = $(`[name="${k}-piano"]`, form).value;
			s[k].ascensore = radio(`${k}-ascensore`);
		}
		s.cosa = radio('cosa');
		s.chi = radio('chi');
		s.scatole = radio('scatole');
		s.nonSo = $('[name="nonSo"]', form).checked;
		s.quanti = valNum('quanti');
		for (const sc of scatole) s.formati[sc.id] = valNum(`f-${sc.id}`);
		s.smontaggio = $('[name="smontaggio"]', form).checked;
		s.deposito = $('[name="deposito-si"]', form).checked ? valNum('deposito') || 1 : 0;
	}

	/** Mostra solo le domande che servono */
	function mostra() {
		for (const k of ['partenza', 'arrivo']) {
			$(`[data-tr-zona="${k}"]`, box).hidden = s[k].comune !== 'Venezia';
			$(`[data-tr-asc="${k}"]`, box).hidden = !(s[k].piano !== '' && Number(s[k].piano) > 0);
		}
		$('[data-tr-casa]', box).hidden = s.cosa !== 'casa';
		$('[data-tr-poche]', box).hidden = s.cosa !== 'poche';
		$('[data-tr-esempi]', box).hidden = s.stanze.length > 0;
		const conStanze = s.stanze.length > 0;
		$('[data-tr-tipi-titolo]', box).textContent = conStanze ? 'Quale stanza aggiungi?' : 'Aggiungi le stanze da traslocare';
		$('[data-tr-tipi]', box).hidden = conStanze && !tipiAperti;
		$('[data-tr-tipi-apri]', box).hidden = !conStanze || tipiAperti;
		const stimati = scatoloniStimati(s);
		$('[data-tr-q2]', box).hidden = !(s.chi === 'noi' || s.chi === 'io');
		$('[data-testo="nostre"]', box).textContent = s.chi === 'io' ? 'Ve li portiamo prima del trasloco' : 'Scatoloni, nastro e carta nostri';
		const conStima = stimati > 0 && (s.chi === 'noi' || (s.chi === 'io' && s.nonSo));
		$('[data-tr-stimati]', box).hidden = !conStima;
		$('[data-tr-stimati-n]', box).textContent = `Circa ${stimati} scatoloni`;
		$('[data-tr-quanti]', box).hidden = !(s.chi === 'noi' && !stimati);
		const formati = $('[data-tr-formati]', box);
		formati.hidden = s.chi !== 'io';
		formati.classList.toggle('is-spento', s.nonSo);
		for (const x of $$('.tr2-righe input, .tr2-righe button, [data-tr-altre] input, [data-tr-altre] button, [data-tr-altra]', formati)) x.disabled = s.nonSo;
		const mie = s.scatole === 'mie';
		$('[data-tr-altra]', box).hidden = !mie;
		boxAltre.hidden = !mie;
		$('[data-tr-mesi]', box).hidden = !$('[name="deposito-si"]', form).checked;
	}

	/* ---------- Stima ---------- */
	const scrivi = (sel, testo, dove = box) => {
		const e = $(sel, dove);
		if (e) e.textContent = testo;
	};
	const cifra = (dove, r) => {
		dove.replaceChildren();
		if (r.vuoto) return void (dove.textContent = '—');
		dove.append(document.createTextNode(`${euro(r.min)}–${euro(r.max)} € `));
		dove.append(el('span', 'risultato__iva', 'IVA inclusa'));
	};
	const blocco = (nome, voci, fai) => {
		const b = $(`[data-blocco="${nome}"]`, box);
		b.hidden = !voci.length;
		$('ul', b).replaceChildren(...voci.map(fai));
	};

	/** Cosa c'è nella stima, in breve: "4 oggetti · circa 28 scatoloni · 9,5 m³" */
	const base = (r) => {
		const sc = r.nScatole ? `${r.scatoloniStimati ? 'circa ' : ''}${r.nScatole} scatoloni` : '';
		const og = r.nOggetti ? `${r.nOggetti} ${r.nOggetti === 1 ? 'oggetto' : 'oggetti'}` : '';
		return maiuscolaT([og, og ? sc : sc && `solo ${sc}`, `${m3Testo(r.m3)} m³`].filter(Boolean).join(' · '));
	};
	const etichetta = (r) => (r.esempio ? 'Stima su un esempio' : r.mancano.length ? 'Stima parziale' : 'Stima indicativa');
	const ATTESA = 'Inserisci partenza e arrivo per vedere il prezzo';

	function aggiorna() {
		leggiCampi();
		mostra();
		const r = calcolaTrasloco(s, km);
		ultimo = r;
		const pronta = !r.vuoto && comuniPronti(s);
		const nManca = r.mancano.length;
		const daFare = nManca ? `${nManca} ${nManca === 1 ? 'dato da completare' : 'dati da completare'}` : '';
		// passo 5
		cifra($('[data-tr-cifra]', box), pronta ? r : { vuoto: true });
		scrivi('[data-tr-stima-label]', pronta ? etichetta(r) : 'La tua stima');
		const mezzi = pronta ? (r.lungo ? `${r.furgoni} camion` : `${r.furgoni} ${r.furgoni === 1 ? 'furgone' : 'furgoni'}`) : '';
		const riga = r.vuoto ? r.messaggio : !pronta ? `${ATTESA}.` : [base(r), mezzi, `${r.squadra} persone`, km && `${euro(r.km)} km`].filter(Boolean).join(' · ');
		scrivi('[data-tr-riga]', riga);
		blocco('incluso', pronta ? r.incluso : [], (t) => el('li', '', t));
		blocco('valutare', r.daValutare, (t) => el('li', '', t));
		blocco('mancano', r.mancano, (m) => {
			const li = el('li');
			const b = bottone('tr2-link', m.testo);
			b.dataset.vaiPasso = m.passo;
			if (m.campo) b.dataset.vaiCampo = m.campo;
			li.append(b);
			return li;
		});
		scrivi('[data-tr-avvisi]', pronta ? r.avvisi.join(' ') : '');
		$('[data-tr-voci]', box).replaceChildren(
			...(pronta ? r.voci : []).map((v) => {
				const li = el('li');
				const ic = el('span', 'scontrino__icona');
				ic.append(icona(v.icona, 18));
				li.append(ic, el('span', 'scontrino__nome', v.nome), el('span', 'scontrino__euro', `${euro(v.euro)} €`));
				return li;
			})
		);
		$('.risultato__piu', box).hidden = !pronta;
		$('.tr-condizioni', box).hidden = !pronta;
		if (!r.vuoto) scrivi('[data-tr-extra]', euro(r.extraM3));
		// totale degli scatoloni per formato: si fa da solo
		const nSc = r.vuoto ? 0 : r.nScatole;
		scrivi('[data-tr-totale]', `Totale: ${nSc} ${nSc === 1 ? 'scatolone' : 'scatoloni'}${nSc ? ` · ${m3Testo(r.m3Scatole)} m³` : ''}`);

		// riassunto a destra (PC)
		cifra($('[data-tr-ris-cifra]', aside), pronta ? r : { vuoto: true });
		scrivi('.risultato__label', pronta ? etichetta(r) : 'Il tuo trasloco', aside);
		scrivi('[data-tr-ris-riga]', r.vuoto ? r.messaggio : pronta ? base(r) : `${base(r)}. ${ATTESA}.`, aside);
		// quanti oggetti per gruppo (la cucina componibile conta 1)
		const pezzi = (mappa) => Object.entries(mappa).reduce((t, [id, q]) => t + (numero(q) > 0 ? (oggetti[id]?.unita === 'm' ? 1 : numero(q)) : 0), 0);
		const gruppi = [];
		if (s.cosa === 'casa') for (const st of s.stanze) gruppi.push([nomeStanza(s.stanze, st), pezzi(st.oggetti), st.esempio]);
		if (s.cosa === 'poche') gruppi.push(['Le tue cose', pezzi(s.poche)]);
		const nAltri = pezzi(s.altri);
		if (nAltri) gruppi.push(['Altri oggetti', nAltri]);
		const nTuoi = s.personali.filter((p) => String(p.nome || '').trim()).length;
		if (nTuoi) gruppi.push(['Da valutare', nTuoi]);
		$('[data-tr-ris-stanze]', aside).replaceChildren(
			...gruppi.map(([nome, q, es]) => {
				const li = el('li');
				li.append(el('span', '', nome), el('span', es ? 'tr2-ris__es' : '', es ? 'esempio' : String(q)));
				return li;
			})
		);
		scrivi('[data-tr-ris-manca]', daFare ? maiuscolaT(daFare) : '', aside);

		// barretta del telefono: cosa c'è dentro la stima, e se è parziale
		barra.hidden = false;
		barra.classList.toggle('is-attesa', !pronta);
		scrivi('[data-tr-barra-label]', pronta ? [etichetta(r), daFare].filter(Boolean).join(' · ') : r.vuoto ? 'Stima del trasloco' : base(r), barra);
		scrivi('[data-tr-barra-cosa]', pronta ? base(r) : !comuniPronti(s) ? 'Inserisci partenza e arrivo' : 'Aggiungi cosa portiamo', barra);
		scrivi('[data-tr-barra-cifra]', pronta ? `${euro(r.min)}–${euro(r.max)} €` : '', barra);

		// riepilogo per il modulo "Richiedi un sopralluogo"
		if (riepilogo && !box.closest('[hidden]')) {
			riepilogo.value = r.riepilogo || '';
			riepilogo.dispatchEvent(new Event('change', { bubbles: true }));
		}
		sintesi();
	}

	form.addEventListener('submit', (e) => e.preventDefault());
	for (const ev of ['input', 'change']) {
		form.addEventListener(ev, (e) => {
			const t = e.target;
			if (t === form || (t.name && !t.matches('[data-tr-comune]'))) {
				if (ev === 'change' && t.type === 'number' && t.value !== '') t.value = String(limitato(t));
				if (t.name?.endsWith('-zona')) strada();
				aggiorna();
			}
		});
	}

	/* ---------- Barretta sul telefono: porta alla stima, o al dato che manca per vederla ---------- */
	const vaiStima = () => {
		const r = ultimo;
		if (r && !r.vuoto && comuniPronti(s)) return apri(5);
		const m = (r?.mancano || []).find((x) => x.passo === 1) || (r?.vuoto ? r.mancano.find((x) => x.passo === 2) : null);
		if (m) vaiAlCampo(m.passo, m.campo);
		else apri(r?.vuoto ? 2 : 5);
	};
	barra.addEventListener('click', vaiStima);
	barra.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), vaiStima()));
	if ('IntersectionObserver' in window)
		new IntersectionObserver(([e]) => barra.classList.toggle('is-nascosta', e.isIntersecting), { threshold: 0.05 }).observe(stimaBox);

	aggiorna();
}

for (const box of $$('[data-trasloco]')) avviaTrasloco(box);
