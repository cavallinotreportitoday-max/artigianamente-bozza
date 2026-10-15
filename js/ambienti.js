// Schede delle stanze (o delle pareti) nel preventivo dell'imbiancatura (15/10/2026, Gian + revisione ChatGPT),
// dei muri con l'umidità nel risanamento (data-ambienti="muri": tipo, fascia o macchia, misure, altro lato) e dei
// lavori della falegnameria (data-ambienti="lavori": cosa, problema, quanti, ricambio).
// Una scheda per stanza: tipo, misure (le misure / i m² di pavimento / «Non lo so»), cosa pitturare, problemi.
// «Aggiungi una stanza», «Duplica» (copia le scelte della scheda) e «Togli». I nomi dei campi sono amb{n}_campo:
// static/js/percorsi.js li raccoglie (ambientiDa). Le parti che non servono si nascondono e si spengono
// (data-spento-da="amb": app.js e condizioni() non le riaccendono).

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const NOMI = { stanze: 'Stanza', pareti: 'Parete', soffitti: 'Stanza', muri: 'Muro', lavori: 'Lavoro' };
const AGGIUNGI = { stanze: 'Aggiungi una stanza', pareti: 'Aggiungi una parete', soffitti: 'Aggiungi una stanza', muri: 'Aggiungi un muro', lavori: 'Aggiungi un altro lavoro' };
const AIUTO = {
	stanze: 'Una scheda per ogni stanza. Le misure vanno bene anche a occhio.',
	pareti: 'Una scheda per ogni parete: larghezza e altezza, anche a occhio.',
	soffitti: 'Una scheda per ogni stanza: bastano le misure del pavimento.',
	muri: 'Una scheda per ogni muro con l’umidità. Le misure vanno bene anche a occhio.',
	lavori: 'Un lavoro per scheda: cosa, che problema ha e quanti sono. L’uscita si conta una volta sola.'
};
// falegnameria, riparazioni e piccoli lavori (data-ambienti="lavori")
const NOME_LAV = { anta: 'Anta di mobile', cassetto: 'Cassetto', mobile: 'Mobile, tavolo o letto', porta: 'Porta interna', scorrevole: 'Anta scorrevole', finestra: 'Finestra o scuro', tapparella: 'Tapparella', zanzariera: 'Zanzariera', altro: 'Altro' };
const UNITA_LAV = { anta: 'ante', cassetto: 'cassetti', mobile: 'pezzi', porta: 'porte', scorrevole: 'ante', finestra: 'ante', tapparella: 'tapparelle', zanzariera: 'zanzariere', altro: 'pezzi' };
/** Il testo della scelta fatta (es. il problema), per riassunti e messaggi */
const etichetta = (card, campo) => $$(`input[name$="_${campo}"]:checked`, card).find((i) => !i.disabled)?.nextElementSibling?.textContent.trim() || '';
const NOME_TIPO = { camera: 'Camera', soggiorno: 'Soggiorno', cucina: 'Cucina', bagno: 'Bagno', corridoio: 'Corridoio', altro: 'Altra stanza', cantina: 'Cantina', esterno: 'Muro esterno' };

/** Che cosa si imbianca adesso: stanze, pareti o soffitti (la scelta del primo passo); «muri» per l'umidità (fisso) */
const modoDi = (box) => box.dataset.ambienti || $('input[name="cosa_imb"]:checked', box.closest('form'))?.value || 'stanze';
const valore = (card, campo) => {
	const els = $$(`[name$="_${campo}"]`, card).filter((i) => !i.disabled);
	if (!els.length) return '';
	if (els[0].type === 'radio') return els.find((i) => i.checked)?.value || '';
	if (els[0].type === 'checkbox') return els.length > 1 || els[0].closest('.scelta') ? els.filter((i) => i.checked).map((i) => i.value) : els[0].checked;
	return els.find((i) => i.value)?.value || '';
};
const numero = (v) => {
	const n = Number(String(v ?? '').replace(',', '.'));
	return Number.isFinite(n) && n > 0 ? n : 0;
};
const virgola = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Mostra e spegne le parti di una scheda secondo le sue risposte e il tipo di lavoro */
function disegnaScheda(card, modo) {
	const modoMis = valore(card, 'modo');
	const pareti = valore(card, 'pareti');
	const problemi = valore(card, 'problemi') || [];
	const vale = (regola) => {
		if (regola === 'estesi') return problemi.some((p) => !['nessuno', 'carta'].includes(p));
		const [k, v] = regola.split('=');
		if (k === 'modo') return modoMis === v;
		if (k === 'pareti') return pareti === v;
		const x = valore(card, k); // altri campi della scheda (lavori: tipo, problema), anche più valori «a,b»
		return v.split(',').some((y) => (Array.isArray(x) ? x.includes(y) : x === y));
	};
	for (const el of $$('[data-amb-per], [data-amb-se]', card)) {
		const si = (!el.dataset.ambPer || el.dataset.ambPer.split(',').includes(modo)) && (!el.dataset.ambSe || vale(el.dataset.ambSe));
		el.hidden = !si;
	}
	if (modo === 'lavori') {
		const u = $('[data-amb-unita]', card);
		const tipo = valore(card, 'tipo');
		const prob = valore(card, 'problema');
		if (u) u.textContent = prob === 'cerniera' || prob === 'supporto' ? 'cerniere' : prob === 'maniglia' ? (tipo === 'porta' ? 'coppie' : 'maniglie') : prob === 'cigola' ? 'letti' : UNITA_LAV[tipo] || 'pezzi';
	}
	// i campi dentro le parti nascoste sono spenti (fuori da stima, riassunto e invio)
	for (const i of $$('input', card)) {
		const nascosta = i.closest('[hidden]');
		const spento = Boolean(nascosta) && card.contains(nascosta); // solo le parti nascoste della scheda
		if (spento) {
			i.dataset.spentoDa = 'amb';
			i.disabled = true;
		} else if (i.dataset.spentoDa === 'amb') {
			delete i.dataset.spentoDa;
			i.disabled = Boolean(i.closest('[data-mostra-se][hidden]'));
		}
	}
	// per una parete: «larghezza» al posto di «lunghezza»
	const l = $('input[name$="_l"]', card);
	if (l && modo !== 'muri') l.placeholder = modo === 'pareti' ? 'largo' : 'lungo';
}

/** Riscrive nomi e titoli delle schede; si chiama a ogni cambio (anche dal primo passo) */
export function ambientiAggiorna(form) {
	for (const box of $$('[data-ambienti]', form)) {
		const modo = modoDi(box);
		box.dataset.modo = modo;
		const schede = $$('[data-amb]', box);
		schede.forEach((card, k) => {
			const tipo = modo === 'pareti' ? '' : modo === 'lavori' ? NOME_LAV[valore(card, 'tipo')] : NOME_TIPO[valore(card, 'tipo')];
			$('[data-amb-nome]', card).textContent = tipo ? `${tipo}` : `${NOMI[modo]} ${k + 1}`;
			$('[data-amb-togli]', card).hidden = schede.length < 2;
			disegnaScheda(card, modo);
			if (modo === 'lavori') disegnaScheda(card, modo); // il problema dipende dall'oggetto, il ricambio dal problema
		});
		const t = $('[data-amb-aggiungi-testo]', box);
		if (t) t.textContent = AGGIUNGI[modo];
		const a = $('[data-amb-aiuto]', box);
		if (a) a.textContent = AIUTO[modo];
	}
}

/** La prima scheda incompleta (per «Avanti»), oppure null */
export function ambientiManca(box) {
	const modo = modoDi(box);
	for (const card of $$('[data-amb]', box)) {
		const m = valore(card, 'modo');
		if (modo === 'lavori') {
			if (!valore(card, 'tipo') || !valore(card, 'problema') || !numero(valore(card, 'n'))) return card;
			continue;
		}
		const tipoOk = modo === 'pareti' || valore(card, 'tipo');
		const misOk =
			m === 'nonso' ||
			(modo === 'muri' ? (m === 'fascia' || m === 'macchia') && numero(valore(card, 'l')) && numero(valore(card, 'h')) : (m === 'misure' && numero(valore(card, 'l')) && (modo === 'pareti' || numero(valore(card, 'w')))) || (m === 'mq' && numero(valore(card, 'mq'))));
		if (!tipoOk || !misOk) return card;
	}
	return $$('[data-amb]', box).length ? null : box;
}

/** Descrizione breve di una scheda: «Camera 4 × 3,5 m», «Parete 3 m», «Soggiorno, misure da prendere» */
function testoScheda(card, modo, k) {
	if (modo === 'lavori') {
		const descr = valore(card, 'descr');
		const n = numero(valore(card, 'n')) || 1;
		return [`${NOME_LAV[valore(card, 'tipo')] || `Lavoro ${k + 1}`}${descr ? `: ${descr}` : ''}`, etichetta(card, 'problema').toLowerCase(), n > 1 ? `${n} ${$('[data-amb-unita]', card)?.textContent || 'pezzi'}` : ''].filter(Boolean).join(', ');
	}
	const tipo = modo === 'pareti' ? `Parete ${k + 1}` : NOME_TIPO[valore(card, 'tipo')] || `${NOMI[modo] || 'Stanza'} ${k + 1}`;
	const m = valore(card, 'modo');
	const l = numero(valore(card, 'l'));
	const w = numero(valore(card, 'w'));
	const mq = numero(valore(card, 'mq'));
	const h = numero(valore(card, 'h'));
	const mis =
		modo === 'muri'
			? m === 'nonso' ? 'misure da prendere' : l && h ? `${m === 'macchia' ? 'macchia ' : ''}${virgola(l)} × ${virgola(h)} m` : ''
			: m === 'misure' && l ? (modo === 'pareti' ? `${virgola(l)} m` : w ? `${virgola(l)} × ${virgola(w)} m` : '') : m === 'mq' && mq ? `${virgola(mq)} m²` : m === 'nonso' ? 'misure da prendere' : '';
	return [tipo, mis].filter(Boolean).join(m === 'nonso' ? ', ' : ' ');
}
/** Riassunto del passo (riga sotto il titolo) */
export function ambientiSintesi(box) {
	const modo = modoDi(box);
	return $$('[data-amb]', box)
		.map((c, k) => testoScheda(c, modo, k))
		.join(', ');
}
/** Righe per i «Dettagli del progetto» che arrivano a Fabri */
export function ambientiRighe(box) {
	const modo = modoDi(box);
	return $$('[data-amb]', box).map((card, k) => {
		const parti = [testoScheda(card, modo, k)];
		if (modo === 'lavori') {
			const r = valore(card, 'ricambio');
			if (r) parti.push(r === 'ho' ? 'ricambio: ce l’ho già' : 'ricambio: lo portate voi');
			return `- ${parti.join(', ')}`;
		}
		if (modo === 'muri') {
			const altro = valore(card, 'altro');
			if (altro) parti.push({ si: 'anche dall’altro lato', no: 'non dall’altro lato', nonso: 'altro lato: non so' }[altro]);
			return `- ${parti.join(', ')}`;
		}
		const h = numero(valore(card, 'h'));
		if (h) parti.push(`altezza ${virgola(h)} m`);
		const pareti = valore(card, 'pareti');
		if (modo === 'stanze') parti.push(pareti === 'alcune' ? `${valore(card, 'quante') || 1} pareti` : pareti === 'nessuna' ? 'nessuna parete' : 'tutte le pareti');
		if (valore(card, 'soffitto') === true) parti.push('anche il soffitto');
		const etichette = $$('input[name$="_problemi"]:checked', card).filter((i) => !i.disabled).map((i) => i.nextElementSibling?.textContent.trim().toLowerCase());
		if (etichette.length) parti.push(`problemi: ${etichette.join(', ')}${valore(card, 'estesi') === 'gran' ? ' (gran parte)' : valore(card, 'estesi') === 'poche' ? ' (poche zone)' : ''}`);
		const v = numero(valore(card, 'vetrata'));
		if (v) parti.push(`${virgola(v)} m² da non pitturare`);
		return `- ${parti.join(', ')}`;
	});
}

/** Avvia le schede di un modulo (una volta) */
export function avviaAmbienti(form) {
	for (const box of $$('[data-ambienti]', form)) {
		if (box.dataset.avviato) continue;
		box.dataset.avviato = '1';
		const lista = $('[data-amb-lista]', box);
		const modello = $('template[data-amb-modello]', box);
		let ultimo = 0;
		const avvisa = () => form.dispatchEvent(new Event('input', { bubbles: true }));
		const nuova = (da = null) => {
			ultimo++;
			const frammento = modello.content.cloneNode(true);
			const card = frammento.firstElementChild;
			for (const i of $$('[name]', card)) i.name = i.name.replace('__N__', String(ultimo));
			card.dataset.amb = String(ultimo);
			if (da) {
				// «Duplica»: stesse scelte della scheda (il tipo di stanza si sceglie di nuovo solo se era vuoto)
				// le schede nascono dallo stesso modello: i campi sono nello stesso ordine
				const da_ = $$('input', da);
				$$('input', card).forEach((j, k) => {
					const i = da_[k];
					if (!i) return;
					if (i.type === 'radio' || i.type === 'checkbox') j.checked = i.checked;
					else j.value = i.value;
				});
				da.after(card);
			} else lista.append(card);
			ambientiAggiorna(form);
			return card;
		};
		$('[data-amb-aggiungi]', box).addEventListener('click', () => {
			const card = nuova();
			avvisa();
			card.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			$('input', card)?.focus({ preventScroll: true });
		});
		box.addEventListener('click', (e) => {
			const card = e.target.closest('[data-amb]');
			if (!card) return;
			if (e.target.closest('[data-amb-copia]')) {
				const copia = nuova(card);
				avvisa();
				copia.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				$('[data-amb-copia]', copia)?.focus({ preventScroll: true });
			} else if (e.target.closest('[data-amb-togli]') && $$('[data-amb]', box).length > 1) {
				const dopo = card.nextElementSibling || card.previousElementSibling;
				card.remove();
				ambientiAggiorna(form);
				avvisa();
				$('[data-amb-copia]', dopo)?.focus({ preventScroll: true });
			}
		});
		// misure scritte a mano: restano tra il minimo e il massimo del campo (come i campi con + e −, B6)
		box.addEventListener(
			'input',
			(e) => {
				const i = e.target;
				if (i.type !== 'number' || !i.closest('[data-amb]') || i.value === '') return;
				const n = Number(i.value);
				if (!Number.isFinite(n)) return;
				const giusto = Math.min(Number(i.max || Infinity), Math.max(Number(i.min || 0), n));
				if (giusto !== n) i.value = String(giusto);
			},
			true
		);
		// «Nessuno» tra i problemi esclude gli altri (e gli altri escludono lui): lo fa già app.js (data-esclusivo)
		nuova();
	}
}
