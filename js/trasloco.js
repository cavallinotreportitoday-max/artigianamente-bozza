// Calcolatore del trasloco: oggetti, volumi standard, tariffe e calcolo.
// Lo stesso file serve alla pagina (prima visualizzazione) e allo script nel browser (copiato in static/js).
// ATTENZIONE: tutte le tariffe sono PROVVISORIE (bozza ottobre 2026), da approvare con Fabri.
// Volumi e prezzi di mercato: vedi RICERCA-TRASLOCHI.md.

/** Tariffe nette (IVA esclusa). */
export const tt = {
	operaio: 28, // € all'ora per persona
	kmFurgone: 0.55, // € al km per furgone (gasolio, usura)
	uscita: 40, // € per furgone per giornata
	capienza: 12.5, // m³ utili per furgone (Renault Master L3H2: 13 m³)
	furgoniMax: 2,
	velocita: 45, // km/h di media, tutta la squadra viaggia
	orePerM3: 0.27, // ore-persona per caricare (o scaricare) 1 m³ a piano terra o con ascensore grande
	fisse: 0.25, // ore per persona e per lato: protezione dei pavimenti, organizzazione
	lungo: 150, // oltre questi km tra partenza e arrivo: un camion a noleggio, un solo viaggio
	camion: 35, // m³ del camion per i traslochi lunghi
	kmCamion: 0.9, // € al km del camion, pedaggi compresi
	uscitaCamion: 60,
	velocitaLunga: 75,
	margine: 0.1, // +10% di volume per gli spazi vuoti nel furgone
	piano: { no: 0.12, piccolo: 0.05, grande: 0.02, piattaforma: 0.03 }, // in più a piano, su quel lato
	porta: { vicino: 0, medio: 0.1, lontano: 0.25 },
	isola: 0.4, // isole senza auto: carrelli a mano
	ponti: { '0': 0, pochi: 0.1, molti: 0.25 },
	scatolaNoi: { materiale: 3, ore: 0.08 }, // imballo fatto da noi, a scatolone
	protezioneM3: 1.2, // € al m³ di mobili: pluriball, film, angolari (solo se imballiamo noi)
	scatolaKit: 2.5, // kit materiali per chi imballa da sé, a scatolone
	piattaforma: 220, // a lato
	barca: 380, // a viaggio, per Venezia centro storico e isole senza auto
	ferry: 70, // a furgone e viaggio (Lido, Pellestrina)
	permesso: 50, // pratica per la sosta; la tassa del Comune è a parte
	depositoM3: 9, // € al m³ al mese
	smaltimentoM3: 45, // € al m³, discarica compresa
	pedaggioKm: 0.07, // € al km in autostrada, solo per tragitti lunghi
	trasferta: 90, // € a persona per notte fuori (vitto e alloggio)
	sabato: 0.15, // in più sul lavoro
	minimo: 180,
	extraM3: 37, // oggetti in più il giorno del trasloco, al m³
	iva: 0.22,
	forbice: [0.92, 1.15] // da… a… intorno al calcolo
};

/** Magazzino di partenza dei furgoni (Via Julia, Cavallino-Treporti) */
export const magazzino = { nome: 'Cavallino-Treporti', lat: 45.45568, lon: 12.45478 };

/** Venezia: dove scaricano i furgoni e se serve la barca */
export const zoneVenezia = [
	{ id: 'terraferma', nome: 'Mestre e terraferma', lat: 45.4906, lon: 12.2381 },
	{ id: 'centro', nome: 'Centro storico', lat: 45.4383, lon: 12.3187, barca: true },
	{ id: 'giudecca', nome: 'Giudecca', lat: 45.4383, lon: 12.3187, barca: true },
	{ id: 'murano', nome: 'Murano', lat: 45.4383, lon: 12.3187, barca: true },
	{ id: 'nord', nome: 'Burano e isole a nord', lat: 45.466, lon: 12.432, barca: true }, // la barca parte da Treporti
	{ id: 'lido', nome: 'Lido', lat: 45.4383, lon: 12.3187, ferry: true, km: 6 },
	{ id: 'pellestrina', nome: 'Pellestrina', lat: 45.4383, lon: 12.3187, ferry: true, km: 18 }
];

// sm: ore-persona per smontare e rimontare. extra: € netti in più. Pochi oggetti, i più comuni (richiesta del 9/10: semplice).
export const stanze = [
	{
		id: 'soggiorno',
		nome: 'Soggiorno',
		icona: 't-divano',
		oggetti: [
			{ id: 'divano3', nome: 'Divano', m3: 2, icona: 't-divano' },
			{ id: 'divanoL', nome: 'Divano angolare', m3: 3, icona: 't-angolo', sm: 0.5 },
			{ id: 'poltrona', nome: 'Poltrona', m3: 0.8, icona: 't-poltrona' },
			{ id: 'tavolo', nome: 'Tavolo', m3: 1, icona: 't-tavolo', sm: 0.3 },
			{ id: 'sedia', nome: 'Sedia', m3: 0.25, icona: 't-sedia' },
			{ id: 'mobileTv', nome: 'Mobile TV e televisore', m3: 0.8, icona: 't-mobiletv', sm: 0.3 },
			{ id: 'libreriaG', nome: 'Libreria o vetrina', m3: 1.2, icona: 't-libreria', sm: 0.6 },
			{ id: 'credenza', nome: 'Credenza o madia', m3: 1.5, icona: 't-credenza' }
		]
	},
	{
		id: 'cucina',
		nome: 'Cucina',
		icona: 't-cucina',
		oggetti: [
			{ id: 'cucinaM', nome: 'Cucina componibile', m3: 0.8, icona: 't-cucina', sm: 1.2, unita: 'm', passo: 0.5 },
			{ id: 'frigo', nome: 'Frigorifero', m3: 1, icona: 't-frigo' },
			{ id: 'lavastoviglie', nome: 'Lavastoviglie o forno', m3: 0.5, icona: 't-lavastoviglie' },
			{ id: 'tavoloC', nome: 'Tavolo', m3: 0.8, icona: 't-tavolo', sm: 0.3 },
			{ id: 'sediaC', nome: 'Sedia', m3: 0.25, icona: 't-sedia' }
		]
	},
	{
		id: 'camera',
		nome: 'Camere',
		icona: 't-letto',
		oggetti: [
			{ id: 'lettoM', nome: 'Letto matrimoniale', m3: 2, icona: 't-letto', sm: 1 },
			{ id: 'lettoS', nome: 'Letto singolo', m3: 1, icona: 't-lettos', sm: 0.6 },
			{ id: 'armadio3', nome: 'Armadio fino a 3 ante', m3: 2, icona: 't-armadio', sm: 2.1 },
			{ id: 'armadio6', nome: 'Armadio grande', m3: 3.5, icona: 't-armadiog', sm: 3.6 },
			{ id: 'como', nome: 'Comò o cassettiera', m3: 0.8, icona: 'drawers' },
			{ id: 'comodino', nome: 'Comodino', m3: 0.2, icona: 't-comodino' },
			{ id: 'scrivania', nome: 'Scrivania', m3: 0.8, icona: 't-scrivania', sm: 0.5 }
		]
	},
	{
		id: 'bagno',
		nome: 'Bagno',
		icona: 't-bagno',
		oggetti: [
			{ id: 'bagno', nome: 'Mobili del bagno', m3: 1, icona: 't-bagno', sm: 1.5 },
			{ id: 'lavatrice', nome: 'Lavatrice o asciugatrice', m3: 0.5, icona: 't-lavatrice' }
		]
	},
	{
		id: 'esterno',
		nome: 'Esterno e garage',
		icona: 't-ombrellone',
		oggetti: [
			{ id: 'bici', nome: 'Bicicletta', m3: 0.6, icona: 't-bici' },
			{ id: 'scooter', nome: 'Moto o scooter', m3: 2.5, icona: 't-scooter', extra: 40 },
			{ id: 'giardino', nome: 'Tavolo e sedie da giardino', m3: 1.5, icona: 't-ombrellone' }
		]
	},
	{
		id: 'speciali',
		nome: 'Pianoforte e cassaforte',
		icona: 't-pianoforte',
		oggetti: [
			{ id: 'piano', nome: 'Pianoforte', m3: 1.5, icona: 't-pianoforte', extra: 150, squadra: 3 },
			{ id: 'cassaforte', nome: 'Cassaforte', m3: 0.3, icona: 't-cassaforte', extra: 60 }
		]
	}
];

export const oggetti = Object.fromEntries(stanze.flatMap((s) => s.oggetti.map((o) => [o.id, { ...o, stanza: s.id }])));

/** Scatoloni standard (misure in cm) */
export const scatole = [
	{ id: 'piccolo', nome: 'Piccolo', misure: [40, 30, 30] },
	{ id: 'medio', nome: 'Medio', misure: [50, 35, 40] },
	{ id: 'grande', nome: 'Grande', misure: [60, 40, 50] }
];
export const m3Scatola = (s) => (s.misure[0] * s.misure[1] * s.misure[2]) / 1e6;
const M3_SCATOLA_NOI = 0.07; // misura media di uno scatolone quando ci dicono solo quanti sono

/** Case tipo: un punto di partenza da correggere */
export const caseTipo = {
	mono: {
		nome: 'Monolocale',
		scatoloni: 20,
		oggetti: { divano3: 1, tavolo: 1, sedia: 2, mobileTv: 1, frigo: 1, lettoM: 1, armadio3: 1, comodino: 1, lavatrice: 1 }
	},
	bi: {
		nome: 'Bilocale',
		scatoloni: 35,
		oggetti: { divano3: 1, tavolo: 1, sedia: 4, mobileTv: 1, libreriaG: 1, cucinaM: 3, frigo: 1, lavastoviglie: 1, lettoM: 1, armadio3: 1, comodino: 2, como: 1, lavatrice: 1 }
	},
	tri: {
		nome: 'Trilocale',
		scatoloni: 50,
		oggetti: { divano3: 1, poltrona: 1, tavolo: 1, sedia: 4, mobileTv: 1, libreriaG: 1, credenza: 1, cucinaM: 3.5, frigo: 1, lavastoviglie: 1, lettoM: 1, armadio6: 1, comodino: 2, como: 1, lettoS: 1, armadio3: 1, scrivania: 1, lavatrice: 1, bici: 1 }
	},
	quattro: {
		nome: '4 o più locali',
		scatoloni: 70,
		oggetti: { divano3: 1, divanoL: 1, poltrona: 1, tavolo: 1, sedia: 6, mobileTv: 2, libreriaG: 1, credenza: 1, cucinaM: 4, frigo: 1, lavastoviglie: 2, lettoM: 1, armadio6: 1, comodino: 4, como: 2, lettoS: 2, armadio3: 2, scrivania: 1, bagno: 1, lavatrice: 2, bici: 2, giardino: 1 }
	},
	poco: { nome: 'Poche cose', scatoloni: 10, oggetti: {} }
};

export const statoIniziale = () => ({
	casa: 'bi',
	partenza: { comune: '', zona: '', piano: 1, ascensore: 'grande', porta: 'vicino', piattaforma: false },
	arrivo: { comune: '', zona: '', piano: 2, ascensore: 'grande', porta: 'vicino', piattaforma: false },
	oggetti: { ...caseTipo.bi.oggetti },
	imballo: 'noi',
	scatoloniNoi: caseTipo.bi.scatoloni,
	conMisure: false, // "+ misure": scatoloni piccoli, medi, grandi o di misura tua
	scatole: { piccolo: 0, medio: 0, grande: 0 },
	scatoleMisure: [], // { l, p, a, q } in cm
	smontaggio: true,
	permesso: false,
	deposito: 0,
	smaltimento: 0,
	giorno: 'feriale'
});

const n = (v, d = 0) => {
	const x = Number(String(v ?? '').replace(',', '.'));
	return Number.isFinite(x) && x >= 0 ? x : d;
};
const arrotonda = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
// Cifre "da listino": 73 → 75; 549 → 550; 3.960 → 4.000
const bello = (x) => (x < 20 ? Math.round(x) : x < 200 ? Math.round(x / 5) * 5 : x < 2000 ? Math.round(x / 10) * 10 : Math.round(x / 50) * 50);
export const euro = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const m3Testo = (x) => String(arrotonda(x)).replace('.', ',');

const zonaDi = (lato) => (lato?.comune === 'Venezia' ? zoneVenezia.find((z) => z.id === lato.zona) : null);

/** Quanto costa in più muovere le cose da/per quel lato (1 = piano terra, porta vicina) */
function fatica(lato) {
	const z = zonaDi(lato);
	const p = Math.round(Number(lato.piano) || 0);
	const piano = p < 0 ? 1 : p; // seminterrato: come un piano di scale
	const tipo = lato.piattaforma ? 'piattaforma' : lato.ascensore;
	let k = 1 + piano * (tt.piano[tipo] ?? tt.piano.no);
	k += tt.porta[lato.porta] ?? 0;
	if (z?.barca) k += tt.isola + (tt.ponti[lato.ponti] ?? tt.ponti.pochi); // senza risposta: 1 o 2 ponti
	return k;
}

/**
 * @param s stato del calcolatore
 * @param strada { mp, pa, am, stima } km stradali magazzino→partenza, partenza→arrivo, arrivo→magazzino
 */
export function calcolaTrasloco(s, strada) {
	const voci = [];
	const avvisi = [];
	const daValutare = [];

	// 1. Volume
	let m3Mobili = 0;
	let oreSmontaggio = 0;
	let extra = 0;
	let squadraMin = 2;
	const elenco = [];
	for (const [id, q0] of Object.entries(s.oggetti || {})) {
		const o = oggetti[id];
		const q = n(q0);
		if (!o || !q) continue;
		m3Mobili += o.m3 * q;
		if (o.sm) oreSmontaggio += o.sm * q;
		if (o.extra) extra += o.extra * q;
		if (o.squadra) squadraMin = Math.max(squadraMin, o.squadra);
		if (o.valuta) daValutare.push(o.nome.toLowerCase());
		elenco.push(`${o.nome}${o.unita === 'm' ? ` ${String(q).replace('.', ',')} m` : q > 1 ? ` ×${q}` : ''}`);
	}
	let m3Misure = 0;
	for (const r of s.misure || []) {
		const v = (n(r.l) * n(r.p) * n(r.a)) / 1e6;
		const q = n(r.q, 1);
		if (!v || !q) continue;
		m3Misure += v * q;
		elenco.push(`${r.nome || 'Oggetto'} ${n(r.l)}×${n(r.p)}×${n(r.a)} cm${q > 1 ? ` ×${q}` : ''}`);
	}
	let nScatole = 0;
	let m3Scatole = 0;
	if (!s.conMisure) {
		// di solito basta il numero: misura media di uno scatolone
		nScatole = Math.round(n(s.scatoloniNoi));
		m3Scatole = nScatole * M3_SCATOLA_NOI;
	} else {
		for (const sc of scatole) {
			const q = Math.round(n(s.scatole?.[sc.id]));
			nScatole += q;
			m3Scatole += q * m3Scatola(sc);
		}
		for (const r of s.scatoleMisure || []) {
			const q = Math.round(n(r.q, 1));
			const v = (n(r.l) * n(r.p) * n(r.a)) / 1e6;
			if (!v || !q) continue;
			nScatole += q;
			m3Scatole += q * v;
		}
	}
	const netto = m3Mobili + m3Misure + m3Scatole;
	const V = netto * (1 + tt.margine);
	if (V < 0.05) {
		return { vuoto: true, messaggio: 'Aggiungi almeno un mobile o qualche scatolone per vedere la stima.', voci: [], avvisi: [], riepilogo: '' };
	}

	// 2. Strada, mezzi e squadra
	const zp = zonaDi(s.partenza);
	const za = zonaDi(s.arrivo);
	const st = strada && strada.mp != null ? strada : { mp: 10, pa: 10, am: 10, stima: true, mancante: true };
	const dep = n(s.deposito) > 0;
	const lungo = !dep && st.pa > tt.lungo;
	const kmP = st.mp + (zp?.km ?? 0);
	const kmA = st.am + (za?.km ?? 0);
	const kmPA = st.pa + (zp?.km ?? 0) + (za?.km ?? 0);
	let furgoni, giri, squadra, kmFurgone, oreStrada;
	if (lungo) {
		// Oltre 150 km: un camion a noleggio (o più), un solo viaggio
		furgoni = Math.ceil(V / tt.camion);
		giri = 1;
		squadra = V <= 20 ? 2 : 3;
		kmFurgone = kmP + kmPA + kmA;
		oreStrada = kmFurgone / tt.velocitaLunga;
	} else {
		furgoni = V <= tt.capienza ? 1 : tt.furgoniMax;
		giri = Math.max(1, Math.ceil(V / (tt.capienza * furgoni)));
		squadra = V <= 12 ? 2 : V <= 28 ? 3 : 4;
		kmFurgone = dep
			? 2 * giri * kmP + 2 * giri * kmA // giorno 1: magazzino ↔ partenza; giorno 2: magazzino ↔ arrivo
			: kmP + kmPA * (2 * giri - 1) + kmA;
		oreStrada = kmFurgone / tt.velocita;
	}
	squadra = Math.max(squadra, squadraMin);

	// 3. Ore di lavoro (ore-persona)
	const carico = V * tt.orePerM3 * fatica(s.partenza);
	const scarico = V * tt.orePerM3 * fatica(s.arrivo);
	const magazzinoOre = dep ? V * tt.orePerM3 * 2 : 0;
	const smont = s.smontaggio ? oreSmontaggio : 0;
	const fisse = tt.fisse * squadra * 2;
	const oreMani = carico + scarico + magazzinoOre + smont + fisse;
	const durata = oreMani / squadra + oreStrada; // ore di calendario
	const giornate = Math.max(dep ? 2 : 1, Math.ceil(durata / (lungo ? 10 : 9)));
	const notti = lungo && st.pa > 350 ? (st.pa > 800 ? 2 : 1) : 0;

	// 5. Costi netti
	const sab = s.giorno === 'sabato' ? 1 + tt.sabato : 1;
	const lavoro = (carico + scarico + magazzinoOre + fisse + oreStrada * squadra) * tt.operaio * sab;
	const costoSmont = smont * tt.operaio * sab;
	const mezzi = lungo
		? kmFurgone * furgoni * tt.kmCamion + tt.uscitaCamion * furgoni * giornate
		: kmFurgone * furgoni * tt.kmFurgone + tt.uscita * furgoni * giornate;
	const pedaggi = !lungo && kmFurgone > 120 ? kmFurgone * furgoni * tt.pedaggioKm : 0;
	const trasferta = notti * squadra * tt.trasferta;
	let imballo = 0;
	if (s.imballo === 'noi') imballo = nScatole * (tt.scatolaNoi.materiale + tt.scatolaNoi.ore * tt.operaio) + m3Mobili * tt.protezioneM3;
	else if (s.imballo === 'kit') imballo = nScatole * tt.scatolaKit;
	const piattaforme = (s.partenza.piattaforma ? 1 : 0) + (s.arrivo.piattaforma ? 1 : 0);
	const costoPiatt = piattaforme * tt.piattaforma;
	const barche = (zp?.barca ? giri : 0) + (za?.barca ? giri : 0);
	const ferry = ((zp?.ferry ? 1 : 0) + (za?.ferry ? 1 : 0)) * giri * furgoni;
	const costoAcqua = barche * tt.barca + ferry * tt.ferry;
	const costoPermesso = s.permesso ? tt.permesso : 0;
	const mesi = Math.round(n(s.deposito));
	const costoDeposito = mesi * V * tt.depositoM3;
	const m3Via = n(s.smaltimento);
	const costoVia = m3Via * tt.smaltimentoM3;

	let totale = lavoro + costoSmont + mezzi + pedaggi + trasferta + imballo + costoPiatt + costoAcqua + costoPermesso + extra + costoDeposito + costoVia;
	const sottoMinimo = totale < tt.minimo;
	if (sottoMinimo) totale = tt.minimo;

	const k = 1 + tt.iva;
	const conIva = (x) => bello(x * k);
	const voce = (nome, icona, x, nota = '') => x > 0 && voci.push({ nome, icona, euro: conIva(x), nota });
	voce(`Squadra di ${squadra} persone`, 't-squadra', lavoro, `${m3Testo(oreMani - smont)} ore di carico e scarico, ${m3Testo(oreStrada)} ore di strada`);
	const nomeMezzi = lungo ? (furgoni === 1 ? 'Camion e strada' : `${furgoni} camion e strada`) : furgoni === 1 ? 'Furgone e strada' : `${furgoni} furgoni e strada`;
	voce(nomeMezzi, 'truck', mezzi, `${euro(kmFurgone * furgoni)} km in tutto${lungo ? ', pedaggi compresi' : ''}`);
	voce('Pedaggi autostradali', 'truck', pedaggi, 'stima');
	voce('Trasferta della squadra', 'calendar', trasferta, `${notti} ${notti === 1 ? 'notte' : 'notti'}`);
	voce('Smontaggio e rimontaggio', 'wrench', costoSmont, `${m3Testo(smont)} ore`);
	voce(s.imballo === 'noi' ? 'Imballo con i nostri materiali' : 'Kit di scatoloni e materiali', 'box', imballo, `${nScatole} scatoloni`);
	voce(piattaforme === 2 ? 'Piattaforma elevatrice (2 volte)' : 'Piattaforma elevatrice', 'lift', costoPiatt);
	voce('Barca e traghetto', 't-barca', costoAcqua, [barche && `${barche} ${barche === 1 ? 'viaggio' : 'viaggi'} in barca`, ferry && 'ferry-boat'].filter(Boolean).join(', '));
	voce('Permesso per la sosta', 'doc', costoPermesso, 'la tassa del Comune è a parte');
	voce('Oggetti speciali', 't-pianoforte', extra);
	voce(`Deposito per ${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`, 'warehouse', costoDeposito, `${euro(conIva(V * tt.depositoM3))} € al mese`);
	voce('Sgombero e smaltimento', 'hammer', costoVia, `${m3Testo(m3Via)} m³`);
	if (sottoMinimo) avvisi.push(`Uscita minima ${euro(conIva(tt.minimo))} €.`);
	if (daValutare.length) avvisi.push(`${daValutare.join(', ')}: ${daValutare.length === 1 ? 'lo valutiamo al sopralluogo, non è nel prezzo' : 'li valutiamo al sopralluogo, non sono nel prezzo'}.`.replace(/^./, (c) => c.toUpperCase()));
	if (lungo) avvisi.push('Oltre 150 km il preventivo lo facciamo su misura.');
	if (st.mancante) avvisi.push('Scegli i comuni per contare i km.');
	else if (st.stima) avvisi.push('Km stimati: li controlliamo noi.');
	if (zp?.barca || za?.barca) avvisi.push('A Venezia il carico va in barca.');
	for (const [nome, lato] of [['partenza', s.partenza], ['arrivo', s.arrivo]]) {
		if (!lato.piattaforma && lato.ascensore === 'no' && Math.abs(Number(lato.piano) || 0) >= 3)
			avvisi.push(`${lato.piano}° piano senza ascensore: al sopralluogo vediamo se serve la piattaforma.`);
	}

	const min = bello(totale * k * tt.forbice[0]);
	const max = bello(totale * k * tt.forbice[1]);

	const lato = (x, z) => {
		const p = Number(x.piano) || 0;
		const piano = p < 0 ? 'seminterrato' : p === 0 ? 'piano terra' : `${p}° piano`;
		const asc = { no: 'senza ascensore', piccolo: 'ascensore piccolo', grande: 'con ascensore' }[x.ascensore] ?? '';
		return `${x.comune || 'comune da scegliere'}${z ? ` (${z.nome})` : ''}, ${piano}${p > 0 ? `, ${x.piattaforma ? 'con piattaforma' : asc}` : ''}`;
	};
	const imb = { noi: `imballo nostro (${nScatole} scatoloni)`, kit: `imballa il cliente con il nostro kit (${nScatole} scatoloni)`, io: `imballa il cliente (${nScatole} scatoloni)` }[s.imballo];
	const servizi = [s.smontaggio && 'smontaggio e rimontaggio', s.permesso && 'permesso di sosta', mesi && `deposito ${mesi} mesi`, m3Via && `smaltimento ${m3Testo(m3Via)} m³`, s.giorno === 'sabato' && 'di sabato'].filter(Boolean);
	const riepilogo = [
		`Trasloco da ${lato(s.partenza, zp)} a ${lato(s.arrivo, za)}.`,
		`Volume circa ${m3Testo(V)} m³: mobili ${m3Testo(m3Mobili + m3Misure)} m³, scatoloni ${m3Testo(m3Scatole)} m³, più il 10% di margine.`,
		elenco.length ? `Cose: ${elenco.join(', ')}.` : '',
		`Imballo: ${imb}.`,
		servizi.length ? `Servizi: ${servizi.join(', ')}.` : '',
		`Strada: ${euro(kmFurgone)} km per mezzo${st.mancante ? ' (stimata)' : ''}. ${furgoni} ${lungo ? 'camion' : furgoni === 1 ? 'furgone' : 'furgoni'}, ${giri} ${giri === 1 ? 'viaggio' : 'viaggi'}, squadra di ${squadra}.`,
		`Stima: ${euro(min)}–${euro(max)} €, IVA 22% inclusa.`
	]
		.filter(Boolean)
		.join(' ');

	return {
		min,
		max,
		nettoMin: bello(totale * tt.forbice[0]),
		nettoMax: bello(totale * tt.forbice[1]),
		m3: V,
		m3Mobili: m3Mobili + m3Misure,
		m3Scatole,
		nScatole,
		furgoni,
		giri,
		lungo,
		capienza: lungo ? tt.camion : tt.capienza,
		squadra,
		durata,
		giornate,
		km: kmFurgone,
		voci,
		avvisi,
		extraM3: conIva(tt.extraM3),
		riepilogo
	};
}

/** Distanza in linea d'aria (km), usata solo se il calcolo della strada non risponde */
export function linea(a, b) {
	const r = Math.PI / 180;
	const x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(x));
}

/** Durata leggibile: "circa 6 ore", "2 giornate" */
export const durataTesto = (r) =>
	r.giornate > 1 ? `${r.giornate} giornate` : r.durata < 1.5 ? 'circa 1 ora' : `circa ${Math.round(r.durata)} ore`;
