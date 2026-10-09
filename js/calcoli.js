// Stime orientative per il preventivo guidato.
// ATTENZIONE: tutte le tariffe sono PROVVISORIE (bozza ottobre 2026), da approvare con il titolare.
// Lo stesso file serve sia alla pagina (prima visualizzazione) sia allo script nel browser.

export const tariffe = {
	imbiancatura: {
		euroMq: [6, 9], // € al m² di superficie da pitturare, 2 mani, pittura traspirante, manodopera e pittura
		pareti: { buone: 0, crepe: 2, rasare: 7 }, // € in più al m²
		pittura: { traspirante: 1, lavabile: 1.15, antimuffa: 1.3 },
		stanze: { vuote: 1, arredate: 1.1 },
		colore: { bianco: 1, colorato: 1.1 },
		minimo: 250
	},
	parquet: {
		lavoro: {
			prefinito: [25, 40],
			laminato: [14, 22],
			massello: [38, 55],
			levigatura: [22, 32],
			manutenzione: [10, 16]
		},
		rimozione: [8, 12],
		battiscopa: [4, 7],
		minimo: 300
	},
	montaggio: {
		mobili: {
			armadioPiccolo: [60, 100],
			armadioGrande: [120, 220],
			cucinaMl: [80, 130],
			letto: [50, 90],
			cassettiera: [35, 60],
			pensili: [20, 35],
			libreria: [40, 80]
		},
		smontaggio: 1.4,
		minimo: 70
	},
	traslochi: {
		casa: {
			monolocale: [450, 800],
			bilocale: [750, 1300],
			trilocale: [1100, 1900],
			quattro: [1600, 2800]
		},
		pianoSenzaAscensore: 0.06,
		distanza: { vicino: 1, media: 1.25 },
		imballaggio: 1.2,
		montaggio: 1.15,
		piattaforma: [150, 250]
	}
};

// Prezzi "a partire da": ognuno legato a un lavoro preciso (consiglio della revisione dell'8/10).
// PROVVISORI: da far approvare a Fabri. Quello delle ristrutturazioni si calcola dal simulatore del bagno (in fondo al file).
export const aPartireDa = {
	ristrutturazioni: { euro: 0, unita: '', dettaglio: 'Rinnovo di un bagno piccolo con finiture Base, impianti invariati.' },
	imbiancatura: { euro: 6, unita: '/m²', dettaglio: 'Al m² di parete: pittura bianca traspirante e manodopera, pareti in buono stato.' },
	'risanamento-umidita': { euro: 60, unita: '/m²', dettaglio: 'Al m² di muro, con intonaco deumidificante di base. La causa va verificata al sopralluogo.' },
	falegnameria: { euro: 60, unita: '', dettaglio: 'Piccole riparazioni a domicilio.' },
	'montaggio-mobili': { euro: 70, unita: '', dettaglio: 'Uscita minima per mobili piccoli.' },
	traslochi: { euro: 255, unita: '', dettaglio: 'Monolocale in zona, con ascensore, scatoloni preparati da te.' }, // dal calcolatore (trasloco.js)
	parquet: { euro: 14, unita: '/m²', dettaglio: 'Sola posa di laminato, al m². Materiale escluso.' }
};

export const notaMateriali = 'Materiali e finiture li scegliamo insieme al sopralluogo.';

// Aliquota IVA ipotizzata per i privati (lavori sulla casa 10%, servizi 22%). DA VERIFICARE col commercialista.
export const iva = {
	ristrutturazioni: 0.1,
	imbiancatura: 0.1,
	'risanamento-umidita': 0.1,
	risanamento: 0.1,
	parquet: 0.1,
	falegnameria: 0.22,
	'montaggio-mobili': 0.22,
	montaggio: 0.22,
	traslochi: 0.22
};

// Arrotonda a cifre "da listino": 6,6 → 7; 73 → 75; 549 → 550; 3.960 → 4.000
const bello = (n) => (n < 20 ? Math.round(n) : n < 200 ? Math.round(n / 5) * 5 : n < 2000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100);

/** Prezzo "da" IVA inclusa da un netto qualsiasi, es. daEuro(350, '/m²') → "390 €/m²" */
export const daEuro = (netto, unita = '', aliquota = 0.1) => `${euro(bello(netto * (1 + aliquota)))} €${unita}`;

/** Prezzo "da" IVA inclusa, es. "7 €/m²" */
export const daTesto = (slug) => {
	const d = aPartireDa[slug];
	return d ? `${euro(bello(d.euro * (1 + (iva[slug] ?? 0.22))))} €${d.unita}` : '';
};

export const predefiniti = {
	// Misure vuote: il cliente scrive le sue (revisione del 9/10: niente numeri che sembrano già dati)
	imbiancatura: { mq: '', soffitti: true, pittura: 'traspirante', pareti: 'buone', stanze: 'arredate', colore: 'bianco' },
	parquet: { lavoro: 'prefinito', mq: '', rimozione: false, battiscopa: false },
	montaggio: {
		armadioPiccolo: 0,
		armadioGrande: 0,
		cucinaMl: 0,
		letto: 0,
		cassettiera: 0,
		pensili: 0,
		libreria: 0,
		smontaggio: false
	},
	traslochi: { casa: 'bilocale', piani: 0, distanza: 'vicino', imballaggio: false, montaggio: true, piattaforma: false, deposito: false }
};

const tondo = (n) => Math.round(n / 50) * 50;
const num = (v, def = 0) => {
	const n = Number(String(v ?? '').replace(',', '.'));
	return Number.isFinite(n) && n >= 0 ? n : def;
};
const si = (v) => v === true || v === 'on' || v === 'true' || v === '1';

// 1900 → "1.900" (anche sotto i 10.000, come si scrive nei preventivi)
export const euro = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * @returns {{ min?: number, max?: number, valutazione?: boolean, vuoto?: boolean, messaggio?: string,
 *            dettaglio: string, comprende: string[], esclude: string[], riepilogo: string }}
 */
function calcolaNetto(tipo, v) {
	const t = tariffe[tipo];
	if (tipo === 'imbiancatura') {
		const mq = num(v.mq, 0);
		if (!mq) return { vuoto: true, messaggio: 'Scrivi i metri quadri di pavimento delle stanze da imbiancare.', dettaglio: '', comprende: [], esclude: [], riepilogo: 'Imbiancatura: metri quadri da indicare.' };
		const sup = Math.round(mq * 2.6 + (si(v.soffitti) ? mq : 0));
		const extra = t.pareti[v.pareti] ?? 0;
		const k = (t.pittura[v.pittura] ?? 1) * (t.stanze[v.stanze] ?? 1) * (t.colore[v.colore] ?? 1);
		const min = Math.max(t.minimo, tondo(sup * (t.euroMq[0] + extra) * k));
		const max = Math.max(t.minimo + 150, tondo(sup * (t.euroMq[1] + extra) * k));
		return {
			min,
			max,
			dettaglio: `Circa ${euro(sup)} m² da pitturare (pareti${si(v.soffitti) ? ' e soffitti' : ''}). Stima con pittura bianca traspirante: pittura e colore li scegliamo insieme.`,
			comprende: ['Manodopera e pittura', 'Protezione di mobili e pavimenti', 'Due mani di pittura', 'Pulizia finale'],
			esclude: ['Riparazioni di intonaco importanti', 'Lavori in altezza oltre i 3,5 m'],
			riepilogo: `Imbiancatura: ${mq} m² di pavimento, soffitti ${si(v.soffitti) ? 'sì' : 'no'}, pareti ${{ buone: 'in buono stato', crepe: 'con crepe o piccoli buchi', rasare: 'da lisciare completamente' }[v.pareti] ?? ''}, ${v.stanze === 'vuote' ? 'stanze vuote' : 'con mobili'}.`
		};
	}
	if (tipo === 'parquet') {
		const mq = num(v.mq, 0);
		if (!mq) return { vuoto: true, messaggio: 'Scrivi quanti metri quadri sono.', dettaglio: '', comprende: [], esclude: [], riepilogo: 'Parquet: metri quadri da indicare.' };
		const base = t.lavoro[v.lavoro] ?? t.lavoro.prefinito;
		const posa = ['prefinito', 'laminato', 'massello'].includes(v.lavoro);
		let a = base[0];
		let b = base[1];
		if (posa && si(v.rimozione)) {
			a += t.rimozione[0];
			b += t.rimozione[1];
		}
		if (si(v.battiscopa)) {
			a += t.battiscopa[0];
			b += t.battiscopa[1];
		}
		const nomi = {
			prefinito: 'posa di parquet prefinito',
			laminato: 'posa di laminato',
			massello: 'posa di parquet massello incollato',
			levigatura: 'levigatura e verniciatura',
			manutenzione: 'manutenzione con olio o cera'
		};
		return {
			min: Math.max(t.minimo, tondo(mq * a)),
			max: Math.max(t.minimo + 150, tondo(mq * b)),
			dettaglio: `${mq} m², ${nomi[v.lavoro] ?? nomi.prefinito}.`,
			comprende: posa
				? ['Manodopera di posa', 'Colle o materassino', 'Tagli e rifiniture']
				: ['Manodopera', 'Prodotti di finitura', 'Pulizia finale'],
			esclude: posa ? ['Il parquet o il laminato da posare', 'Rifacimento del massetto'] : ['Sostituzione di doghe rovinate'],
			riepilogo: `Parquet: ${nomi[v.lavoro] ?? ''}, ${mq} m², rimozione vecchio pavimento ${si(v.rimozione) ? 'sì' : 'no'}, battiscopa ${si(v.battiscopa) ? 'sì' : 'no'}.`
		};
	}
	if (tipo === 'montaggio') {
		let a = 0;
		let b = 0;
		const parti = [];
		const etichette = {
			armadioPiccolo: 'armadio fino a 2 ante',
			armadioGrande: 'armadio da 3 a 6 ante',
			cucinaMl: 'metri di cucina',
			letto: 'letto',
			cassettiera: 'cassettiera o comò',
			pensili: 'pensili o mensole',
			libreria: 'libreria o mobile TV'
		};
		for (const [k, [x, y]] of Object.entries(t.mobili)) {
			const q = num(v[k], 0);
			if (q > 0) {
				a += q * x;
				b += q * y;
				parti.push(`${q} ${etichette[k]}`);
			}
		}
		if (!parti.length) {
			return { vuoto: true, messaggio: 'Aggiungi almeno un mobile per vedere la stima.', dettaglio: '', comprende: [], esclude: [], riepilogo: '' };
		}
		if (si(v.smontaggio)) {
			a *= t.smontaggio;
			b *= t.smontaggio;
		}
		return {
			min: Math.max(t.minimo, tondo(a)),
			max: Math.max(t.minimo + 50, tondo(b)),
			dettaglio: parti.join(', ') + (si(v.smontaggio) ? ', con smontaggio dei vecchi mobili.' : '.'),
			comprende: ['Montaggio e allineamento', 'Fissaggio a muro', 'Attrezzatura e piccoli componenti'],
			esclude: ['Allacci di acqua, gas e corrente', 'Modifiche su misura ai mobili'],
			riepilogo: `Montaggio mobili: ${parti.join(', ')}. Smontaggio vecchi mobili ${si(v.smontaggio) ? 'sì' : 'no'}.`
		};
	}
	if (tipo === 'traslochi') {
		if (v.casa === 'ufficio' || v.distanza === 'lontano' || v.distanza === 'venezia') {
			const perche = {
				ufficio: 'Per uffici e negozi serve vedere spazi e arredi.',
				lontano: 'Per traslochi oltre i 100 km organizziamo viaggio e tempi su misura.',
				venezia: 'A Venezia e nelle isole servono trasporto via acqua e permessi.'
			};
			const chiave = v.casa === 'ufficio' ? 'ufficio' : v.distanza;
			return {
				valutazione: true,
				messaggio: perche[chiave] + ' Ti facciamo un preventivo dopo un sopralluogo o una videochiamata.',
				dettaglio: '',
				comprende: [],
				esclude: [],
				riepilogo: `Trasloco: ${v.casa === 'ufficio' ? 'ufficio o negozio' : v.casa}, ${{ vicino: 'fino a 30 km', media: 'da 30 a 100 km', lontano: 'oltre 100 km', venezia: 'Venezia e isole' }[v.distanza] ?? ''}, piani senza ascensore ${num(v.piani, 0)}.`
			};
		}
		const base = t.casa[v.casa] ?? t.casa.bilocale;
		let k = 1 + num(v.piani, 0) * t.pianoSenzaAscensore;
		k *= t.distanza[v.distanza] ?? 1;
		if (si(v.imballaggio)) k *= t.imballaggio;
		if (si(v.montaggio)) k *= t.montaggio;
		let a = base[0] * k;
		let b = base[1] * k;
		if (si(v.piattaforma)) {
			a += t.piattaforma[0];
			b += t.piattaforma[1];
		}
		const casa = { monolocale: 'monolocale', bilocale: 'bilocale', trilocale: 'trilocale', quattro: 'casa con 4 o più locali' }[v.casa];
		const extra = [
			si(v.imballaggio) && 'imballaggio',
			si(v.montaggio) && 'smontaggio e montaggio mobili',
			si(v.piattaforma) && 'piattaforma elevatrice'
		].filter(Boolean);
		return {
			min: tondo(a),
			max: tondo(b),
			dettaglio: `Trasloco di un ${casa}${extra.length ? ', con ' + extra.join(', ') : ''}.` + (si(v.deposito) ? ' Il deposito lo calcoliamo a parte.' : ''),
			comprende: ['Squadra e furgone', 'Carico, trasporto e scarico', 'Protezione dei mobili'],
			esclude: ['Pedaggi e permessi di sosta', si(v.deposito) ? 'Deposito (preventivo a parte)' : 'Deposito e custodia'],
			riepilogo: `Trasloco: ${casa}, piani senza ascensore ${num(v.piani, 0)}, ${{ vicino: 'fino a 30 km', media: 'da 30 a 100 km' }[v.distanza] ?? ''}, servizi: ${extra.join(', ') || 'nessuno'}${si(v.deposito) ? ', deposito' : ''}.`
		};
	}
	return { valutazione: true, dettaglio: '', comprende: [], esclude: [], riepilogo: '' };
}

/** Stima per il preventivo guidato, IVA inclusa (ipotesi per i privati). */
export function calcola(tipo, v) {
	const r = calcolaNetto(tipo, v);
	if (r.min) {
		const k = 1 + (iva[tipo] ?? 0.22);
		r.min = tondo(r.min * k);
		r.max = tondo(r.max * k);
		r.ivaPerc = Math.round((k - 1) * 100);
	}
	return r;
}

/* ---------------------------------------------------------------------------
   SIMULATORE BAGNO (8/10/2026, seconda versione)
   Numeri PROVVISORI. Partenza: revisione ChatGPT (Base 7.500–10.000 €) ricalibrata più in basso
   sui prezzi pubblicati online (cronoshare.it 2026: bagno medio 4.000–7.000 €; idealista.it:
   5 m² 4.000–6.000 €; pacchetto Leroy Merlin fino a 6 m² da 9.490 € IVA inclusa).
   Bagno completo di circa 5 m², IVA esclusa: Base 5.500–7.500, Comfort 7.500–10.500, Top 10.500–15.000.
   Fabri deve confermarli con i suoi preventivi reali.
--------------------------------------------------------------------------- */
export const bagno = {
	voci: [
		{ id: 'cantiere', icona: 'shield', nome: 'Preparazione cantiere e protezioni', base: [200, 400], area: false },
		{ id: 'demolizioni', icona: 'hammer', nome: 'Demolizioni, rimozioni e smaltimento', base: [700, 1000], area: true },
		{ id: 'impianti', icona: 'drop', nome: 'Impianto idraulico ed elettrico', base: [1300, 1800], area: false },
		{ id: 'ripristini', icona: 'trowel', nome: 'Ripristini e impermeabilizzazione', base: [500, 700], area: true },
		{ id: 'rivestimenti', icona: 'wall', nome: 'Pavimenti e rivestimenti, con posa', base: [1300, 1800], area: true },
		{ id: 'sanitari', icona: 'toilet', nome: 'Sanitari, rubinetti, mobile e doccia', base: [1200, 1400], area: false },
		{ id: 'finiture', icona: 'roller', nome: 'Tinteggiatura, verifiche e pulizia', base: [300, 400], area: true }
	],
	// quanto si aggiunge rispetto al livello Base
	livelli: {
		base: {},
		comfort: { impianti: [150, 300], rivestimenti: [800, 1200], sanitari: [1050, 1500] },
		top: { impianti: [400, 600], ripristini: [200, 300], rivestimenti: [2100, 3000], sanitari: [2300, 3600] }
	},
	misure: { piccolo: { area: 0.75, fisso: 0.95 }, medio: { area: 1, fisso: 1 }, grande: { area: 1.45, fisso: 1.1 } },
	pareti: { doccia: 0.8, meta: 1, soffitto: 1.3 }, // quanto rivestimento sulle pareti
	rinnovoImpianti: [300, 600], // impianti che restano: solo piccoli adeguamenti
	rinnovoDemolizioni: 0.8,
	spostamento: [1000, 2000],
	docciaVasca: {
		doccia: null,
		vasca: { icona: 'bathtub', nome: 'Vasca al posto della doccia', costo: [300, 600] },
		entrambe: { icona: 'bathtub', nome: 'Doccia e vasca', costo: [900, 1500] },
		davasca: { icona: 'shower', nome: 'Togliere la vasca e fare la doccia', costo: [300, 600] }
	},
	extra: {
		filo: { icona: 'tray', nome: 'Piatto doccia a filo pavimento', costo: [400, 800] },
		box: { icona: 'glass', nome: 'Box doccia in cristallo su misura', costo: [500, 1000] },
		sospesi: { icona: 'toilet', nome: 'Sanitari sospesi', costo: [350, 650] },
		termo: { icona: 'radiator', nome: 'Termoarredo scaldasalviette', costo: [250, 500] },
		specchio: { icona: 'mirror', nome: 'Specchio con luce', costo: [150, 350] },
		lavatrice: { icona: 'washer', nome: 'Attacco per la lavatrice', costo: [150, 300] }
	},
	iva: 0.1 // lavori sulla casa: IVA al 10% (aziende ed enti: 22%). Da verificare col commercialista.
};

const nomiBagno = {
	intervento: { rinnovo: 'rinnovo di piastrelle e sanitari', completo: 'rifacimento completo' },
	misura: { piccolo: 'piccolo (fino a 4 m²)', medio: 'medio (4–7 m²)', grande: 'grande (oltre 7 m²)', nonso: 'misura da verificare' },
	doccia: { doccia: 'doccia', vasca: 'vasca', entrambe: 'doccia e vasca', davasca: 'da vasca a doccia' },
	pareti: { doccia: 'piastrelle solo in zona doccia', meta: 'piastrelle fino a 1,2 m', soffitto: 'piastrelle fino al soffitto' },
	disposizione: { uguale: 'disposizione uguale', cambio: 'disposizione da cambiare', nonso: 'disposizione da decidere' },
	livello: { base: 'Base', comfort: 'Comfort', top: 'Top' },
	dove: { terraferma: 'terraferma', venezia: 'Venezia e isole' }
};

const cento = (n) => Math.round(n / 100) * 100;
const lista = (x) => (Array.isArray(x) ? x : x ? [x] : []);

/** Budget del bagno. min e max sono IVA inclusa; nettoMin e nettoMax senza IVA. */
export function calcolaBagno(v) {
	const livello = bagno.livelli[v.livello] ? v.livello : 'comfort';
	const m = bagno.misure[v.misura] ?? bagno.misure.medio;
	const rinnovo = v.intervento === 'rinnovo';
	const agg = bagno.livelli[livello];
	const netto = bagno.voci.map((x) => {
		let [a, b] = rinnovo && x.id === 'impianti' ? bagno.rinnovoImpianti : x.base;
		if (rinnovo && x.id === 'demolizioni') {
			a *= bagno.rinnovoDemolizioni;
			b *= bagno.rinnovoDemolizioni;
		}
		if (agg[x.id]) {
			a += agg[x.id][0];
			b += agg[x.id][1];
		}
		let k = x.area ? m.area : m.fisso;
		if (x.id === 'rivestimenti') k *= bagno.pareti[v.pareti] ?? 1;
		const nome = rinnovo && x.id === 'impianti' ? 'Piccoli adeguamenti di impianti' : x.nome;
		return { icona: x.icona, nome, min: a * k, max: b * k };
	});
	const dv = bagno.docciaVasca[v.doccia];
	if (dv) netto.push({ icona: dv.icona, nome: dv.nome, min: dv.costo[0], max: dv.costo[1] });
	for (const e of lista(v.extra)) {
		const x = bagno.extra[e];
		if (x) netto.push({ icona: x.icona, nome: x.nome, min: x.costo[0], max: x.costo[1] });
	}
	if (v.disposizione === 'cambio') netto.push({ icona: 'wrench', nome: 'Spostamento di scarichi e punti acqua', min: bagno.spostamento[0], max: bagno.spostamento[1] });
	const daValutare = [];
	if (v.disposizione === 'nonso') daValutare.push({ icona: 'wrench', nome: 'Eventuale spostamento di scarichi', daValutare: true });
	if (v.misura === 'nonso') daValutare.push({ icona: 'ruler', nome: 'Misure esatte', daValutare: true });
	if (v.dove === 'venezia') daValutare.push({ icona: 'pin', nome: 'Trasporto via acqua e logistica', daValutare: true });
	// voci arrotondate a 100 €, con e senza IVA: i totali sono la somma delle voci
	const voci = netto.map((x) => ({ ...x, nettoMin: cento(x.min), nettoMax: cento(x.max), min: cento(x.min * (1 + bagno.iva)), max: cento(x.max * (1 + bagno.iva)) }));
	const somma = (k) => voci.reduce((t, x) => t + x[k], 0);
	const min = somma('min');
	const max = somma('max');
	const testo = [
		nomiBagno.intervento[v.intervento] ?? nomiBagno.intervento.completo,
		nomiBagno.misura[v.misura] ?? nomiBagno.misura.medio,
		nomiBagno.doccia[v.doccia] ?? nomiBagno.doccia.doccia,
		nomiBagno.pareti[v.pareti] ?? nomiBagno.pareti.meta,
		nomiBagno.disposizione[v.disposizione] ?? nomiBagno.disposizione.uguale,
		'finiture ' + nomiBagno.livello[livello],
		nomiBagno.dove[v.dove] ?? nomiBagno.dove.terraferma
	].join(', ');
	const extra = lista(v.extra).map((e) => bagno.extra[e]?.nome.toLowerCase()).filter(Boolean);
	return {
		min,
		max,
		nettoMin: somma('nettoMin'),
		nettoMax: somma('nettoMax'),
		voci: [...voci, ...daValutare],
		livello,
		durata: rinnovo ? '1–2 settimane' : '2–4 settimane',
		comprende: ['Materiali del livello scelto e posa', 'Impermeabilizzazione della doccia', 'Smaltimento delle macerie', 'Pulizia finale'],
		esclude: ['Progetto e pratiche comunali', 'Accessori non elencati', 'Imprevisti sotto pavimenti e rivestimenti'],
		aumenti: ['Tubi o massetto da rifare', 'Spostare wc o doccia', 'Piano alto senza ascensore', 'Accesso solo via acqua'],
		riepilogo: `Bagno: ${testo}${extra.length ? ', con ' + extra.join(', ') : ''}. Budget indicativo: ${euro(min)}–${euro(max)} €, IVA 10% inclusa.`
	};
}

export const bagnoPredefinito = {
	cosa: 'bagno',
	intervento: 'completo',
	misura: 'medio',
	doccia: 'doccia',
	extra: [],
	pareti: 'meta',
	disposizione: 'uguale',
	livello: 'comfort',
	dove: 'terraferma'
};

// Il prezzo "da" delle ristrutturazioni è il caso più piccolo del simulatore (senza IVA: daTesto la aggiunge)
aPartireDa.ristrutturazioni.euro = calcolaBagno({ intervento: 'rinnovo', misura: 'piccolo', doccia: 'doccia', pareti: 'meta', disposizione: 'uguale', livello: 'base', dove: 'terraferma' }).nettoMin;
