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

function imbiancatura(a, et, l) {
	const cosa = a.cosa_imb;
	if (!cosa) return { titolo: 'La tua imbiancatura', mancaPerStima: 'scegli cosa imbiancare' };
	if (cosa === 'stanze') {
		const mq = num(a.mq);
		const nonso = a.nonso === true;
		const soffitti = { si: 'soffitti inclusi', no: 'senza soffitti', dadecidere: 'soffitti da decidere' }[a.soffitti_r];
		const arredo = { arredate: 'locali arredati', vuote: 'locali vuoti', dadecidere: 'arredo da decidere' }[a.stanze];
		const descrizione = frase(['imbiancatura interna', mq ? `${mq} m² di pavimento` : nonso ? 'm² da misurare al sopralluogo' : '', soffitti, arredo, { buone: 'pareti in buono stato', crepe: 'pareti con crepe o piccoli buchi', rasare: 'pareti da lisciare', nonso: 'stato delle pareti da vedere' }[a.pareti], a.particolare ? 'colore o finitura particolare' : '']);
		const base = { titolo: 'La tua imbiancatura', descrizione, iniziato: true };
		const valutare = nonso || a.pareti === 'nonso' || a.particolare === true;
		if (valutare)
			return {
				...base,
				esito: 'V',
				perche: nonso ? 'Misuriamo noi le stanze al sopralluogo, poi ricevi il preventivo.' : a.pareti === 'nonso' ? 'Lo stato delle pareti lo vediamo al sopralluogo, poi ricevi il preventivo.' : 'Colori e finiture particolari li valutiamo al sopralluogo.'
			};
		const manca = !mq ? 'i metri quadri' : !a.soffitti_r ? 'i soffitti' : !a.pareti ? 'lo stato delle pareti' : !a.stanze ? 'l’arredo' : '';
		if (manca) return { ...base, esito: 'V', perche: 'Con le risposte che mancano vedi la stima.', mancaPerStima: manca };
		return {
			...base,
			esito: 'S',
			motore: { tipo: 'imbiancatura', input: { mq: String(mq), soffitti: a.soffitti_r === 'si', pittura: 'traspirante', pareti: a.pareti, stanze: a.stanze === 'vuote' ? 'vuote' : 'arredate', colore: 'bianco' } },
			stimaTitolo: 'Stima indicativa',
			ipotesi: ['Pittura bianca traspirante: pittura e colore li scegliamo insieme', a.stanze === 'dadecidere' && 'Locali arredati (arredo ancora da decidere)'].filter(Boolean),
			daVerificare: [a.soffitti_r === 'dadecidere' && 'Soffitti: da decidere, non compresi nella stima'].filter(Boolean)
		};
	}
	if (cosa === 'ritocchi') {
		const mq = num(a.mq_parete);
		return {
			titolo: 'I tuoi ritocchi',
			iniziato: true,
			descrizione: frase([a.quanto_rit ? `ritocchi: ${l('quanto_rit')[0]}` : 'ritocchi', osserva(a, l), mq ? `circa ${mq} m² di parete` : 'superficie da verificare']),
			perche: 'Al sopralluogo vediamo le pareti e la preparazione che serve.'
		};
	}
	const mq = num(a.mq_esterno);
	return {
		titolo: 'La tua imbiancatura esterna',
		iniziato: true,
		descrizione: frase([et('cosa_est')[0] || 'superfici esterne', l('quanto_est')[0], osserva(a, l), mq ? `circa ${mq} m²` : 'superficie da verificare']),
		perche: 'Al sopralluogo vediamo superficie, stato e come arrivarci.'
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
