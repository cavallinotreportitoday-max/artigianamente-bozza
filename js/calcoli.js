// Stime orientative per il preventivo guidato.
import datiRevisione from './revisione-dati.js?r=61';
// ATTENZIONE: tutte le tariffe sono PROVVISORIE (bozza ottobre 2026), da approvare con il titolare.
// Lo stesso file serve sia alla pagina (prima visualizzazione) sia allo script nel browser.

export const tariffe = {
	imbiancatura: {
		euroMq: [6, 9], // € al m² di superficie da pitturare, 2 mani, pittura traspirante, manodopera e pittura
		pareti: { buone: 0, crepe: 2, rasare: 7 }, // € in più al m²
		pittura: { traspirante: 1, lavabile: 1.15, antimuffa: 1.3 },
		stanze: { vuote: 1, arredate: 1.1 },
		colore: { bianco: 1, colorato: 1.1 },
		minimo: 250,
		/* Preventivo dettagliato (15/10/2026, Gian + revisione ChatGPT): voce per voce, prezzi SENZA IVA.
		   PROVVISORI, dal mercato (fonti in DESIGN.md: money.it 2026, cronoshare, prezzario Regione Lazio 2022,
		   elenco prezzi Veneto): li approva e li cambia Fabri dalla Gestione. [da, a] = forchetta. */
		lavoro: {
			pareti: [5, 8], // €/m² tinteggiatura delle pareti, due mani (solo manodopera)
			soffitti: [6, 9], // €/m² tinteggiatura dei soffitti, due mani
			manoExtra: [2, 3], // €/m² una mano in più (colore intenso, da scuro a chiaro, intonaco nuovo)
			fissativo: [1, 1.5], // €/m² fondo fissativo, materiale compreso
			protezioni: [1.5, 2.5], // €/m² di pavimento: teli e protezioni posati e tolti
			stuccaturaPoca: [30, 60], // a stanza: buchi e crepe in poche zone, materiale compreso
			stuccatura: [4, 7], // €/m² di parete interessata
			raschiaturaPoca: [20, 40], // a stanza: pittura che si stacca in poche zone
			raschiatura: [3, 5], // €/m² interessato
			rasaturaPoca: [40, 80], // a stanza: superficie irregolare in poche zone
			rasatura: [11, 19], // €/m² interessato, rasatura con carteggiatura
			muffaPoca: [25, 50], // a stanza: pulizia e trattamento della muffa in poche zone
			muffa: [5, 9], // €/m² interessato
			macchiePoca: [15, 30], // a stanza: fondo isolante sulle macchie
			macchie: [3, 5], // €/m² interessato
			carta: [6, 10] // €/m² rimozione della carta da parati
		},
		granParte: 50, // «gran parte» della stanza = 50% delle superfici
		materiali: {
			traspirante: [4, 6], // €/litro pittura per uso normale
			lavabile: [7, 10], // €/litro pittura lavabile
			antimuffa: [9, 13], // €/litro pittura antimuffa
			tinta: [1, 2], // €/litro in più per la tinta (colori)
			resa: 10 // m² per litro, a mano
		},
		consumo: { mq: [0.4, 0.7], minimo: [20, 30] }, // materiali di consumo: €/m² lavorato (superficie contata una volta), minimo per intervento
		extra: {
			mobili: [30, 60], // a stanza: spostare e rimettere i mobili
			mobiliFermi: [10, 20], // a stanza: coprire i mobili grandi che restano al loro posto
			trabattello: [60, 120], // a stanza con soffitto oltre 3,5 m
			piano: [20, 40], // a piano senza ascensore, dal secondo in su: portare su materiali e attrezzi
			fasi: 1.1, // casa abitata: si lavora a stanze (+10% sulla manodopera)
			rallenta: 1.1 // travi, cornici, cassonetti o piastrelle da contornare (+10% sulla manodopera)
		},
		smalti: {
			termosifone: [40, 80], // a termosifone, smalto compreso
			porta: [70, 120], // a porta, due lati
			finestra: [60, 110], // a finestra o scuro
			ringhiera: [20, 35], // al metro
			battiscopa: [3, 5] // al metro
		},
		ritocchi: { piccola: [25, 45], media: [40, 80], grande: [70, 130], minimo: 150 }, // a zona; minimo del lavoro
		esterni: {
			lavoro: [8, 12], // €/m² tinteggiatura esterna, due mani
			pittura: [3, 6], // €/m² pittura per esterni (silicati o silossanica)
			lavaggio: [3, 6], // €/m² lavaggio della superficie
			alghe: [4, 7], // €/m² trattamento di muffa e alghe
			intonaco: [30, 50], // €/m² ripristino delle parti di intonaco che si staccano
			crepe: [80, 150], // a corpo: crepe da aprire e sigillare
			quotaIntonaco: 10, // parti da ripristinare: 10% della superficie (si verifica al sopralluogo)
			minimo: 400,
			// 15/10 (Gian: «anche se è alta, il costo di piattaforma o impalcatura lo dobbiamo dare»): attrezzatura per
			// lavorare in alto, scelta dall'altezza e dalla superficie. Fonti: studiomadera.it 2026 (ponteggio
			// prefabbricato 17 €/m² montaggio e primo mese + 7 €/m² smontaggio; tubi e giunti 20 + 8; mesi dopo 3–4,5 €/m²),
			// qualcherisposta.it (piattaforma 14 m 100–140 €/giorno, più alte fino a 300 €/giorno senza operatore).
			resaGiorno: 25, // m² di superficie finiti al giorno (lavaggio, fondo e due mani), squadra di due
			trabattello: [40, 70], // €/giorno noleggio, fino a 6 m
			trabattelloPorto: [60, 100], // a corpo: trasporto, montaggio e smontaggio
			piattaforma: [150, 300], // €/giorno noleggio piattaforma aerea, oltre 6 m
			piattaformaPorto: [80, 150], // a corpo: consegna e ritiro
			ponteggio: [24, 30], // €/m² di facciata: montaggio, smontaggio e primo mese
			ponteggioMese: [3, 4.5], // €/m² per ogni mese in più
			trabattelloFino: 6, // m: oltre serve piattaforma o ponteggio
			terra: 3 // m: fin qui si lavora da terra con le scale
		},
		minimoLavoro: 250 // minimo del lavoro (soglia: non si somma)
	},
	/* Risanamento umidità voce per voce (15/10/2026, Gian + revisione ChatGPT): stima del ripristino delle superfici,
	   mai della causa. Prezzi SENZA IVA, PROVVISORI (fonti in DESIGN.md: edilizia.com 2026 ciclo deumidificante
	   55–90 €/m², rimozione intonaco 15–35 €/m², rasatura e pittura 12–30 €/m²; elenco prezzi IO Veneto 2024
	   rimozione intonaco 18,11 €/m²; scheda Fassa RisanaFacile: 10 kg/m² per cm, almeno 2 cm, rinzaffo 5–15 mm).
	   Li approva e li cambia Fabri dalla Gestione. [da, a] = forchetta. */
	risanamento: {
		lavoro: {
			preparazione: [40, 80], // a muro: protezione del locale, del pavimento e delle zone vicine
			mobili: [30, 60], // a muro: spostare e rimettere i mobili
			rimozione: [12, 20], // €/m² rimozione dell'intonaco degradato fino a 2 cm, a mano, con insacco
			rivestimenti: [12, 22], // €/m² rimozione di piastrelle, perline o contropareti
			pulizia: [3, 6], // €/m² pulizia e preparazione della muratura (o della superficie)
			sali: [3, 5], // €/m² spazzolatura dei sali superficiali (depositi bianchi)
			giunti: [8, 15], // €/m² ripristino di giunti e parti deteriorate
			scuci: [80, 120], // €/m² scuci-cuci dei mattoni deteriorati (da verificare)
			consolidante: [4, 6], // €/m² posa del fondo consolidante sulla muratura debole
			crepe: [10, 15], // €/m stuccatura e risarcitura delle crepe
			antisale: [3, 6], // €/m² posa del trattamento antisale
			rinzaffo: [6, 10], // €/m² posa del rinzaffo
			rete: [6, 10], // €/m² posa della rete porta intonaco
			risanante: [18, 28], // €/m² posa dell'intonaco risanante, spessore di base
			spessoreCm: [5, 8], // €/m² per ogni cm in più di intonaco risanante (posa)
			spigoli: [5, 8], // €/m posa dei paraspigoli
			rasatura: [7, 12], // €/m² rasatura compatibile
			pittura: [5, 8], // €/m² pittura traspirante compatibile, due mani (posa)
			muffa: [5, 9], // €/m² trattamento superficiale della muffa, prodotto compreso
			fondo: [1.5, 3], // €/m² fondo traspirante, materiale compreso (trattamento delle superfici)
			battiscopa: [6, 12], // €/m rimozione e riposa del battiscopa
			battiscopaNuovo: [8, 15], // €/m battiscopa nuovo se il vecchio si rompe (da verificare)
			termosifoni: [80, 160], // a corpo: smontaggio e rimontaggio dei termosifoni
			presa: [7, 10], // €/pezzo: prese e placche, smontaggio e rimontaggio
			fissi: [150, 300], // a corpo: cucina, mobili fissi o sanitari (da verificare)
			piastrelle: [60, 120], // a corpo: ritocco di piastrelle o fughe vicine (da verificare)
			scale: [40, 80], // a corpo: protezione di scale e passaggi comuni
			macerie: [2, 4] // €/m² movimentazione e insacco delle macerie
		},
		materiali: {
			risanante: [0.7, 1.2], // €/kg intonaco risanante (sacco da 25 kg)
			rinzaffo: [0.5, 0.9], // €/kg
			rasante: [0.8, 1.4], // €/kg
			malta: [0.4, 0.6], // €/kg malta per ripristini (giunti, scuci-cuci)
			stucco: [2.5, 3.5], // €/kg stucco per crepe
			antisale: [8, 15], // €/litro
			consolidante: [6, 10], // €/litro fondo consolidante
			rete: [1.8, 3], // €/m² rete porta intonaco
			spigoli: [1.5, 2.5], // €/m paraspigoli
			pittura: [9, 15], // €/litro pittura traspirante compatibile (silicati o per risananti)
			kgRisanante: 10, // kg/m² per ogni cm di spessore
			kgRinzaffo: 8, // kg/m²
			kgRasante: 3, // kg/m²
			kgMalta: 25, // kg/m² di giunti o scuci-cuci
			kgStucco: 1, // kg per metro di crepa
			lAntisale: 0.3, // litri/m²
			resaConsolidante: 6, // m² per litro
			resaPittura: 7 // m² per litro, una mano
		},
		// lavori in più: fuori dal totale finché il cliente non li sceglie
		opzioni: {
			parete: [9, 13], // €/m² pittura del resto della parete (niente stacchi), materiali compresi
			zoccolo: [25, 35], // €/m² zoccolatura intonacata (da valutare: non è una protezione automatica)
			zoccoloH: 30, // cm di altezza della zoccolatura
			calce: [38, 50], // €/m² intonaco a calce compatibile per edifici antichi, al posto del risanante, materiali compresi
			deumidificatore: [10, 18], // €/giorno noleggio del deumidificatore
			giorni: 14 // giorni di deumidificatore
		},
		spessore: 2, // cm di intonaco risanante di base (in più 1 cm su pietra o muro misto)
		oltre: 50, // cm di intonaco da togliere sopra il danno visibile: ipotesi, la decide il sistema scelto (fino a 1 m)
		bordo: 20, // cm attorno a una macchia isolata (e sopra il danno quando l'intonaco resta)
		quotaGiunti: 20, // % della superficie con giunti da ripristinare (edifici antichi)
		quotaScuci: 10, // % della superficie con mattoni da ripristinare (muro che si sbriciola)
		crepeMuro: 2, // m di crepe per muro, se il cliente non lo dice
		preseMuro: 2, // prese e placche per muro, se il cliente non lo dice
		rifiuti: { viaggio: [80, 150], kg: [0.03, 0.06], kgMq: 35, kgRivestimenti: 20, bigbag: [10, 15], kgBigBag: 800 }, // a corpo + €/kg; kg di macerie al m²; big bag e sacchi
		barca: [80, 120], // a viaggio: trasporto via acqua
		approdo: [30, 50], // a viaggio: approdo e scarico dalla barca
		oraMano: [25, 35], // €/ora: trasporto a mano fino al cantiere
		kgOra: 400, // kg portati a mano in un'ora, a 100 m
		deposito: [40, 70], // a corpo: deposito del materiale
		piano: [20, 40], // a piano senza ascensore, dal secondo in su
		resaGiorno: 8, // m² finiti al giorno (per i giorni di attrezzatura in altezza)
		consumo: { mq: [0.8, 1.5], minimo: [30, 50] }, // materiali di consumo: €/m² lavorato, minimo per intervento
		tipicoL: 3, // m: muro senza misure, fascia lunga 3 m (dichiarata)
		tipicoH: 1, // m: e alta 1 m
		minimoLavoro: 350
	},
	/* Falegnameria, gruppo A (15/10/2026, Gian + revisione ChatGPT): riparazioni e piccoli lavori a pezzo. Il cliente
	   dice cosa e che problema ha; il calcolo propone la lavorazione. Prezzi SENZA IVA, PROVVISORI: ipotesi da
	   confrontare con tempi e costi reali di Fabri (fonti in DESIGN.md: cronoshare.it per l'ora, edilizia.com per le
	   tapparelle). Li cambia Fabri dalla Gestione. [da, a] = forchetta. */
	falegnameria: {
		uscita: [30, 50], // a corpo, una volta per appuntamento
		ora: [35, 45], // €/ora, per i lavori fuori catalogo (oggi non usata in automatico)
		minimo: 80, // uscita + manodopera almeno questo (soglia, non si somma); ricambi e consumi a parte
		consumo: [5, 15], // materiali di consumo (viti, tasselli, colla, cera, abrasivi), una volta per appuntamento
		lavoro: {
			antaRegola: [10, 15], // ad anta: regolazione semplice, ferramenta integra
			cerniera: [15, 25], // a cerniera: sostituzione, regolazione compresa
			cernieraSupporto: [25, 45], // a cerniera: ripristino del fissaggio su supporto rovinato (da verificare)
			manigliaMobile: [5, 10], // a maniglia o pomolo, su fori già adatti
			cassettoRegola: [15, 25], // a cassetto: pulizia e regolazione
			guide: [30, 50], // a cassetto: posa della coppia di guide
			frontale: [20, 35], // a cassetto: frontale staccato da rifissare
			instabile: [30, 60], // a pezzo: tavolo o sedia che traballa (da verificare)
			staccata: [25, 50], // a pezzo: parte staccata da rincollare o fissare, caso semplice (da verificare)
			cigola: [20, 35], // a letto: controllo e serraggio
			ripiano: [10, 20], // a ripiano: fissaggio o supporti
			portaRegola: [20, 35], // a porta: regolazione semplice
			piallatura: [40, 70], // a porta: smontaggio, piallatura del bordo, rimontaggio (da verificare)
			serratura: [40, 70], // a porta: sostituzione compatibile della serratura
			manigliaPorta: [15, 25], // a coppia di maniglie (due lati)
			cernieraPorta: [20, 30], // a cerniera della porta
			scorrevoleRegola: [20, 35], // ad anta scorrevole: regolazione
			ruote: [40, 70], // ad anta scorrevole: ruote o binario
			finestraRegola: [25, 45], // ad anta di finestra o scuro: regolazione semplice
			guarnizione: [6, 10], // al metro: posa della guarnizione
			cinghia: [30, 50], // a tapparella: sola cinghia
			avvolgitore: [40, 70], // a tapparella: cinghia e avvolgitore
			stecche: [50, 90], // a tapparella: sostituzione delle stecche (da verificare)
			tapparellaBlocca: [40, 70], // a tapparella: verifica e sblocco di rullo o guide (da verificare)
			zanzarieraRegola: [15, 25], // a zanzariera: regolazione
			zanzarieraRete: [30, 50], // a zanzariera: sostituzione della rete
			fissare: [20, 40] // a pezzo: altro da fissare o regolare (da verificare)
		},
		ricambi: {
			cerniera: [3, 10], // a cerniera di mobile, modelli semplici
			guide: [15, 40], // a coppia di guide, modelli compatibili
			serratura: [15, 40], // serratura per porta interna, modelli semplici
			cernieraPorta: [5, 15], // a cerniera di porta
			cinghia: [5, 12], // a tapparella
			avvolgitore: [15, 30], // a tapparella
			guarnizione: [2, 5], // al metro
			rete: [10, 25] // a zanzariera
		},
		metriGuarnizione: 5 // m di guarnizione per anta di finestra
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
	falegnameria: { euro: 85, unita: '', dettaglio: 'Piccola riparazione a domicilio: uscita e lavoro (minimo 80 € + IVA) e materiali di consumo.' }, // 15/10: allineato al minimo (revisione ChatGPT)
	'montaggio-mobili': { euro: 70, unita: '', dettaglio: 'Uscita minima per mobili piccoli.' },
	traslochi: { euro: 300, unita: '', dettaglio: 'Monolocale in zona, con ascensore, scatoloni preparati da te.' }, // dal calcolatore (trasloco.js): esempio Monolocale, 1° piano con ascensore, 3 km, imballo io con i miei scatoloni → 300–370 €
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

// Arrotonda a cifre "da listino", per eccesso: 6,6 → 7; 73 → 75; 541 → 550; 3.910 → 4.000
// 15/10 (Gian): per i prezzi «da» si arrotonda sempre per eccesso, mai sotto il prezzo vero (60 € + IVA = 66 € → 70 €)
const bello = (x) => {
	const n = Math.round(x * 100) / 100; // niente resti delle virgole (55,000001 resta 55)
	const passo = n < 20 ? 1 : n < 200 ? 5 : n < 2000 ? 10 : 100;
	return Math.ceil(n / passo) * passo;
};

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
	// 15/10: preventivo dettagliato voce per voce (le pagine di prima mandano ancora le scelte vecchie: formula di sempre)
	if (tipo === 'imbiancatura' && Number(v?.versione) === 2) return imbiancaturaDettagliata(v, t);
	if (tipo === 'risanamento') return risanamentoDettagliato(v && typeof v === 'object' ? v : {}, t);
	if (tipo === 'falegnameria') return falegnameriaDettagliata(v && typeof v === 'object' ? v : {}, t);
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

/* ---------------------------------------------------------------------------
   IMBIANCATURA DETTAGLIATA (15/10/2026, Gian + revisione ChatGPT)
   Voce per voce: manodopera, materiali, materiali di consumo (una riga sola, con l'asterisco), extra.
   Superfici: pareti = perimetro × altezza (con le misure); con i soli m² di pavimento il perimetro di una stanza
   quadrata; senza misure i m² tipici della stanza (dichiarati come stimati). Porte e finestre normali non si
   tolgono («vuoto per pieno», come nei prezzari: compensa il lavoro sui bordi); si toglie solo una vetrata grande.
   Problemi: «poche zone» = a corpo per stanza; «gran parte» = al m² sulla quota granParte della stanza.
   Ingresso (dal percorso del sito, static/js/percorsi.js): { versione: 2, lavoro, ambienti: [...], ... }.
   Tutti i numeri arrivano anche dal browser del cliente: si limitano (stanze, misure, quantità).
--------------------------------------------------------------------------- */
const STANZA_TIPICA = { camera: 12, soggiorno: 22, cucina: 10, bagno: 5, corridoio: 6, altro: 12 };
const NOME_STANZA = { camera: 'Camera', soggiorno: 'Soggiorno', cucina: 'Cucina', bagno: 'Bagno', corridoio: 'Corridoio', altro: 'Altra stanza' };
const ALTEZZA = 2.7;
const fra = (n, a, b) => Math.min(b, Math.max(a, n));
const cinque = (n) => Math.round(n / 5) * 5;
const dieci = (n) => Math.round(n / 10) * 10;
const m2 = (n) => `${euro(n)} m²`;
const voce = (gruppo, nome, quantita, a, b, extra = {}) => ({ gruppo, nome, quantita, min: cinque(a), max: cinque(b), ...extra });

/** Superfici di una stanza (o di una parete): pareti, soffitto e pavimento in m², stimata = senza misure vere */
function superfici(x, lavoro) {
	const h = fra(num(x.h, 0), 0, 10) || ALTEZZA;
	if (lavoro === 'pareti') {
		const l = fra(num(x.l, 0), 0, 50);
		const larga = l || 3;
		return { pareti: larga * h, soffitto: 0, pavimento: larga * 1.5, lunghezza: larga, stimata: !l, h };
	}
	const l = fra(num(x.l, 0), 0, 50);
	const w = fra(num(x.w, 0), 0, 50);
	const mq = fra(num(x.mq, 0), 0, 500);
	let pav;
	let perimetro;
	let stimata = false;
	if (x.modo === 'misure' && l && w) {
		pav = l * w;
		perimetro = 2 * (l + w);
	} else if (x.modo === 'mq' && mq) {
		pav = mq;
		perimetro = 4 * Math.sqrt(mq);
	} else {
		pav = STANZA_TIPICA[x.tipo] ?? 12;
		perimetro = 4 * Math.sqrt(pav);
		stimata = true;
	}
	const quota = lavoro === 'soffitti' || x.pareti === 'nessuna' ? 0 : x.pareti === 'alcune' ? fra(num(x.quante, 1) || 1, 1, 3) / 4 : 1;
	const pareti = Math.max(0, perimetro * h * quota - fra(num(x.vetrata, 0), 0, 200));
	const soffitto = lavoro === 'soffitti' || x.soffitto === true ? pav : 0;
	return { pareti, soffitto, pavimento: pav, stimata, h };
}

const PREPARAZIONI = [
	['buchi', 'stuccatura', 'Stuccatura di buchi e crepe'],
	['stacca', 'raschiatura', 'Raschiatura della pittura che si stacca'],
	['irregolare', 'rasatura', 'Rasatura e carteggiatura'],
	['muffa', 'muffa', 'Trattamento superficiale della muffa'],
	['macchie', 'macchie', 'Fondo isolante sulle macchie']
];

function imbiancaturaDettagliata(v, t) {
	const lav = t.lavoro;
	const lavoro = ['stanze', 'pareti', 'soffitti', 'ritocchi', 'esterni'].includes(v.lavoro) ? v.lavoro : 'stanze';
	if (lavoro === 'ritocchi') return ritocchiDettagliati(v, t);
	if (lavoro === 'esterni') return esterniDettagliati(v, t);
	const ambienti = (Array.isArray(v.ambienti) ? v.ambienti : []).filter((x) => x && typeof x === 'object').slice(0, 20);
	if (!ambienti.length) return { vuoto: true, messaggio: 'Aggiungi almeno una stanza.', dettaglio: '', comprende: [], esclude: [], riepilogo: '' };

	const voci = [];
	const ipotesi = [];
	const daVerificare = [];
	const daComprare = [];
	const lista = (x) => (Array.isArray(x) ? x : []);
	const colore = ['bianco', 'chiaro', 'intenso', 'particolare'].includes(v.colore) ? v.colore : 'bianco';
	const nuovo = v.adesso === 'nuovo';
	// totali delle superfici
	let pareti = 0;
	let soffitti = 0;
	let pavimento = 0;
	let lunghezza = 0; // pareti singole: metri di parete da proteggere
	let manoIn = 0; // m² con una mano in più
	let fissativo = 0;
	let stimate = 0;
	let alte = 0;
	const prep = Object.fromEntries(PREPARAZIONI.map(([k]) => [k, { mq: 0, stanze: 0 }]));
	let carta = 0;
	const litri = { traspirante: 0, lavabile: 0, antimuffa: 0 };
	const usoBase = v.uso === 'lavabile' ? 'lavabile' : 'traspirante';
	for (const x of ambienti) {
		const s = superfici(x, lavoro);
		pareti += s.pareti;
		soffitti += s.soffitto;
		pavimento += s.pavimento;
		lunghezza += s.lunghezza ?? 0;
		if (s.stimata) stimate++;
		if (s.h > 3.5) alte++;
		const sup = s.pareti + s.soffitto;
		const problemi = lista(x.problemi);
		const estesi = x.estesi === true;
		for (const [k] of PREPARAZIONI) {
			if (!problemi.includes(k)) continue;
			if (estesi) prep[k].mq += (sup * t.granParte) / 100;
			else prep[k].stanze++;
		}
		if (problemi.includes('carta')) carta += s.pareti;
		// fondo fissativo su tutta la stanza quando le superfici sono nuove o vanno preparate
		if (nuovo || problemi.some((k) => ['buchi', 'stacca', 'irregolare', 'carta'].includes(k))) fissativo += sup;
		// mani: due; una in più su tutto se l'intonaco è nuovo, sulle pareti con colore intenso o da scuro a chiaro
		const extra = nuovo ? sup : colore === 'intenso' || colore === 'particolare' || v.scuro === true ? s.pareti : 0;
		manoIn += extra;
		// la pittura antimuffa non si mette da sola: si decide dopo la verifica della causa (revisione ChatGPT 15/10)
		litri[usoBase] += ((sup * 2 + extra) / (t.materiali.resa || 10)) * 1.1;
	}
	const n = ambienti.length;
	const quale = lavoro === 'pareti' ? (n === 1 ? 'parete' : 'pareti') : n === 1 ? 'stanza' : 'stanze';

	// MANODOPERA
	const qProt = lavoro === 'pareti' ? `${euro(Math.round(lunghezza))} m di parete` : `${m2(Math.round(pavimento))} di pavimento`;
	voci.push(voce('Manodopera', lavoro === 'pareti' ? 'Protezioni e preparazione' : 'Protezioni e preparazione dei locali', qProt, pavimento * lav.protezioni[0], pavimento * lav.protezioni[1]));
	if (carta) voci.push(voce('Manodopera', 'Rimozione della carta da parati', m2(Math.round(carta)), carta * lav.carta[0], carta * lav.carta[1]));
	for (const [k, chiave, nome] of PREPARAZIONI) {
		const { mq, stanze } = prep[k];
		if (!mq && !stanze) continue;
		const poca = lav[chiave + 'Poca'];
		const a = mq * lav[chiave][0] + stanze * poca[0];
		const b = mq * lav[chiave][1] + stanze * poca[1];
		const q = [mq ? m2(Math.round(mq)) : '', stanze ? `poche zone in ${stanze} ${stanze === 1 ? 'stanza' : 'stanze'}` : ''].filter(Boolean).join(' e ');
		voci.push(voce('Manodopera', nome, q, a, b));
	}
	if (fissativo) voci.push(voce('Manodopera', 'Fondo fissativo', m2(Math.round(fissativo)), fissativo * lav.fissativo[0], fissativo * lav.fissativo[1]));
	let pittura = [0, 0];
	if (pareti) {
		const r = voce('Manodopera', 'Tinteggiatura delle pareti, due mani', m2(Math.round(pareti)), pareti * lav.pareti[0], pareti * lav.pareti[1]);
		voci.push(r);
		pittura = [pittura[0] + r.min, pittura[1] + r.max];
	}
	if (soffitti) {
		const r = voce('Manodopera', 'Tinteggiatura dei soffitti, due mani', m2(Math.round(soffitti)), soffitti * lav.soffitti[0], soffitti * lav.soffitti[1]);
		voci.push(r);
		pittura = [pittura[0] + r.min, pittura[1] + r.max];
	}
	if (manoIn) {
		const perche = nuovo ? 'intonaco nuovo' : colore === 'intenso' || colore === 'particolare' ? 'colore intenso' : 'da scuro a chiaro';
		voci.push(voce('Manodopera', `Una mano in più (${perche})`, m2(Math.round(manoIn)), manoIn * lav.manoExtra[0], manoIn * lav.manoExtra[1]));
	}
	if (v.piuColori === true || v.rallenta === true) {
		const k = (v.rallenta === true ? t.extra.rallenta : 1) * (v.piuColori === true ? t.extra.rallenta : 1) - 1;
		const cosa = [v.piuColori === true && 'più colori', v.rallenta === true && 'travi, cornici o parti da contornare'].filter(Boolean).join(', ');
		voci.push(voce('Manodopera', `Contorni e stacchi (${cosa})`, 'sulla tinteggiatura', pittura[0] * k, pittura[1] * k));
	}
	const manodopera = voci.reduce((x, r) => [x[0] + r.min, x[1] + r.max], [0, 0]);
	if (v.abitata === true) voci.push(voce('Manodopera', 'Lavoro a stanze (casa abitata)', 'sulla manodopera', manodopera[0] * (t.extra.fasi - 1), manodopera[1] * (t.extra.fasi - 1)));

	// MATERIALI
	const nomePittura = { traspirante: 'Pittura traspirante', lavabile: 'Pittura lavabile', antimuffa: 'Pittura antimuffa' };
	const tinta = colore !== 'bianco';
	const fornitura = ['noi', 'ho', 'compro', 'decidere'].includes(v.fornitura) ? v.fornitura : 'decidere';
	for (const [k, l] of Object.entries(litri)) {
		if (!l) continue;
		const lt = Math.ceil(l);
		const nome = `${nomePittura[k]}${tinta ? ' colorata' : ' bianca'}`;
		if (fornitura === 'noi' || fornitura === 'decidere') {
			const p = t.materiali[k];
			const add = tinta ? t.materiali.tinta : [0, 0];
			voci.push(voce('Materiali', nome, `circa ${lt} litri`, lt * (p[0] + add[0]), lt * (p[1] + add[1])));
		} else if (fornitura === 'compro') daComprare.push(`${nome}: circa ${lt} litri`);
		else daVerificare.push(`${nome} tua: servono circa ${lt} litri; tipo e condizioni da verificare`);
	}
	if (fornitura === 'decidere') ipotesi.push('Pittura fornita da noi (hai detto «devo decidere»)');
	const lavorata = pareti + soffitti;
	const consumo = [Math.max(lavorata * t.consumo.mq[0], t.consumo.minimo[0]), Math.max(lavorata * t.consumo.mq[1], t.consumo.minimo[1])];
	voci.push(voce('Materiali', 'Materiali di consumo*', m2(Math.round(lavorata)) + ' lavorati', consumo[0], consumo[1]));

	// EXTRA
	const ex = t.extra;
	if (v.mobili === 'voi') voci.push(voce('Extra', 'Spostamento e riposizionamento dei mobili', `${n} ${quale}`, n * ex.mobili[0], n * ex.mobili[1]));
	if (v.mobili === 'restano') voci.push(voce('Extra', 'Copertura dei mobili grandi che restano', `${n} ${quale}`, n * ex.mobiliFermi[0], n * ex.mobiliFermi[1]));
	if (alte) voci.push(voce('Extra', 'Trabattello per soffitti alti', `${alte} ${alte === 1 ? 'stanza' : 'stanze'}`, alte * ex.trabattello[0], alte * ex.trabattello[1]));
	const piano = fra(Math.round(num(v.piano, 0)), 0, 30);
	if (piano >= 2 && v.ascensore !== true) voci.push(voce('Extra', 'Materiali e attrezzi ai piani, senza ascensore', `${piano}° piano`, (piano - 1) * ex.piano[0], (piano - 1) * ex.piano[1]));
	const sm = v.smalti && typeof v.smalti === 'object' ? v.smalti : {};
	for (const [k, nome, unita, max] of [
		['termosifone', 'Smalto dei termosifoni', 'pz', 30],
		['porta', 'Smalto delle porte, due lati', 'pz', 30],
		['finestra', 'Smalto di finestre o scuri', 'pz', 40],
		['ringhiera', 'Smalto della ringhiera', 'm', 200],
		['battiscopa', 'Smalto del battiscopa', 'm', 500]
	]) {
		const q = fra(Math.round(num(sm[k], 0)), 0, max);
		if (q) voci.push(voce('Extra', nome, `${q} ${unita === 'm' ? 'm' : q === 1 ? 'pezzo' : 'pezzi'}`, q * t.smalti[k][0], q * t.smalti[k][1]));
	}
	voci.push(voce('Extra', 'Pulizia di fine lavoro', 'compresa', 0, 0, { compresa: true }));

	// avvisi
	if (stimate) ipotesi.push(`Misure stimate per ${stimate === n ? (n === 1 ? 'la stanza' : 'tutte le stanze') : `${stimate} ${stimate === 1 ? 'stanza' : 'stanze'}`} (stanza tipica: camera 12 m², soggiorno 22 m², cucina 10 m², bagno 5 m²)`);
	if (lavoro !== 'soffitti' && ambienti.some((x) => !num(x.h, 0))) ipotesi.push('Altezza 2,70 m dove non l’hai indicata');
	if (Object.values(prep).some((x) => x.mq)) ipotesi.push(`«Gran parte» della stanza = il ${t.granParte}% delle superfici`);
	if (colore === 'particolare') daVerificare.push('Effetto decorativo o finitura particolare: da quantificare al sopralluogo');
	if (prep.muffa.mq || prep.muffa.stanze) daVerificare.push('Muffa: nella stima c’è solo il trattamento della superficie. La causa (condensa, infiltrazione) va verificata; se serve una pittura antimuffa la decidiamo dopo');
	if (lavoro !== 'soffitti') ipotesi.push('Porte e finestre normali non si tolgono dalle pareti: il lavoro sui bordi le compensa (vuoto per pieno)');
	if (v.accesso === 'venezia') daVerificare.push('Trasporto via acqua e accesso a Venezia o nelle isole: da quantificare');
	if (v.accesso === 'ztl') daVerificare.push('Accesso in ZTL o senza parcheggio vicino: da quantificare');

	return chiudiVoci(voci, t.minimoLavoro, {
		ipotesi,
		daVerificare,
		daComprare,
		titoloStima: 'Stima del lavoro',
		dettaglio: `${n} ${quale}: circa ${m2(Math.round(pareti))} di pareti${soffitti ? ` e ${m2(Math.round(soffitti))} di soffitti` : ''}.`,
		riepilogo: `Imbiancatura (${lavoro}): ${n} ${quale}, pareti ${m2(Math.round(pareti))}, soffitti ${m2(Math.round(soffitti))}, colore ${colore}, pittura ${{ noi: 'fornita da noi', ho: 'già del cliente', compro: 'comprata dal cliente', decidere: 'da decidere' }[fornitura]}.`
	});
}

/** Ritocchi: a zona, oppure tutta la parete (il ritocco può restare visibile) */
function ritocchiDettagliati(v, t) {
	const r = v.ritocchi && typeof v.ritocchi === 'object' ? v.ritocchi : {};
	const zone = fra(Math.round(num(r.zone, 0)), 0, 30);
	const dim = ['piccola', 'media', 'grande'].includes(r.dimensione) ? r.dimensione : 'media';
	const voci = [];
	const ipotesi = [];
	const daVerificare = [];
	const daComprare = [];
	if (!zone) return { vuoto: true, messaggio: 'Indica quante zone sono.', dettaglio: '', comprende: [], esclude: [], riepilogo: '' };
	const nomeDim = { piccola: 'piccole, fino a un foglio', media: 'medie, fino a 1 m²', grande: 'grandi, oltre 1 m²' }[dim];
	voci.push(voce('Manodopera', `Riparazione e ritocco (zone ${nomeDim})`, `${zone} ${zone === 1 ? 'zona' : 'zone'}`, zone * t.ritocchi[dim][0], zone * t.ritocchi[dim][1]));
	if (r.parete === true) {
		const l = fra(num(r.l, 0), 0, 30) || 3;
		const h = fra(num(r.h, 0), 0, 10) || ALTEZZA;
		if (!num(r.l, 0)) ipotesi.push('Parete larga 3 m (non hai indicato la misura)');
		const mq = l * h;
		voci.push(voce('Manodopera', 'Tinteggiatura di tutta la parete, due mani', m2(Math.round(mq)), mq * t.lavoro.pareti[0], mq * t.lavoro.pareti[1]));
		const lt = Math.ceil(((mq * 2) / (t.materiali.resa || 10)) * 1.1);
		if (v.fornitura === 'compro') daComprare.push(`Pittura: circa ${lt} litri`);
		else if (v.fornitura === 'ho') daVerificare.push(`Pittura tua: servono circa ${lt} litri; tipo e condizioni da verificare`);
		else voci.push(voce('Materiali', 'Pittura', `circa ${lt} litri`, lt * t.materiali.traspirante[0], lt * t.materiali.traspirante[1]));
	} else {
		daVerificare.push('Il ritocco può restare visibile: dipende da pittura, colore e luce. Non promettiamo che non si veda');
		if (r.stessa !== 'si') daVerificare.push('Pittura uguale a quella di adesso: da trovare o da verificare');
	}
	voci.push(voce('Materiali', 'Materiali di consumo*', 'minimo per intervento', t.consumo.minimo[0], t.consumo.minimo[1]));
	return chiudiVoci(voci, t.ritocchi.minimo, {
		ipotesi,
		daVerificare,
		daComprare,
		titoloStima: 'Stima del lavoro',
		dettaglio: `${zone} ${zone === 1 ? 'zona' : 'zone'} da ritoccare${r.parete === true ? ', con tutta la parete' : ''}.`,
		riepilogo: `Imbiancatura (ritocchi): ${zone} zone ${nomeDim}${r.parete === true ? ', tutta la parete' : ''}.`
	});
}

/**
 * Lavorare in alto (esterni dell'imbiancatura e muri esterni dell'umidità): fino a 3 m da terra con le scale; fino a
 * 6 m trabattello; oltre, piattaforma aerea o ponteggio (il più conveniente per questa superficie e questi giorni).
 * Prezzi del noleggio: tariffe.imbiancatura.esterni (uno solo, per tutti i lavori). Aggiunge le voci e l'ipotesi.
 * @returns {string} l'attrezzatura scelta, '' se non serve
 */
function attrezzatura(voci, ipotesi, mq, h, giorni, te) {
	if (!(h > te.terra)) return '';
	let attrezzo;
	const gg = `${giorni} ${giorni === 1 ? 'giorno' : 'giorni'}`;
	if (h <= te.trabattelloFino) {
		voci.push(voce('Attrezzatura', 'Trabattello: noleggio', gg, giorni * te.trabattello[0], giorni * te.trabattello[1]));
		voci.push(voce('Attrezzatura', 'Trabattello: trasporto, montaggio e smontaggio', 'a corpo', te.trabattelloPorto[0], te.trabattelloPorto[1]));
		attrezzo = 'trabattello';
	} else {
		const mesiIn = Math.max(0, Math.ceil(giorni / 22) - 1);
		const ponteggio = [mq * (te.ponteggio[0] + mesiIn * te.ponteggioMese[0]), mq * (te.ponteggio[1] + mesiIn * te.ponteggioMese[1])];
		const piattaforma = [giorni * te.piattaforma[0] + te.piattaformaPorto[0], giorni * te.piattaforma[1] + te.piattaformaPorto[1]];
		if (piattaforma[0] + piattaforma[1] <= ponteggio[0] + ponteggio[1]) {
			voci.push(voce('Attrezzatura', 'Piattaforma aerea: noleggio', gg, giorni * te.piattaforma[0], giorni * te.piattaforma[1]));
			voci.push(voce('Attrezzatura', 'Piattaforma aerea: consegna e ritiro', 'a corpo', te.piattaformaPorto[0], te.piattaformaPorto[1]));
			attrezzo = 'piattaforma aerea';
		} else {
			voci.push(voce('Attrezzatura', `Ponteggio: montaggio, smontaggio e ${mesiIn ? `${mesiIn + 1} mesi` : 'primo mese'}`, m2(Math.round(mq)) + ' di facciata', ponteggio[0], ponteggio[1]));
			attrezzo = 'ponteggio';
		}
	}
	ipotesi.push(`Per lavorare fino a ${String(Math.round(h * 10) / 10).replace('.', ',')} m da terra: ${attrezzo}, circa ${gg} di lavoro. La scelta la confermiamo al sopralluogo`);
	return attrezzo;
}

/** Esterni: lavorazioni sulle superfici e attrezzatura per lavorare in alto (trabattello, piattaforma o ponteggio) */
function esterniDettagliati(v, t) {
	const e = v.esterni && typeof v.esterni === 'object' ? v.esterni : {};
	const te = t.esterni;
	const l = fra(num(e.l, 0), 0, 200);
	const h = fra(num(e.h, 0), 0, 40);
	const mq = fra(num(e.mq, 0), 0, 5000) || l * h;
	if (!mq) return { vuoto: true, messaggio: 'Indica larghezza e altezza della superficie.', dettaglio: '', comprende: [], esclude: [], riepilogo: '' };
	const fondo = Array.isArray(e.fondo) ? e.fondo : [];
	const voci = [];
	const daVerificare = [];
	const ipotesi = [];
	const lato = l || Math.sqrt(mq);
	const giorni = Math.max(1, Math.ceil(mq / (te.resaGiorno || 25)));
	voci.push(voce('Manodopera', 'Protezioni a terra e su infissi', `${euro(Math.round(lato))} m di muro`, lato * t.lavoro.protezioni[0], lato * t.lavoro.protezioni[1]));
	if (fondo.includes('sporco')) voci.push(voce('Manodopera', 'Lavaggio della superficie', m2(Math.round(mq)), mq * te.lavaggio[0], mq * te.lavaggio[1]));
	if (fondo.includes('alghe')) voci.push(voce('Manodopera', 'Trattamento di muffa e alghe', m2(Math.round(mq)), mq * te.alghe[0], mq * te.alghe[1]));
	if (fondo.includes('intonaco')) {
		const q = (mq * te.quotaIntonaco) / 100;
		voci.push(voce('Manodopera', 'Ripristino dell’intonaco che si stacca', m2(Math.round(q)), q * te.intonaco[0], q * te.intonaco[1]));
		ipotesi.push(`Intonaco da ripristinare: circa il ${te.quotaIntonaco}% della superficie`);
	}
	if (fondo.includes('crepe')) voci.push(voce('Manodopera', 'Apertura e sigillatura delle crepe', 'a corpo', te.crepe[0], te.crepe[1]));
	voci.push(voce('Manodopera', 'Fondo fissativo', m2(Math.round(mq)), mq * t.lavoro.fissativo[0], mq * t.lavoro.fissativo[1]));
	voci.push(voce('Manodopera', 'Tinteggiatura esterna, due mani', m2(Math.round(mq)), mq * te.lavoro[0], mq * te.lavoro[1]));
	voci.push(voce('Materiali', `Pittura per esterni${e.colore === 'colorato' ? ' colorata' : ''}`, m2(Math.round(mq)), mq * te.pittura[0], mq * te.pittura[1]));
	voci.push(voce('Materiali', 'Materiali di consumo*', m2(Math.round(mq)) + ' lavorati', Math.max(mq * t.consumo.mq[0], t.consumo.minimo[0]), Math.max(mq * t.consumo.mq[1], t.consumo.minimo[1])));
	const attrezzo = attrezzatura(voci, ipotesi, mq, h, giorni, te);
	voci.push(voce('Extra', 'Pulizia di fine lavoro', 'compresa', 0, 0, { compresa: true }));
	if (e.davanti === 'pubblico' && attrezzo) daVerificare.push('Occupazione di suolo pubblico per l’attrezzatura: tassa e permesso del Comune, da verificare');
	if (e.davanti === 'acqua') daVerificare.push('Lavoro dal lato dell’acqua: trasporto e attrezzatura da quantificare');
	if (h > 20) daVerificare.push('Oltre 20 m d’altezza: attrezzatura e sicurezza da progettare al sopralluogo');
	daVerificare.push('Supporto, umidità e meteo incidono sul lavoro: date e durata le concordiamo dopo il sopralluogo');
	if (!l || !h) ipotesi.push('Superficie indicata da te in m²');
	return chiudiVoci(voci, te.minimo, {
		ipotesi,
		daVerificare,
		daComprare: [],
		titoloStima: 'Stima del lavoro',
		dettaglio: `Circa ${m2(Math.round(mq))} di superficie esterna${attrezzo ? `, con ${attrezzo}` : ''}.`,
		riepilogo: `Imbiancatura (esterni): ${m2(Math.round(mq))}, altezza ${String(h).replace('.', ',')} m${attrezzo ? `, ${attrezzo}` : ''}.`
	});
}

/* ---------------------------------------------------------------------------
   RISANAMENTO UMIDITÀ VOCE PER VOCE (15/10/2026, Gian + revisione ChatGPT)
   Stima del ripristino delle superfici, mai della causa: il cliente descrive, non sceglie la diagnosi.
   Due casi, decisi dai segni: «Ripristino dell'intonaco» (intonaco gonfio o che si stacca, depositi bianchi, oppure
   «Non so») e «Trattamento delle superfici» (macchie, muffa, odore: l'intonaco resta). Edificio vincolato: niente
   demolizione automatica, solo il trattamento; il resto «da quantificare». La causa (barriera, infiltrazioni,
   impermeabilizzazioni…) è sempre «da quantificare»: mai 0 €, mai nel subtotale.
   Superfici muro per muro: danno visibile (lunghezza × altezza) e superficie di intervento ipotizzata (sopra il danno
   la fascia `oltre`; attorno a una macchia il `bordo`). La conferma Fabri al sopralluogo.
   Voci in quattro modi (revisione di Gian, 15/10): sicure (nel totale); «da verificare» (nel totale, con l'avviso:
   le conferma Fabri); lavori in più (fuori dal totale finché il cliente non li sceglie); «da quantificare» (mai 0 €).
   Ingresso (static/js/percorsi.js): { versione: 1, zona, antico, vincolato, lato, piano, punto, segni, peggiora,
   perdite, muri: [{ tipo, modo, l, h, altro }], muro, crepeM, spigoli, rivestimento, provato, uso, riscaldato,
   condensa, ostacoli, preseN, passaggi, pianoN, ascensore, distanza, deposito, finitura, opzioni }.
--------------------------------------------------------------------------- */
const NOME_MURO = { ...NOME_STANZA, cantina: 'Cantina', esterno: 'Muro esterno' };
function risanamentoDettagliato(v, t) {
	const lav = t.lavoro;
	const mat = t.materiali;
	const op = t.opzioni;
	const lista = (x) => (Array.isArray(x) ? x : []);
	const muri = lista(v.muri)
		.filter((x) => x && typeof x === 'object')
		.slice(0, 20);
	if (!muri.length) return { vuoto: true, messaggio: 'Aggiungi almeno un muro.', dettaglio: '', comprende: [], esclude: [], riepilogo: '' };
	const segni = lista(v.segni);
	const ostacoli = lista(v.ostacoli);
	const punto = lista(v.punto);
	const peggiora = lista(v.peggiora);
	const scelte = lista(v.opzioni);
	const provato = lista(v.provato).filter((x) => x !== 'no');
	const nonSo = !segni.some((x) => x !== 'nonso');
	const storico = v.vincolato === true;
	const debole = segni.includes('sbriciola');
	const crepe = segni.includes('crepe');
	const ripristino = !storico && (nonSo || segni.includes('intonaco') || segni.includes('sali') || debole);
	const finitura = ['pronto', 'pitturato', 'decidere'].includes(v.finitura) ? v.finitura : 'decidere';
	const pittura = finitura !== 'pronto';
	// le voci per gruppo, nell'ordine in cui si vedono
	const G = { lavoro: [], materiali: [], attrezzatura: [], logistica: [], piu: [] };
	const L = (nome, q, a, b, x) => G.lavoro.push(voce('Manodopera', nome, q, a, b, x));
	const M = (nome, q, a, b) => G.materiali.push(voce('Materiali', nome, q, a, b));
	const S = (nome, q, a, b, x) => G.logistica.push(voce('Rifiuti e logistica', nome, q, a, b, x));
	const verifica = { verifica: true }; // nel totale, con l'avviso: decide Fabri al sopralluogo
	const opzioni = []; // lavori in più che il cliente può scegliere (fuori dal totale finché non li sceglie)
	const ipotesi = [];
	const daVerificare = [];
	const daQuantificare = [];
	const pz = (n, uno, piu) => `${euro(n)} ${n === 1 ? uno : piu}`;

	// superfici, muro per muro
	const oltre = fra(num(t.oltre, 50), 0, 200) / 100;
	const bordo = fra(num(t.bordo, 20), 0, 100) / 100;
	let danno = 0;
	let area = 0;
	let fascia = 0; // metri lineari di fascia (battiscopa, zoccolatura)
	let resto = 0; // m² del resto delle pareti interne (opzione: pittura senza stacchi)
	let hInter = 0; // altezza di intervento più alta (paraspigoli)
	let stimate = 0;
	let doppi = 0;
	let esterni = 0; // m² sui muri esterni
	let altezza = 0; // il punto più alto da raggiungere sui muri esterni
	for (const x of muri) {
		let l = fra(num(x.l, 0), 0, 50);
		let h = fra(num(x.h, 0), 0, 10);
		const macchia = x.modo === 'macchia';
		if (x.modo === 'nonso' || !l || !h) {
			[l, h] = [t.tipicoL, t.tipicoH];
			stimate++;
		}
		const lati = x.altro === 'si' ? 2 : 1;
		if (lati === 2) doppi++;
		const alto = macchia ? h + 2 * bordo : h + (ripristino ? oltre : bordo);
		const inter = macchia ? (l + 2 * bordo) * alto : l * alto;
		danno += l * h * lati;
		area += inter * lati;
		hInter = Math.max(hInter, alto);
		if (!macchia) fascia += l * lati;
		if (x.tipo === 'esterno') {
			esterni += inter;
			altezza = Math.max(altezza, alto);
		} else resto += Math.max(0, (macchia ? Math.max(3, l) : l) * ALTEZZA - inter) * lati;
	}
	const A = Math.round(area * 10) / 10;
	const q = m2(Math.round(A));
	const n = muri.length;
	const nMuri = pz(n, 'muro', 'muri');
	let kgMateriali = 0;

	// MANODOPERA (e i materiali che servono, in kg e litri: la posa non li comprende)
	L('Preparazione e protezione del locale', nMuri, n * lav.preparazione[0], n * lav.preparazione[1]);
	if (ostacoli.includes('mobili')) L('Spostamento e riposizionamento dei mobili', nMuri, n * lav.mobili[0], n * lav.mobili[1]);
	if (v.passaggi === true) L('Protezione di scale e passaggi comuni', 'a corpo', lav.scale[0], lav.scale[1]);
	if (ostacoli.includes('fissi')) L('Smontaggio e rimontaggio di cucina, mobili fissi o sanitari', 'a corpo', lav.fissi[0], lav.fissi[1], verifica);
	if (ostacoli.includes('prese')) {
		const np = fra(Math.round(num(v.preseN, 0)), 0, 60) || n * t.preseMuro;
		if (!num(v.preseN, 0)) ipotesi.push(`Prese e placche: ${t.preseMuro} per muro (non hai indicato quante)`);
		L('Smontaggio e rimontaggio di prese e placche', pz(np, 'pezzo', 'pezzi'), np * lav.presa[0], np * lav.presa[1]);
	}
	if (ostacoli.includes('termosifoni')) L('Smontaggio e rimontaggio dei termosifoni', 'a corpo', lav.termosifoni[0], lav.termosifoni[1]);
	if (ripristino && (v.rivestimento === 'tutto' || v.rivestimento === 'parte')) {
		const r = v.rivestimento === 'tutto' ? A : A / 2;
		L('Rimozione di rivestimenti o contropareti', m2(Math.round(r)), r * lav.rivestimenti[0], r * lav.rivestimenti[1]);
		if (v.rivestimento === 'parte') ipotesi.push('Rivestimento su metà della superficie di intervento');
	}
	if (v.rivestimento === 'nonso') daVerificare.push('Rivestimenti o contropareti sopra il muro: da verificare');
	if (ripristino) L('Rimozione dell’intonaco degradato (fino a 2 cm)', q, A * lav.rimozione[0], A * lav.rimozione[1]);
	L(ripristino ? 'Pulizia e preparazione della muratura' : 'Pulizia e preparazione della superficie', q, A * lav.pulizia[0], A * lav.pulizia[1]);
	if (segni.includes('sali')) L('Spazzolatura dei sali superficiali (depositi bianchi)', q, A * lav.sali[0], A * lav.sali[1]);
	if (crepe) {
		const m = fra(num(v.crepeM, 0), 0, 200) || n * t.crepeMuro;
		if (!num(v.crepeM, 0)) ipotesi.push(`Crepe: circa ${t.crepeMuro} m per muro (non hai indicato quanti metri)`);
		L('Stuccatura e risarcitura delle crepe', `${euro(Math.round(m * 10) / 10)} m`, m * lav.crepe[0], m * lav.crepe[1]);
		const kg = Math.ceil(m * mat.kgStucco);
		M('Stucco per crepe', `circa ${euro(kg)} kg`, kg * mat.stucco[0], kg * mat.stucco[1]);
	}
	let kgMalta = 0;
	if (ripristino && v.antico === 'si') {
		const g = (A * t.quotaGiunti) / 100;
		L('Ripristino di giunti e parti deteriorate', m2(Math.round(g)), g * lav.giunti[0], g * lav.giunti[1], verifica);
		ipotesi.push(`Giunti e parti deteriorate: circa il ${t.quotaGiunti}% della superficie`);
		kgMalta += g * mat.kgMalta;
	}
	if (ripristino && debole) {
		const s = Math.max(0.5, (A * t.quotaScuci) / 100);
		L('Scuci-cuci dei mattoni deteriorati', m2(Math.round(s * 10) / 10), s * lav.scuci[0], s * lav.scuci[1], verifica);
		ipotesi.push(`Mattoni da ripristinare: circa il ${t.quotaScuci}% della superficie`);
		kgMalta += s * mat.kgMalta;
		L('Fondo consolidante sulla muratura debole', q, A * lav.consolidante[0], A * lav.consolidante[1]);
		const lt = Math.ceil(A / (mat.resaConsolidante || 6));
		M('Fondo consolidante', `circa ${pz(lt, 'litro', 'litri')}`, lt * mat.consolidante[0], lt * mat.consolidante[1]);
	}
	if (kgMalta) {
		const kg = Math.ceil(kgMalta);
		M('Malta per ripristini', `circa ${euro(kg)} kg`, kg * mat.malta[0], kg * mat.malta[1]);
		kgMateriali += kg;
	}
	let kgMacerie = 0;
	if (ripristino) {
		const cm = fra(num(t.spessore, 2), 1, 6);
		const piu = ['pietra', 'misto'].includes(v.muro) ? 1 : 0;
		const calce = scelte.includes('calce') && v.antico === 'si';
		if (segni.includes('sali')) L('Trattamento antisale', q, A * lav.antisale[0], A * lav.antisale[1]);
		L('Rinzaffo', q, A * lav.rinzaffo[0], A * lav.rinzaffo[1]);
		const rete = debole || crepe || v.muro === 'misto';
		if (rete) L('Posa della rete porta intonaco', q, A * lav.rete[0], A * lav.rete[1]);
		if (!calce) {
			L(`Intonaco risanante, spessore ${cm} cm`, q, A * lav.risanante[0], A * lav.risanante[1]);
			if (piu) L(`Spessore aggiuntivo, ${piu} cm (muro ${v.muro === 'pietra' ? 'in pietra' : 'misto'})`, q, A * piu * lav.spessoreCm[0], A * piu * lav.spessoreCm[1]);
		}
		const spigoli = fra(Math.round(num(v.spigoli, 0)), 0, 40);
		if (spigoli) {
			const m = Math.ceil(spigoli * hInter * 10) / 10;
			L(`Posa dei paraspigoli (${pz(spigoli, 'angolo', 'angoli')})`, `${euro(m)} m`, m * lav.spigoli[0], m * lav.spigoli[1]);
			M('Paraspigoli', `${euro(m)} m`, m * mat.spigoli[0], m * mat.spigoli[1]);
		}
		L('Rasatura compatibile', q, A * lav.rasatura[0], A * lav.rasatura[1]);
		if (pittura) L('Pittura traspirante compatibile, due mani', q, A * lav.pittura[0], A * lav.pittura[1]);
		if (ostacoli.includes('battiscopa') && fascia) {
			const f = Math.round(fascia);
			L('Rimozione e riposa del battiscopa', `${euro(f)} m`, fascia * lav.battiscopa[0], fascia * lav.battiscopa[1]);
			L('Battiscopa nuovo, se quello vecchio si rompe', `${euro(f)} m`, fascia * lav.battiscopaNuovo[0], fascia * lav.battiscopaNuovo[1], verifica);
		}
		if (ostacoli.includes('piastrelle')) L('Ritocco di piastrelle o fughe vicine', 'a corpo', lav.piastrelle[0], lav.piastrelle[1], verifica);
		L('Movimentazione e insacco delle macerie', q, A * lav.macerie[0], A * lav.macerie[1]);
		// materiali
		if (segni.includes('sali')) {
			const lt = Math.ceil(A * mat.lAntisale);
			M('Prodotto antisale', `circa ${pz(lt, 'litro', 'litri')}`, lt * mat.antisale[0], lt * mat.antisale[1]);
		}
		const kgR = Math.ceil(A * mat.kgRinzaffo);
		M('Malta da rinzaffo', `circa ${euro(kgR)} kg`, kgR * mat.rinzaffo[0], kgR * mat.rinzaffo[1]);
		if (rete) {
			const r = Math.ceil(A * 1.1);
			M('Rete porta intonaco', m2(r), r * mat.rete[0], r * mat.rete[1]);
		}
		const kgI = calce ? 0 : Math.ceil(A * mat.kgRisanante * (cm + piu));
		if (kgI) M('Intonaco risanante', `circa ${euro(kgI)} kg`, kgI * mat.risanante[0], kgI * mat.risanante[1]);
		const kgS = Math.ceil(A * mat.kgRasante);
		M('Rasante compatibile', `circa ${euro(kgS)} kg`, kgS * mat.rasante[0], kgS * mat.rasante[1]);
		kgMateriali += kgR + kgI + kgS;
		kgMacerie = A * t.rifiuti.kgMq + (v.rivestimento === 'tutto' ? A : v.rivestimento === 'parte' ? A / 2 : 0) * t.rifiuti.kgRivestimenti;
		// lavori in più (opzioni)
		if (fascia) {
			const z = Math.round(fascia * (num(op.zoccoloH, 30) / 100) * 10) / 10;
			opzioni.push(voce('Lavori in più', `Zoccolatura intonacata, alta ${num(op.zoccoloH, 30)} cm (da valutare: non è una protezione automatica)`, m2(z), z * op.zoccolo[0], z * op.zoccolo[1], { chiave: 'zoccolo' }));
		}
		if (v.antico === 'si') opzioni.push(voce('Lavori in più', 'Intonaco a calce compatibile con l’edificio antico, al posto del risanante (materiali compresi)', q, A * op.calce[0], A * op.calce[1], { chiave: 'calce' }));
	} else {
		if (segni.includes('muffa')) L('Trattamento superficiale della muffa', q, A * lav.muffa[0], A * lav.muffa[1]);
		L('Fondo traspirante', q, A * lav.fondo[0], A * lav.fondo[1]);
		if (pittura) L('Pittura traspirante compatibile, due mani', q, A * lav.pittura[0], A * lav.pittura[1]);
	}
	if (pittura) {
		const lt = Math.ceil(((A * 2) / (mat.resaPittura || 7)) * 1.1);
		M('Pittura traspirante compatibile', `circa ${pz(lt, 'litro', 'litri')}`, lt * mat.pittura[0], lt * mat.pittura[1]);
		if (resto >= 1) opzioni.push(voce('Lavori in più', 'Pittura del resto della parete, per non vedere stacchi (materiali compresi)', m2(Math.round(resto)), resto * op.parete[0], resto * op.parete[1], { chiave: 'parete' }));
	}
	G.materiali.push(voce('Materiali', 'Materiali di consumo*', `${q} lavorati`, Math.max(A * t.consumo.mq[0], t.consumo.minimo[0]), Math.max(A * t.consumo.mq[1], t.consumo.minimo[1])));
	const gg = fra(Math.round(num(op.giorni, 14)), 1, 90);
	if (ripristino) opzioni.push(voce('Lavori in più', 'Noleggio del deumidificatore: aiuta l’asciugatura, i tempi non sono garantiti', pz(gg, 'giorno', 'giorni'), gg * op.deumidificatore[0], gg * op.deumidificatore[1], { chiave: 'deumidificatore' }));

	// ATTREZZATURA: muri esterni in alto, la stessa degli esterni dell'imbiancatura
	if (esterni) attrezzatura(G.attrezzatura, ipotesi, esterni, altezza, Math.max(1, Math.ceil(esterni / (t.resaGiorno || 8))), tariffe.imbiancatura.esterni);

	// RIFIUTI E LOGISTICA
	if (kgMacerie) {
		const kg = Math.ceil(kgMacerie / 10) * 10;
		S('Trasporto e conferimento delle macerie', `circa ${euro(kg)} kg`, t.rifiuti.viaggio[0] + kg * t.rifiuti.kg[0], t.rifiuti.viaggio[1] + kg * t.rifiuti.kg[1]);
		const bb = Math.max(1, Math.ceil(kg / (t.rifiuti.kgBigBag || 800)));
		S('Big bag e sacchi per le macerie', pz(bb, 'big bag', 'big bag'), bb * t.rifiuti.bigbag[0], bb * t.rifiuti.bigbag[1]);
	}
	const acqua = v.zona === 'venezia' || v.zona === 'isole';
	const kgTot = kgMacerie + kgMateriali;
	if (acqua) {
		const viaggi = kgTot > 300 ? 3 : 2;
		S('Trasporto via acqua (barca)', pz(viaggi, 'viaggio', 'viaggi'), viaggi * t.barca[0], viaggi * t.barca[1]);
		S('Approdo e scarico dalla barca', pz(viaggi, 'viaggio', 'viaggi'), viaggi * t.approdo[0], viaggi * t.approdo[1]);
		const metri = { vicino: 25, medio: 120, lontano: 250 }[v.distanza];
		if (metri) {
			const ore = Math.max(1, Math.ceil((kgTot / (t.kgOra || 400)) * (1 + metri / 100)));
			S(`Trasporto a mano fino al cantiere (circa ${metri} m)`, pz(ore, 'ora', 'ore'), ore * t.oraMano[0], ore * t.oraMano[1]);
		} else daQuantificare.push('Trasporto a mano: distanza dall’approdo da verificare (ponti, scale, calli)');
		if (v.deposito === 'no') daQuantificare.push('Permesso di suolo pubblico in calle (big bag, deposito)');
		if (peggiora.includes('acquaalta') || ['sotto', 'terra'].includes(v.piano)) daVerificare.push('Con l’acqua alta il cantiere si può fermare: eventuali giorni persi da verificare');
	}
	if (v.deposito === 'no') S('Deposito del materiale', 'a corpo', t.deposito[0], t.deposito[1]);
	const piano = fra(Math.round(num(v.pianoN, 0)), 0, 30);
	if (piano >= 2 && v.ascensore !== true) S('Supplemento per piani senza ascensore', `${piano}° piano`, (piano - 1) * t.piano[0], (piano - 1) * t.piano[1]);
	S('Pulizia di fine lavoro', 'compresa', 0, 0, { compresa: true });

	// lavori in più scelti dal cliente: nel totale; gli altri restano a parte, con il prezzo
	for (const o of opzioni) if (scelte.includes(o.chiave)) G.piu.push(o);
	const nonScelte = opzioni.filter((o) => !scelte.includes(o.chiave));
	const voci = [...G.lavoro, ...G.materiali, ...G.attrezzatura, ...G.logistica, ...G.piu];

	// IPOTESI (quello che abbiamo supposto per fare il conto)
	ipotesi.unshift(
		ripristino
			? 'Ripristino dell’intonaco: rimozione, preparazione, intonaco risanante e finitura'
			: 'Trattamento delle superfici: pulizia, trattamento e pittura, con l’intonaco che resta'
	);
	if (nonSo) ipotesi.push('Non sai ancora cosa noti: abbiamo contato il ripristino dell’intonaco');
	if (ripristino) ipotesi.push(`Superficie di intervento: ${String(Math.round(oltre * 100))} cm oltre il danno visibile (alcuni sistemi chiedono fino a 1 m: lo confermiamo dopo il sopralluogo)`);
	else if (!storico) ipotesi.push('L’intonaco può restare: se al sopralluogo è degradato, va rifatto e il preventivo cambia');
	if (stimate) ipotesi.push(`Misure stimate per ${stimate === n ? (n === 1 ? 'il muro' : 'tutti i muri') : pz(stimate, 'muro', 'muri')}: fascia di ${String(t.tipicoL).replace('.', ',')} × ${String(t.tipicoH).replace('.', ',')} m`);
	if (doppi) ipotesi.push('Stessa misura anche dall’altro lato del muro');
	if (finitura === 'decidere') ipotesi.push('Finitura: abbiamo contato anche la pittura (hai detto «da decidere»)');
	if (scelte.includes('calce') && ripristino && v.antico === 'si') ipotesi.push('Intonaco a calce al posto del risanante, come hai scelto');
	ipotesi.push('Materiali forniti da noi, tutti dello stesso sistema: prodotti compatibili tra loro');
	if (voci.some((x) => x.verifica)) ipotesi.push('Le voci «da verificare» sono nel totale: dopo il sopralluogo Fabri le conferma o le toglie');

	// DA QUANTIFICARE (non compreso nel subtotale, mai 0 €)
	daQuantificare.unshift('Intervento sulla causa dell’umidità, dopo la verifica (barriera, riparazione di infiltrazioni, ventilazione o altro)');
	if (punto.includes('basso') || punto.includes('controterra') || ['sotto', 'terra'].includes(v.piano)) daQuantificare.push('Eventuale barriera contro la risalita: prodotto e fori, al metro, dopo la verifica dello spessore del muro');
	if (v.perdite === 'presente' || segni.includes('bagnato')) daQuantificare.push('Riparazione della perdita o dell’infiltrazione');
	if (punto.includes('controterra')) daQuantificare.push('Impermeabilizzazione del muro contro terra');
	if (ripristino) daQuantificare.push('Misure dell’umidità prima e dopo il lavoro, da concordare prima');
	if (segni.includes('sali') || v.antico === 'si') daQuantificare.push('Analisi dei sali, da concordare prima');
	if (v.antico === 'si' && (v.muro === 'nonso' || !v.muro)) daQuantificare.push('Piccolo saggio per vedere com’è fatto il muro, da concordare prima');
	if (v.antico === 'si' && ripristino) daQuantificare.push('Eventuali consolidamenti della muratura');
	if (storico) daQuantificare.push('Lavorazioni sulle superfici storiche (intonaci da conservare) ed eventuale ripristino dell’intonaco');

	// DA VERIFICARE
	if (v.perdite === 'presente') daVerificare.push('La perdita va riparata prima del ripristino');
	if (peggiora.includes('acquaalta')) daVerificare.push('Acqua alta e risalita sono fenomeni diversi: li distinguiamo al sopralluogo');
	if (segni.includes('sali') || v.antico === 'si') daVerificare.push('Sali e murature antiche vanno valutati: una sola misura con lo strumento non basta a stabilire la causa');
	if (segni.includes('muffa') && (v.condensa === true || v.riscaldato === 'no' || v.uso === 'stagionale' || v.uso === 'vuoto')) daVerificare.push('La muffa può dipendere da condensa e ventilazione: lo verifichiamo prima di scegliere i prodotti');
	if (provato.length) daVerificare.push('Il problema è già tornato dopo un intervento: verifichiamo perché, prima di rifare');
	if (v.antico === 'si' && !storico) daVerificare.push('Edificio antico: valutiamo insieme cosa conservare degli intonaci');
	if (scelte.includes('deumidificatore')) daVerificare.push('Il deumidificatore aiuta l’asciugatura, ma i tempi dipendono dal muro e dalla stagione: non sono garantiti');
	daVerificare.push('Il sopralluogo è gratuito; eventuali analisi aggiuntive le concordiamo prima');
	daVerificare.push('IVA al 10% ipotizzata: l’aliquota si conferma secondo intervento, immobile e fornitura');

	const dove = [...new Set(muri.map((x) => NOME_MURO[x.tipo]).filter(Boolean))].join(', ');
	return chiudiVoci(voci, t.minimoLavoro, {
		ipotesi,
		daVerificare,
		daComprare: [],
		daQuantificare,
		opzioni: nonScelte,
		consumo: 'teli, nylon, nastro, cartone, sacchi piccoli, spazzole e dischi abrasivi',
		titoloStima: 'Stima del ripristino delle superfici',
		dettaglio: `Danno visibile circa ${m2(Math.round(danno))}, intervento ipotizzato circa ${q}. Comprende le lavorazioni elencate. Gli eventuali interventi sulla causa dell’umidità sono da verificare e non sono compresi.`,
		riepilogo: `Risanamento umidità (${ripristino ? 'ripristino dell’intonaco' : 'trattamento delle superfici'}): ${nMuri}${dove ? ` (${dove.toLowerCase()})` : ''}, danno visibile ${m2(Math.round(danno))}, intervento ipotizzato ${q}.`
	});
}

/* ---------------------------------------------------------------------------
   FALEGNAMERIA, GRUPPO A (15/10/2026, Gian + revisione ChatGPT): riparazioni e piccoli lavori.
   Il cliente dice cosa (anta, cassetto, porta, tapparella…), che problema ha e quanti sono: il calcolo propone la
   lavorazione, senza addebiti doppi (la sostituzione di una cerniera comprende la sua regolazione). Uscita una volta
   per appuntamento; minimo su uscita + manodopera (soglia), ricambi e consumi a parte. Ricambi separati: «da
   verificare» per i modelli semplici, «da quantificare» quando il modello va scelto o identificato. «Non so» o una
   parte rotta da rifare: mai ore a forfait, «da quantificare». Se manca una lavorazione necessaria il titolo è
   «Subtotale delle lavorazioni stimabili».
   Ingresso (static/js/percorsi.js): { versione: 1, lavori: [{ tipo, problema, n, ricambio, descr }], zona, dove }.
--------------------------------------------------------------------------- */
const OGGETTI_FAL = {
	anta: ['Anta di mobile', 'ante di mobili'],
	cassetto: ['Cassetto', 'cassetti'],
	mobile: ['Mobile, tavolo o letto', 'mobili'],
	porta: ['Porta interna', 'porte interne'],
	scorrevole: ['Anta o porta scorrevole', 'ante scorrevoli'],
	finestra: ['Finestra o scuro', 'finestre o scuri'],
	tapparella: ['Tapparella', 'tapparelle'],
	zanzariera: ['Zanzariera', 'zanzariere'],
	altro: ['Altro', 'altri lavori']
};
// oggetto.problema → [lavoro, lavorazione, unità, unità al plurale, ricambio ('?' = da identificare), da verificare]
// lavoro null = da quantificare (si vede prima di fare)
const CATALOGO_FAL = {
	'anta.regola': ['antaRegola', 'regolazione', 'anta', 'ante'],
	'anta.cerniera': ['cerniera', 'sostituzione della cerniera, regolazione compresa', 'cerniera', 'cerniere', 'cerniera'],
	'anta.supporto': ['cernieraSupporto', 'ripristino del fissaggio della cerniera', 'cerniera', 'cerniere', 'cerniera', true],
	'anta.maniglia': ['manigliaMobile', 'montaggio di maniglia o pomolo', 'maniglia', 'maniglie', '?'],
	'cassetto.scorre': ['cassettoRegola', 'pulizia e regolazione', 'cassetto', 'cassetti'],
	'cassetto.guide': ['guide', 'sostituzione delle guide (coppia)', 'cassetto', 'cassetti', 'guide'],
	'cassetto.frontale': ['frontale', 'frontale da rifissare', 'cassetto', 'cassetti'],
	'cassetto.maniglia': ['manigliaMobile', 'montaggio di maniglia o pomolo', 'maniglia', 'maniglie', '?'],
	'mobile.instabile': ['instabile', 'consolidamento delle giunzioni', 'pezzo', 'pezzi', null, true],
	'mobile.staccata': ['staccata', 'parte staccata da rincollare o fissare', 'pezzo', 'pezzi', null, true],
	'mobile.cigola': ['cigola', 'controllo e serraggio', 'letto', 'letti'],
	'mobile.ripiano': ['ripiano', 'fissaggio del ripiano o dei supporti', 'ripiano', 'ripiani'],
	'mobile.rotta': [null, 'parte rotta da rifare'],
	'porta.regola': ['portaRegola', 'regolazione', 'porta', 'porte'],
	'porta.striscia': ['piallatura', 'smontaggio, piallatura del bordo e rimontaggio', 'porta', 'porte', null, true],
	'porta.serratura': ['serratura', 'sostituzione della serratura', 'porta', 'porte', 'serratura'],
	'porta.maniglia': ['manigliaPorta', 'sostituzione delle maniglie (coppia, due lati)', 'coppia', 'coppie', '?'],
	'porta.cerniera': ['cernieraPorta', 'sostituzione della cerniera', 'cerniera', 'cerniere', 'cernieraPorta'],
	'scorrevole.regola': ['scorrevoleRegola', 'regolazione', 'anta', 'ante'],
	'scorrevole.ruote': ['ruote', 'sostituzione di ruote o binario', 'anta', 'ante', '?'],
	'scorrevole.scomparsa': [null, 'porta a scomparsa nel muro che non scorre'],
	'finestra.regola': ['finestraRegola', 'regolazione', 'anta', 'ante'],
	'finestra.guarnizione': ['guarnizione', 'sostituzione delle guarnizioni', 'm', 'm', 'guarnizione', true],
	'finestra.ferramenta': [null, 'ferramenta rotta'],
	'tapparella.cinghia': ['cinghia', 'sostituzione della sola cinghia', 'tapparella', 'tapparelle', 'cinghia'],
	'tapparella.avvolgitore': ['avvolgitore', 'sostituzione di cinghia e avvolgitore', 'tapparella', 'tapparelle', 'avvolgitore'],
	'tapparella.stecche': ['stecche', 'sostituzione delle stecche rotte', 'tapparella', 'tapparelle', '?', true],
	'tapparella.blocca': ['tapparellaBlocca', 'verifica e sblocco di rullo o guide', 'tapparella', 'tapparelle', '?', true],
	'tapparella.motore': [null, 'tapparella motorizzata che non va (parte elettrica)'],
	'zanzariera.regola': ['zanzarieraRegola', 'regolazione', 'zanzariera', 'zanzariere'],
	'zanzariera.rete': ['zanzarieraRete', 'sostituzione della rete', 'zanzariera', 'zanzariere', 'rete'],
	'zanzariera.meccanismo': [null, 'meccanismo rotto'],
	'altro.fissare': ['fissare', 'da fissare o regolare', 'pezzo', 'pezzi', null, true],
	'altro.rotta': [null, 'parte rotta']
};
const NOME_RICAMBIO = { cerniera: 'cerniere per mobili', guide: 'guide per cassetti (coppie)', serratura: 'serrature', cernieraPorta: 'cerniere per porte', cinghia: 'cinghie', avvolgitore: 'cinghie e avvolgitori', guarnizione: 'guarnizione (al metro)', rete: 'reti per zanzariere' };
function falegnameriaDettagliata(v, t) {
	const lavori = (Array.isArray(v.lavori) ? v.lavori : []).filter((x) => x && typeof x === 'object' && OGGETTI_FAL[x.tipo]).slice(0, 30);
	if (!lavori.length) return { vuoto: true, messaggio: 'Aggiungi almeno un lavoro.', dettaglio: '', comprende: [], esclude: [], riepilogo: '' };
	const G = { uscita: [], lavoro: [], ricambi: [], materiali: [] };
	const ipotesi = [];
	const daVerificare = [];
	const daQuantificare = [];
	const verifica = { verifica: true };
	let stimabili = 0;
	let ricambioCliente = false;
	let casa = false; // porte, finestre, tapparelle, zanzariere: l'IVA potrebbe essere al 10%
	const descr = (x) => (x.tipo === 'altro' && typeof x.descr === 'string' && x.descr.trim() ? x.descr.trim().slice(0, 60) : OGGETTI_FAL[x.tipo][0]);
	for (const x of lavori) {
		const voce_ = CATALOGO_FAL[`${x.tipo}.${x.problema}`];
		const n = fra(Math.round(num(x.n, 1)) || 1, 1, 30);
		if (['porta', 'scorrevole', 'finestra', 'tapparella', 'zanzariera'].includes(x.tipo)) casa = true;
		if (!voce_ || !voce_[0]) {
			daQuantificare.push(`${descr(x)}${n > 1 ? ` (${n})` : ''}: ${voce_ ? voce_[1] : 'problema da vedere'}. Lo valutiamo e ti diciamo il costo prima di procedere`);
			continue;
		}
		const [lav, nome, uno, piu, ric, ver] = voce_;
		stimabili++;
		const q = lav === 'guarnizione' ? n * (t.metriGuarnizione || 5) : n;
		const quantita = lav === 'guarnizione' ? `${euro(q)} m, ${n} ${n === 1 ? 'anta' : 'ante'}` : `${n} ${n === 1 ? uno : piu}`;
		const p = t.lavoro[lav];
		G.lavoro.push(voce('Manodopera', `${descr(x)}: ${nome}`, quantita, q * p[0], q * p[1], ver ? verifica : {}));
		if (!ric) continue;
		if (x.ricambio === 'ho') {
			ricambioCliente = true;
			continue;
		}
		if (ric === '?') {
			daQuantificare.push(`Ricambio per ${descr(x).toLowerCase()}: modello da scegliere o identificare. Non compreso nel subtotale: te lo comunichiamo prima dell’acquisto`);
			continue;
		}
		const r = t.ricambi[ric];
		G.ricambi.push(voce('Ricambi', `Ricambio previsto: ${NOME_RICAMBIO[ric]}`, lav === 'guarnizione' ? `${euro(q)} m` : `${n} ${n === 1 ? 'pezzo' : 'pezzi'}`, q * r[0], q * r[1], verifica));
	}
	if (!stimabili) return { valutazione: true, messaggio: 'I lavori indicati vanno visti prima: ti diciamo il costo dopo la verifica.', dettaglio: '', comprende: [], esclude: [], riepilogo: `Falegnameria (riparazioni): ${lavori.length} ${lavori.length === 1 ? 'lavoro' : 'lavori'} da vedere.` };
	G.uscita.push(voce('Uscita', 'Uscita, conteggiata una sola volta', 'a corpo', t.uscita[0], t.uscita[1]));
	G.materiali.push(voce('Materiali', 'Materiali di consumo*', 'per l’appuntamento', t.consumo[0], t.consumo[1]));
	const voci = [...G.uscita, ...G.lavoro, ...G.ricambi, ...G.materiali];
	// minimo: uscita + manodopera almeno t.minimo (soglia, una volta sola); ricambi e consumi a parte
	const base = [...G.uscita, ...G.lavoro].reduce((s, r) => [s[0] + r.min, s[1] + r.max], [0, 0]);
	if (base[0] < t.minimo) voci.push(voce('Minimo d’intervento', 'Adeguamento al minimo d’intervento', `uscita e lavoro almeno ${euro(t.minimo)} € + IVA`, t.minimo - base[0], Math.max(0, t.minimo - base[1]), { soglia: true }));

	// IPOTESI
	ipotesi.push('La stima prevede fissaggi integri e componenti compatibili con quelli esistenti. Eventuali adattamenti o riparazioni del supporto li concordiamo prima');
	ipotesi.push('La stima prevede un accesso. Se occorre ordinare un ricambio o lavorare in laboratorio, concordiamo prima eventuali costi e un nuovo appuntamento');
	if (ricambioCliente) ipotesi.push('Possiamo usare il ricambio che hai già, dopo averne verificato la compatibilità. Eventuali adattamenti li concordiamo prima');
	if (G.ricambi.length) ipotesi.push('Ricambi previsti per modelli semplici e compatibili: il prezzo esatto lo confermiamo quando vediamo il pezzo');
	if (voci.some((x) => x.verifica)) ipotesi.push('Le voci «da verificare» sono nel totale, calcolate sull’ipotesi indicata: Fabri le conferma dopo la verifica');
	// DA VERIFICARE
	if (v.zona === 'venezia' || v.zona === 'isole') daVerificare.push('Venezia e isole: l’eventuale trasporto via acqua lo concordiamo (per piccoli attrezzi spesso non serve)');
	daVerificare.push('L’uscita serve a eseguire i lavori: non è il sopralluogo gratuito. Cosa si paga se un lavoro non si può fare lo concordiamo prima');
	daVerificare.push(`IVA al 22% ipotizzata${casa ? ': per porte, finestre e tapparelle di casa potrebbe essere al 10%, lo conferma il commercialista' : ''}`);

	const nL = lavori.length;
	const completo = !daQuantificare.some((x) => !x.startsWith('Ricambio'));
	return chiudiVoci(voci, 0, {
		ipotesi,
		daVerificare,
		daComprare: [],
		daQuantificare,
		consumo: 'viti, tasselli, colla, cera, abrasivi',
		titoloStima: completo ? 'Stima delle riparazioni' : 'Subtotale delle lavorazioni stimabili',
		dettaglio: `Hai indicato ${nL} ${nL === 1 ? 'lavoro' : 'lavori'} da eseguire nello stesso appuntamento: l’uscita si conta una sola volta. Prima del lavoro confermiamo interventi, ricambi e prezzo; nessun lavoro in più senza la tua approvazione.`,
		riepilogo: `Falegnameria (riparazioni): ${lavori.map((x) => `${descr(x).toLowerCase()} ×${fra(Math.round(num(x.n, 1)) || 1, 1, 30)}`).join(', ')}.`
	});
}

/** Totali (somma delle voci, senza IVA) con il minimo come soglia; testi per il server e per Fabri */
function chiudiVoci(voci, minimo, extra) {
	let min = voci.reduce((x, r) => x + r.min, 0);
	let max = voci.reduce((x, r) => x + r.max, 0);
	if (min < minimo) {
		// il minimo è una soglia: porta il totale al minimo, non si somma per intero (soglia: «fino a …» nel riepilogo)
		const a = minimo - min;
		const b = Math.max(0, minimo - max);
		voci.push(voce('Minimo d’intervento', 'Adeguamento al minimo d’intervento', `il lavoro costa almeno ${euro(minimo)} € + IVA`, a, b, { soglia: true }));
		min = voci.reduce((x, r) => x + r.min, 0);
		max = Math.max(min, voci.reduce((x, r) => x + r.max, 0));
	}
	const righe = voci.map((r) => `${r.nome}${r.quantita ? ` (${r.quantita})` : ''}${r.verifica ? ' [da verificare]' : ''}: ${r.compresa ? 'compresa' : r.soglia ? `fino a ${euro(r.min)} €` : `${euro(r.min)}–${euro(r.max)} €`}`);
	return {
		min,
		max,
		voci,
		consumo: 'carta, nylon, nastro di carta, carta abrasiva, sacchi per i residui',
		comprende: righe,
		esclude: ['Opere murarie e impianti', 'Cause dell’umidità', ...extra.daComprare.map((x) => `Da comprare dal cliente: ${x}`), ...(extra.daQuantificare ?? []).map((x) => `Da quantificare: ${x}`), ...(extra.opzioni ?? []).map((x) => `Lavoro in più non scelto: ${x.nome} (${euro(x.min)}–${euro(x.max)} €)`)],
		...extra
	};
}

/** Stima per il preventivo guidato, IVA inclusa (ipotesi per i privati). */
export function calcola(tipo, v) {
	const r = calcolaNetto(tipo, v);
	if (r.min && r.voci) {
		// voce per voce: le voci sono senza IVA, il totale con l'IVA (arrotondato a 10 €)
		const k = 1 + (iva[tipo] ?? 0.22);
		r.nettoMin = r.min;
		r.nettoMax = r.max;
		r.min = dieci(r.min * k);
		r.max = dieci(r.max * k);
		r.ivaPerc = Math.round((k - 1) * 100);
		return r;
	}
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
const prezzoDaBagno = () => calcolaBagno({ intervento: 'rinnovo', misura: 'piccolo', doccia: 'doccia', pareti: 'meta', disposizione: 'uguale', livello: 'base', dove: 'terraferma' }).nettoMin;
aPartireDa.ristrutturazioni.euro = prezzoDaBagno();

/* ---------------------------------------------------------------------------
   REVISIONI (backend, Fase 1)
   Le formule restano qui; i numeri (tariffe, IVA, bagno, prezzi "da") sono i "parametri" di una revisione.
   Il server ricalcola ogni stima con i parametri della revisione pubblicata, usando queste stesse funzioni.
   versioneFormule: da aumentare quando si cambia il modo di calcolare (non quando cambiano i numeri).
--------------------------------------------------------------------------- */
export const versioneFormule = 6; // falegnameria gruppo A voce per voce; 15/10: imbiancatura voce per voce (le scelte vecchie come prima); esterni con l'attrezzatura per l'altezza; risanamento umidità voce per voce, poi con le voci in più (da verificare, lavori in più)

const copia = (x) => JSON.parse(JSON.stringify(x));
const tipoDi = (x) => (Array.isArray(x) ? 'lista' : x === null ? 'null' : typeof x);
/**
 * I parametri di una revisione con la forma di quelli del codice (15/10): le voci nuove prendono il valore scritto
 * nel codice, quelle che non esistono più si tolgono, tutto il resto resta com'era nella revisione.
 * Serve quando cambiano le formule e la revisione online è nata prima (supabase/script/pubblica/prova-uguale.mjs).
 */
export function completa(codice, rev) {
	if (tipoDi(codice) !== tipoDi(rev)) return copia(codice);
	if (Array.isArray(codice)) {
		if (rev.length !== codice.length) return copia(codice);
		return codice.map((x, i) => (x && typeof x === 'object' ? completa(x, rev[i]) : typeof x === typeof rev[i] ? rev[i] : x));
	}
	if (codice && typeof codice === 'object') return Object.fromEntries(Object.keys(codice).map((k) => [k, k in rev ? completa(codice[k], rev[k]) : copia(codice[k])]));
	return typeof rev === typeof codice ? rev : codice;
}
const sostituisci = (dove, da) => {
	// le voci che la revisione non ha ancora restano quelle di adesso (mai un prezzo che manca)
	const nuovo = completa(dove, da);
	for (const k of Object.keys(dove)) delete dove[k];
	Object.assign(dove, nuovo);
};

/** I parametri attuali (quelli scritti in questo file), da salvare in una revisione */
export const parametri = () => copia({ tariffe, iva, bagno, aPartireDa, notaMateriali });

// Mette i numeri di una revisione al posto di quelli scritti qui (il prezzo "da" del bagno si ricalcola)
function applica(p) {
	sostituisci(tariffe, p.tariffe);
	sostituisci(iva, p.iva);
	sostituisci(bagno, p.bagno);
	sostituisci(aPartireDa, p.aPartireDa);
	aPartireDa.ristrutturazioni.euro = prezzoDaBagno();
}

/** Esegue fn con i parametri di una revisione, poi rimette quelli di prima. fn deve essere sincrona. */
export function conParametri(p, fn) {
	const prima = parametri();
	try {
		if (p) applica(p);
		return fn();
	} finally {
		applica(prima);
	}
}

// Sito costruito da una revisione pubblicata: i suoi numeri valgono per tutta la pagina (consegna B)
if (datiRevisione?.parametri?.calcoli) applica(datiRevisione.parametri.calcoli);
