// Calcolatore del trasloco, una stanza alla volta: 6 passi, uno aperto alla volta.
// Dal 10/10: 1 comuni (si può saltare), 2 cosa portiamo, 3 altri oggetti, 4 scatoloni, 5 piano e ascensore, 6 stima.
// "Avanti" va avanti solo se il passo ha i dati che servono (tranne il passo 1).
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
} from './trasloco.js?v=2026101021-r19';

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
	const veloStanza = $('[data-tr-velo-stanza]', box); // velo dietro la tendina della stanza (telefono)
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
	// altezza di quello che sta fisso in alto: intestazione del sito, oppure la testa della tendina (telefono)
	const testaFoglio = document.querySelector('[data-foglio-testa]');
	const inAlto = () => (testaFoglio && testaFoglio.offsetHeight ? testaFoglio.offsetHeight : header?.offsetHeight || 60);
	const sopra = () => inAlto() + (barra && !barra.hidden && barra.offsetHeight ? barra.offsetHeight + 8 : 0) + 12;
	// telefono, traslochi: i passi 1-4 si aprono come tendina da sotto (il passo 5, la stima, resta nella pagina)
	const foglio = () => document.documentElement.classList.contains('pv-foglio') && matchMedia('(max-width: 860px)').matches;
	const tendina = (n) => foglio() && Number(n) !== 6;
	const scorriA = (dove) => {
		// dentro una tendina scorre la tendina, non la pagina
		const sez = dove.closest('[data-passo]');
		if (sez && sez.classList.contains('is-aperto') && tendina(sez.dataset.passo)) {
			const corpo = $('[data-passo-corpo]', sez);
			const yc = dove === sez ? 0 : dove.getBoundingClientRect().top - corpo.getBoundingClientRect().top + corpo.scrollTop - 12;
			corpo.scrollTo({ top: Math.max(0, yc), behavior: ridotto || dove === sez ? 'auto' : 'smooth' });
			return;
		}
		const y = dove.getBoundingClientRect().top + scrollY - sopra();
		if (Math.abs(y - scrollY) > 8) scrollTo({ top: Math.max(0, y), behavior: ridotto ? 'auto' : 'smooth' });
	};

	/** + e − con il numero in mezzo */
	const dito = matchMedia('(pointer: coarse)').matches;
	function stepper({ valore = 0, min = 0, max = 99, passo = 1, unita = '', etichetta, cambia, tastiera = true }) {
		const wrap = el('div', 'numero');
		const inp = el('input');
		inp.type = 'number';
		inp.inputMode = passo % 1 ? 'decimal' : 'numeric';
		// telefono, oggetti da portare: niente tastiera che si apre e sposta tutto, bastano − e + (10/10)
		if (!tastiera && dito) {
			inp.readOnly = true;
			inp.inputMode = 'none';
			inp.tabIndex = -1;
		}
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
		const pulisci = $(`[data-tr-pulisci="${lato}"]`, box);
		const vedi = () => pulisci && (pulisci.hidden = !input.value);
		const scegli = (c) => {
			scelti[lato] = c;
			input.value = c.nome;
			input.classList.add('is-ok');
			vedi();
			chiudi();
			strada();
			aggiorna();
		};
		// × nel campo: si svuota e si riscrive
		pulisci?.addEventListener('mousedown', (e) => e.preventDefault());
		pulisci?.addEventListener('click', () => {
			input.value = '';
			vedi();
			if (scelti[lato]) {
				scelti[lato] = null;
				input.classList.remove('is-ok');
				strada();
				aggiorna();
			}
			chiudi();
			input.focus();
		});
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
		input.addEventListener('focus', () => {
			// comune già scelto: toccandolo il nome si seleziona, scrivendo si cambia subito
			if (scelti[lato]) setTimeout(() => document.activeElement === input && input.select(), 0);
			// telefono: il campo sale in cima alla tendina, così i suggerimenti restano sopra la tastiera
			if (tendina(1)) setTimeout(() => document.activeElement === input && scorriA(input.closest('.tr__lato') || input), 260);
			caricaComuni().then(() => input.value && !scelti[lato] && document.activeElement === input && mostra());
		});
		input.addEventListener('input', () => {
			vedi();
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
		// da una tendina all'altra (Avanti, ‹, indietro): niente risalita da sotto, cambia solo il contenuto
		const prima = passi.find((q) => q.classList.contains('is-aperto') && !q.classList.contains('is-chiude') && tendina(q.dataset.passo));
		const daTendina = Boolean(prima);
		if (aperta && n !== 2) chiudiStanza(false);
		for (const p of passi) {
			clearTimeout(p._chiude);
			p.classList.remove('is-chiude');
			const si = Number(p.dataset.passo) === n;
			p.classList.toggle('senza-salita', si && daTendina);
			// avanti: il contenuto arriva da destra; indietro: da sinistra; stesso passo: fermo
			if (si && daTendina) p.dataset.verso = prima === p ? 'fermo' : n > Number(prima.dataset.passo) ? 'avanti' : 'indietro';
			p.classList.toggle('is-aperto', si);
			$('[data-passo-corpo]', p).hidden = !si;
			$('[data-passo-apri]', p).setAttribute('aria-expanded', String(si));
		}
		sintesi();
		if (tendina(n)) segna();
		if (!scorri || !passo(n)) return;
		// tendina: si parte dall'inizio del passo, la pagina sotto resta ferma
		if (tendina(n)) $('[data-passo-corpo]', passo(n)).scrollTop = 0;
		else requestAnimationFrame(() => scorriA(passo(n)));
	}
	/** Chiude un passo; sul telefono la tendina scende prima di sparire */
	function chiudiPasso(p, subito = false) {
		const fine = () => {
			p.classList.remove('is-aperto', 'is-chiude');
			$('[data-passo-corpo]', p).hidden = true;
			$('[data-passo-apri]', p).setAttribute('aria-expanded', 'false');
			sintesi();
		};
		clearTimeout(p._chiude);
		if (tendina(p.dataset.passo)) togliSegno();
		if (tendina(p.dataset.passo) && !ridotto && !subito) {
			p.classList.add('is-chiude');
			p._chiude = setTimeout(fine, 330);
		} else fine();
	}
	/** Tendina tirata giù col dito: segue il dito (il velo sfuma insieme); lanciata o tirata oltre un certo punto
	 *  si chiude, altrimenti torna su con la molla (10/10) */
	function tiraGiu(foglio, scorre, chiudi, vale = () => true, velo = null) {
		let y0 = null;
		let dy = 0;
		let tira = false;
		let ultimi = [];
		const inCima = () => !scorre || scorre.scrollTop <= 0;
		const pulisci = (el) => el && ((el.style.transition = ''), (el.style.transform = ''), (el.style.opacity = ''));
		foglio.addEventListener(
			'touchstart',
			(e) => {
				y0 = e.touches.length === 1 && vale() ? e.touches[0].clientY : null;
				dy = 0;
				tira = false;
				ultimi = [];
			},
			{ passive: true }
		);
		foglio.addEventListener(
			'touchmove',
			(e) => {
				if (y0 == null) return;
				dy = e.touches[0].clientY - y0;
				if (!tira) {
					const daTesta = !scorre || !scorre.contains(e.target);
					if (dy > 8 && (daTesta || inCima())) {
						tira = true;
						foglio.style.transition = 'none';
						if (velo) velo.style.transition = 'none';
					} else if (dy < -4 || (dy > 8 && !inCima())) {
						y0 = null;
						return;
					} else return;
				}
				e.preventDefault();
				// verso l'alto fa resistenza, verso il basso segue il dito
				const y = dy > 0 ? dy : dy * 0.2;
				foglio.style.transform = `translateY(${y}px)`;
				if (velo) velo.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / (foglio.offsetHeight * 0.8)));
				ultimi.push([e.timeStamp, dy]);
				if (ultimi.length > 5) ultimi.shift();
			},
			{ passive: false }
		);
		const fine = () => {
			if (y0 == null) return;
			y0 = null;
			if (!tira) return;
			tira = false;
			// velocità degli ultimi movimenti (px al millisecondo): un lancio verso il basso chiude
			const [a, b] = [ultimi[0], ultimi[ultimi.length - 1]];
			const v = a && b && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
			const chiude = dy > Math.min(140, foglio.offsetHeight * 0.18) || (v > 0.45 && dy > 16);
			if (chiude) {
				foglio.style.transition = 'transform 280ms var(--molla)';
				foglio.style.transform = 'translateY(100%)';
				if (velo) {
					velo.style.transition = 'opacity 280ms ease';
					velo.style.opacity = '0';
				}
				setTimeout(() => {
					chiudi();
					pulisci(foglio);
					requestAnimationFrame(() => pulisci(velo));
				}, 270);
			} else {
				foglio.style.transition = 'transform 420ms var(--molla)';
				foglio.style.transform = '';
				if (velo) {
					velo.style.transition = 'opacity 420ms var(--molla)';
					velo.style.opacity = '';
				}
				setTimeout(() => {
					foglio.style.transition = '';
					if (velo) velo.style.transition = '';
				}, 440);
			}
		};
		foglio.addEventListener('touchend', fine);
		foglio.addEventListener('touchcancel', fine);
	}

	for (const p of passi) {
		const n = Number(p.dataset.passo);
		// telefono: la tendina del passo si chiude tirandola giù
		tiraGiu(p, $('[data-passo-corpo]', p), () => chiudiPasso(p, true), () => p.classList.contains('is-aperto') && tendina(n) && !aperta, $('[data-tr-velo]', box));
		$('[data-passo-apri]', p).addEventListener('click', () => {
			if (p.classList.contains('is-aperto')) chiudiPasso(p);
			else apri(n);
		});
		$('[data-passo-chiudi]', p)?.addEventListener('click', () => chiudiPasso(p));
		// ‹ in alto a sinistra: il passo prima
		$('[data-passo-indietro]', p)?.addEventListener('click', () => n > 1 && apri(n - 1));
		$('[data-passo-avanti]', p)?.addEventListener('click', () => {
			// mancano dati: niente passo dopo, si porta al campo da completare
			if (bloccato(n)) return mostraCosaManca(n);
			confermati.add(n);
			if (n === 2 && aperta) {
				// la stanza aperta si chiude e resta com'è
				chiudiStanza(false);
			}
			// la prima volta i passi vanno in fila; se la stima si è già vista e si stava solo correggendo,
			// si salta ai passi ancora da fare, o si torna alla stima
			let dopo = n + 1;
			if (visti.has(6)) while (dopo < 6 && visti.has(dopo) && !bloccato(dopo)) dopo++;
			apri(dopo);
		});
	}
	box.addEventListener('click', (e) => {
		const st = e.target.closest('[data-tr-avanti-stima]');
		if (!st) return;
		const a = st.dataset.azione;
		if (a === 'comuni') vaiAlCampo(1, '[data-tr-comune]');
		else if (a === 'cose') vaiAlCampo(2, s.cosa === 'poche' ? '[data-gruppo="poche"] input' : s.cosa ? '[data-tipo]' : '[name="cosa"]');
		else apri(6);
	});
	$('[data-tr-velo]', box)?.addEventListener('click', () => {
		const p = passi.find((q) => q.classList.contains('is-aperto') && tendina(q.dataset.passo));
		if (p) chiudiPasso(p);
	});
	veloStanza?.addEventListener('click', () => aperta && chiudiEditor(false));
	// Esc chiude la tendina aperta (ma prima chiude l'elenco dei comuni, se è aperto)
	document.addEventListener(
		'keydown',
		(e) => {
			if (e.key !== 'Escape' || e.target.closest?.('[role="combobox"][aria-expanded="true"]')) return;
			const p = passi.find((q) => q.classList.contains('is-aperto') && tendina(q.dataset.passo));
			if (p && aperta && p.dataset.passo === '2') chiudiEditor(false);
			else if (p) chiudiPasso(p);
		},
		true
	);
	box.addEventListener('click', (e) => {
		const b = e.target.closest('[data-vai-passo]');
		if (b) vaiAlCampo(Number(b.dataset.vaiPasso), b.dataset.vaiCampo);
	});
	/* ---------- Tasto indietro del telefono: con le tendine porta al passo prima, non fuori dalla pagina ---------- */
	let segno = false; // nella cronologia c'è una voce in più per le tendine
	let ignora = false;
	let dopoIgnora = null;
	const apertoOra = () => Number(passi.find((q) => q.classList.contains('is-aperto'))?.dataset.passo || 0);
	function segna() {
		if (segno || !foglio()) return;
		try {
			if (!history.state?.trTendina) history.pushState({ ...(history.state || {}), trTendina: 1 }, '');
			segno = true;
		} catch {
			// in alcune anteprime la cronologia non si può toccare
		}
	}
	function togliSegno(poi = null) {
		if (!segno) return poi?.();
		segno = false;
		ignora = true;
		dopoIgnora = poi;
		history.back();
	}
	addEventListener('popstate', () => {
		if (ignora) {
			ignora = false;
			const f = dopoIgnora;
			dopoIgnora = null;
			return f?.();
		}
		if (!segno) return;
		segno = false;
		const n = apertoOra();
		// stanza aperta: si chiude la stanza e si resta nel passo
		if (n === 2 && aperta && tendina(2)) {
			chiudiEditor(false);
			return segna();
		}
		if (n && tendina(n)) return n > 1 ? apri(n - 1) : chiudiPasso(passo(1));
		// dalla stima (o dalla pagina dopo i passi) si torna all'ultimo passo
		apri(5);
	});
	// × della pagina con la voce in più: prima si toglie la voce, poi la × fa il suo lavoro (torna alla pagina di prima)
	document.querySelector('[data-foglio-chiudi]')?.addEventListener(
		'click',
		(e) => {
			if (!segno) return;
			e.stopImmediatePropagation();
			togliSegno(() => e.currentTarget?.click?.() ?? document.querySelector('[data-foglio-chiudi]').click());
		},
		true
	);
	// la tendina si apre anche scegliendo Traslochi dalla pagina (la classe arriva dopo)
	new MutationObserver(() => {
		const n = apertoOra();
		if (n && tendina(n)) segna();
	}).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

	/** Il passo n ha i dati per andare avanti? Il passo 1 (comuni) si può saltare: il prezzo poi si vede solo inserendoli */
	function primoMancante(n) {
		const r = ultimo;
		if (!r || n === 1 || n >= 6) return null;
		const m = (r.mancano || []).find((x) => x.passo === n && !(n === 2 && /esempio/.test(x.testo)));
		if (m) return m;
		// passo 2: serve almeno qualcosa da portare (le stanze d'esempio vanno bene, si controllano dopo)
		if (n === 2 && r.vuoto) return { testo: 'Aggiungi cosa portiamo', passo: 2, campo: s.cosa === 'poche' ? '[data-gruppo="poche"] input' : s.cosa ? '[data-tipo]' : '[name="cosa"]' };
		return null;
	}
	const bloccato = (n) => Boolean(primoMancante(n));
	function mostraCosaManca(n) {
		const m = primoMancante(n);
		if (m) vaiAlCampo(n, m.campo, true);
	}
	/** Apre il passo e porta al campo che manca, visibile sotto la barra (evidenzia = un attimo in risalto) */
	function vaiAlCampo(n, sel, evidenzia = false) {
		apri(n, !sel);
		if (!sel) return;
		if (n === 2 && sel === '[data-tipo]') tipiAperti = true;
		mostra();
		requestAnimationFrame(() => {
			const p = passo(n);
			const tutti = $$(sel, p).filter((x) => !x.closest('[hidden]'));
			const campo = tutti.find((x) => 'value' in x && !x.value && x.type !== 'radio') || tutti[0];
			if (!campo) return scorriA(p);
			const dove = campo.closest('fieldset.campo, .tr__lato .campo, .tr2-pers, .tr2-tipi-box, .tr2-stanza, .tr__ogg, .tr2-gruppo') || campo;
			scorriA(dove);
			if (evidenzia) {
				dove.classList.remove('tr2-evidenzia');
				void dove.offsetWidth;
				dove.classList.add('tr2-evidenzia');
				setTimeout(() => dove.classList.remove('tr2-evidenzia'), 1700);
				// sul telefono la tastiera non si apre da sola: si mette in risalto e basta
				if (campo.matches('input[type="radio"], select, button') || !foglio()) campo.focus({ preventScroll: true });
			} else campo.focus({ preventScroll: true });
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
		const lato = (l) => {
			if (!l.comune) return '';
			const z = l.comune === 'Venezia' ? zoneVenezia.find((x) => x.id === l.zona) : null;
			return z ? `${l.comune} (${z.nome})` : l.comune;
		};
		const a = lato(s.partenza);
		const b = lato(s.arrivo);
		if (!manca(1)) metti(1, `${a} → ${b}`, true);
		else metti(1, a || b ? `${a || '…'} → ${b || '…'} · da completare` : visti.has(1) && chiuso(1) ? 'Serve per il prezzo · da completare' : '', false);
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
		// 5 · piano e ascensore
		const asc = { no: 'senza ascensore', piccolo: 'ascensore piccolo', grande: 'ascensore grande' };
		const piano = (l) => (l.piano === '' ? '' : `${pianoTesto(l.piano)}${Number(l.piano) > 0 && l.ascensore ? `, ${asc[l.ascensore]}` : ''}`);
		const pa = piano(s.partenza);
		const pb = piano(s.arrivo);
		if (!manca(5)) metti(5, maiuscola(`${pa} → ${pb}`), true);
		else metti(5, pa || pb ? maiuscola(`${pa || '…'} → ${pb || '…'} · da completare`) : daCompletare(5), false);
		metti(6, '', false);
	}

	/* ---------- Stanze ---------- */
	const listaStanze = $('[data-tr-stanze]', box);
	const foglioStanza = $('[data-tr-stanza-foglio]', box);
	function nuovaStanza(t, ogg = {}, esempio = false) {
		const st = { uid: `s${++uid}`, tipo: t, oggetti: { ...ogg }, esempio };
		s.stanze.push(st);
		return st;
	}
	function apriStanza(id) {
		aperta = id;
		disegnaStanze();
		const ed = $(`.tr2-stanza.is-aperta[data-stanza="${id}"]`, box);
		if (ed) {
			$('.tr2-stanza__nome', ed)?.focus({ preventScroll: true });
			if (tendina(2)) ed.scrollTop = 0;
			else requestAnimationFrame(() => scorriA(ed));
		}
	}
	function chiudiStanza(controllata) {
		const st = s.stanze.find((x) => x.uid === aperta);
		if (st && controllata) st.esempio = false;
		aperta = null;
		disegnaStanze();
		return st;
	}
	/** Chiude la stanza aperta e torna alla sua scheda (controllata = l'esempio è stato visto) */
	function chiudiEditor(controllata, subito = false) {
		const ed = foglioStanza && $('.tr2-stanza.is-aperta', foglioStanza);
		if (ed && tendina(2) && !subito && !ridotto) {
			if (ed.classList.contains('is-chiude')) return;
			ed.classList.add('is-chiude');
			const uid = aperta;
			setTimeout(() => aperta === uid && chiudiEditorOra(controllata), 330);
			return;
		}
		chiudiEditorOra(controllata);
	}
	function chiudiEditorOra(controllata) {
		const chiusa = chiudiStanza(controllata);
		aggiorna();
		const card = chiusa && $(`[data-stanza="${chiusa.uid}"]`, listaStanze);
		if (!card) return;
		$('button', card)?.focus({ preventScroll: true });
		// telefono: la lista resta ferma dov'era (prima scorreva da sola fino alla stanza)
		if (!tendina(2)) requestAnimationFrame(() => scorriA(card));
	}
	function disegnaStanze() {
		const sopra = tendina(2) && foglioStanza;
		listaStanze.replaceChildren(...s.stanze.map((st) => (st.uid === aperta && !sopra ? editorStanza(st) : schedaStanza(st))));
		if (foglioStanza) {
			const st = sopra && aperta ? s.stanze.find((x) => x.uid === aperta) : null;
			foglioStanza.replaceChildren(...(st ? [editorStanza(st)] : []));
		}
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
		// × (solo sul telefono, dove la stanza è una tendina sopra il passo): si chiude e resta com'è
		const x = bottone('tr2-stanza__chiudi');
		x.dataset.stanzaChiudi = '';
		x.setAttribute('aria-label', `Chiudi ${nome.toLowerCase()}`);
		x.append(icona('close', 20));
		x.addEventListener('click', () => chiudiEditor(false));
		t.append(x);
		if (tendina(2)) tiraGiu(ed, ed, () => chiudiEditor(false, true), () => true, veloStanza);
		if (st.esempio) t.append(el('span', 'tr2-badge', 'Esempio da controllare'));
		ed.append(t);
		if (st.esempio) ed.append(el('p', 'tr2-aiuto', "Sono quantità d'esempio: correggile con le tue."));
		ed.append(gruppo({ chiave: st.uid, mappa: st.oggetti, base: tipo[st.tipo].oggetti }));
		const az = el('div', 'tr2-stanza__azioni');
		const fine = bottone('btn', tendina(2) ? 'Fatto' : `Termina ${nome.toLowerCase()}`);
		fine.addEventListener('click', () => chiudiEditor(true));
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
					tastiera: false,
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
		// telefono (tendina): l'elenco delle stanze resta sempre in vista, così se ne aggiunge un'altra con un tocco
		const sempre = tendina(2);
		$('[data-tr-tipi-titolo]', box).textContent = conStanze ? (sempre ? "Aggiungi un'altra stanza" : 'Quale stanza aggiungi?') : 'Aggiungi le stanze da traslocare';
		$('[data-tr-tipi]', box).hidden = conStanze && !tipiAperti && !sempre;
		$('[data-tr-tipi-apri]', box).hidden = !conStanze || tipiAperti || sempre;
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
		// passo 6 (la stima)
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

		// riquadro in fondo alla pagina dei passi: cosa c'è nella stima e cosa manca
		const fnd = $('[data-tr-fondo]', box);
		if (fnd) {
			scrivi('[data-tr-fondo-titolo]', pronta ? etichetta(r) : 'Stima del trasloco', fnd);
			scrivi('[data-tr-fondo-sotto]', r.vuoto ? 'Sopralluogo gratuito' : [base(r), daFare].filter(Boolean).join(' · '), fnd);
			const finito = pronta && !nManca && [1, 2, 3, 4, 5].every((k) => visti.has(k));
			scrivi('[data-tr-fondo-vai]', finito ? 'Vedi la stima' : 'Continua', fnd);
		}
		// passo 5: accanto a "Partenza" e "Arrivo" il comune scelto
		for (const k of ['partenza', 'arrivo']) scrivi(`[data-tr-lato-comune="${k}"]`, s[k].comune ? ` · ${s[k].comune}` : '');
		// stima senza comuni: si chiede di inserirli per vedere il prezzo
		const chiedi = $('[data-tr-chiedi-comuni]', box);
		if (chiedi) chiedi.hidden = comuniPronti(s);
		// "Avanti": grigio finché mancano dati; il passo 1 dice "Salta" se i comuni non ci sono
		for (const p of passi) {
			const n = Number(p.dataset.passo);
			const av = $('[data-passo-avanti]', p);
			if (!av) continue;
			av.setAttribute('aria-disabled', String(bloccato(n)));
			if (n === 1) av.textContent = comuniPronti(s) ? 'Avanti' : 'Salta';
		}
		// in fondo a ogni tendina: prezzo e tipo di stima, oppure cosa manca per vederla
		for (const st of $$('[data-tr-avanti-stima]', box)) {
			scrivi('strong', pronta ? `${euro(r.min)}–${euro(r.max)} €` : '', st);
			scrivi('small', pronta ? etichetta(r) : !comuniPronti(s) ? 'Inserisci partenza e arrivo' : 'Aggiungi cosa portiamo', st);
			// toccandola: senza comuni si va ai comuni, senza cose a "Cosa portiamo", col prezzo alla stima
			st.dataset.azione = pronta ? 'stima' : !comuniPronti(s) ? 'comuni' : 'cose';
			st.setAttribute('aria-label', pronta ? `Stima ${euro(r.min)}–${euro(r.max)} euro: vedi i dettagli` : st.textContent.trim());
		}

		// riepilogo per il modulo "Richiedi un sopralluogo"
		if (riepilogo && !box.closest('[hidden]')) {
			riepilogo.value = r.riepilogo || '';
			// scelte per il server, che rifà il conto (le foto vanno a parte, non nelle scelte)
			if (riepilogo.form) {
				const input = JSON.parse(JSON.stringify(s, (k, x) => (k === 'files' ? undefined : x)));
				riepilogo.form._am = { lavoro: null, calcolo: { input, strada: km, mostrato: pronta ? { min: r.min, max: r.max } : null } };
			}
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
		if (r && !r.vuoto && comuniPronti(s)) return apri(6);
		const m = (r?.mancano || []).find((x) => x.passo === 1) || (r?.vuoto ? r.mancano.find((x) => x.passo === 2) : null);
		if (m) vaiAlCampo(m.passo, m.campo);
		else apri(r?.vuoto ? 2 : 6);
	};
	barra.addEventListener('click', vaiStima);
	// riquadro in fondo (telefono): "Continua" porta al primo passo non ancora fatto, poi a quello che manca, poi alla stima
	const fondo = $('[data-tr-fondo]', box);
	$('[data-tr-fondo-vai]', fondo)?.addEventListener('click', () => {
		const r = ultimo;
		const nonVisto = [1, 2, 3, 4, 5].find((k) => !visti.has(k));
		if (nonVisto) return apri(nonVisto);
		const m = [...(r?.mancano || [])].sort((x, y) => x.passo - y.passo)[0];
		if (m) return vaiAlCampo(m.passo, m.campo);
		apri(r?.vuoto ? 2 : 6);
	});
	barra.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), vaiStima()));
	if ('IntersectionObserver' in window)
		new IntersectionObserver(
			([e]) => {
				barra.classList.toggle('is-nascosta', e.isIntersecting);
				// quando la stima si vede nella pagina, il riquadro in fondo scende via
				fondo?.classList.toggle('is-nascosta', e.isIntersecting);
			},
			{ threshold: 0.05 }
		).observe(stimaBox);

	aggiorna();
	if (tendina(apertoOra())) segna();
}

for (const box of $$('[data-trasloco]')) avviaTrasloco(box);
