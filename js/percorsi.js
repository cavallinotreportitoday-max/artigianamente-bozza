// Percorsi guidati (12/10/2026, mandato «Flussi guidati per tutti i servizi»).
// Dalle risposte ATTIVE (solo le domande in vista: quelle nascoste sono spente e non arrivano qui) ricava:
//  - titolo e descrizione del progetto, scritti con le parole del cliente;
//  - l'esito: 'S' (stima) solo se il calcolatore copre il lavoro e ha tutti i dati, altrimenti 'V' (prezzo dopo il
//    sopralluogo); niente prezzi minimi generici come risultato;
//  - per 'S' gli ingressi del calcolatore, con i nomi e le unità di sempre (calcoli.js non cambia);
//  - ipotesi usate dalla stima e cose da verificare, separate da quello che ha detto il cliente.
// Funzioni pure: niente pagina, niente rete. Le usa static/js/app.js.

const num = (v) => {
	const n = Number(String(v ?? '').replace(',', '.'));
	return Number.isFinite(n) && n > 0 ? n : 0;
};
const minuscola = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : '');
const maiuscola = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
const elenco = (xs) => {
	const v = xs.filter(Boolean);
	return v.length < 2 ? v.join('') : `${v.slice(0, -1).join(', ')} e ${v.at(-1)}`;
};
const frase = (parti) => maiuscola(parti.filter(Boolean).join(' · '));
const lista = (x) => (Array.isArray(x) ? x : x ? [x] : []);

/** Ipotesi del simulatore del bagno quando il cliente non ha ancora risposto (le stesse di sempre) */
export const IPOTESI_BAGNO = { intervento: 'completo', misura: 'medio', doccia: 'doccia', extra: [], pareti: 'meta', disposizione: 'uguale', livello: 'comfort', dove: 'terraferma' };

const MOBILI = [
	['armadioGrande', 'armadio da 3 a 6 ante', 'armadi da 3 a 6 ante'],
	['armadioPiccolo', 'armadio fino a 2 ante', 'armadi fino a 2 ante'],
	['cucinaMl', 'cucina', 'cucina'],
	['letto', 'letto', 'letti'],
	['cassettiera', 'cassettiera o comò', 'cassettiere o comò'],
	['pensili', 'pensile o mensola', 'pensili o mensole'],
	['libreria', 'libreria o mobile TV', 'librerie o mobili TV']
];

/**
 * @param {string} tipo  imbiancatura | parquet | montaggio | ristrutturazioni | risanamento | falegnameria
 * @param {object} a     risposte attive: nome → valore (radio), elenco (più scelte), true/false (casella), testo
 * @param {(nome:string)=>string[]} et  etichette brevi delle risposte scelte
 */
export function percorso(tipo, a, et) {
	const l = (nome) => et(nome).map(minuscola);
	const f = { imbiancatura, parquet, montaggio, ristrutturazioni, risanamento, falegnameria }[tipo];
	const p = f ? f(a, et, l) : null;
	return { titolo: '', descrizione: '', esito: 'V', motore: null, perche: '', ipotesi: [], daVerificare: [], mancaPerStima: '', iniziato: false, ...p };
}

// «Non so» detto nel modo giusto per ogni domanda (mai trasformato in una risposta certa)
const oNonSo = (a, nome, l, seNonSo) => (lista(a[nome]).includes('nonso') ? seNonSo : elenco(l(nome)));
const osserva = (a, l) => oNonSo(a, 'osserva', l, 'stato da vedere');

/* Imbiancatura voce per voce (15/10/2026, Gian + revisione ChatGPT): stanza per stanza (o parete per parete), poi
   superfici e colore, mobili, pittura e accesso. La stima la fa calcoli.js (imbiancaturaDettagliata) con
   { versione: 2, ... }: qui solo le risposte del cliente, raccolte nella forma che il calcolo (e il server) si aspetta. */
const NOMI_AMB = { camera: 'camera', soggiorno: 'soggiorno', cucina: 'cucina', bagno: 'bagno', corridoio: 'corridoio', altro: 'altra stanza' };
/** Le stanze (o pareti) scritte nelle schede: amb{n}_campo → [{ tipo, modo, l, w, h, mq, ... }] in ordine */
export function ambientiDa(a) {
	const per = new Map();
	for (const [k, val] of Object.entries(a)) {
		const m = k.match(/^amb(\d+)_(\w+)$/);
		if (!m) continue;
		if (!per.has(+m[1])) per.set(+m[1], {});
		per.get(+m[1])[m[2]] = val;
	}
	return [...per.entries()]
		.sort((x, y) => x[0] - y[0])
		.map(([, x]) => ({
			tipo: x.tipo || '',
			modo: x.modo || '',
			l: num(x.l),
			w: num(x.w),
			h: num(x.h),
			mq: num(x.mq),
			pareti: x.pareti || 'tutte',
			quante: num(x.quante) || 1,
			soffitto: x.soffitto === true,
			vetrata: num(x.vetrata),
			problemi: lista(x.problemi).filter((p) => p !== 'nessuno'),
			estesi: x.estesi === 'gran'
		}));
}
const virgola = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
function imbiancatura(a, et, l) {
	const cosa = a.cosa_imb;
	if (!cosa) return { titolo: 'La tua imbiancatura', mancaPerStima: 'scegli cosa imbiancare' };
	const fornitura = a.fornitura || 'decidere';
	if (cosa === 'ritocchi') {
		const zone = num(a.rit_zone);
		const parete = a.rit_come === 'parete';
		const descrizione = frase([zone ? `${zone} ${zone === 1 ? 'zona' : 'zone'} da ritoccare` : 'ritocchi', a.rit_dim ? l('rit_dim')[0] : '', lista(a.rit_difetti).length ? elenco(l('rit_difetti')) : '', parete ? 'con tutta la parete' : a.rit_come ? 'solo le zone' : '']);
		const base = { titolo: 'I tuoi ritocchi', descrizione, iniziato: true };
		const manca = !zone ? 'quante zone' : !a.rit_dim ? 'quanto sono grandi' : !a.rit_come ? 'come ritoccare' : '';
		if (manca) return { ...base, esito: 'V', perche: 'Con le risposte che mancano vedi la stima.', mancaPerStima: manca };
		return {
			...base,
			esito: 'S',
			motore: { tipo: 'imbiancatura', input: { versione: 2, lavoro: 'ritocchi', fornitura: parete ? fornitura : 'noi', ritocchi: { zone, dimensione: a.rit_dim, parete, l: num(a.rit_l), h: num(a.rit_h), stessa: a.rit_stessa || 'nonso' } } },
			stimaTitolo: 'Stima del lavoro'
		};
	}
	if (cosa === 'esterni') {
		const lrg = num(a.est_l);
		const alt = num(a.est_h);
		const descrizione = frase([et('est_tipo')[0] || 'superficie esterna', lrg && alt ? `${virgola(lrg)} × ${virgola(alt)} m` : a.est_nonso ? 'misure da prendere' : '', a.est_alto ? l('est_alto')[0] : '', lista(a.est_fondo).length ? elenco(l('est_fondo')) : '']);
		const base = { titolo: 'La tua imbiancatura esterna', descrizione, iniziato: true };
		if (a.est_nonso === true) return { ...base, esito: 'V', perche: 'Misuriamo noi la superficie al sopralluogo, poi ricevi il preventivo.' };
		const manca = !lrg || !alt ? 'le misure' : !a.est_alto ? 'l’altezza da terra' : !lista(a.est_fondo).length ? 'com’è adesso' : '';
		if (manca) return { ...base, esito: 'V', perche: 'Con le risposte che mancano vedi la stima.', mancaPerStima: manca };
		return {
			...base,
			esito: 'S',
			motore: { tipo: 'imbiancatura', input: { versione: 2, lavoro: 'esterni', esterni: { tipo: a.est_tipo || 'altro', l: lrg, h: alt, alto: a.est_alto, fondo: lista(a.est_fondo).filter((x) => x !== 'buono'), colore: a.est_colore || 'bianco' } } },
			stimaTitolo: a.est_alto === 'basso' && alt <= 3 ? 'Stima del lavoro' : 'Stima delle lavorazioni'
		};
	}
	// stanze, alcune pareti, solo soffitti
	const ambienti = ambientiDa(a);
	const quale = cosa === 'pareti' ? ['parete', 'pareti'] : ['stanza', 'stanze'];
	const nomi = ambienti
		.map((x) => {
			const nome = cosa === 'pareti' ? '' : NOMI_AMB[x.tipo] || '';
			const mis = x.modo === 'misure' && x.l && (cosa === 'pareti' ? x.h || true : x.w) ? (cosa === 'pareti' ? `${virgola(x.l)} m` : `${virgola(x.l)} × ${virgola(x.w)} m`) : x.modo === 'mq' && x.mq ? `${virgola(x.mq)} m²` : '';
			return [nome, mis].filter(Boolean).join(' ');
		})
		.filter(Boolean);
	const descrizione = frase([
		ambienti.length ? `${ambienti.length} ${ambienti.length === 1 ? quale[0] : quale[1]}${nomi.length ? ` (${nomi.join(', ')})` : ''}` : '',
		a.colore ? l('colore')[0] : '',
		a.uso ? `pittura ${l('uso')[0].replace(/^per /, 'per ')}` : '',
		a.mobili ? `mobili: ${l('mobili')[0]}` : ''
	]);
	const base = { titolo: { pareti: 'Le tue pareti', soffitti: 'I tuoi soffitti' }[cosa] || 'La tua imbiancatura', descrizione, iniziato: true };
	const valida = (x) => (cosa === 'pareti' ? x.modo === 'nonso' || x.l > 0 : x.tipo && (x.modo === 'nonso' || (x.modo === 'misure' && x.l > 0 && x.w > 0) || (x.modo === 'mq' && x.mq > 0)));
	const manca = !ambienti.length || !ambienti.every(valida) ? (cosa === 'pareti' ? 'le pareti' : 'le stanze') : !a.adesso ? 'com’è adesso' : !a.colore ? 'il colore' : !a.uso ? 'l’uso delle pareti' : !a.mobili ? 'i mobili' : !a.fornitura ? 'chi porta la pittura' : '';
	if (manca) return { ...base, esito: 'V', perche: 'Con le risposte che mancano vedi la stima.', mancaPerStima: manca };
	const sm = (k) => num(a[`sm_${k}`]);
	return {
		...base,
		esito: 'S',
		motore: {
			tipo: 'imbiancatura',
			input: {
				versione: 2,
				lavoro: cosa,
				ambienti,
				adesso: a.adesso,
				colore: a.colore,
				scuro: a.scuro === true,
				piuColori: a.piu_colori === true,
				uso: a.uso,
				mobili: a.mobili,
				abitata: a.abitata === 'si',
				rallenta: a.rallenta === true,
				smalti: { termosifone: sm('termosifone'), porta: sm('porta'), finestra: sm('finestra'), ringhiera: sm('ringhiera'), battiscopa: sm('battiscopa') },
				fornitura,
				piano: num(a.piano),
				ascensore: a.ascensore === 'si',
				accesso: a.accesso || 'normale'
			}
		},
		stimaTitolo: 'Stima del lavoro'
	};
}

function parquet(a, et, l) {
	const intento = a.intento;
	if (!intento) return { titolo: 'Il tuo parquet', mancaPerStima: 'scegli il lavoro' };
	const mq = num(a.mq);
	const nonsoMq = a.nonso_mq === true;
	const sup = mq ? `${mq} m²` : nonsoMq ? 'superficie da misurare' : '';
	if (intento === 'aiuto') {
		const m = num(a.mq_aiuto);
		return {
			titolo: 'Il tuo pavimento',
			iniziato: true,
			descrizione: frase([a.nuovo_esistente ? `pavimento ${l('nuovo_esistente')[0]}` : 'pavimento da definire', m ? `circa ${m} m²` : '', a.locale ? `locale ${l('locale')[0].replace(/^(sì|no), /, '')}` : '']),
			perche: 'Al sopralluogo vediamo insieme la soluzione giusta e misuriamo la superficie.'
		};
	}
	if (intento === 'posa') {
		const lav = a.lavoro_posa;
		const materiale = { si: 'pavimento già acquistato', insieme: 'pavimento da scegliere insieme', nonso: 'pavimento da definire' }[a.materiale];
		const rim = { si: 'con rimozione del vecchio', no: 'senza rimozione', davalutare: 'rimozione da valutare' }[a.rimozione_r];
		const bat = { si: 'battiscopa nuovo', no: 'senza battiscopa nuovo', davalutare: 'battiscopa da valutare' }[a.battiscopa_r];
		const descrizione = frase([lav && lav !== 'dascegliere' ? `posa di ${l('lavoro_posa')[0]}` : 'posa di un pavimento da scegliere', sup, materiale, rim, bat]);
		const base = { titolo: 'La posa del tuo pavimento', descrizione, iniziato: true };
		if (lav === 'dascegliere' || nonsoMq) return { ...base, esito: 'V', perche: lav === 'dascegliere' ? 'Al sopralluogo scegliamo insieme il pavimento e misuriamo la superficie.' : 'Misuriamo noi la superficie al sopralluogo, poi ricevi il preventivo.' };
		const manca = !lav ? 'il pavimento da posare' : !mq ? 'i metri quadri' : !a.rimozione_r ? 'la rimozione' : !a.battiscopa_r ? 'il battiscopa' : '';
		if (manca) return { ...base, esito: 'V', perche: 'Con le risposte che mancano vedi la stima della posa.', mancaPerStima: manca };
		return {
			...base,
			esito: 'S',
			stimaTitolo: 'Stima della posa',
			motore: { tipo: 'parquet', input: { lavoro: lav, mq: String(mq), rimozione: a.rimozione_r === 'si', battiscopa: a.battiscopa_r === 'si' } },
			ipotesi: [a.materiale !== 'si' && 'Il pavimento da posare non è nella stima: lo scegliamo insieme'].filter(Boolean),
			daVerificare: [a.rimozione_r === 'davalutare' && 'Rimozione del vecchio pavimento: da valutare, non compresa', a.battiscopa_r === 'davalutare' && 'Battiscopa: da valutare, non compreso'].filter(Boolean)
		};
	}
	// rinnovo
	const lav = a.lavoro_rinnovo;
	const descrizione = frase([lav && lav !== 'nonso' ? l('lavoro_rinnovo')[0] : 'trattamento da scegliere', sup, a.segni?.length ? `noti: ${elenco(l('segni'))}` : '']);
	const base = { titolo: 'Il rinnovo del tuo parquet', descrizione, iniziato: true };
	if (lav === 'nonso' || nonsoMq) return { ...base, esito: 'V', perche: lav === 'nonso' ? 'Al sopralluogo vediamo il pavimento e ti consigliamo il trattamento.' : 'Misuriamo noi la superficie al sopralluogo, poi ricevi il preventivo.' };
	const manca = !lav ? 'il trattamento' : !mq ? 'i metri quadri' : '';
	if (manca) return { ...base, esito: 'V', perche: 'Con le risposte che mancano vedi la stima.', mancaPerStima: manca };
	return {
		...base,
		esito: 'S',
		stimaTitolo: 'Stima del trattamento',
		motore: { tipo: 'parquet', input: { lavoro: lav, mq: String(mq), rimozione: false, battiscopa: false } },
		daVerificare: [lista(a.segni).includes('rovinati') && 'Listelli rovinati: riparazione o sostituzione da valutare, non compresa'].filter(Boolean)
	};
}

function montaggio(a, et) {
	const op = a.operazione;
	const pezzi = MOBILI.map(([k, uno, tanti]) => {
		const n = num(a[k]);
		if (!n) return '';
		return k === 'cucinaMl' ? `cucina ${n} m` : `${n} ${n === 1 ? uno : tanti}`;
	}).filter(Boolean);
	const altro = a.altro_mobile === true;
	const misto = a.misto === true;
	const titolo = { nuovi: 'Il tuo montaggio', rimontare: 'Il tuo smontaggio e rimontaggio', smontare: 'Il tuo smontaggio' }[op] || 'Il tuo montaggio';
	if (!op) return { titolo, mancaPerStima: 'scegli cosa fare' };
	const lavoro = { nuovi: 'da montare', rimontare: 'da smontare e rimontare', smontare: 'solo da smontare' }[op];
	const descrizione = frase([
		pezzi.length ? `${elenco(pezzi)} ${lavoro}` : altro ? '' : `mobili ${lavoro}`,
		altro ? `altro mobile${a.altro_nome ? `: ${a.altro_nome.trim()}` : ''} ${pezzi.length ? '' : lavoro}`.trim() : '',
		op === 'nuovi' && a.smontaggio === true ? 'anche lo smontaggio dei vecchi' : '',
		misto ? 'lavori diversi sui mobili' : '',
		a.modello?.trim() ? `modello: ${a.modello.trim()}` : ''
	]);
	const base = { titolo, descrizione, iniziato: true };
	if (op === 'smontare') return { ...base, esito: 'V', perche: 'Per il solo smontaggio la stima la facciamo al sopralluogo.' };
	if (altro) return { ...base, esito: 'V', perche: 'Il mobile da riconoscere lo vediamo al sopralluogo, o da una foto.' };
	if (misto) return { ...base, esito: 'V', perche: 'Con lavori diversi su ogni mobile la stima la facciamo al sopralluogo.' };
	if (!pezzi.length) return { ...base, esito: 'V', perche: 'Aggiungi almeno un mobile per vedere la stima.', mancaPerStima: 'i mobili' };
	const input = Object.fromEntries(MOBILI.map(([k]) => [k, num(a[k])]));
	// «smontare e rimontare» usa lo smontaggio che c'era già: una sola maggiorazione
	input.smontaggio = op === 'rimontare' ? true : a.smontaggio === true;
	return { ...base, esito: 'S', stimaTitolo: 'Stima indicativa', motore: { tipo: 'montaggio', input }, rimontare: op === 'rimontare' };
}

function risanamento(a, et, l) {
	if (!a.dove?.length && !a.segni?.length) return { titolo: 'Il tuo risanamento', mancaPerStima: '' };
	const metri = num(a.metri);
	const est = { zona: 'una piccola zona', parete: 'una parete', piu: 'più pareti', nonso: 'estensione da vedere' }[a.estensione];
	return {
		titolo: 'Il tuo risanamento',
		iniziato: true,
		descrizione: frase([
			a.dove?.length ? oNonSo(a, 'dove', l, 'zona da individuare') : '',
			a.segni?.length ? oNonSo(a, 'segni', l, 'segni da vedere') : '',
			est,
			metri ? `circa ${metri} m di muro in lunghezza` : '',
			a.quando ? `si nota: ${l('quando')[0]}` : ''
		]),
		perche: 'Verifichiamo la causa prima di proporti l’intervento.'
	};
}

const OGGETTI_RIP = { armadio: 'del tuo armadio', cassettiera: 'della tua cassettiera', tavolo: 'di tavolo o sedie', letto: 'del tuo letto', altro: 'del tuo mobile' };
const SU_MISURA = { armadio: 'Il tuo armadio su misura', libreria: 'La tua libreria su misura', bagno: 'Il tuo mobile bagno su misura', cucina: 'La tua cucina su misura', tv: 'Il tuo mobile TV su misura', altro: 'Il tuo mobile su misura' };
const PORTE = { interna: 'La tua porta interna', finestra: 'Le tue finestre o scuri', ingresso: 'Il tuo portoncino', altro: 'Il tuo serramento' };

function falegnameria(a, et, l) {
	const t = a.tipo;
	if (!t) return { titolo: 'Il tuo lavoro in legno', mancaPerStima: '' };
	const misure = (coppie, unita = 'cm') => {
		const v = coppie.map(([k, nome]) => (num(a[k]) ? `${nome} ${num(a[k])} ${unita}` : '')).filter(Boolean);
		return v;
	};
	const altro = a.altro_descr?.trim();
	let titolo = 'Il tuo lavoro in legno';
	let descrizione = '';
	let perche = '';
	if (t === 'riparazione') {
		titolo = a.oggetto_rip ? `La riparazione ${OGGETTI_RIP[a.oggetto_rip]}` : 'La tua riparazione';
		const sint = l(`sint_${a.oggetto_rip === 'letto' ? 'altro' : a.oggetto_rip}`);
		descrizione = frase([et('oggetto_rip')[0] ? `${et('oggetto_rip')[0]}${altro ? `: ${altro}` : ''}` : '', sint.length ? oNonSo(a, `sint_${a.oggetto_rip === 'letto' ? 'altro' : a.oggetto_rip}`, l, 'problema da vedere') : '']);
		perche = 'Al sopralluogo vediamo il mobile e cosa serve per sistemarlo.';
	} else if (t === 'mobile') {
		titolo = SU_MISURA[a.oggetto_mis] || 'Il tuo mobile su misura';
		const forma = a[`apertura_${{ libreria: 'lib', armadio: 'arm', tv: 'tv' }[a.oggetto_mis]}`];
		const nome = { armadio: 'Armadio', libreria: 'Libreria', bagno: 'Mobile bagno', cucina: 'Cucina', tv: 'Mobile TV' }[a.oggetto_mis] || maiuscola(altro || 'Mobile');
		const FORME = { aperta: 'Libreria aperta', ante: 'Libreria con ante', mista: 'Libreria mista', battente: 'Armadio con ante battenti', scorrevole: 'Armadio con ante scorrevoli', aperto: 'Mobile TV aperto', chiuso: 'Mobile TV chiuso', misto: 'Mobile TV misto' };
		const dove = { parete: 'su una parete libera', nicchia: 'da inserire in una nicchia', sottoscala: 'nel sottoscala', dadecidere: 'posizione da decidere' }[a.posizione];
		const ms = misure([['larghezza', 'larghezza'], ['altezza', 'altezza'], ['profondita', 'profondità']]);
		const testoForma = FORME[forma] || nome + (forma === 'dadecidere' ? ', apertura da decidere' : '');
		descrizione = `${testoForma}${dove ? `, ${dove}` : ''}.` + (ms.length ? ` ${maiuscola(ms.map((x) => x.replace(/^(\S+) /, '$1 indicativa ')).join(', '))}; ${ms.length < 3 ? 'altre misure' : 'misure precise'} da definire.` : ' Misure da definire.');
		perche = 'Al sopralluogo definiamo misure, materiali e finiture.';
		return { titolo, descrizione, perche, iniziato: true, esito: 'V' };
	} else if (t === 'porte') {
		titolo = PORTE[a.porte_cosa] || 'Le tue porte e finestre';
		const n = num(a.porte_n);
		const ms = misure([['porta_larghezza', 'larghezza'], ['porta_altezza', 'altezza']]);
		descrizione = frase([a.porte_cosa === 'altro' && altro ? altro : '', l('porte_azione')[0], n ? `${n} in tutto` : '', a.porte_problema?.length ? elenco(l('porte_problema')) : '', ms.length ? `${ms.join(', ')} indicative` : '']);
		perche = 'Al sopralluogo prendiamo le misure e vediamo come intervenire.';
	} else if (t === 'restauro') {
		titolo = 'Il tuo restauro';
		descrizione = frase([a.oggetto_res === 'altro' && altro ? altro : et('oggetto_res')[0], l('risultato')[0], a.res_nota?.trim() ? `vorresti: ${a.res_nota.trim()}` : '']);
		perche = 'Al sopralluogo vediamo lo stato del mobile e il trattamento giusto.';
	} else if (t === 'pergola') {
		titolo = 'La tua pergola';
		const ms = misure([['pergola_l', 'larghezza'], ['pergola_p', 'profondità']], 'm');
		descrizione = frase([a.pergola === 'nuova' ? 'pergola nuova' : a.pergola === 'esistente' ? 'pergola da sistemare' : '', a.pergola_problema?.length ? elenco(l('pergola_problema')) : '', ms.length ? `${ms.join(', ')} indicative` : '']);
		perche = 'Al sopralluogo vediamo lo spazio, la struttura e i materiali.';
	} else if (t === 'scala') {
		titolo = 'La tua scala in legno';
		const g = num(a.scala_gradini);
		descrizione = frase([a.scala === 'nuova' ? 'scala nuova' : a.scala === 'esistente' ? 'scala da sistemare' : '', a.scala_parte?.length ? elenco(l('scala_parte')) : '', g ? `circa ${g} gradini` : '']);
		perche = 'Al sopralluogo prendiamo le misure e vediamo la struttura.';
	} else if (t === 'piccoli') {
		titolo = 'I tuoi piccoli lavori';
		const n = num(a.piccoli_n);
		descrizione = frase([a.piccoli?.length ? elenco(l('piccoli').map((x) => (x === 'altro' && altro ? altro : x))) : '', n ? `circa ${n} interventi` : '']);
		perche = 'Al sopralluogo vediamo i lavori e i ricambi che servono.';
	}
	return { titolo, descrizione, perche, iniziato: true, esito: 'V' };
}

function ristrutturazioni(a, et, l) {
	const cosa = a.cosa;
	if (!cosa) return { titolo: 'La tua ristrutturazione', mancaPerStima: 'scegli lo spazio' };
	const lavoro = cosa;
	if (cosa === 'bagno') {
		const int = a.intervento;
		if (int === 'singolo') {
			return {
				lavoro,
				titolo: 'Il tuo intervento in bagno',
				iniziato: true,
				descrizione: frase([et('singolo_cosa')[0] ? `${et('singolo_cosa')[0]}: ${l('singolo_azione')[0] || 'da definire'}` : 'un intervento singolo', a.singolo_nota?.trim()]),
				perche: 'Al sopralluogo vediamo l’intervento e i materiali: il prezzo di un intero bagno non vale per un singolo lavoro.'
			};
		}
		if (!int || !a.misura) return { lavoro, titolo: 'Il tuo bagno', iniziato: Boolean(int), esito: 'V', perche: 'Con le prime risposte vedi la stima del tuo bagno.', mancaPerStima: !int ? 'quanto vuoi cambiare' : 'la misura del bagno' };
		// ipotesi del simulatore: valgono finché il cliente non risponde, e lo diciamo
		const input = { ...IPOTESI_BAGNO, extra: [] };
		const ipotesi = [];
		for (const k of ['intervento', 'misura', 'doccia', 'pareti', 'disposizione', 'livello', 'dove']) {
			if (a[k]) input[k] = a[k];
		}
		input.extra = lista(a.extra);
		if (a.misura === 'nonso') ipotesi.push('Misura non indicata: la stima usa la fascia di un bagno medio (4–7 m²). La misura si verifica al sopralluogo');
		if (!a.doccia) ipotesi.push('Doccia (non ancora scelta)');
		if (!a.livello) ipotesi.push('Finiture Comfort: ipotesi iniziale, modificabile');
		if (!a.disposizione) ipotesi.push('Disposizione uguale (ipotesi)');
		if (!a.dove) ipotesi.push('Immobile in terraferma (ipotesi)');
		if (!a.pareti) ipotesi.push('Piastrelle fino a 1,2 m (ipotesi)');
		const nomi = {
			intervento: { rinnovo: 'rinnovo di piastrelle e sanitari', completo: 'rifacimento completo' },
			misura: { piccolo: 'bagno piccolo', medio: 'bagno medio', grande: 'bagno grande', nonso: 'misura da verificare' },
			livello: { base: 'finiture Base', comfort: 'finiture Comfort', top: 'finiture Top' }
		};
		return {
			lavoro,
			titolo: 'Il tuo bagno',
			iniziato: true,
			descrizione: frase([nomi.intervento[a.intervento], nomi.misura[a.misura], a.doccia ? l('doccia')[0] : '', a.livello ? nomi.livello[a.livello] : '']),
			esito: 'S',
			stimaTitolo: 'La stima del tuo bagno',
			motore: { tipo: 'bagno', input },
			ipotesi
		};
	}
	const V = { lavoro, iniziato: true, esito: 'V' };
	if (cosa === 'cucina') {
		const disp = a.disp_cambio ? l('disp_cambio')[0] : a.disp_cucina ? l('disp_cucina')[0] : '';
		const mq = num(a.mq_cucina);
		return {
			...V,
			titolo: 'La tua cucina',
			descrizione: frase([a.lav_cucina?.length ? `da rinnovare: ${elenco(l('lav_cucina'))}` : '', disp, a.mobili_cucina ? `mobili ${l('mobili_cucina')[0]}` : '', mq ? `${mq} m² di pavimento` : '', a.stato_cucina ? `cucina ${l('stato_cucina')[0]}` : '']),
			perche: 'Al sopralluogo vediamo impianti, spazi e lavorazioni, poi ricevi il preventivo.'
		};
	}
	if (cosa === 'casa') {
		const mq = num(a.mq_casa);
		return {
			...V,
			titolo: 'La tua casa',
			descrizione: frase([a.amb_casa?.length ? elenco(l('amb_casa')) : '', a.lav_casa?.length ? elenco(l('lav_casa')) : '', mq ? `${mq} m² di pavimento` : '', a.uso_casa ? `casa ${l('uso_casa')[0]}` : '']),
			perche: 'Al sopralluogo vediamo gli ambienti e le lavorazioni: niente somme automatiche.'
		};
	}
	if (cosa === 'ufficio') {
		const mq = num(a.mq_ufficio);
		return {
			...V,
			titolo: { ufficio: 'Il tuo ufficio', negozio: 'Il tuo negozio', altro: 'Il tuo locale' }[a.tipo_uff] || 'Il tuo spazio di lavoro',
			descrizione: frase([a.lav_ufficio?.length ? elenco(l('lav_ufficio')) : '', mq ? `${mq} m² di pavimento` : '', a.aperta ? `attività aperta durante i lavori: ${l('aperta')[0]}` : '']),
			perche: 'Al sopralluogo vediamo spazi, impianti e tempi dell’attività.'
		};
	}
	if (cosa === 'esterni') {
		const mq = num(a.mq_facciata);
		return {
			...V,
			titolo: 'La tua facciata',
			descrizione: frase([a.lav_esterni?.length ? elenco(l('lav_esterni')) : '', a.est_estensione === 'nonso' ? 'estensione da vedere' : l('est_estensione')[0], mq ? `circa ${mq} m² di facciata` : '', a.edificio ? l('edificio')[0] : '', num(a.piani_est) ? `${num(a.piani_est)} piani` : '']),
			perche: 'Al sopralluogo verifichiamo stato, accessi e interventi necessari.'
		};
	}
	if (cosa === 'tetti') {
		const mq = num(a.mq_tetto);
		return {
			...V,
			titolo: 'Il tuo tetto',
			descrizione: frase([l('tetto_bisogno')[0], a.tetto_segni?.length ? oNonSo(a, 'tetto_segni', l, 'segni da verificare') : '', l('tetto_estensione')[0], mq ? `circa ${mq} m²` : '']),
			perche: 'Stato, accesso e intervento li verifichiamo al sopralluogo.'
		};
	}
	return { ...V, titolo: 'Il tuo progetto', descrizione: maiuscola(a.descr_altro?.trim() || ''), perche: 'Al sopralluogo vediamo lo spazio e cosa serve.' };
}
