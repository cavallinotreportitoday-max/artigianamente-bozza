// ArtigianaMente — interazioni della bozza (menu, ricerca in home, preventivo guidato, moduli, visore foto).
import { calcola, euro, calcolaBagno } from './calcoli.js?v=2026101502-r58';
import { percorso } from './percorsi.js?v=2026101502';
import { avviaAmbienti, ambientiAggiorna, ambientiRighe } from './ambienti.js?v=2026101502';
import { cerca } from './ricerca.js?v=2026100914-r58';
import { attivaModuli } from './invio.js?v=2026101220-r58';
import { durata, ravviva, daTastiera } from './tendine.js?v=2026101214';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
// Arrivati col tasto indietro o ricaricando: il browser rimette la pagina dov'era, gli script non devono scorrere
const tornato = (() => {
	try {
		const t = performance.getEntriesByType('navigation')[0]?.type;
		return t === 'back_forward' || t === 'reload';
	} catch {
		return false;
	}
})();
/* Pila dei popup (14/10, Gian: come Airbnb). Ogni finestra aperta (Più informazioni, prezzo, calendario, foto…)
   entra qui: quella sotto si rimpicciolisce e si scurisce (classe is-sotto), il tasto indietro del telefono e Esc
   chiudono solo quella sopra, poi si torna a quella sotto. Ogni finestra aggiunge un passo nella cronologia. */
const pila = [];
let saltaPop = 0;
const vive = () => pila.filter((x) => !x.d.classList.contains('is-chiude') && x.d.open !== false);
const ridisegnaPila = () => {
	const v = vive();
	for (const x of pila) x.d.classList.toggle('is-sotto', v.includes(x) && x !== v[v.length - 1]);
	document.documentElement.classList.toggle('popup-aperto', v.length > 0);
};
const popup = {
	// d: la finestra; chiudi: la sua chiusura (con il suo movimento)
	apri(d, chiudi) {
		const i = pila.findIndex((x) => x.d === d);
		if (i >= 0) {
			if (!pila[i].uscita) return ridisegnaPila();
			pila.splice(i, 1); // riaperta mentre si chiudeva: rientra in cima con un passo nuovo
		}
		pila.push({ d, chiudi });
		ridisegnaPila();
		try {
			history.pushState({ ...(history.state || {}), popup: pila.length }, '');
		} catch {
			// alcune anteprime non lasciano cambiare la cronologia
		}
	},
	// inizio della chiusura: quella sotto torna subito grande; il passo nella cronologia si toglie
	esce(d) {
		const x = pila.find((y) => y.d === d);
		if (!x || x.uscita) return;
		x.uscita = true;
		ridisegnaPila();
		if (x.dalStorico) return;
		saltaPop++;
		history.back();
	},
	// fine della chiusura
	chiusa(d) {
		const i = pila.findIndex((y) => y.d === d);
		if (i < 0) return;
		popup.esce(d);
		pila.splice(i, 1);
		ridisegnaPila();
	},
	// la finestra più in alto ancora aperta
	sopra: () => vive().at(-1)?.d || null
};
addEventListener('popstate', () => {
	if (saltaPop) {
		saltaPop--;
		return;
	}
	const x = vive().at(-1);
	if (!x) return;
	x.dalStorico = true;
	x.chiudi();
});
window.amPopup = popup;

const CHECK =
	'<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" vector-effect="non-scaling-stroke"/></svg>';

/* Trascinare col dito a destra o a sinistra (solo tocco, non il mouse) */
function scorriColDito(el, fai) {
	if (!el) return;
	let x0 = null;
	let y0 = null;
	el.addEventListener('touchstart', (e) => {
		x0 = e.touches[0].clientX;
		y0 = e.touches[0].clientY;
	}, { passive: true });
	el.addEventListener('touchend', (e) => {
		if (x0 === null) return;
		const dx = e.changedTouches[0].clientX - x0;
		const dy = e.changedTouches[0].clientY - y0;
		x0 = null;
		if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) fai(dx < 0);
	});
}

/* Testata (11/10): in home è trasparente sulla foto grande e diventa bianca quando la foto passa sotto di lei;
   nelle altre pagine è bianca da subito (riga sottile appena si scorre). Le sezioni stanno dentro la testata. */
const header = $('[data-header]');
if (header) {
	const chiaro = header.classList.contains('mm-header--chiaro');
	const sopra = () => $('[data-sfondo]') || $('[data-slider], [data-copertina]');
	const soglia = () => (chiaro ? 4 : Math.max(40, (sopra()?.offsetHeight || 400) - header.offsetHeight));
	// Home (12/10): le sezioni stanno nella fascia sotto la foto. Telefono e tablet: quando la fascia arriva alla
	// seconda riga della testata prende il suo posto (stessa altezza, non si vede il cambio). Computer: la testata
	// diventa bianca quando la fascia la tocca e le sezioni compaiono quando la fascia le è passata sotto.
	const fascia = $('[data-sezioni-home]');
	const rigaSezioni = $('[data-chips]', header);
	const largo = matchMedia('(min-width: 1024px)');
	const aggiornaHeader = () => {
		if (!fascia || !rigaSezioni) return header.classList.toggle('is-scrolled', window.scrollY > soglia());
		const f = fascia.getBoundingClientRect();
		const fondoTestata = header.getBoundingClientRect().bottom;
		const cima = largo.matches ? fondoTestata : fondoTestata - rigaSezioni.offsetHeight;
		const con = f.bottom <= fondoTestata + 1;
		// la fila riparte da dove l'hai lasciata, scendendo (fascia → testata) e risalendo (testata → fascia)
		const prima = header.classList.contains('con-sezioni');
		if (con && !prima) $('.mm-sezioni__in', rigaSezioni).scrollLeft = $('.mm-sezioni__in', fascia).scrollLeft;
		if (!con && prima) $('.mm-sezioni__in', fascia).scrollLeft = $('.mm-sezioni__in', rigaSezioni).scrollLeft;
		header.classList.toggle('is-scrolled', f.top <= cima + 1);
		header.classList.toggle('con-sezioni', con);
	};
	addEventListener('scroll', aggiornaHeader, { passive: true });
	addEventListener('resize', aggiornaHeader, { passive: true });
	aggiornaHeader();
}

/* Barra in fondo alle pagine dei lavori (10/10): scendendo nella pagina si restringe, risalendo torna estesa.
   Cambia solo dopo un movimento di almeno 24 px nella stessa direzione: niente cambi continui per piccoli
   aggiustamenti o per il rimbalzo di Safari in cima e in fondo. */
const fondoBarra = $('[data-fondo]');
if (fondoBarra) {
	let ultimo = scrollY;
	let corsa = 0;
	const SOGLIA = 24;
	const segui = () => {
		const y = scrollY;
		const max = document.documentElement.scrollHeight - innerHeight;
		const d = y - ultimo;
		ultimo = y;
		if (y <= 40) {
			corsa = 0;
			fondoBarra.classList.remove('is-compatta');
			return;
		}
		if (y < 0 || y > max - 2) return; // rimbalzo in fondo: resta com'è
		if (d === 0) return;
		if (Math.sign(d) !== Math.sign(corsa)) corsa = 0;
		corsa += d;
		if (corsa > SOGLIA) fondoBarra.classList.add('is-compatta');
		else if (corsa < -SOGLIA) fondoBarra.classList.remove('is-compatta');
	};
	addEventListener('scroll', segui, { passive: true });
}

/* Slider a tutto schermo */
for (const slider of $$('[data-slider]')) {
	const track = $('[data-track]', slider);
	const slides = $$('[data-slide]', slider);
	if (slides.length < 2) continue;
	const conta = $('[data-current]', slider);
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let i = 0;
	let timer;
	const vai = (n) => {
		i = (n + slides.length) % slides.length;
		track.style.transform = `translateX(${-100 * i}%)`;
		slides.forEach((s, k) => {
			const attiva = k === i;
			s.classList.toggle('is-active', attiva);
			if (attiva) s.removeAttribute('aria-hidden');
			else s.setAttribute('aria-hidden', 'true');
			const link = $('a', s);
			if (link) link.tabIndex = attiva ? 0 : -1;
		});
		if (conta) conta.textContent = String(i + 1).padStart(2, '0');
	};
	const avvia = () => {
		clearInterval(timer);
		if (!ridotto) timer = setInterval(() => vai(i + 1), 6500);
	};
	$('[data-next]', slider)?.addEventListener('click', () => {
		vai(i + 1);
		avvia();
	});
	$('[data-prev]', slider)?.addEventListener('click', () => {
		vai(i - 1);
		avvia();
	});
	slider.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') {
			vai(i + 1);
			avvia();
		}
		if (e.key === 'ArrowLeft') {
			vai(i - 1);
			avvia();
		}
	});
	let x0 = null;
	slider.addEventListener('pointerdown', (e) => {
		if (e.pointerType !== 'mouse') x0 = e.clientX;
	});
	slider.addEventListener('pointerup', (e) => {
		if (x0 === null) return;
		const dx = e.clientX - x0;
		x0 = null;
		if (Math.abs(dx) > 40) {
			vai(dx < 0 ? i + 1 : i - 1);
			avvia();
		}
	});
	slider.addEventListener('mouseenter', () => clearInterval(timer));
	slider.addEventListener('mouseleave', avvia);
	document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : avvia()));
	avvia();
}

/* Campi numerici con + e − */
for (const box of $$('[data-stepper]')) {
	const input = $('input', box);
	// anche scritti a mano restano tra il minimo e il massimo; dove si conta uno a uno, solo numeri interi (12/10, B6)
	const limita = (finale) => {
		if (input.value === '') return;
		const min = input.min === '' ? -Infinity : Number(input.min);
		const max = input.max === '' ? Infinity : Number(input.max);
		let n = Number(input.value);
		if (!Number.isFinite(n)) return;
		if (finale && Number(input.step) === 1) n = Math.round(n);
		const giusto = Math.min(max, Math.max(min, n));
		if (giusto !== Number(input.value)) input.value = String(giusto);
	};
	input.addEventListener('input', () => limita(false));
	input.addEventListener('change', () => {
		const prima = input.value;
		limita(true);
		if (input.value !== prima) input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	for (const btn of $$('[data-step]', box)) {
		btn.addEventListener('click', () => {
			const passo = Number(input.step) || 1;
			const min = input.min === '' ? -Infinity : Number(input.min);
			const max = input.max === '' ? Infinity : Number(input.max);
			const val = Number(input.value) || 0;
			input.value = String(Math.min(max, Math.max(min, val + Number(btn.dataset.step) * passo)));
			input.dispatchEvent(new Event('input', { bubbles: true }));
		});
	}
}

/* Lettura dei valori del preventivo: solo le domande in vista (quelle nascoste per le risposte date sono spente) */
function leggi(box) {
	const v = {};
	for (const el of $$('input, textarea, select', box)) {
		if (!el.name || el.disabled || el.type === 'file') continue;
		if (el.type === 'radio') {
			if (el.checked) v[el.name] = el.value;
		} else if (el.type === 'checkbox' && el.closest('.scelta, .pv-carta')) {
			v[el.name] = v[el.name] || [];
			if (el.checked) v[el.name].push(el.value);
		} else if (el.type === 'checkbox') {
			v[el.name] = el.checked;
		} else {
			v[el.name] = el.value;
		}
	}
	return v;
}

// una domanda nascosta per le risposte date non conta (i passi chiusi sì: le risposte restano)
const nascosto = (el) => Boolean(el.closest('[data-mostra-se][hidden]'));
const senzaFacolt = (t) => t.replace(/\s*\(facoltativ[oiae]\)/gi, '').replace(/\s+/g, ' ').trim();
const testoDi = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
/** Nome breve di una risposta: il titolo della scheda (senza l'esempio), il nome del livello, o il testo della scelta */
const nomeDi = (i) => testoDi($('.tr__imballo-nome, .livello__nome', i.closest('label')) || i.closest('label'));
/** Etichette delle risposte attive, per nome della domanda */
const etichette = (box) => (nome) => $$(`input[name="${nome}"]:checked`, box).filter((i) => !i.disabled).map(nomeDi);
/** La domanda di un campo: la legenda del gruppo o l'etichetta, senza «(facoltativo)» */
const domandaDi = (el) => senzaFacolt(testoDi($(':scope > legend, :scope > .campo__label, :scope > label', el) || $('legend, .campo__label, label', el)));

/* Domande che compaiono solo per certe risposte (12/10, flussi guidati): data-mostra-se su domande, scelte e passi.
   Regola: «nome=a,b» (una delle risposte), «nome!=a,b» (nessuna di queste), «nome>0» (numero positivo);
   «&» = tutte, «|» = almeno una. «_» = nessuna risposta. Nascoste = spente: fuori da stima, riepilogo, controlli e invio. */
function vale(regola, box) {
	return regola.split('|').some((alt) =>
		alt.split('&').every((atomo) => {
			const m = atomo.match(/^([\w-]+)(!=|=|>)(.*)$/);
			if (!m) return false;
			const [, nome, op, vals] = m;
			const campi = $$(`[name="${nome}"]`, box).filter((i) => !i.disabled);
			if (op === '>') return campi.some((i) => Number(String(i.value).replace(',', '.')) > Number(vals));
			const scelti = campi.filter((i) => (i.type === 'radio' || i.type === 'checkbox' ? i.checked : i.value)).map((i) => i.value);
			const ammessi = vals.split(',');
			if (op === '!=') return !scelti.some((x) => ammessi.includes(x));
			return (scelti.length === 0 && ammessi.includes('_')) || scelti.some((x) => ammessi.includes(x));
		})
	);
}
function condizioni(box) {
	// schede delle stanze (imbiancatura): parti che servono o no, nomi e titoli (static/js/ambienti.js)
	ambientiAggiorna(box);
	// più giri finché niente cambia: una domanda può dipendere da un'altra che dipende da una terza
	for (let giro = 0; giro < 5; giro++) {
		let cambiato = false;
		for (const el of $$('[data-mostra-se]', box)) {
			const si = vale(el.dataset.mostraSe, box) && !el.parentElement.closest('[data-mostra-se][hidden]');
			if (el.hidden !== !si) {
				el.hidden = !si;
				cambiato = true;
			}
			// i campi dentro una domanda nascosta (anche di una domanda interna in vista) sono spenti
			for (const i of $$('input, select, textarea', el)) {
				const spento = !si || Boolean(i.closest('[data-mostra-se][hidden]'));
				if (i.disabled !== spento && !i.dataset.spentoDa) {
					i.disabled = spento;
					cambiato = true;
				}
			}
		}
		if (!cambiato) break;
	}
	// «Non so i m²»: il campo dei metri si spegne e si svuota (niente zero inventato); torna quando togli la spunta
	for (const c of $$('input[data-spegne]', box)) {
		const campo = $(`[name="${c.dataset.spegne}"]`, box);
		if (!campo) continue;
		const spegni = c.checked && !c.disabled;
		if (spegni) {
			campo.dataset.spentoDa = c.name;
			campo.disabled = true;
			campo.value = '';
		} else if (campo.dataset.spentoDa) {
			delete campo.dataset.spentoDa;
			campo.disabled = nascosto(campo);
		}
		for (const b of $$('[data-step]', campo.parentElement)) b.disabled = campo.disabled;
	}
	// titoli dei passi che seguono la risposta (es. «Quali mobili smontiamo?»)
	for (const t of $$('[data-titoli]', box)) {
		let nuovo = t.dataset.titoloBase;
		for (const r of t.dataset.titoli.split(';')) {
			const k = r.indexOf(':');
			if (k > 0 && vale(r.slice(0, k), box)) {
				nuovo = r.slice(k + 1);
				break;
			}
		}
		if (t.textContent !== nuovo) t.textContent = nuovo;
	}
}
/* «Non so», «Da decidere», «Tutta la casa»… nelle scelte multiple escludono le altre (e le altre escludono loro) */
function esclusivi(e) {
	const i = e.target;
	if (!i.matches?.('input[type="checkbox"]') || !i.checked || !i.closest('.scelta, .pv-carta')) return;
	const gruppo = $$(`input[type="checkbox"][name="${i.name}"]`, i.form);
	for (const x of gruppo) if (x !== i && x.checked && (i.hasAttribute('data-esclusivo') || x.hasAttribute('data-esclusivo'))) x.checked = false;
}

/* «Dettagli del progetto»: tutte le risposte in vista, passo per passo, in righe semplici (per Fabri, nel messaggio).
   Si rifà da capo a ogni invio dalle risposte di adesso: niente accumuli tornando indietro. */
// «Domanda? risposta» oppure «Etichetta: risposta»
const coppia = (d, r) => (d.endsWith('?') ? `${d} ${r}` : `${d}: ${r}`);
function dettagliDa(box, p) {
	const righe = [];
	for (const passo of $$('.tr2-passo', box)) {
		if (passo.hidden) continue;
		for (const el of $$('fieldset.campo, .campo, label.check', $('[data-passo-corpo]', passo))) {
			if (nascosto(el) || el.closest('.tr2-avanti')) continue;
			// schede delle stanze: una riga per scheda
			if (el.matches('[data-ambienti]')) {
				righe.push(...ambientiRighe(el));
				continue;
			}
			if (el.closest('[data-ambienti]')) continue;
			if (el.matches('.campo') && el.closest('fieldset.campo') && el.closest('fieldset.campo') !== el) continue;
			if (el.matches('label.check')) {
				const c = $('input', el);
				if (c.checked && !c.disabled) righe.push(`- ${coppia(testoDi(el), 'sì')}`);
				continue;
			}
			if (el.matches('fieldset')) {
				const sel = $$('input:checked', el).filter((i) => !i.disabled).map(nomeDi);
				if (sel.length) righe.push(`- ${coppia(domandaDi(el), sel.join(', '))}`);
			} else if (el.matches('[data-somma]')) {
				const pezzi = $$('.riga-mobile', el)
					.map((r) => [testoDi($('label', r)), Number($('input', r).value) || 0, testoDi($('.numero__unita', r))])
					.filter(([, n]) => n > 0)
					.map(([nome, n, u]) => (u ? `${nome} ${n} ${u}` : `${nome}: ${n}`));
				if (pezzi.length) righe.push(`- Mobili: ${pezzi.join(', ')}`);
			} else {
				const tutti = $$('input:not([type="checkbox"]):not([type="radio"]), textarea', el);
				const campi = tutti.filter((i) => !i.disabled && i.value.trim());
				if (!campi.length) continue;
				const unita = (i) => testoDi($('.numero__unita', i.parentElement));
				const val = campi.map((i) => `${tutti.length > 1 && i.placeholder ? i.placeholder + ' ' : ''}${i.value.trim()}${unita(i) ? ' ' + unita(i) : ''}`).join(', ');
				righe.push(`- ${coppia(domandaDi(el), val)}`);
			}
		}
	}
	const testa = [p.servizio, p.titolo].filter(Boolean).join(' · ');
	const esito = p.modo === 'valutazione' ? 'Richiesta di valutazione: prezzo dopo il sopralluogo' : p.esito === 'S' ? `${p.stimaTitolo || 'Stima indicativa'} calcolata sul sito (la ricalcola il server)` : 'Prezzo dopo il sopralluogo';
	return [
		testa,
		...righe,
		p.ipotesi?.length ? `Ipotesi della stima: ${p.ipotesi.join('; ')}` : '',
		p.daVerificare?.length ? `Da verificare: ${p.daVerificare.join('; ')}` : '',
		p.modo !== 'valutazione' && p.daQuantificare?.length ? `Da quantificare (non compreso): ${p.daQuantificare.join('; ')}` : '',
		`Esito: ${esito}`,
		p.contesto ? `Arriva da: ${p.contesto}` : ''
	]
		.filter(Boolean)
		.join('\n');
}

const euroRiga = (r) => (r.min === r.max ? `${euro(r.min)} €` : `${euro(r.min)}–${euro(r.max)} €`);
const iva = (testo) => {
	const s = document.createElement('span');
	s.className = 'risultato__iva';
	s.textContent = testo;
	return s;
};

/* Stima voce per voce (15/10, imbiancatura e umidità): totali per gruppo sempre in vista, tutte le voci nel dettaglio apribile,
   «Materiali di consumo*» con la nota, materiali che compra il cliente fuori dal totale. */
const euroVoce = (x) => (x.compresa ? 'compresa' : x.soglia ? `fino a ${euro(x.min)} €` : x.min === x.max ? `${euro(x.min)} €` : euroRiga(x));
function scontrinoVoci(r) {
	const box = document.createElement('div');
	box.className = 'scontrino scontrino--voci';
	let gruppo = '';
	let ul = null;
	for (const x of r.voci) {
		if (x.gruppo !== gruppo) {
			gruppo = x.gruppo;
			const t = document.createElement('p');
			t.className = 'scontrino__gruppo';
			t.textContent = gruppo;
			ul = document.createElement('ul');
			box.append(t, ul);
		}
		const li = document.createElement('li');
		const a = document.createElement('span');
		a.className = 'scontrino__nome';
		a.textContent = x.nome;
		if (x.quantita) {
			const q = document.createElement('small');
			q.className = 'scontrino__qta';
			q.textContent = x.quantita;
			a.append(q);
		}
		const b = document.createElement('span');
		b.className = 'scontrino__euro';
		b.textContent = euroVoce(x);
		li.append(a, b);
		ul.append(li);
	}
	const nota = document.createElement('p');
	nota.className = 'scontrino__nota';
	nota.textContent = `Importi senza IVA. * Materiali di consumo: ${r.consumo}.`;
	box.append(nota);
	return box;
}
function disegnaVoci(r, dove) {
	for (const el of $$('[data-out-gruppi]', dove)) {
		if (!r?.voci) {
			el.hidden = true;
			el.replaceChildren();
			continue;
		}
		const tot = new Map();
		for (const x of r.voci) {
			const t = tot.get(x.gruppo) ?? { min: 0, max: 0, soglia: false };
			tot.set(x.gruppo, { min: t.min + x.min, max: t.max + x.max, soglia: t.soglia || Boolean(x.soglia) });
		}
		const righe = [...tot.entries()].map(([g, t]) => [g, euroVoce(t)]);
		righe.push([`IVA ${r.ivaPerc}%`, euroRiga({ min: r.min - r.nettoMin, max: r.max - r.nettoMax })]);
		el.replaceChildren(
			...righe.map(([g, v]) => {
				const li = document.createElement('li');
				const a = document.createElement('span');
				const b = document.createElement('span');
				a.textContent = g;
				b.textContent = v;
				li.append(a, b);
				return li;
			})
		);
		el.hidden = false;
	}
	for (const el of $$('[data-out-quantificare]', dove)) {
		const v = r?.daQuantificare ?? [];
		el.hidden = !v.length;
		$('[data-out-quantificare-lista]', el)?.replaceChildren(
			...v.map((t) => {
				const li = document.createElement('li');
				li.textContent = t;
				return li;
			})
		);
	}
	for (const el of $$('[data-out-comprare]', dove)) {
		const v = r?.daComprare ?? [];
		el.hidden = !v.length;
		$('[data-out-comprare-lista]', el)?.replaceChildren(
			...v.map((t) => {
				const li = document.createElement('li');
				li.textContent = t;
				return li;
			})
		);
	}
}

for (const calc of $$('[data-calc]')) {
	const tipo = calc.dataset.calc;
	const servizio = calc.dataset.servizio;
	const inputs = $('[data-calc-inputs]', calc);
	const riepilogo = $('[data-riepilogo]');
	const ris = $('[data-pv-ris]', calc);
	const R = (k) => $(`[data-pv-ris-${k}]`, ris);
	const cifra = $('[data-out-cifra]', ris);
	const dettaglio = $('[data-out-dettaglio]', ris);
	const liste = $('[data-out-liste]', ris);
	const bagnoBox = $('[data-ris="bagno"]', ris);
	let senzaStima = false; // «Preferisco una valutazione senza stima» (bagno)
	// Nella pagina Preventivo ci sono tutti i lavori: scrive il riepilogo solo quello scelto
	const attivo = () => riepilogo && !calc.closest('[hidden]');
	// Le scelte del calcolatore vanno al server, che rifà il conto (backend, Fase 1); «valutazione» = senza stima
	const segna = (am) => {
		if (riepilogo?.form) riepilogo.form._am = am;
	};

	const disegnaBagno = (r, v) => {
		const c = $('[data-b-cifra]', bagnoBox);
		const testo = euroRiga(r);
		if (c.firstChild?.textContent.trim() !== testo) ravviva(c);
		c.replaceChildren(testo + ' ', iva('IVA inclusa'));
		$('[data-b-iva]', bagnoBox).textContent = `Senza IVA: ${euro(r.nettoMin)}–${euro(r.nettoMax)} €. IVA al 10% per i lavori sulla casa (aziende ed enti: 22%).`;
		$('[data-b-durata]', bagnoBox).textContent = r.durata;
		const icona = (n) => {
			const span = document.createElement('span');
			span.className = 'scontrino__icona';
			const svg = $(`[data-icone-set] [data-icona="${n}"] svg`, calc) ?? $('[data-icone-set] svg', calc);
			if (svg) span.append(svg.cloneNode(true));
			return span;
		};
		$('[data-b-voci]', bagnoBox).replaceChildren(
			...r.voci.map((x) => {
				const li = document.createElement('li');
				const a = document.createElement('span');
				const b = document.createElement('span');
				a.className = 'scontrino__nome';
				b.className = 'scontrino__euro';
				a.textContent = x.nome;
				b.textContent = x.daValutare ? 'da valutare' : euroRiga(x);
				li.append(icona(x.icona), a, b);
				return li;
			})
		);
		// prezzo di ogni livello con le altre scelte di adesso
		for (const el of $$('[data-prezzo-livello]', calc)) el.textContent = euroRiga(calcolaBagno({ ...v, livello: el.dataset.prezzoLivello }));
		// «Salva la tua stima»: il testo che il cliente si tiene
		const salva = [
			'Stima del mio bagno, da ArtigianaMente',
			r.riepilogo,
			...r.voci.map((x) => `- ${x.nome}: ${x.daValutare ? 'da valutare' : euroRiga(x)}`),
			`Durata indicativa: ${r.durata}.`,
			'Stima indicativa, non un’offerta vincolante. Il preventivo scritto arriva dopo il sopralluogo gratuito.',
			location.href.split('#')[0] + '#ristrutturazioni:bagno'
		].join('\n');
		$('[data-b-whatsapp]', bagnoBox).href = 'https://wa.me/?text=' + encodeURIComponent(salva);
		$('[data-b-email]', bagnoBox).href = 'mailto:?subject=' + encodeURIComponent('Stima del mio bagno – ArtigianaMente') + '&body=' + encodeURIComponent(salva);
	};

	const aggiorna = () => {
		condizioni(inputs);
		const a = leggi(inputs);
		const p = percorso(tipo, a, etichette(inputs));
		p.servizio = servizio;
		p.contesto = calc._contesto || '';
		// la stima: solo con il calcolatore e tutti i dati (mai importi inventati)
		let r = null;
		if (p.esito === 'S' && p.motore) {
			r = p.motore.tipo === 'bagno' ? calcolaBagno(p.motore.input) : calcola(p.motore.tipo, p.motore.input);
			if (!r.min) {
				p.esito = 'V';
				r = null;
			} else if (r.voci) {
				// stima voce per voce: le sue ipotesi e le cose da verificare si aggiungono a quelle del percorso
				p.ipotesi = [...p.ipotesi, ...(r.ipotesi ?? [])];
				p.daVerificare = [...p.daVerificare, ...(r.daVerificare ?? [])];
				p.daQuantificare = r.daQuantificare ?? [];
				if (r.titoloStima) p.stimaTitolo = r.titoloStima;
			} else if (p.rimontare) {
				r.dettaglio = r.dettaglio.replace(', con smontaggio dei vecchi mobili.', ', da smontare e rimontare.');
				r.riepilogo = r.riepilogo.replace('Smontaggio vecchi mobili sì.', 'Da smontare e rimontare.');
			}
		}
		const bagno = p.motore?.tipo === 'bagno' && Boolean(r);
		p.modo = r && !(bagno && senzaStima) ? 'stima' : 'valutazione';
		const S = p.modo === 'stima';
		ris.dataset.esito = S ? 'S' : 'V';
		ris.dataset.cifra = S ? euroRiga(r) : '';
		ris.dataset.iniziato = p.iniziato ? '1' : '';
		ris.dataset.manca = p.mancaPerStima || '';
		R('label').textContent = S ? (bagno ? 'La stima del tuo bagno' : 'La tua stima') : 'Il tuo progetto';
		R('titolo').textContent = p.titolo;
		R('descr').textContent = p.descrizione;
		R('descr').hidden = !p.descrizione;
		// stima (S)
		R('stima').hidden = !S || bagno;
		if (bagnoBox) bagnoBox.hidden = !(S && bagno);
		if (S && bagno) disegnaBagno(r, p.motore.input);
		if (S && !bagno) {
			R('stima-titolo').textContent = p.stimaTitolo || 'Stima indicativa';
			const testo = euroRiga(r);
			if (cifra.firstChild?.textContent.trim() !== testo) queueMicrotask(() => ravviva(cifra));
			cifra.replaceChildren(testo + ' ', iva(`IVA ${r.ivaPerc}% inclusa`));
			dettaglio.textContent = r.dettaglio;
			disegnaVoci(r, ris);
			if (r.voci) {
				liste.replaceChildren(scontrinoVoci(r));
			} else {
			const ul = document.createElement('ul');
			for (const c of r.comprende) {
				const li = document.createElement('li');
				li.innerHTML = CHECK;
				li.append(c);
				ul.append(li);
			}
			const fuori = document.createElement('p');
			fuori.className = 'risultato__dettaglio';
			fuori.textContent = r.esclude.length ? 'Non comprende: ' + r.esclude.join(', ').toLowerCase() + '.' : '';
			liste.replaceChildren(ul, fuori);
			}
		} else disegnaVoci(null, ris);
		// ipotesi e cose da verificare: separate da quello che hai detto
		const note = [...(S ? p.ipotesi.map((t) => ['ipotesi', t]) : []), ...(S ? p.daVerificare.map((t) => ['verifica', t]) : [])];
		R('note').hidden = !note.length;
		R('note-titolo').textContent = p.ipotesi.length && S ? 'Ipotesi e cose da verificare' : 'Da verificare al sopralluogo';
		R('note-lista').replaceChildren(
			...note.map(([k, t]) => {
				const li = document.createElement('li');
				li.dataset.nota = k;
				li.textContent = t;
				return li;
			})
		);
		// prezzo dopo il sopralluogo (V): perché, in una frase pertinente
		R('v').hidden = S || !p.iniziato;
		R('perche').textContent = bagno && senzaStima ? 'Hai scelto una valutazione senza stima: la simulazione non vale come prezzo.' : p.perche;
		R('senza').hidden = !bagno;
		$('[data-pv-valutazione]', ris).textContent = senzaStima ? 'Torna alla stima del bagno' : 'Preferisco una valutazione senza stima';
		R('avviso').hidden = !S || bagno;
		calc._p = p;
		if (attivo()) {
			const testa = tipo === 'ristrutturazioni' && a.cosa ? `${servizio}: ${etichette(inputs)('cosa')[0]}.` : `${servizio}.`;
			riepilogo.value = S
				? `${(r.riepilogo || servizio).replace(/ Budget indicativo:.*$/, '')} ${p.stimaTitolo || 'Stima indicativa'}: ${euroRiga(r)}, IVA ${r.ivaPerc ?? 10}% inclusa.`
				: [testa, p.titolo && p.titolo + '.', p.descrizione && p.descrizione.replace(/\.?$/, '.'), 'Prezzo dopo il sopralluogo.'].filter(Boolean).join(' ');
			segna({
				lavoro: tipo === 'ristrutturazioni' ? a.cosa || null : null,
				calcolo: S ? { input: p.motore.input, mostrato: { min: r.min, max: r.max } } : null,
				modo: p.modo,
				dettagli: () => dettagliDa(inputs, calc._p)
			});
		}
	};
	avviaAmbienti(inputs);
	inputs.addEventListener('submit', (e) => e.preventDefault()); // Invio in un campo non ricarica la pagina
	inputs.addEventListener('change', esclusivi, true);
	inputs.addEventListener('input', aggiorna);
	inputs.addEventListener('change', aggiorna);
	$('[data-pv-valutazione]', ris)?.addEventListener('click', () => {
		senzaStima = !senzaStima;
		aggiorna();
	});
	calc._aggiorna = aggiorna;
	aggiorna();
}

/* Richiesta rapida (12/10, mandato «Richiesta rapida in tutte le sezioni»): lo stesso modulo breve nel Preventivo e nei
   Contatti (src/lib/components/RichiestaRapida.svelte). Qui: foto con miniature, dettagli a scomparsa, recapiti già
   scritti in questa scheda, suggerimenti dei comuni, errori nelle parti chiuse. Il riepilogo lo scrive la pagina
   Preventivo; le date il calendario. Prima di attivaModuli: un errore in una parte chiusa la apre prima dell'invio. */
for (const form of $$('[data-rapida]')) {
	const pannello = $('[data-rr-pannello]', form);
	const apriB = $('[data-rr-apri]', form);
	const rigaDett = $('[data-rr-dettagli-riga]', form);
	const titoloDett = $('[data-rr-dettagli-titolo]', form);
	const testoDett = $('[data-rr-dettagli-testo]', form);
	const vuotoDett = testoDett?.textContent || '';
	const msg = $('textarea[name="messaggio"]', pannello);
	const email = $('input[name="email"]', form);

	// dettagli (messaggio ed email): chiusi, ma se c'è scritto qualcosa si vede anche da chiusi
	const sintesiDettagli = () => {
		if (!testoDett) return;
		const parti = [msg?.value.trim() && (form.hasAttribute('data-generale') ? 'messaggio' : 'nota'), email?.value.trim() && 'email'].filter(Boolean);
		testoDett.textContent = parti.length ? `Aggiunte: ${parti.join(' ed ')}` : vuotoDett;
		rigaDett?.classList.toggle('is-pieno', parti.length > 0);
		if (titoloDett) titoloDett.textContent = parti.length ? 'Dettagli' : 'Aggiungi dettagli';
	};
	const apriDettagli = (si, fuoco = false) => {
		if (!pannello || !apriB) return;
		pannello.hidden = !si;
		apriB.setAttribute('aria-expanded', String(si));
		rigaDett?.classList.toggle('is-aperta', si);
		if (si && fuoco) ($('textarea, input', pannello))?.focus({ preventScroll: false });
	};
	apriB?.addEventListener('click', () => apriDettagli(pannello.hidden, true));
	for (const c of [msg, email]) c?.addEventListener('input', sintesiDettagli);

	// un errore in una parte chiusa: la parte si apre e il browser porta lì il fuoco (anche un campo facoltativo
	// scritto male, come l'email); un campo nascosto che non serve non è mai obbligatorio
	form.addEventListener(
		'invalid',
		(e) => {
			if (pannello?.hidden && pannello.contains(e.target)) apriDettagli(true);
		},
		true
	);

	// recapiti già scritti in questa scheda (anche nell'altro modulo): tornano, e si possono cambiare
	const CHIAVE_REC = 'am-recapiti';
	const ricorda = $$('[data-rr-ricorda]', form);
	try {
		const v = JSON.parse(sessionStorage.getItem(CHIAVE_REC) || '{}');
		for (const c of ricorda) if (!c.value && typeof v[c.name] === 'string') c.value = v[c.name];
	} catch {
		// sessione non disponibile (navigazione privata)
	}
	form.addEventListener('input', (e) => {
		if (!e.target.matches?.('[data-rr-ricorda]')) return;
		try {
			const v = JSON.parse(sessionStorage.getItem(CHIAVE_REC) || '{}');
			v[e.target.name] = e.target.value;
			sessionStorage.setItem(CHIAVE_REC, JSON.stringify(v));
		} catch {
			// niente
		}
	});

	// foto: «Aggiungi foto» apre la scelta; poi miniature, quante sono e × per toglierle. Si possono aggiungere a più
	// riprese (restano tutte nel campo «foto», come prima). Al massimo 12 in tutto (con le foto degli oggetti del trasloco)
	const fotoRiga = $('[data-rr-foto]', form);
	const fotoIn = $('[data-rr-foto-input]', form);
	const mini = $('[data-rr-miniature]', form);
	const fotoTesto = $('[data-rr-foto-testo]', form);
	const fotoAvviso = $('[data-rr-foto-avviso]', form);
	const vuotoFoto = fotoTesto?.textContent || '';
	const MAX_FOTO = 12;
	let scelte = [];
	let indirizzi = [];
	const oggetti = () => $('[data-pv-foto-oggetti]', form)?.files?.length || 0;
	const metti = () => {
		try {
			const dt = new DataTransfer();
			for (const f of scelte) dt.items.add(f);
			fotoIn.files = dt.files;
			return true;
		} catch {
			return false; // browser vecchio: restano solo le foto dell'ultima scelta
		}
	};
	const disegnaFoto = () => {
		for (const u of indirizzi) URL.revokeObjectURL(u);
		indirizzi = [];
		mini.replaceChildren(
			...scelte.map((f, i) => {
				const li = document.createElement('li');
				const img = document.createElement('img');
				const u = URL.createObjectURL(f);
				indirizzi.push(u);
				img.src = u;
				img.alt = '';
				img.addEventListener('error', () => li.classList.add('is-senza'));
				const via = document.createElement('button');
				via.type = 'button';
				via.className = 'rr-miniature__via';
				via.setAttribute('aria-label', `Togli la foto ${i + 1} (${f.name})`);
				via.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12 M18 6L6 18"/></svg>';
				via.addEventListener('click', () => {
					scelte.splice(i, 1);
					metti();
					disegnaFoto();
					fotoAvviso.hidden = true;
					// il fuoco va alla foto dopo (o al pulsante per aggiungerne)
					($$('.rr-miniature__via', mini)[Math.min(i, scelte.length - 1)] || fotoIn).focus({ preventScroll: true });
					form.dispatchEvent(new Event('input', { bubbles: true }));
				});
				li.append(img, via);
				return li;
			})
		);
		mini.hidden = !scelte.length;
		fotoRiga.classList.toggle('is-pieno', scelte.length > 0);
		fotoTesto.textContent = scelte.length ? `${scelte.length === 1 ? '1 foto aggiunta' : `${scelte.length} foto aggiunte`} · aggiungine altre` : vuotoFoto;
	};
	fotoIn?.addEventListener('change', () => {
		const nuove = [...fotoIn.files].filter((f) => !scelte.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified));
		const posto = Math.max(0, MAX_FOTO - oggetti() - scelte.length);
		scelte = scelte.concat(nuove.slice(0, posto));
		// (scelta annullata: il campo si svuota, ma le foto di prima si rimettono)
		if (!metti()) scelte = [...fotoIn.files].slice(0, Math.max(0, MAX_FOTO - oggetti()));
		fotoAvviso.textContent = `Puoi allegare al massimo ${MAX_FOTO} foto in tutto.`;
		fotoAvviso.hidden = nuove.length <= posto;
		disegnaFoto();
	});

	// suggerimenti dei comuni: l'elenco arriva solo quando serve; prima quelli che iniziano così, i più vicini a noi
	const lista = $('[data-rr-comuni]', form);
	let comuni = null;
	let carica = null;
	const norm = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
	const vicino = (lat, lon) => (lat - 45.45568) ** 2 + ((lon - 12.45478) * 0.7) ** 2;
	const suggerisci = (q) => {
		if (!lista || !comuni) return;
		const t = norm(q);
		if (t.length < 2) return lista.replaceChildren();
		const inizio = [];
		const dentro = [];
		for (const c of comuni) {
			if (c.k.startsWith(t)) inizio.push(c);
			else if (c.k.includes(' ' + t)) dentro.push(c);
		}
		const ordina = (a, b) => a.d - b.d;
		const scelti = [...inizio.sort(ordina), ...dentro.sort(ordina)].slice(0, 8);
		lista.replaceChildren(
			...scelti.map((c) => {
				const o = document.createElement('option');
				o.value = c.nome;
				o.label = c.sigla;
				return o;
			})
		);
	};
	for (const c of $$('[data-rr-comune]', form)) {
		c.addEventListener('focus', () => {
			carica ??= fetch(new URL('../data/comuni.json', import.meta.url))
				.then((r) => r.json())
				.then((l) => (comuni = l.map(([nome, sigla, lat, lon]) => ({ nome, sigla, k: norm(nome), d: vicino(lat, lon) }))))
				.then(() => suggerisci(c.value))
				.catch(() => (comuni = []));
		});
		c.addEventListener('input', () => suggerisci(c.value));
	}

	// periodo preferito: toccando di nuovo quello scelto si toglie (è facoltativo)
	for (const r of $$('input[name="periodo"]', form)) {
		r.addEventListener('pointerdown', () => (r._prima = r.checked));
		r.addEventListener('click', () => {
			if (!r._prima) return;
			r.checked = false;
			r._prima = false;
			form.dispatchEvent(new Event('input', { bubbles: true }));
		});
	}

	// dopo l'invio riuscito i campi restano come sono (il modulo appena mandato non cambia)
	form._rr = {
		apriDettagli,
		/** Il lavoro scelto nel Preventivo. 12/10 (flussi guidati): per «Altro lavoro» la descrizione si scrive prima,
		 *  nel percorso; qui il messaggio resta una nota facoltativa per tutti */
		servizio() {
			const etichetta = $('[data-rr-msg-etichetta]', form);
			if (etichetta) etichetta.textContent = 'Nota';
			if (testoDett) testoDett.textContent = vuotoDett;
			sintesiDettagli();
		}
	};
	sintesiDettagli();
}

/* Moduli: con il server collegato inviano davvero (invio.js); nella bozza senza server mostrano solo la prova */
attivaModuli($$('[data-richiesta]'));

/* Modulo generale (Contatti): nei Traslochi da dove a dove al posto del comune; il resto è uguale per tutti */
const sel = $('[data-servizio-select]');
const soloTraslochi = $('[data-solo-traslochi]');
if (sel && soloTraslochi) {
	const comuneG = $('[data-pv-comune-campo]', sel.form);
	const mostra = () => {
		const tr = sel.value === 'Traslochi';
		soloTraslochi.hidden = !tr;
		// i campi nascosti non partono e non bloccano l'invio
		for (const c of $$('input', soloTraslochi)) {
			c.disabled = !tr;
			if (c.name === 'partenza' || c.name === 'arrivo') c.required = tr;
		}
		if (comuneG) {
			comuneG.hidden = tr;
			$('input', comuneG).required = !tr;
			$('input', comuneG).disabled = tr;
		}
	};
	sel.addEventListener('change', mostra);
	mostra();
}

/* Visore foto, come Airbnb, su fondo bianco.
   "Tutte le foto": griglia a due colonne. Una foto alla volta: si scorre col dito, "3 di 17", frecce e tasti ← → col computer.
   La galleria in cima alle pagine apre la griglia (data-visore-apri="griglia"); le altre foto aprono subito quella toccata.
   Le foto con lo stesso data-visore-gruppo si sfogliano insieme. */
const visore = $('[data-visore]');
if (visore && typeof visore.showModal === 'function') {
	const vistaGriglia = $('[data-visore-vista="griglia"]', visore);
	const vistaFoto = $('[data-visore-vista="foto"]', visore);
	const griglia = $('[data-visore-griglia]', visore);
	const riga = $('[data-visore-riga]', visore);
	const conta = $('[data-visore-conta]', visore);
	const tutte = $('[data-visore-tutte]', visore);
	const prec = $('[data-visore-prec]', visore);
	const succ = $('[data-visore-succ]', visore);
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let gruppo = [];

	// una foto presa dal link: stessa immagine (e stesse misure) della miniatura, il link ha quella grande
	const immagine = (a, grande) => {
		const mini = $('img', a);
		const img = document.createElement('img');
		img.alt = mini?.alt || '';
		img.decoding = 'async';
		if (grande) {
			img.src = a.getAttribute('href');
			if (mini?.srcset) {
				img.srcset = mini.srcset;
				img.sizes = '100vw';
			}
		} else {
			img.src = mini?.currentSrc || mini?.src || a.getAttribute('href');
			img.loading = 'lazy';
		}
		if (mini?.width && mini?.height) {
			img.width = mini.width;
			img.height = mini.height;
		}
		return img;
	};
	const indice = () => Math.round(riga.scrollLeft / (riga.clientWidth || 1));
	const segna = () => {
		const i = Math.min(gruppo.length - 1, Math.max(0, indice()));
		conta.textContent = `${i + 1} di ${gruppo.length}`;
		prec.disabled = i <= 0;
		succ.disabled = i >= gruppo.length - 1;
	};
	const mostraFoto = (i, morbido = false) => {
		vistaGriglia.hidden = true;
		vistaFoto.hidden = false;
		// con una foto sola niente "Tutte le foto" né "1 di 1" (nascosti senza spostare la ×)
		tutte.style.visibility = conta.style.visibility = gruppo.length < 2 ? 'hidden' : '';
		requestAnimationFrame(() => {
			riga.scrollTo({ left: i * riga.clientWidth, behavior: morbido && !lento ? 'smooth' : 'auto' });
			segna();
		});
	};
	const mostraGriglia = () => {
		vistaFoto.hidden = true;
		vistaGriglia.hidden = false;
		vistaGriglia.scrollTop = 0;
	};
	const apri = (a) => {
		const nome = a.dataset.visoreGruppo;
		gruppo = nome ? $$(`[data-visore-gruppo="${nome}"]`) : [a];
		griglia.replaceChildren(
			...gruppo.map((x, i) => {
				const b = document.createElement('button');
				b.type = 'button';
				b.className = 'visore__mini';
				b.setAttribute('aria-label', `Apri la foto ${i + 1} di ${gruppo.length}`);
				b.append(immagine(x, false));
				b.addEventListener('click', () => mostraFoto(i));
				return b;
			})
		);
		riga.replaceChildren(
			...gruppo.map((x) => {
				const d = document.createElement('div');
				d.className = 'visore__pagina';
				d.append(immagine(x, true));
				return d;
			})
		);
		// riaperto mentre si stava chiudendo: vince l'ultima azione, la finestra resta aperta
		clearTimeout(visore._t);
		visore.classList.remove('is-chiude');
		if (!visore.open) visore.showModal();
		popup.apri(visore, chiudi);
		// il fuoco va sulla finestra, non sul primo pulsante: niente cerchio intorno alla × all'apertura
		visore.focus({ preventScroll: true });
		document.documentElement.classList.add('visore-aperto');
		if (a.dataset.visoreApri === 'griglia' && gruppo.length > 1) mostraGriglia();
		else mostraFoto(gruppo.indexOf(a));
	};
	for (const a of $$('[data-visore-link]')) {
		a.addEventListener('click', (e) => {
			e.preventDefault();
			apri(a);
		});
	}
	const vai = (verso) => mostraFoto(Math.min(gruppo.length - 1, Math.max(0, indice() + verso)), true);
	tutte.addEventListener('click', mostraGriglia);
	prec.addEventListener('click', () => vai(-1));
	succ.addEventListener('click', () => vai(1));
	riga.addEventListener('scroll', segna, { passive: true });
	addEventListener('resize', () => {
		if (visore.open && !vistaFoto.hidden) mostraFoto(indice());
	});
	visore.addEventListener('keydown', (e) => {
		if (vistaFoto.hidden || gruppo.length < 2) return;
		if (e.key === 'ArrowRight') vai(1);
		else if (e.key === 'ArrowLeft') vai(-1);
	});
	// chiudendo, la libreria scende piano e poi sparisce (anche con Esc)
	const chiudi = () => {
		if (!visore.open || visore.classList.contains('is-chiude')) return;
		const ms = durata('--t-esce', 250);
		if (lento || !ms) return visore.close();
		visore.classList.add('is-chiude');
		popup.esce(visore);
		clearTimeout(visore._t);
		visore._t = setTimeout(() => {
			visore.close();
			visore.classList.remove('is-chiude');
		}, ms);
	};
	for (const b of $$('[data-visore-chiudi]', visore)) b.addEventListener('click', chiudi);
	visore.addEventListener('cancel', (e) => {
		e.preventDefault();
		chiudi();
	});
	visore.addEventListener('close', () => {
		popup.chiusa(visore);
		document.documentElement.classList.remove('visore-aperto');
		riga.replaceChildren();
		griglia.replaceChildren();
	});
}

/* Pagina Lavori: pallini sotto ogni fila di foto, uno per ogni posizione in cui la fila si ferma */
for (const riga of $$('[data-punti-riga]')) {
	const box = riga.nextElementSibling?.matches('[data-punti]') ? riga.nextElementSibling : null;
	if (!box) continue;
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const passo = () => (riga.firstElementChild?.offsetWidth || riga.clientWidth) + (parseFloat(getComputedStyle(riga).columnGap) || 0);
	const max = () => riga.scrollWidth - riga.clientWidth;
	let punti = [];
	const disegna = () => {
		const n = max() > 2 ? Math.ceil(max() / passo() - 0.05) + 1 : 0;
		if (n === punti.length) return;
		punti = Array.from({ length: n }, (_, i) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = 'v3-galleria__punto';
			b.tabIndex = -1;
			b.addEventListener('click', () => riga.scrollTo({ left: Math.min(max(), i * passo()), behavior: lento ? 'auto' : 'smooth' }));
			return b;
		});
		box.replaceChildren(...punti);
		segna();
	};
	const segna = () => {
		if (!punti.length) return;
		const i = riga.scrollLeft >= max() - 2 ? punti.length - 1 : Math.round(riga.scrollLeft / passo());
		punti.forEach((p, k) => p.classList.toggle('is-attivo', k === i));
	};
	riga.addEventListener('scroll', segna, { passive: true });
	if ('ResizeObserver' in window) new ResizeObserver(disegna).observe(riga);
	else addEventListener('resize', disegna);
	disegna();
}

/* Gallerie (in cima alle pagine, schede della home, tipi di ristrutturazione…): si scorrono col dito,
   "1 / 6" segue la foto (dove c'è), frecce ‹ › col mouse, pallini sotto */
for (const g of $$('[data-galleria]')) {
	const riga = $('[data-galleria-riga]', g);
	const n = $('[data-galleria-n]', g);
	const prec = $('[data-galleria-prec]', g);
	const succ = $('[data-galleria-succ]', g);
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const quale = () => Math.round(riga.scrollLeft / (riga.clientWidth || 1));
	// pallini sotto la galleria: quello acceso è la foto che stai guardando; toccandone uno si va a quella foto
	const punti = $$('[data-galleria-punto]', g.parentElement);
	// scritta che vale solo per la prima foto (L'azienda: «Immagine dimostrativa» sui furgoni, non sui lavori veri)
	const soloPrima = $('[data-galleria-solo-prima]', g);
	const ultima = () => riga.children.length - 1;
	const stato = () => {
		const i = quale();
		if (n) n.textContent = String(i + 1);
		if (soloPrima) soloPrima.hidden = i > 0;
		if (prec) prec.disabled = i <= 0;
		// 12/10 (Gian): la freccia a destra c'è sempre; sull'ultima foto riporta alla prima (niente stop)
		if (succ) {
			succ.disabled = ultima() < 1;
			const fine = i >= ultima();
			if (fine !== succ._fine) {
				succ._fine = fine;
				if (!succ._nome) succ._nome = succ.getAttribute('aria-label') || '';
				succ.setAttribute('aria-label', fine ? 'Torna alla prima' : succ._nome);
			}
		}
		punti.forEach((p, k) => p.classList.toggle('is-attivo', k === i));
	};
	// dall'ultima si riparte dalla prima di colpo (un riavvolgimento lungo farebbe passare tutte le foto, e negli
	// esempi anche tutti i testi)
	const daCapo = () => riga.scrollTo({ left: 0, behavior: 'auto' });
	const vai = (verso) => {
		const i = quale() + verso;
		if (i > ultima()) return daCapo();
		riga.scrollTo({ left: i * riga.clientWidth, behavior: lento ? 'auto' : 'smooth' });
	};
	// col dito (sul telefono le frecce non ci sono): sull'ultima foto, strisciando ancora verso sinistra si riparte dalla prima
	let x0 = null;
	let y0 = 0;
	let inFondo = false;
	riga.addEventListener(
		'touchstart',
		(e) => {
			x0 = e.touches.length === 1 ? e.touches[0].clientX : null;
			y0 = e.touches[0]?.clientY ?? 0;
			inFondo = riga.scrollLeft >= riga.scrollWidth - riga.clientWidth - 2;
		},
		{ passive: true }
	);
	riga.addEventListener(
		'touchend',
		(e) => {
			if (x0 === null) return;
			const dx = e.changedTouches[0].clientX - x0;
			const dy = e.changedTouches[0].clientY - y0;
			x0 = null;
			if (inFondo && ultima() > 0 && dx < -50 && Math.abs(dx) > Math.abs(dy) * 1.5) daCapo();
		},
		{ passive: true }
	);
	for (const p of punti)
		p.addEventListener('click', () =>
			riga.scrollTo({ left: Number(p.dataset.galleriaPunto) * riga.clientWidth, behavior: lento ? 'auto' : 'smooth' })
		);
	prec?.addEventListener('click', () => vai(-1));
	succ?.addEventListener('click', () => vai(1));
	riga.addEventListener('scroll', stato, { passive: true });
	stato();
}

/* Home: la foto di sfondo è alta quanto la prima schermata (titolo e ricerca);
   le icone dei lavori arrivano subito sotto, la freccia ↓ ci porta lì */
const sfondo = $('[data-sfondo]');
const zonaCerca = $('.v3-cerca');
if (sfondo && zonaCerca) {
	const fine = () => zonaCerca.offsetTop + zonaCerca.offsetHeight;
	const misura = () => (sfondo.style.height = `${fine()}px`);
	misura();
	addEventListener('resize', misura);
	document.addEventListener('sfondo-misura', misura);
	addEventListener('load', misura);
	$('[data-giu]')?.addEventListener('click', () => {
		window.amScopriTutto?.();
		// la vetrina parte subito sotto la testata, che intanto ha preso le sezioni dalla fascia
		const c = $('[data-contenuto]');
		const y = c ? c.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 0) : fine();
		scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
	});
}

/* Sezioni nella testata (in ogni pagina): la voce attiva si vede subito, anche quando la riga scorre di lato.
   Si centra solo se non si vede già intera (lo fa già lo script in fondo alla pagina, prima del primo disegno). */
const barraChips = $('[data-chips]');
const chipAttiva = barraChips && $('.mm-sezione.is-active', barraChips);
if (chipAttiva) {
	const riga = chipAttiva.parentElement;
	const fuori = chipAttiva.offsetLeft + chipAttiva.offsetWidth > riga.scrollLeft + riga.clientWidth - 8 || chipAttiva.offsetLeft < riga.scrollLeft;
	if (fuori) riga.scrollLeft = Math.max(0, chipAttiva.offsetLeft - riga.clientWidth / 2 + chipAttiva.offsetWidth / 2);
}

/* Home: la vetrina. La ricerca e le icone portano alla pagina di ogni lavoro */
const contenuto = $('[data-contenuto]');
if (contenuto) {
	const form = $('[data-ricerca-form]');
	const input = $('[data-ricerca]');
	const pulisci = $('[data-ricerca-pulisci]');
	const sugg = $('[data-suggerimenti]');
	const frequenti = $('[data-sugg-frequenti]');
	const risultati = $('[data-sugg-risultati]');
	const vuotoSugg = $('[data-sugg-vuoto]');
	const bottoniRis = $$('[data-risultato]');
	const vuoto = $('[data-vuoto]');
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const pagina = (slug) => `./${slug}.html`;

	// Porta la vetrina subito sotto le icone fisse
	const scorriAiLavori = (morbido) => {
		window.amScopriTutto?.();
		// le sezioni stanno nella testata: la vetrina parte subito sotto di lei
		const alto = header?.offsetHeight || 0;
		const y = contenuto.getBoundingClientRect().top + scrollY - alto;
		scrollTo({ top: Math.max(0, y), behavior: morbido && !ridotto ? 'smooth' : 'auto' });
	};

	// Indirizzi vecchi (#traslochi, #azienda…): ora ogni lavoro ha la sua pagina
	const daIndirizzo = (primaVolta) => {
		const h = decodeURIComponent(location.hash.slice(1));
		if (h && h !== 'tutto' && bottoniRis.some((b) => b.dataset.risultato === h)) location.replace(pagina(h));
		else if (h === 'tutto' && !(primaVolta && tornato)) requestAnimationFrame(() => scorriAiLavori(!primaVolta));
	};
	daIndirizzo(true);
	addEventListener('hashchange', () => daIndirizzo(false));

	// "Tutto" in home (nella testata e nella fascia sotto la foto): resta qui e scende alla vetrina
	for (const tutto of $$('[data-chip="tutto"]')) tutto.addEventListener('click', (e) => {
		e.preventDefault();
		try {
			history.replaceState(null, '', location.pathname + '#tutto');
		} catch {
			// in alcune anteprime l'indirizzo non si può cambiare
		}
		scorriAiLavori(true);
	});

	const aggiornaPulisci = () => (pulisci.hidden = !input.value);

	const vai = (testo) => {
		const trovati = cerca(testo);
		if (trovati.length) {
			location.href = pagina(trovati[0]);
			return;
		}
		// niente trovato: un messaggio gentile sopra la vetrina
		sugg.hidden = true;
		input.blur();
		vuoto.hidden = false;
		scorriAiLavori(true);
	};

	// Tendina sotto la barra: ricerche frequenti se è vuota, i lavori trovati mentre scrivi
	const tendina = () => {
		const testo = input.value.trim();
		const scrivo = testo.length >= 2;
		frequenti.hidden = scrivo;
		risultati.hidden = !scrivo;
		if (!scrivo) return;
		const trovati = cerca(testo).slice(0, matchMedia('(max-width: 760px)').matches ? 3 : 4);
		for (const b of bottoniRis) b.hidden = !trovati.includes(b.dataset.risultato);
		for (const slug of trovati) {
			const b = bottoniRis.find((x) => x.dataset.risultato === slug);
			if (b) risultati.insertBefore(b, vuotoSugg);
		}
		vuotoSugg.hidden = trovati.length > 0;
	};

	input.addEventListener('input', () => {
		sugg.hidden = document.activeElement !== input;
		vuoto.hidden = true;
		tendina();
		aggiornaPulisci();
	});
	input.addEventListener('focus', () => {
		sugg.hidden = false;
		tendina();
		// Sul telefono la barra sale sotto l'intestazione, così i suggerimenti restano sopra la tastiera
		if (matchMedia('(max-width: 760px)').matches) {
			setTimeout(() => {
				const titolo = $('.v3-cerca__titolo') || form;
				const y = titolo.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 60) - 10;
				if (y > scrollY + 8) scrollTo({ top: y, behavior: ridotto ? 'auto' : 'smooth' });
			}, 280);
		}
	});
	// Su Safari (Mac e iPhone) un bottone toccato non prende il fuoco: senza questo la tendina si chiudeva
	// prima del clic e i risultati non si potevano scegliere
	sugg.addEventListener('mousedown', (e) => {
		if (e.target.closest('button')) e.preventDefault();
	});
	form.addEventListener('focusout', () =>
		setTimeout(() => {
			if (!form.contains(document.activeElement) && !sugg.matches(':hover')) sugg.hidden = true;
		}, 150)
	);
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const testo = input.value.trim();
		if (testo) vai(testo);
	});
	form.addEventListener('keydown', (e) => {
		const voci = $$('button', sugg).filter((b) => b.offsetParent !== null);
		const i = voci.indexOf(document.activeElement);
		if (e.key === 'Escape') {
			sugg.hidden = true;
			input.focus();
		} else if (!sugg.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			e.preventDefault();
			const n = e.key === 'ArrowDown' ? i + 1 : i - 1;
			if (n < 0) input.focus();
			else voci[Math.min(n, voci.length - 1)].focus();
		}
	});
	sugg.addEventListener('click', (e) => {
		const r = e.target.closest('[data-risultato]');
		if (r) {
			location.href = pagina(r.dataset.risultato);
			return;
		}
		const b = e.target.closest('[data-suggerimento]');
		if (!b) return;
		input.value = b.dataset.suggerimento;
		vai(b.dataset.suggerimento);
	});
	pulisci.addEventListener('click', () => {
		input.value = '';
		aggiornaPulisci();
		vuoto.hidden = true;
		tendina();
		input.focus();
	});
}

/* Pagina Preventivo: scegli il servizio, rispondi, vedi il tuo progetto; i dati solo se chiedi il sopralluogo */
const pv = $('[data-pv]');
if (pv) {
	const lavori = $$('[data-scegli]', pv);
	const pannelli = $$('[data-pannello]', pv);
	const scelta = $('[data-pv-scelta]', pv);
	const scelto = $('[data-pv-scelto]', pv);
	const domande = $('[data-pv-domande]', pv);
	const dati = $('[data-pv-dati]', pv);
	const campoLavoro = $('[data-pv-lavoro]', pv);
	const riepilogo = $('[data-riepilogo]', pv);
	const riepTesto = $('[data-pv-riep]', pv);
	const riepBox = $('[data-pv-riep-box]', pv);
	const comuneCampo = $('[data-pv-comune-campo]', pv);
	const msg = $('[data-pv-msg]', pv);
	const facolt = $('[data-pv-facolt]', pv);
	const fotoIn = $('[data-rr-foto-input]', pv);
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const vai = (el) => el.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
	const formDati = riepilogo.form;
	const pannello = (slug) => $(`[data-pannello="${slug}"]`, pv);

	/* ---------- Altro lavoro (A1): una frase; se somiglia a un nostro lavoro lo proponiamo (senza spostarti) ---------- */
	const altro = $('[data-altro]', pv);
	const descrAltro = altro && $('[data-altro-descr]', altro);
	let suggerito = null;
	const aggiornaAltro = () => {
		if (!altro) return;
		const t = descrAltro.value.trim();
		$('[data-altro-testo]', altro).textContent = t;
		$('[data-altro-testo]', altro).hidden = !t;
		$('[data-altro-vuoto]', altro).hidden = Boolean(t);
		suggerito = t.length >= 4 ? cerca(t)[0] ?? null : null;
		const btn = suggerito && lavori.find((b) => b.dataset.scegli === suggerito);
		$('[data-altro-suggerito]', altro).hidden = !btn;
		if (btn) {
			$('[data-altro-nome]', altro).textContent = $('.v3-pv__nome', btn).textContent.trim();
			$('[data-altro-vai]', altro).href = '#' + suggerito;
		}
		// il messaggio del modulo serve solo se qui non c'è niente (il server vuole una descrizione)
		if (formDati.dataset.servizio === 'altro') msg.required = !t;
		if (formDati.dataset.servizio === 'altro') {
			riepilogo.value = t ? `Altro lavoro: ${t}` : 'Altro lavoro: vedi la descrizione.';
			formDati._am = {
				lavoro: null,
				calcolo: null,
				modo: 'valutazione',
				dettagli: () => ['Altro lavoro · Il tuo lavoro', t && `- Cosa ti serve? ${t}`, suggerito && `- Percorso suggerito dal sito: ${$('[data-altro-nome]', altro).textContent} (non seguito)`, 'Esito: Prezzo dopo il sopralluogo'].filter(Boolean).join('\n')
			};
		}
	};
	descrAltro?.addEventListener('input', aggiornaAltro);
	$('[data-altro-vai]', altro)?.addEventListener('click', (e) => {
		e.preventDefault();
		if (!suggerito) return;
		passaA(suggerito, `Altro lavoro: «${descrAltro.value.trim()}»`);
	});

	/* ---------- Da un percorso all'altro (Montaggio → Traslochi, Cucina → Montaggio…): il contesto viene con te ---------- */
	const mostraContesto = (box, testo) => {
		box._contesto = testo;
		const nota = $('[data-pv-contesto]', box);
		if (!nota) return;
		nota.hidden = !testo;
		$('[data-pv-contesto-testo]', nota).textContent = testo ? `Hai scritto prima: ${testo.replace(/^([^:]+): /, '$1 · ')}` : '';
		box._aggiorna?.();
		$('[data-calc-inputs], [data-tr-form]', box)?.dispatchEvent(new Event('input', { bubbles: true }));
	};
	const passaA = (verso, testo) => {
		const [slug] = verso.split(':');
		const box = pannello(slug)?.querySelector('[data-calc], [data-trasloco]');
		if (box) mostraContesto(box, testo);
		sceltoQui = true;
		location.hash = verso;
	};
	pv.addEventListener('click', (e) => {
		const a = e.target.closest('[data-pv-passa]');
		if (a) {
			e.preventDefault();
			const box = a.closest('[data-calc]');
			const p = box?._p;
			passaA(a.dataset.pvPassa, p ? `${p.servizio}: ${[p.titolo, p.descrizione].filter(Boolean).join(' — ')}` : '');
			return;
		}
		const via = e.target.closest('[data-pv-contesto-togli]');
		if (via) mostraContesto(via.closest('[data-calc], [data-trasloco]'), '');
		// «È una porta o una finestra?»: stessa domanda, altra risposta (il resto resta)
		const b = e.target.closest('[data-pv-vai-scelta]');
		if (b) {
			const [nome, val] = b.dataset.pvVaiScelta.split('=');
			const r = $(`input[name="${nome}"][value="${val}"]`, b.closest('form'));
			if (r) {
				r.click();
				requestAnimationFrame(() => $('fieldset:not([hidden]) input:not(:disabled)', b.closest('[data-passo-corpo]'))?.focus({ preventScroll: true }));
			}
		}
		// foto nel passo o nel risultato: la stessa raccolta del modulo
		if (e.target.closest('[data-pv-foto-aggiungi]')) fotoIn?.click();
	});
	const contaFoto = () => {
		const n = fotoIn?.files?.length || 0;
		for (const c of $$('[data-pv-foto-conta]', pv)) c.textContent = n ? ` ${n === 1 ? '1 foto aggiunta' : `${n} foto aggiunte`}.` : '';
		for (const r of $$('[data-pv-ris-foto]', pv)) {
			const box = r.closest('[data-pv-ris]');
			r.hidden = !box?.dataset.iniziato;
			$('[data-pv-ris-foto-testo]', r).textContent = n ? (n === 1 ? '1 foto aggiunta' : `${n} foto aggiunte`) : 'Puoi aggiungere una foto, se vuoi';
		}
	};
	fotoIn?.addEventListener('change', () => setTimeout(contaFoto, 0));
	formDati.addEventListener('input', () => setTimeout(contaFoto, 0));

	/* ---------- «La tua richiesta» nel modulo: il progetto in breve, la stima solo se c'è, tutte le risposte in «Vedi dettagli» ---------- */
	const rr = {
		icona: $('[data-rr-icona]', riepBox),
		servizio: $('[data-rr-servizio]', riepBox),
		cosa: $('[data-rr-cosa]', riepBox),
		stima: $('[data-rr-stima]', riepBox),
		cifra: $('[data-rr-cifra]', riepBox),
		nota: $('[data-rr-nota]', riepBox),
		vedi: $('[data-rr-vedi]', riepBox),
		tutto: riepTesto.parentElement
	};
	const essenziale = (slug) => {
		if (slug === 'altro') return descrAltro?.value.trim() || 'Raccontaci cosa ti serve';
		if (slug === 'traslochi') {
			// partenza e arrivo restano due cose distinte (e non si chiedono di nuovo)
			const s = formDati._am?.calcolo?.input;
			const da = s?.partenza?.comune;
			const a = s?.arrivo?.comune;
			if (formDati._am?.modo === 'valutazione' && !s) return 'Da quantificare insieme';
			return da && a ? `Da ${da} a ${a}` : da ? `Partenza da ${da}, arrivo da indicare` : a ? `Arrivo a ${a}, partenza da indicare` : 'Partenza e arrivo da indicare';
		}
		const p = $('[data-calc]', pannello(slug))?._p;
		return p ? [p.titolo, p.descrizione].filter(Boolean).join(' · ') : '';
	};
	const mostraRiep = () => {
		const slug = formDati.dataset.servizio || '';
		const btn = lavori.find((b) => b.dataset.scegli === slug);
		riepBox.hidden = !btn;
		if (!btn) return;
		let nome = $('[data-pv-scelto-nome]', scelto).textContent.trim() || $('.v3-pv__nome', btn).textContent.trim();
		const cosa = slug === 'ristrutturazioni' && $(`[data-pannello="${slug}"] input[name="cosa"]:checked`, pv);
		if (cosa && !nome.includes('·')) nome = `${nome} · ${nomeDi(cosa)}`;
		rr.servizio.textContent = nome;
		if (rr.icona.dataset.per !== slug) {
			rr.icona.dataset.per = slug;
			rr.icona.replaceChildren($('svg', btn).cloneNode(true));
		}
		const riga = essenziale(slug);
		rr.cosa.textContent = riga;
		rr.cosa.hidden = !riga;
		const am = formDati._am;
		const m = am?.modo !== 'valutazione' ? am?.calcolo?.mostrato : null;
		rr.stima.hidden = !m;
		if (m) rr.cifra.textContent = `${euro(m.min)}–${euro(m.max)} €`;
		const p = $('[data-calc]', pannello(slug))?._p;
		rr.nota.textContent = m
			? 'Importo indicativo. Il preventivo definitivo segue il sopralluogo gratuito. Prezzi provvisori.'
			: slug === 'altro'
				? 'Sopralluogo e preventivo sono gratuiti.'
				: p?.perche || 'Il prezzo lo definiamo dopo il sopralluogo gratuito.';
		// «Vedi dettagli»: tutte le risposte, anche quelle che non cambiano il prezzo (come arrivano a Fabri)
		const tutto = typeof am?.dettagli === 'function' ? am.dettagli() : riepilogo.value;
		riepTesto.textContent = tutto;
		const vedi = Boolean(tutto);
		rr.vedi.hidden = !vedi;
		if (!vedi) {
			rr.tutto.hidden = true;
			rr.vedi.setAttribute('aria-expanded', 'false');
		}
	};
	rr.vedi.addEventListener('click', () => {
		const si = rr.tutto.hidden;
		rr.tutto.hidden = !si;
		rr.vedi.setAttribute('aria-expanded', String(si));
		rr.vedi.textContent = si ? 'Nascondi dettagli' : 'Vedi dettagli';
	});
	// «Modifica»: si torna alle scelte del lavoro (sul telefono il primo passo sale come tendina); per «Altro lavoro» alla frase
	$('[data-rr-modifica]', riepBox).addEventListener('click', () => {
		const slug = formDati.dataset.servizio;
		if (slug === 'altro') return descrAltro ? (vai(altro), descrAltro.focus({ preventScroll: true })) : $('[data-pv-cambia]', pv).click();
		const pan = slug && pannello(slug);
		if (!pan) return $('[data-pv-cambia]', pv).click();
		const primo = $$('.tr2-passo', pan).find((q) => !q.hidden && !q.classList.contains('is-saltato') && !q.matches('[data-passo-stima], [data-passo="6"]'));
		if (!primo) return vai(pan);
		if (!primo.classList.contains('is-aperto')) $('[data-passo-apri]', primo)?.click();
		if (!telefono()) requestAnimationFrame(() => vai(primo));
	});
	const apriDati = () => {
		// Altro lavoro: prima la frase (il messaggio del modulo resta per i dettagli in più)
		if (formDati.dataset.servizio === 'altro' && descrAltro && !descrAltro.value.trim() && !msg.value.trim()) {
			vai(altro);
			descrAltro.focus({ preventScroll: true });
			descrAltro.closest('.campo')?.classList.add('tr2-evidenzia');
			setTimeout(() => descrAltro.closest('.campo')?.classList.remove('tr2-evidenzia'), 1700);
			return;
		}
		mostraRiep();
		dati.hidden = false;
		vai(dati);
	};

	const telefono = () => matchMedia('(max-width: 860px)').matches;
	// × della tendina: si torna alla pagina di prima del sito (es. Traslochi), altrimenti alla scelta del servizio.
	// Se il lavoro l'hai scelto qui (dalla lista «Che lavoro ti serve?»), si torna alla lista (12/10)
	let sceltoQui = false;
	// C'è una pagina del sito prima, nella stessa scheda? Si misura all'arrivo: dopo, le tendine aggiungono voci alla
	// cronologia e history.length non lo dice più (revisione 12/10, M3: in una scheda nuova la × non faceva niente)
	let daSito = false;
	try {
		daSito = !!document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1;
	} catch {
		// referrer non leggibile: si resta qui
	}
	$('[data-foglio-chiudi]')?.addEventListener('click', () => {
		// B4: subito dopo la chiusura di una tendina un secondo tocco nello stesso punto non chiude anche la stima
		if (performance.now() - (window.amTendinaChiusaIl ?? -1e9) < 350) return;
		if (!sceltoQui && daSito) return history.back();
		// alla lista pulita: le domande del lavoro di prima non restano sotto (B1)
		$('[data-pv-cambia]', pv).click();
		domande.hidden = true;
		dati.hidden = true;
	});
	const scegli = (slug, scorri) => {
		const btn = lavori.find((b) => b.dataset.scegli === slug);
		if (!btn) return;
		// una domanda già risposta dalla pagina di prima (es. "Cucina") torna visibile se si cambia lavoro
		for (const f of $$('[data-pv-fissata]', pv)) {
			delete f.dataset.pvFissata;
			f.hidden = false;
			f.closest('.tr2-passo')?.classList.remove('is-saltato');
		}
		for (const b of lavori) {
			b.classList.toggle('is-active', b === btn);
			b.setAttribute('aria-pressed', String(b === btn));
		}
		for (const pan of pannelli) pan.hidden = pan.dataset.pannello !== slug;
		const nome = $('.v3-pv__nome', btn).textContent.trim();
		scelta.hidden = true;
		scelto.hidden = false;
		$('[data-pv-scelto-nome]', scelto).textContent = nome;
		$('[data-pv-scelto-icona]', scelto).replaceChildren($('svg', btn).cloneNode(true));
		domande.hidden = false;
		campoLavoro.value = nome;
		if (campoLavoro.form) {
			campoLavoro.form.dataset.servizio = slug;
			if (slug === 'altro') campoLavoro.form._am = null;
		}
		const isAltro = slug === 'altro';
		msg.required = false;
		facolt.hidden = false;
		campoLavoro.form?._rr?.servizio(slug);
		// nei traslochi partenza e arrivo li abbiamo già: niente terza domanda sul comune
		const trasloco = slug === 'traslochi';
		// calcolatori a passi (tutti tranne «Altro lavoro», 11/10): titolo più corto e meno spazio sopra, così il passo
		// aperto arriva prima; sul telefono i passi salgono come tendine (come Traslochi)
		const passi = !isAltro;
		document.documentElement.classList.toggle('pv-trasloco', passi);
		document.documentElement.classList.toggle('pv-foglio', passi && !window.amSenzaTendine);
		const titolo = btn.dataset.titoloStima || nome;
		for (const t of $$('.pv-foglio__titolo, .pv-titolo-tr')) t.textContent = titolo;
		$('[data-foglio-chiudi]')?.setAttribute('aria-label', `Chiudi: ${titolo.toLowerCase()}`);
		comuneCampo.hidden = trasloco;
		$('input', comuneCampo).required = !trasloco;
		// un campo nascosto non parte e non blocca l'invio (nei Traslochi il comune non serve: ci sono partenza e arrivo)
		$('input', comuneCampo).disabled = trasloco;
		dati.hidden = true;
		$('[data-conferma]', dati).hidden = true;
		if (isAltro) aggiornaAltro();
		else $(`[data-pannello="${slug}"] [data-calc-inputs]`, pv)?.dispatchEvent(new Event('input', { bubbles: true }));
		mostraRiep();
		contaFoto();
		try {
			history.replaceState(history.state, '', location.pathname + '#' + slug);
		} catch {
			// in alcune anteprime l'indirizzo non si può cambiare
		}
		// con le tendine (telefono) si parte dall'alto; altrimenti si va al servizio scelto
		if (scorri) passi && telefono() ? scrollTo({ top: 0, behavior: 'auto' }) : vai(scelto);
	};

	for (const b of lavori)
		b.addEventListener('click', () => {
			sceltoQui = true;
			document.documentElement.classList.remove('pv-arrivo');
			scegli(b.dataset.scegli, true);
		});
	$('[data-pv-cambia]', pv).addEventListener('click', () => {
		scelta.hidden = false;
		scelto.hidden = true;
		document.documentElement.classList.remove('pv-trasloco', 'pv-foglio');
		vai(scelta);
	});
	// «Richiedi un sopralluogo»: apre il modulo dei dati
	pv.addEventListener('click', (e) => {
		const a = e.target.closest('a[href="#dati"]');
		if (!a) return;
		e.preventDefault();
		apriDati();
	});
	for (const ev of ['input', 'change'])
		pv.addEventListener(ev, () =>
			setTimeout(() => {
				mostraRiep();
				contaFoto();
			}, 0)
		);

	// Arrivo da una pagina del servizio (preventivo.html#parquet): servizio già scelto, si va alle domande
	// #ristrutturazioni:cucina → ristrutturazioni con "Cucina" già scelta. Un indirizzo sconosciuto lascia la scelta.
	const daIndirizzo = (primaVolta) => {
		const [h, sub] = decodeURIComponent(location.hash.slice(1)).split(':');
		if (h === 'dati') return;
		if (!lavori.some((b) => b.dataset.scegli === h)) return;
		const fai = () => {
			const r = sub && $(`[data-pannello="${h}"] input[name="cosa"][value="${sub}"]`, pv);
			if (r && !r.checked) {
				r.checked = true;
				r.dispatchEvent(new Event('change', { bubbles: true }));
			}
			scegli(h, !(primaVolta && tornato));
			// "Parliamo della tua cucina": la cucina è già scelta, niente domanda "Quale spazio vuoi rinnovare?".
			// Si vede in alto: "Ristrutturazioni · Cucina · Modifica"
			if (r) {
				const domanda = r.closest('fieldset');
				domanda.dataset.pvFissata = '';
				domanda.hidden = true;
				const nome = $('[data-pv-scelto-nome]', scelto);
				nome.textContent = `${nome.textContent} · ${nomeDi(r)}`;
				// la variante resta nell'indirizzo: ricaricando o copiando il link resta la cucina (revisione 12/10, M2)
				try {
					history.replaceState(history.state, '', `${location.pathname}#${h}:${sub}`);
				} catch {
					// in alcune anteprime l'indirizzo non si può cambiare
				}
				// se era l'unica domanda del passo aperto («Quale spazio»), si apre subito il passo dopo,
				// così la tendina non resta vuota (passi.js fa lo stesso, ma arriva un attimo dopo)
				const passo = domanda.closest('.tr2-passo.is-aperto');
				const corpo = passo && $('[data-passo-corpo]', passo);
				const restano = corpo && $$('fieldset, .campo, label.check', corpo).some((el) => !el.closest('.tr2-avanti') && !el.closest('[data-pv-fissata]') && !nascosto(el));
				if (passo && !restano) passo.classList.add('is-saltato');
				if (passo && !restano) {
					let dopo = passo.nextElementSibling;
					while (dopo && !(dopo.matches('.tr2-passo') && !dopo.hidden)) dopo = dopo.nextElementSibling;
					if (dopo) {
						passo.classList.remove('is-aperto');
						corpo.hidden = true;
						$('[data-passo-apri]', passo)?.setAttribute('aria-expanded', 'false');
						dopo.classList.add('is-aperto');
						$('[data-passo-corpo]', dopo).hidden = false;
						$('[data-passo-apri]', dopo)?.setAttribute('aria-expanded', 'true');
					}
				}
			}
		};
		// la prima volta subito, così la pagina è già quella giusta quando il browser la rimette dov'era
		if (primaVolta === true) fai();
		else requestAnimationFrame(fai);
	};
	addEventListener('hashchange', () => daIndirizzo(false));
	daIndirizzo(true);
	// D2 (12/10): arrivando con un lavoro nell'indirizzo la pagina era nascosta fino a qui (pv-arrivo): ora è pronta
	document.documentElement.classList.add('pv-pronto');
}

/* "Stampa il riepilogo": stampa solo il riepilogo del bagno (dal menu di stampa si salva come PDF) */
for (const b of $$('[data-stampa]')) {
	b.addEventListener('click', () => {
		document.documentElement.classList.add('stampa-bagno');
		print();
		setTimeout(() => document.documentElement.classList.remove('stampa-bagno'), 500);
	});
}

/* Telefono: barretta con il budget sempre a portata, sparisce quando il riepilogo è sullo schermo */
for (const barra of $$('[data-bagno-barra]')) {
	const box = barra.parentElement.querySelector('[data-ris="bagno"]');
	if (!box || !('IntersectionObserver' in window)) continue;
	new IntersectionObserver(([e]) => barra.classList.toggle('is-nascosta', e.isIntersecting), { threshold: 0.15 }).observe(box);
	barra.addEventListener('click', () => box.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

/* Freccia "indietro": torna alla pagina di prima del sito, altrimenti va alla home */
for (const a of $$('[data-indietro]')) {
	a.addEventListener('click', (e) => {
		let dalSito = false;
		try {
			dalSito = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
		} catch {
			dalSito = false;
		}
		if (dalSito && history.length > 1) {
			e.preventDefault();
			history.back();
		}
	});
}

/* Mappe "Dove siamo": disegnate con MapLibre e la mappa libera di OpenFreeMap (nitida anche su iPhone).
   Il programma (nel sito, cartella vendor) si carica solo quando una mappa sta per vedersi. */
const mappe = $$('[data-mappa]');
if (mappe.length && 'IntersectionObserver' in window) {
	const base = new URL('../vendor/maplibre/', import.meta.url);
	let libreria;
	const carica = () =>
		(libreria ||= new Promise((ok, no) => {
			const css = document.createElement('link');
			css.rel = 'stylesheet';
			css.href = new URL('maplibre-gl.css', base).href;
			document.head.append(css);
			const s = document.createElement('script');
			s.src = new URL('maplibre-gl.js', base).href;
			s.onload = ok;
			s.onerror = no;
			document.head.append(s);
		}));
	const disegna = async (el) => {
		try {
			await carica();
			const mappa = new window.maplibregl.Map({
				container: el,
				style: 'https://tiles.openfreemap.org/styles/bright',
				center: [Number(el.dataset.lon), Number(el.dataset.lat)],
				zoom: el.clientWidth < 600 ? 12.2 : 12.8,
				interactive: false,
				attributionControl: false,
				fadeDuration: 0
			});
			mappa.once('load', () => el.classList.add('is-pronta'));
		} catch {
			// senza mappa resta il fondo chiaro con il pallino: si può sempre toccare per aprire Mappe
		}
	};
	const guarda = new IntersectionObserver(
		(voci) => {
			for (const v of voci) {
				if (!v.isIntersecting) continue;
				guarda.unobserve(v.target);
				disegna(v.target);
			}
		},
		{ rootMargin: '300px' }
	);
	for (const m of mappe) guarda.observe(m);
}

/* "Portami qui": su iPhone, iPad e Mac apre Mappe di Apple, altrimenti Google Maps */
if (/iPhone|iPad|Macintosh/.test(navigator.userAgent)) {
	for (const a of $$('[data-portami]')) a.href = `https://maps.apple.com/?daddr=${encodeURIComponent(a.dataset.portami)}`;
}

/* Righe con frecce ‹ › (come Airbnb): scorrono di una pagina e si spengono agli estremi. Sul telefono si usa il dito. */
for (const box of $$('[data-scorri]')) {
	const riga = $('[data-scorri-riga]', box);
	const indietro = $('[data-scorri-prec]', box);
	const avanti = $('[data-scorri-succ]', box);
	if (!riga || !indietro || !avanti) continue;
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const stato = () => {
		indietro.disabled = riga.scrollLeft <= 2;
		avanti.disabled = riga.scrollLeft >= riga.scrollWidth - riga.clientWidth - 2;
	};
	const vai = (verso) => {
		const card = riga.firstElementChild;
		const spazio = parseFloat(getComputedStyle(riga).columnGap) || 0;
		const larga = card ? card.offsetWidth + spazio : riga.clientWidth;
		const quante = Math.max(1, Math.floor((riga.clientWidth + spazio) / larga));
		riga.scrollBy({ left: verso * larga * quante, behavior: lento ? 'auto' : 'smooth' });
	};
	indietro.addEventListener('click', () => vai(-1));
	avanti.addEventListener('click', () => vai(1));
	riga.addEventListener('scroll', stato, { passive: true });
	// anche quando la riga diventa visibile (schede della home) o cambia la finestra
	if ('ResizeObserver' in window) new ResizeObserver(stato).observe(riga);
	else addEventListener('resize', stato);
	stato();
}


/* Tipi di ristrutturazione (14/10, come «Scegli la tua camera» di Airbnb): ogni scheda apre la sua finestra grande
   (il pulsante ha data-info-apri: la apre il blocco «Finestre e fumetti»). Qui: il riquadro di lato, la barra in fondo
   e i Dettagli del prezzo seguono lo spazio aperto; ristrutturazioni.html#tipo-cucina apre subito la Cucina. */
// solo i pulsanti dei tipi (hanno data-tipo-sub): anche le stanze dei Traslochi hanno data-tipo (revisione 12/10, M4)
const tipi = $$('[data-tipo][data-tipo-sub]');
if (tipi.length) {
	// prezzo (o "Prezzo dopo il sopralluogo"), condizione e pulsante che porta al preventivo di quel tipo
	// (10/10, brief: il caso Tetti con "Da 4.000 €")
	const base = $('[data-vivo-href]')?.getAttribute('href')?.split('#')[0] || '';
	const vivo = (b) => {
		const prezzo = b.dataset.tipoPrezzo;
		for (const el of $$('[data-vivo-prezzo]'))
			el.innerHTML = prezzo ? `<span>Da <strong>${prezzo}</strong></span><small>IVA inclusa</small>` : '<span>Prezzo dopo il sopralluogo</span>';
		for (const el of $$('[data-vivo-nota]')) el.textContent = prezzo ? b.dataset.tipoNota : 'Lo definiamo dopo aver visto il lavoro.';
		if (base) for (const el of $$('[data-vivo-href]')) el.setAttribute('href', `${base}#ristrutturazioni:${b.dataset.tipoSub}`);
	};
	const mostra = (id) => {
		for (const b of tipi) {
			const si = b.dataset.tipo === id;
			b.classList.toggle('is-active', si);
			if (si) vivo(b);
		}
	};
	for (const b of tipi) b.addEventListener('click', () => mostra(b.dataset.tipo));
	// all'apertura il riquadro porta già al preventivo del primo tipo (il bagno)
	vivo(tipi[0]);
	const daIndirizzo = () => {
		const h = decodeURIComponent(location.hash.slice(1));
		const b = h.startsWith('tipo-') && tipi.find((x) => x.dataset.tipo === h.slice(5));
		if (!b) return;
		mostra(b.dataset.tipo);
		// la finestra si apre quando lo script delle finestre è pronto (è più in basso in questo file)
		setTimeout(() => window.amApriInfo?.(document.getElementById(b.dataset.infoApri), b), 0);
	};
	addEventListener('hashchange', daIndirizzo);
	daIndirizzo();
}

/* Calcolatore del trasloco: lo script si carica solo dove serve */
/* Entrata morbida (12/10, lotto «Movimento rifinito»): solo le schede con foto salgono piano (12 px, 400 ms), la prima
   volta. Testi e prezzi si vedono subito. Arrivando con un'ancora (#…), col tasto indietro o con «Riduci movimento»
   niente entrate; con «Tutto» e con la freccia ↓ la destinazione si vede subito. La classe «entra» la mette questo
   script: se si ferma, il contenuto resta visibile. */
window.amScopriTutto = () => {};
if (
	'IntersectionObserver' in window &&
	!matchMedia('(prefers-reduced-motion: reduce)').matches &&
	!document.documentElement.classList.contains('torna') &&
	!location.hash
) {
	const vista = new IntersectionObserver(
		(voci) => {
			for (const v of voci) {
				if (!v.isIntersecting) continue;
				v.target.classList.add('si-vede');
				vista.unobserve(v.target);
				// a fine entrata si tolgono le classi: niente trasformazioni rimaste addosso
				setTimeout(() => v.target.classList.remove('entra', 'si-vede'), durata('--t-entra', 400) + 100);
			}
		},
		{ rootMargin: '0px 0px -6% 0px' }
	);
	const candidati = $$('.v3-card, .v3-mini, .v3-rappresenta').filter((e) => !e.closest('.v3-pv'));
	for (const e of candidati) {
		if (e.getBoundingClientRect().top < innerHeight) continue;
		e.classList.add('entra');
		vista.observe(e);
	}
	window.amScopriTutto = () => {
		vista.disconnect();
		for (const e of $$('.entra')) e.classList.remove('entra', 'si-vede');
	};
}

// se uno script dei passi non arriva, la pagina non resta sotto una tendina senza comandi: i passi restano nella pagina
const senzaTendine = () => {
	window.amSenzaTendine = true;
	document.documentElement.classList.remove('pv-foglio');
};
if ($('[data-trasloco]')) import('./trasloco-ui.js?v=2026101220-r58').catch(senzaTendine);
// gli altri calcolatori a passi, come Traslochi (11/10): tendine sul telefono
if ($('[data-passi]')) import('./passi.js?v=2026101502').catch(senzaTendine);

/* Link alla stessa pagina (es. "Scrivici" → #scrivici): scorrimento morbido fatto qui, non dal CSS */
document.addEventListener('click', (e) => {
	const a = e.target.closest('a[href^="#"]');
	if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
	const id = decodeURIComponent(a.getAttribute('href').slice(1));
	const el = id && document.getElementById(id);
	if (!el) return;
	e.preventDefault();
	el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});

/* Calendario unico, guidato in due passi (lotto 11/10, S6): «Sopralluogo» → «Avanti» → «Inizio desiderato»
   (Traslochi: «Giorno del trasloco») → «Salva le preferenze». Sono PREFERENZE, non prenotazioni, e tutte e due
   facoltative («Nessuna preferenza», «Non lo so ancora»). Lo aprono le caselle del riquadro di lato (pagine dei
   lavori, computer: al centro) e le righe di "Quando ti va bene?" nel modulo (telefono: sale dal basso).
   Aprendo la seconda casella si parte dal secondo passo; «Indietro» torna al primo. Le scelte restano in una bozza:
   chiudere (×, Esc, clic fuori) non cambia niente; solo «Salva le preferenze» le scrive, in un'unica sorgente
   (la sessione), e le ricontrolla senza spostarle. Giorni civili sul calendario di Roma (Europe/Rome).
   Niente fine prevista finché Fabri non approva le durate (MOSTRA_FINE). Giorni esclusi: passati, sabati,
   domeniche, festivi (Pasquetta compresa, 4 ottobre dal 2026) e ferie di Fabri (data.js, ferie). */
const cal = $('[data-cal]');
if (cal) {
	const MOSTRA_FINE = false;
	const CHIAVE = 'am-date';
	const mesiBox = $('[data-cal-mesi]', cal);
	const titolo = $('[data-cal-titolo]', cal);
	const sotto = $('[data-cal-sotto]', cal);
	const passoTesto = $('[data-cal-passo]', cal);
	const sceltaTesto = $('[data-cal-scelta]', cal);
	const cancella = $('[data-cal-cancella]', cal);
	const salta = $('[data-cal-salta]', cal);
	const avanti = $('[data-cal-avanti]', cal);
	const indietro = $('[data-cal-indietro]', cal);
	const ferie = (() => {
		try {
			return JSON.parse(cal.dataset.ferie || '[]');
		} catch {
			return [];
		}
	})();
	const pv = $('[data-pv]');
	const avviso = $('[data-quando-avviso]');
	let modo = 'sopralluogo';
	let bozza = { sopralluogo: null, inizio: null }; // le scelte di questa apertura, non ancora salvate
	let periodi = []; // «Oppure un periodo» del modulo (12/10): con «Ho una data» che apre il calendario
	const dillo = (t) => {
		if (!avviso) return;
		avviso.textContent = t;
		avviso.hidden = !t;
	};
	// periodo e date insieme no: con delle date salvate il periodo è «Ho una data»; senza date «Ho una data» si toglie
	function allinea() {
		const hoData = periodi.find((r) => r.value === 'Ho una data');
		if (!hoData) return;
		const date = Boolean(valori.sopralluogo || valori.inizio);
		if (date && !hoData.checked) {
			const prima = periodi.find((r) => r.checked);
			hoData.checked = true;
			if (prima) dillo(`Resta la data che hai scelto: il periodo «${prima.value}» non vale più.`);
		} else if (!date && hoData.checked && !cal.open) hoData.checked = false;
	}

	// «oggi» è il giorno civile a Roma, qualunque sia il fuso del dispositivo; giorni senza ore (niente salti col cambio dell'ora)
	const oggi = () => {
		try {
			const parti = Object.fromEntries(
				new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric' })
					.formatToParts(new Date())
					.map((x) => [x.type, x.value])
			);
			const d = new Date(Number(parti.year), Number(parti.month) - 1, Number(parti.day));
			if (!Number.isNaN(d.getTime())) return d;
		} catch {
			// fuso orario non disponibile: si usa quello del dispositivo
		}
		const d = new Date();
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	};
	const piu = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
	const piuMesi = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
	const chiave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const daChiave = (k) => {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(k || '')) return null;
		const [y, m, g] = k.split('-').map(Number);
		return new Date(y, m - 1, g);
	};
	const stesso = (a, b) => (a ? chiave(a) : '') === (b ? chiave(b) : '');
	const pasqua = (y) => {
		const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
		const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
		const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
		const mese = Math.floor((h + l - 7 * m + 114) / 31), giorno = ((h + l - 7 * m + 114) % 31) + 1;
		return new Date(y, mese - 1, giorno);
	};
	const festivi = new Map();
	const festivo = (d) => {
		const y = d.getFullYear();
		if (!festivi.has(y)) {
			const f = new Set(['01-01', '01-06', '04-25', '05-01', '06-02', '08-15', '11-01', '12-08', '12-25', '12-26', chiave(piu(pasqua(y), 1)).slice(5)]);
			if (y >= 2026) f.add('10-04'); // San Francesco, di nuovo festa nazionale (legge 151/2025)
			festivi.set(y, f);
		}
		return festivi.get(y).has(chiave(d).slice(5));
	};
	const inFerie = (d) => {
		const k = chiave(d);
		return ferie.some(([da, a]) => k >= da && k <= (a || da));
	};
	const lavorativo = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !festivo(d) && !inFerie(d);

	// il servizio di cui parliamo: pagina del lavoro, oppure quello scelto nel Preventivo
	const servizio = () => cal.dataset.servizio || $('[data-scegli].is-active')?.dataset.scegli || '';
	const trasloco = () => servizio() === 'traslochi';
	const nomeInizio = () => (trasloco() ? 'Giorno del trasloco' : 'Inizio desiderato');

	// un'unica sorgente: la sessione (niente dati personali nell'indirizzo)
	const leggi = () => {
		try {
			const v = JSON.parse(sessionStorage.getItem(CHIAVE) || '{}');
			return { servizio: v.servizio || '', sopralluogo: daChiave(v.sopralluogo), inizio: daChiave(v.inizio) };
		} catch {
			return { servizio: '', sopralluogo: null, inizio: null };
		}
	};
	const valori = leggi();
	const scrivi = () => {
		try {
			sessionStorage.setItem(
				CHIAVE,
				JSON.stringify({ servizio: valori.servizio, sopralluogo: valori.sopralluogo ? chiave(valori.sopralluogo) : '', inizio: valori.inizio ? chiave(valori.inizio) : '' })
			);
		} catch {
			// sessione non disponibile (navigazione privata): le date valgono solo in questa pagina
		}
	};

	// limiti delle preferenze (non disponibilità reali): l'inizio dipende dal sopralluogo della stessa serie di scelte
	const limiti = (k, v = valori) => {
		const o = oggi();
		if (k === 'sopralluogo') return [piu(o, 2), piuMesi(o, 3)];
		return [v.sopralluogo ? piu(v.sopralluogo, 1) : piu(o, 7), piuMesi(o, 12)];
	};
	const valida = (k, d, v = valori) => {
		if (!d) return false;
		const [min, max] = limiti(k, v);
		return d >= min && d <= max && lavorativo(d);
	};
	// una preferenza non più valida si toglie, non si sposta
	const rivalida = (v = valori) => {
		if (v.sopralluogo && !valida('sopralluogo', v.sopralluogo, v)) v.sopralluogo = null;
		if (v.inizio && !valida('inizio', v.inizio, v)) v.inizio = null;
	};

	const anno = (d) => (d.getFullYear() !== oggi().getFullYear() ? { year: 'numeric' } : {});
	const lungo = (d) => d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', ...anno(d) });
	const corto = (d) => d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', ...anno(d) });

	const aggiorna = () => {
		for (const t of $$('[data-quando-etichetta]')) t.textContent = nomeInizio();
		for (const k of ['sopralluogo', 'inizio']) {
			const v = valori[k];
			for (const t of $$(`[data-quando-testo="${k}"]`)) {
				const mini = !!t.closest('[data-quando-mini]');
				t.textContent = v ? (mini ? corto(v) : lungo(v)) : t.dataset.quandoVuoto || 'Scegli un giorno';
				t.closest('button')?.classList.toggle('is-pieno', !!v);
			}
			for (const i of $$(`[data-quando-valore="${k}"]`)) i.value = v ? chiave(v) : '';
		}
		// richiesta rapida (12/10): una riga sola «Preferenze sulle date» con quelle scelte, «Modifica» e × per toglierle
		const parti = [valori.sopralluogo && `Sopralluogo: ${corto(valori.sopralluogo)}`, valori.inizio && `${nomeInizio()}: ${corto(valori.inizio)}`].filter(Boolean);
		for (const t of $$('[data-rr-date]')) {
			t.textContent = parti.length ? parti.join(' · ') : 'Facoltative: puoi inviare anche senza';
			const riga = t.closest('[data-rr-date-riga]');
			riga?.classList.toggle('is-pieno', parti.length > 0);
			const az = riga && $('[data-rr-date-azione]', riga);
			if (az) az.textContent = parti.length ? 'Modifica' : 'Scegli';
			const via = riga && $('[data-rr-date-togli]', riga);
			if (via) via.hidden = !parti.length;
		}
		allinea();
	};
	for (const b of $$('[data-rr-date-togli]'))
		b.addEventListener('click', () => {
			valori.sopralluogo = null;
			valori.inizio = null;
			scrivi();
			aggiorna();
			$('[data-quando-apri]', b.closest('[data-rr-date-riga]'))?.focus({ preventScroll: true });
		});

	// cambio di lavoro: l'inizio desiderato si toglie (e lo diciamo); il sopralluogo resta se è ancora valido
	const controllaServizio = () => {
		const s = servizio();
		if (!s) return;
		if (valori.servizio && valori.servizio !== s && valori.inizio) {
			valori.inizio = null;
			if (avviso) {
				avviso.textContent = 'Hai cambiato lavoro: scegli di nuovo l’inizio desiderato.';
				avviso.hidden = false;
			}
		}
		valori.servizio = s;
		rivalida();
		scrivi();
		aggiorna();
	};

	const segna = () => {
		const d = bozza[modo];
		const kp = d && chiave(d);
		for (const b of $$('.cal__giorno', mesiBox)) {
			const scelto = b.dataset.giorno === kp;
			b.classList.toggle('is-scelto', scelto);
			b.setAttribute('aria-pressed', String(scelto));
		}
		sceltaTesto.textContent = d ? lungo(d) : 'Nessun giorno scelto';
		cancella.hidden = !d;
		avanti.disabled = !d;
	};
	const disegna = () => {
		const [min, max] = limiti(modo, bozza);
		const o = oggi();
		const frag = document.createDocumentFragment();
		const mesi = (max.getFullYear() - o.getFullYear()) * 12 + max.getMonth() - o.getMonth() + 1;
		for (let m = 0; m < mesi; m++) {
			const primo = new Date(o.getFullYear(), o.getMonth() + m, 1);
			const sez = document.createElement('section');
			sez.className = 'cal__mese';
			const nome = document.createElement('h3');
			nome.className = 'cal__nome';
			const testo = primo.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
			nome.textContent = testo.charAt(0).toUpperCase() + testo.slice(1);
			const griglia = document.createElement('div');
			griglia.className = 'cal__griglia';
			for (let i = 0; i < (primo.getDay() + 6) % 7; i++) griglia.append(document.createElement('span'));
			const ultimo = new Date(primo.getFullYear(), primo.getMonth() + 1, 0).getDate();
			for (let g = 1; g <= ultimo; g++) {
				const d = new Date(primo.getFullYear(), primo.getMonth(), g);
				const ok = d >= min && d <= max && lavorativo(d);
				const b = document.createElement('button');
				b.type = 'button';
				b.className = 'cal__giorno';
				b.textContent = g;
				b.disabled = !ok;
				b.dataset.giorno = chiave(d);
				b.setAttribute('aria-label', lungo(d) + (ok ? '' : ', non disponibile'));
				griglia.append(b);
			}
			sez.append(nome, griglia);
			frag.append(sez);
		}
		mesiBox.replaceChildren(frag);
	};

	// mostra un passo nella stessa finestra: titolo, testi, pulsanti, giorni possibili
	const mostra = (k, nota = '') => {
		// da un passo all'altro il contenuto arriva di lato, come nelle tendine (avanti da destra, indietro da sinistra)
		const verso = modo && modo !== k ? (k === 'inizio' ? 'avanti' : 'indietro') : '';
		modo = k;
		cal.classList.remove('cal-scorre');
		if (verso) {
			cal.dataset.verso = verso;
			void cal.offsetWidth;
			cal.classList.add('cal-scorre');
		}
		const primo = k === 'sopralluogo';
		passoTesto.textContent = primo ? 'Passo 1 di 2' : 'Passo 2 di 2';
		titolo.textContent = primo ? 'Sopralluogo' : nomeInizio();
		sotto.textContent =
			nota ||
			(primo
				? 'Scegli il giorno che preferisci, se ne hai uno. Ti contattiamo per concordare giorno e orario.'
				: trasloco()
					? 'Facoltativo. Scegli il giorno in cui vorresti traslocare.'
					: 'Facoltativo. Scegli quando vorresti iniziare i lavori.');
		salta.textContent = primo ? 'Nessuna preferenza' : 'Non lo so ancora';
		avanti.textContent = primo ? 'Avanti' : 'Salva le preferenze';
		indietro.hidden = primo;
		disegna();
		segna();
		const vedi = $('.cal__giorno.is-scelto', mesiBox) || $('.cal__giorno:not(:disabled)', mesiBox);
		mesiBox.scrollTop = vedi ? Math.max(0, vedi.closest('.cal__mese').offsetTop - mesiBox.offsetTop) : 0;
		(vedi || avanti).focus({ preventScroll: true });
	};
	// dal primo al secondo passo: se il nuovo sopralluogo rende impossibile l'inizio scelto, l'inizio si toglie (e lo diciamo)
	const alSecondo = () => {
		const prima = bozza.inizio;
		if (bozza.inizio && !valida('inizio', bozza.inizio, bozza)) bozza.inizio = null;
		mostra('inizio', prima && !bozza.inizio ? `Con il nuovo sopralluogo il giorno scelto prima non va più bene: scegline un altro, se vuoi.` : '');
	};
	const salvaTutto = () => {
		valori.sopralluogo = bozza.sopralluogo;
		valori.inizio = bozza.inizio;
		valori.servizio = servizio();
		rivalida();
		scrivi();
		aggiorna();
		chiudi();
	};

	let daChi = null; // il pulsante che ha aperto il calendario: ci torna il fuoco alla chiusura
	const apri = (k, chi) => {
		controllaServizio();
		daChi = chi;
		bozza = { sopralluogo: valori.sopralluogo, inizio: valori.inizio };
		// riaperto mentre si stava chiudendo: vince l'ultima azione
		clearTimeout(cal._t);
		cal.classList.remove('is-chiude');
		if (!cal.open) cal.showModal(); // la pagina sotto resta inerte finché la finestra è aperta
		popup.apri(cal, chiudi);
		document.documentElement.classList.add('cal-aperto');
		modo = null; // all'apertura niente scivolata di lato
		mostra(k === 'inizio' ? 'inizio' : 'sopralluogo');
	};
	// chiusura con un movimento (12/10): sul telefono scende come le tendine, sul computer sparisce svelto
	const chiudi = () => {
		if (!cal.open || cal.classList.contains('is-chiude')) return;
		const ms = durata(matchMedia('(max-width: 860px)').matches ? '--t-chiudi' : '--t-rapido', 200);
		if (!ms) return cal.close();
		cal.classList.add('is-chiude');
		popup.esce(cal);
		cal._t = setTimeout(() => {
			cal.classList.remove('is-chiude');
			cal.close();
		}, ms);
	};
	// Esc: stessa chiusura animata (senza salvare)
	cal.addEventListener('cancel', (e) => {
		e.preventDefault();
		chiudi();
	});
	cal.addEventListener('close', () => {
		popup.chiusa(cal);
		allinea(); // «Ho una data» senza date salvate (chiuso senza salvare) si toglie
		document.documentElement.classList.remove('cal-aperto');
		cal.classList.remove('is-chiude', 'cal-scorre');
		// il fuoco torna al pulsante che l'ha aperto; col dito il browser lo rimette da solo, senza riquadro
		if (daTastiera() || !matchMedia('(hover: none)').matches) daChi?.focus({ preventScroll: true });
	});
	cal.addEventListener('click', (e) => {
		if (e.target === cal) chiudi(); // clic fuori: chiude senza salvare
	});
	mesiBox.addEventListener('click', (e) => {
		const b = e.target.closest('.cal__giorno');
		if (!b || b.disabled) return;
		const d = daChiave(b.dataset.giorno);
		bozza[modo] = stesso(bozza[modo], d) ? null : d; // toccare di nuovo il giorno scelto lo toglie
		segna();
	});
	$('[data-cal-chiudi]', cal).addEventListener('click', chiudi);
	cancella.addEventListener('click', () => {
		bozza[modo] = null;
		segna();
		($('.cal__giorno:not(:disabled)', mesiBox) || avanti).focus({ preventScroll: true });
	});
	indietro.addEventListener('click', () => mostra('sopralluogo'));
	salta.addEventListener('click', () => {
		bozza[modo] = null;
		if (modo === 'sopralluogo') alSecondo();
		else salvaTutto();
	});
	avanti.addEventListener('click', () => {
		if (modo === 'sopralluogo') alSecondo();
		else salvaTutto();
	});
	document.addEventListener('click', (e) => {
		const b = e.target.closest?.('[data-quando-apri]');
		if (b) apri(b.dataset.quandoApri, b);
	});
	// Preventivo: quando si sceglie o cambia il lavoro
	if (pv) {
		document.addEventListener('click', (e) => {
			if (e.target.closest?.('[data-scegli]')) setTimeout(controllaServizio, 0);
		});
		addEventListener('hashchange', () => setTimeout(controllaServizio, 0));
	}
	// richiesta arrivata: le preferenze sono state usate una volta, non passano a una richiesta nuova
	document.addEventListener('am:richiesta-inviata', () => {
		try {
			sessionStorage.removeItem(CHIAVE);
		} catch {
			// sessione non disponibile
		}
	});
	// «Ho una data» apre il calendario; scegliendo un periodo le date di prima si tolgono (e lo diciamo)
	periodi = $$('[data-rr-periodo] input[name="periodo"]');
	for (const r of periodi)
		r.addEventListener('change', () => {
			if (!r.checked) return;
			if (r.value === 'Ho una data') {
				if (!valori.sopralluogo && !valori.inizio) apri('sopralluogo', $('[data-quando-apri="sopralluogo"]', r.form) || r);
				return;
			}
			if (valori.sopralluogo || valori.inizio) {
				valori.sopralluogo = null;
				valori.inizio = null;
				scrivi();
				aggiorna();
				dillo(`Resta il periodo «${r.value}»: abbiamo tolto le date scelte prima.`);
			}
		});
	// date scadute o non più valide (es. tornando dopo qualche giorno): si tolgono
	rivalida();
	setTimeout(controllaServizio, 0);
	aggiorna();
	void MOSTRA_FINE;
}

/* Esempi di intervento (12/10, Gian): le foto si scorrono come le altre gallerie ([data-galleria]); i testi seguono
   la foto in vista, così scorrendo cambia tutto il caso. Niente rotazione automatica. */
for (const box of $$('[data-esempi]')) {
	const riga = $('[data-galleria-riga]', box);
	const casi = $$('[data-esempio-caso]', box);
	if (!riga || !casi.length) continue;
	let ora = 0;
	const segui = () => {
		const i = Math.min(casi.length - 1, Math.max(0, Math.round(riga.scrollLeft / (riga.clientWidth || 1))));
		if (i === ora) return;
		ora = i;
		casi.forEach((c, k) => (c.hidden = k !== i));
		// i testi del caso nuovo compaiono con una dissolvenza breve, mai sovrapposti ai vecchi (12/10)
		ravviva(casi[i]);
	};
	riga.addEventListener('scroll', segui, { passive: true });
	addEventListener('resize', segui, { passive: true });
}

/* Recensioni: «Mostra tutte e N le recensioni» apre la finestra con l'elenco completo (14/10, «Finestre e fumetti») */

/* Barre in fondo assenti quando non servono (10/10, brief): con il modulo della richiesta aperto
   (nei Traslochi sparisce "Inserisci partenza e arrivo / Continua") e mentre si scrive (tastiera). */
const datiPv = $('[data-pv-dati]');
if (datiPv) {
	const segnaModulo = () => document.documentElement.classList.toggle('pv-modulo', !datiPv.hidden);
	new MutationObserver(segnaModulo).observe(datiPv, { attributes: true, attributeFilter: ['hidden'] });
	segnaModulo();
}
{
	const campo = (el) => el?.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]), textarea, select');
	let via;
	document.addEventListener('focusin', (e) => {
		if (!campo(e.target)) return;
		clearTimeout(via);
		document.documentElement.classList.add('tastiera');
	});
	document.addEventListener('focusout', (e) => {
		if (!campo(e.target)) return;
		via = setTimeout(() => {
			if (!campo(document.activeElement)) document.documentElement.classList.remove('tastiera');
		}, 120);
	});
}

/* ---------- Finestre e fumetti come Airbnb (14/10, Gian) ----------
   dialog[data-info]: finestre (Più informazioni, recensioni, schede di Ristrutturazioni, dettagli del prezzo).
   Si aprono con [data-info-apri="id"]; si chiudono con ×, Esc, tocco fuori o il tasto indietro del telefono.
   Si possono aprire una sopra l'altra (pila in cima al file). Telefono: salgono dal basso. Computer: al centro;
   le finestre con data-fumetto invece stanno attaccate al pulsante che le apre, senza sfondo scuro, come il
   «Dettagli del prezzo» di Airbnb (sul telefono diventano un foglio basso). Il fuoco torna al pulsante. */
{
	const radiceInfo = document.documentElement;
	const telefono = () => matchMedia('(max-width: 860px)').matches;
	const chiudiInfo = (d) => {
		if (!d || !d.open || d.classList.contains('is-chiude')) return;
		const ms = durata(telefono() ? '--t-chiudi' : '--t-rapido', 200);
		const fine = () => {
			d.classList.remove('is-chiude');
			d.close();
		};
		if (!ms) return fine();
		d.classList.add('is-chiude');
		popup.esce(d);
		d._t = setTimeout(fine, ms);
	};
	// fumetto sul computer: sotto il pulsante, allineato al suo bordo sinistro; se sotto non c'è posto, sopra
	const metti = (d, chi) => {
		if (!d.hasAttribute('data-fumetto') || telefono() || !chi) {
			d.style.removeProperty('left');
			d.style.removeProperty('top');
			return;
		}
		const r = chi.getBoundingClientRect();
		const w = d.offsetWidth;
		const h = d.offsetHeight;
		const left = Math.min(Math.max(16, r.left), innerWidth - w - 16);
		let top = r.bottom + 8;
		if (top + h > innerHeight - 16) top = Math.max(16, r.top - h - 8);
		d.style.left = `${Math.round(left)}px`;
		d.style.top = `${Math.round(top)}px`;
	};
	const apriInfo = (d, chi) => {
		if (!d || typeof d.showModal !== 'function') return;
		clearTimeout(d._t);
		d.classList.remove('is-chiude');
		d._chi = chi;
		d.querySelector('.info__corpo')?.scrollTo(0, 0);
		if (!d.open) d.showModal();
		// il fuoco va sulla finestra, non sulla ×: niente cerchio intorno alla × all'apertura (come il visore)
		d.focus({ preventScroll: true });
		metti(d, chi);
		// il fumetto sul computer non blocca la pagina (niente salto della barra di scorrimento)
		if (!d.hasAttribute('data-fumetto') || telefono()) radiceInfo.classList.add('info-aperta');
		popup.apri(d, () => chiudiInfo(d));
	};
	for (const d of document.querySelectorAll('dialog[data-info]')) {
		d.addEventListener('cancel', (e) => {
			e.preventDefault();
			chiudiInfo(d);
		});
		d.addEventListener('click', (e) => {
			if (e.target === d || e.target.closest('[data-info-chiudi]')) chiudiInfo(d);
		});
		d.addEventListener('close', () => {
			popup.chiusa(d);
			if (!document.querySelector('dialog[data-info][open]')) radiceInfo.classList.remove('info-aperta');
			if (daTastiera() || !matchMedia('(hover: none)').matches) d._chi?.focus({ preventScroll: true });
		});
	}
	// il fumetto resta attaccato al pulsante: scorrendo o cambiando misura si chiude, come su Airbnb
	const viaFumetti = (e) => {
		if (telefono() || e?.target?.closest?.('dialog[data-fumetto]')) return;
		for (const d of document.querySelectorAll('dialog[data-fumetto][open]')) chiudiInfo(d);
	};
	addEventListener('resize', viaFumetti, { passive: true });
	addEventListener('wheel', viaFumetti, { passive: true });
	document.addEventListener('click', (e) => {
		const b = e.target.closest('[data-info-apri]');
		if (!b) return;
		e.preventDefault();
		apriInfo(document.getElementById(b.dataset.infoApri), b);
	});
	window.amApriInfo = apriInfo;
	window.amChiudiInfo = chiudiInfo;
}
