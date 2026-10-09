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

// sm: ore-persona per smontare e rimontare. extra: € netti in più. valuta: si decide al sopralluogo.
export const stanze = [
	{
		id: 'soggiorno',
		nome: 'Soggiorno',
		icona: 't-divano',
		oggetti: [
			{ id: 'divano2', nome: 'Divano 2 posti', m3: 1.5, icona: 't-divano' },
			{ id: 'divano3', nome: 'Divano 3 posti', m3: 2, icona: 't-divano' },
			{ id: 'divanoL', nome: 'Divano angolare', m3: 3, icona: 't-angolo', sm: 0.5 },
			{ id: 'poltrona', nome: 'Poltrona', m3: 0.8, icona: 't-poltrona' },
			{ id: 'tavolo', nome: 'Tavolo 4–6 posti', m3: 1, icona: 't-tavolo', sm: 0.3 },
			{ id: 'tavoloG', nome: 'Tavolo grande', m3: 1.5, icona: 't-tavolo', sm: 0.5 },
			{ id: 'sedia', nome: 'Sedia', m3: 0.25, icona: 't-sedia' },
			{ id: 'tavolino', nome: 'Tavolino', m3: 0.3, icona: 't-tavolino' },
			{ id: 'mobileTv', nome: 'Mobile TV', m3: 0.6, icona: 't-mobiletv', sm: 0.3 },
			{ id: 'tv', nome: 'Televisore', m3: 0.2, icona: 't-tv' },
			{ id: 'libreriaP', nome: 'Libreria piccola', m3: 0.6, icona: 't-libreria', sm: 0.4 },
			{ id: 'libreriaG', nome: 'Libreria grande', m3: 1.5, icona: 't-libreria', sm: 0.8 },
			{ id: 'parete', nome: 'Parete attrezzata', m3: 3, icona: 't-parete', sm: 2.5 },
			{ id: 'credenza', nome: 'Credenza o madia', m3: 1.5, icona: 't-credenza' },
			{ id: 'vetrina', nome: 'Vetrina', m3: 1.2, icona: 't-vetrina' },
			{ id: 'tappeto', nome: 'Tappeto', m3: 0.2, icona: 't-tappeto' },
			{ id: 'lampada', nome: 'Lampada da terra', m3: 0.2, icona: 't-lampada' },
			{ id: 'quadro', nome: 'Quadro o specchio', m3: 0.1, icona: 't-quadro' }
		]
	},
	{
		id: 'cucina',
		nome: 'Cucina',
		icona: 't-cucina',
		oggetti: [
			{ id: 'cucinaM', nome: 'Cucina componibile', m3: 0.8, icona: 't-cucina', sm: 1.2, unita: 'm', passo: 0.5 },
			{ id: 'frigo', nome: 'Frigorifero', m3: 1, icona: 't-frigo' },
			{ id: 'frigoA', nome: 'Frigo americano', m3: 1.5, icona: 't-frigoa' },
			{ id: 'lavastoviglie', nome: 'Lavastoviglie', m3: 0.5, icona: 't-lavastoviglie' },
			{ id: 'forno', nome: 'Forno o cucina a gas', m3: 0.5, icona: 't-forno' },
			{ id: 'microonde', nome: 'Microonde', m3: 0.1, icona: 't-microonde' },
			{ id: 'tavoloC', nome: 'Tavolo da cucina', m3: 0.8, icona: 't-tavolo', sm: 0.3 },
			{ id: 'sediaC', nome: 'Sedia', m3: 0.25, icona: 't-sedia' },
			{ id: 'dispensa', nome: 'Dispensa o credenza', m3: 1, icona: 't-credenza' }
		]
	},
	{
		id: 'camera',
		nome: 'Camere da letto',
		icona: 't-letto',
		oggetti: [
			{ id: 'lettoM', nome: 'Letto matrimoniale', m3: 2, icona: 't-letto', sm: 1 },
			{ id: 'lettoS', nome: 'Letto singolo', m3: 1, icona: 't-lettos', sm: 0.6 },
			{ id: 'castello', nome: 'Letto a castello', m3: 2, icona: 't-castello', sm: 1.5 },
			{ id: 'armadio2', nome: 'Armadio 2 ante', m3: 1.5, icona: 't-armadio', sm: 1.4 },
			{ id: 'armadio3', nome: 'Armadio 3 ante', m3: 2, icona: 't-armadio', sm: 2.1 },
			{ id: 'armadio4', nome: 'Armadio 4 ante', m3: 3, icona: 't-armadiog', sm: 2.8 },
			{ id: 'armadio6', nome: 'Armadio 6 ante', m3: 4, icona: 't-armadiog', sm: 4 },
			{ id: 'cabina', nome: 'Cabina armadio', m3: 3.5, icona: 't-abiti', sm: 4 },
			{ id: 'como', nome: 'Comò o cassettiera', m3: 0.8, icona: 'drawers' },
			{ id: 'comodino', nome: 'Comodino', m3: 0.2, icona: 't-comodino' },
			{ id: 'scrivania', nome: 'Scrivania', m3: 0.8, icona: 't-scrivania', sm: 0.5 },
			{ id: 'sediaS', nome: 'Sedia', m3: 0.25, icona: 't-sedia' },
			{ id: 'culla', nome: 'Culla o lettino', m3: 0.5, icona: 't-lettos', sm: 0.4 }
		]
	},
	{
		id: 'bagno',
		nome: 'Bagno e lavanderia',
		icona: 't-bagno',
		oggetti: [
			{ id: 'bagno', nome: 'Mobili del bagno', m3: 1, icona: 't-bagno', sm: 1.5 },
			{ id: 'lavatrice', nome: 'Lavatrice', m3: 0.5, icona: 't-lavatrice' },
			{ id: 'asciugatrice', nome: 'Asciugatrice', m3: 0.5, icona: 't-asciugatrice' },
			{ id: 'scarpiera', nome: 'Scarpiera o armadietto', m3: 0.5, icona: 't-comodino' },
			{ id: 'stendino', nome: 'Stendino e asse da stiro', m3: 0.2, icona: 't-stendino' }
		]
	},
	{
		id: 'studio',
		nome: 'Studio e ingresso',
		icona: 't-scrivania',
		oggetti: [
			{ id: 'scrivaniaG', nome: 'Scrivania grande', m3: 1.5, icona: 't-scrivania', sm: 0.8 },
			{ id: 'sediaU', nome: 'Sedia da ufficio', m3: 0.4, icona: 't-sediau' },
			{ id: 'schedario', nome: 'Cassettiera o schedario', m3: 0.5, icona: 't-schedario' },
			{ id: 'armadioU', nome: 'Armadio da ufficio', m3: 1.5, icona: 't-armadio', sm: 1 },
			{ id: 'computer', nome: 'Computer e monitor', m3: 0.2, icona: 't-tv' },
			{ id: 'attaccapanni', nome: 'Attaccapanni o consolle', m3: 0.3, icona: 't-abiti' },
			{ id: 'cassapanca', nome: 'Cassapanca', m3: 0.6, icona: 't-credenza' }
		]
	},
	{
		id: 'esterno',
		nome: 'Esterno e garage',
		icona: 't-ombrellone',
		oggetti: [
			{ id: 'bici', nome: 'Bicicletta', m3: 0.6, icona: 't-bici' },
			{ id: 'scooter', nome: 'Moto o scooter', m3: 2.5, icona: 't-scooter', extra: 40 },
			{ id: 'tavoloE', nome: 'Tavolo da giardino', m3: 1, icona: 't-ombrellone' },
			{ id: 'sediaE', nome: 'Sedia o sdraio', m3: 0.2, icona: 't-sdraio' },
			{ id: 'barbecue', nome: 'Barbecue', m3: 0.5, icona: 't-barbecue' },
			{ id: 'pianta', nome: 'Pianta o vaso grande', m3: 0.3, icona: 't-pianta' },
			{ id: 'attrezzi', nome: 'Attrezzi e banco da lavoro', m3: 1, icona: 'tools' },
			{ id: 'tagliaerba', nome: 'Tagliaerba', m3: 0.5, icona: 't-tagliaerba' }
		]
	},
	{
		id: 'speciali',
		nome: 'Oggetti speciali',
		icona: 't-pianoforte',
		oggetti: [
			{ id: 'piano', nome: 'Pianoforte verticale', m3: 1.5, icona: 't-pianoforte', extra: 150, squadra: 3 },
			{ id: 'pianoCoda', nome: 'Pianoforte a coda', m3: 3, icona: 't-pianoforte', valuta: true },
			{ id: 'cassaforte', nome: 'Cassaforte piccola', m3: 0.2, icona: 't-cassaforte', extra: 60 },
			{ id: 'cassaforteG', nome: 'Cassaforte grande', m3: 0.5, icona: 't-cassaforte', valuta: true },
			{ id: 'acquario', nome: 'Acquario', m3: 0.4, icona: 't-acquario', extra: 30 },
			{ id: 'arte', nome: 'Opere d’arte o mobili antichi', m3: 0.5, icona: 't-quadro', valuta: true }
		]
	}
];

export const oggetti = Object.fromEntries(stanze.flatMap((s) => s.oggetti.map((o) => [o.id, { ...o, stanza: s.id }])));

/** Scatoloni standard (misure in cm) */
export const scatole = [
	{ id: 'piccolo', nome: 'Piccolo', misure: [40, 30, 30], per: 'libri, piatti, bicchieri' },
	{ id: 'medio', nome: 'Medio', misure: [50, 35, 40], per: 'vestiti piegati, pentole, giochi' },
	{ id: 'grande', nome: 'Grande', misure: [60, 40, 50], per: 'cuscini, coperte, cose leggere' },
	{ id: 'abiti', nome: 'Porta-abiti', misure: [50, 50, 100], per: 'vestiti appesi, con la stampella' },
	{ id: 'valigia', nome: 'Valigia o borsone', misure: [70, 45, 30], per: 'quello che porti già in valigia' }
];
export const m3Scatola = (s) => (s.misure[0] * s.misure[1] * s.misure[2]) / 1e6;
const M3_SCATOLA_NOI = 0.07; // misura media quando imballiamo noi

/** Case tipo: un punto di partenza da correggere */
export const caseTipo = {
	mono: {
		nome: 'Monolocale',
		scatoloni: 20,
		oggetti: { divano2: 1, tavolo: 1, sedia: 2, mobileTv: 1, tv: 1, frigo: 1, microonde: 1, lettoM: 1, armadio2: 1, comodino: 1, lavatrice: 1, quadro: 2 }
	},
	bi: {
		nome: 'Bilocale',
		scatoloni: 35,
		oggetti: { divano3: 1, tavolo: 1, sedia: 4, mobileTv: 1, tv: 1, quadro: 3, cucinaM: 3, frigo: 1, lavastoviglie: 1, microonde: 1, lettoM: 1, armadio3: 1, comodino: 2, como: 1, lavatrice: 1 }
	},
	tri: {
		nome: 'Trilocale',
		scatoloni: 50,
		oggetti: { divano3: 1, poltrona: 1, tavolo: 1, sedia: 4, mobileTv: 1, tv: 1, libreriaG: 1, credenza: 1, tappeto: 1, quadro: 4, cucinaM: 3.5, frigo: 1, lavastoviglie: 1, microonde: 1, lettoM: 1, armadio4: 1, comodino: 2, como: 1, lettoS: 1, armadio2: 1, scrivania: 1, sediaS: 1, lavatrice: 1, stendino: 1, bici: 1 }
	},
	quattro: {
		nome: 'Casa con 4 o più locali',
		scatoloni: 70,
		oggetti: { divano3: 1, divano2: 1, poltrona: 1, tavoloG: 1, sedia: 6, tavolino: 1, mobileTv: 1, tv: 2, libreriaG: 1, credenza: 1, tappeto: 2, quadro: 6, cucinaM: 4, frigo: 1, lavastoviglie: 1, forno: 1, microonde: 1, lettoM: 1, armadio6: 1, comodino: 4, como: 2, lettoS: 2, armadio2: 2, scrivania: 1, sediaS: 1, lavatrice: 1, asciugatrice: 1, stendino: 1, bici: 2, tavoloE: 1, sediaE: 4 }
	},
	poco: { nome: 'Solo alcune cose', scatoloni: 10, oggetti: {} }
};

export const statoIniziale = () => ({
	casa: 'bi',
	partenza: { comune: '', zona: '', piano: 1, ascensore: 'grande', porta: 'vicino', ponti: '0', piattaforma: false },
	arrivo: { comune: '', zona: '', piano: 2, ascensore: 'grande', porta: 'vicino', ponti: '0', piattaforma: false },
	oggetti: { ...caseTipo.bi.oggetti },
	misure: [], // oggetti con misure tue: { nome, l, p, a, q } in cm
	imballo: 'noi',
	scatoloniNoi: caseTipo.bi.scatoloni,
	scatole: { piccolo: 0, medio: 0, grande: 0, abiti: 0, valigia: 0 },
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
	if (z?.barca) k += tt.isola + (tt.ponti[lato.ponti] ?? 0);
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
	if (s.imballo === 'noi') {
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
	if (sottoMinimo) avvisi.push(`Sotto i ${euro(conIva(tt.minimo))} € facciamo comunque l’uscita minima.`);
	if (s.giorno === 'sabato') avvisi.push('Di sabato il lavoro costa il 15% in più.');
	if (daValutare.length) avvisi.push(`${daValutare.join(', ')}: ${daValutare.length === 1 ? 'lo valutiamo al sopralluogo, non è nel prezzo' : 'li valutiamo al sopralluogo, non sono nel prezzo'}.`.replace(/^./, (c) => c.toUpperCase()));
	if (lungo) avvisi.push('Oltre 150 km usiamo un camion e un solo viaggio: la stima è indicativa, il preventivo lo prepariamo su misura.');
	if (st.mancante) avvisi.push('Scegli i due comuni: per ora la strada è stimata come un trasloco in zona.');
	else if (st.stima) avvisi.push('Strada stimata in linea d’aria: la controlliamo noi.');
	if (zp?.barca || za?.barca) avvisi.push('A Venezia e nelle isole il carico va in barca e a mano sui ponti.');
	for (const [nome, lato] of [['partenza', s.partenza], ['arrivo', s.arrivo]]) {
		if (!lato.piattaforma && lato.ascensore === 'no' && Math.abs(Number(lato.piano) || 0) >= 3)
			avvisi.push(`Alla ${nome} sei al ${lato.piano}° piano senza ascensore: con la piattaforma elevatrice si fa prima e i mobili grandi passano dal balcone.`);
	}

	const min = bello(totale * k * tt.forbice[0]);
	const max = bello(totale * k * tt.forbice[1]);

	const lato = (x, z) => {
		const p = Number(x.piano) || 0;
		const piano = p < 0 ? 'seminterrato' : p === 0 ? 'piano terra' : `${p}° piano`;
		const asc = { no: 'senza ascensore', piccolo: 'ascensore piccolo', grande: 'ascensore grande' }[x.ascensore] ?? '';
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
