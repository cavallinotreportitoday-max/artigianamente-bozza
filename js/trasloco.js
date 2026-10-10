import datiRevisione from './revisione-dati.js?r=3';
// Calcolatore del trasloco: catalogo degli oggetti per stanza, volumi standard, tariffe e calcolo.
// Lo stesso file serve alla pagina (prima visualizzazione) e allo script nel browser (copiato in static/js).
// ATTENZIONE: tutte le tariffe sono PROVVISORIE (bozza ottobre 2026), da approvare con Fabri.
// Volumi e prezzi di mercato: vedi RICERCA-TRASLOCHI.md (sezione "Catalogo").
// Versione "una stanza alla volta" (richiesta del 9/10): tariffe e coefficienti NON cambiati.

/** Tariffe nette (IVA esclusa). Invariate rispetto alla versione precedente. */
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
	scatolaNoi: { materiale: 3, ore: 0.08 }, // imballo fatto da noi, a scatolone: materiale + lavoro
	protezioneM3: 1.2, // € al m³ di mobili: pluriball, film, angolari (solo se imballiamo noi)
	scatolaKit: 2.5, // scatoloni e materiali nostri per chi imballa da sé, a scatolone
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

/**
 * Catalogo. m3: volume da trasportare. sm: ore-persona per smontare e rimontare.
 * extra: € netti in più (PROVVISORI). valuta: non entra nella stima, lo vediamo al sopralluogo.
 * stima: volume ricavato da misure tipiche (non da tabelle pubblicate): da verificare con Fabri.
 * s: altre parole per la ricerca. nota: una riga sotto il nome.
 */
const O = (id, nome, m3, icona, x = {}) => ({ id, nome, m3, icona, ...x });
export const catalogo = [
	// Soggiorno
	O('divano2', 'Divano 2 posti', 1.5, 't-divano', { s: 'sofa sofà' }),
	O('divano3', 'Divano 3 posti', 2, 't-divano', { s: 'sofa sofà' }),
	O('divanoL', 'Divano angolare', 3, 't-angolo', { sm: 0.5, s: 'sofa sofà penisola' }),
	O('poltrona', 'Poltrona', 0.8, 't-poltrona', { s: 'poltroncina relax' }),
	O('pouf', 'Pouf', 0.2, 't-pouf', { s: 'puff poggiapiedi', stima: true }),
	O('tavolino', 'Tavolino', 0.3, 't-tavolino', { s: 'tavolino da caffè basso' }),
	O('tavolo', 'Tavolo', 1, 't-tavolo', { sm: 0.3, s: 'tavolo da pranzo' }),
	O('tavoloG', 'Tavolo grande (8 posti o più)', 1.5, 't-tavolo', { sm: 0.4, s: 'tavolo da pranzo allungabile' }),
	O('sedia', 'Sedia', 0.25, 't-sedia', { s: 'sedie' }),
	O('mobileTv', 'Mobile TV', 0.6, 't-mobiletv', { sm: 0.3, s: 'porta tv mobile televisione' }),
	O('tv', 'Televisore', 0.2, 't-tv', { s: 'tv televisione schermo' }),
	O('libreriaP', 'Libreria piccola', 0.6, 't-libreria', { s: 'mensole' }),
	O('libreriaG', 'Libreria grande', 1.5, 't-libreria', { sm: 0.6, s: 'libri' }),
	O('parete', 'Parete attrezzata', 3, 't-parete', { sm: 1.5, s: 'parete soggiorno' }),
	O('credenza', 'Credenza o madia', 1.5, 't-credenza', { s: 'buffet' }),
	O('vetrina', 'Vetrina', 1.2, 't-vetrina', { sm: 0.4, s: 'cristalliera' }),
	O('lampada', 'Lampada da terra', 0.2, 't-lampada', { s: 'piantana' }),
	O('tappeto', 'Tappeto', 0.2, 't-tappeto', { stima: true }),
	O('quadro', 'Quadro o specchio', 0.1, 't-quadro', { s: 'quadri specchio cornice', stima: true }),
	// Cucina
	O('cucinaM', 'Cucina componibile', 0.8, 't-cucina', { sm: 1.2, unita: 'm', passo: 0.5, nota: 'In metri. Elettrodomestici da incasso compresi.', s: 'mobili cucina pensili' }),
	O('frigo', 'Frigorifero', 1, 't-frigo', { nota: 'Solo se non è da incasso.', s: 'frigo' }),
	O('frigoA', 'Frigo americano', 1.5, 't-frigoa', { s: 'frigorifero doppia porta side by side' }),
	O('congelatore', 'Congelatore', 0.5, 't-congelatore', { s: 'freezer pozzetto', stima: true }),
	O('forno', 'Forno', 0.5, 't-forno', { nota: 'Solo se non è da incasso.' }),
	O('lavastoviglie', 'Lavastoviglie', 0.5, 't-lavastoviglie', { nota: 'Solo se non è da incasso.', s: 'lavapiatti' }),
	O('cucinaGas', 'Cucina a gas libera', 0.4, 't-forno', { s: 'fornelli piano cottura', stima: true }),
	O('microonde', 'Microonde', 0.1, 't-microonde', { s: 'fornetto' }),
	O('tavoloC', 'Tavolo da cucina', 0.8, 't-tavolo', { sm: 0.3 }),
	O('sgabello', 'Sgabello', 0.15, 't-sgabello', { s: 'sgabelli', stima: true }),
	O('dispensa', 'Mobile dispensa', 1, 't-credenza', { s: 'colonna mobile cucina', stima: true }),
	// Camera
	O('lettoM', 'Letto matrimoniale', 2, 't-letto', { sm: 1, s: 'letto doppio materasso' }),
	O('lettoS', 'Letto singolo', 1, 't-lettos', { sm: 0.6, s: 'materasso' }),
	O('castello', 'Letto a castello', 2, 't-castello', { sm: 1, s: 'letti bambini' }),
	O('culla', 'Culla o lettino', 0.5, 't-culla', { sm: 0.3, s: 'neonato bimbo', stima: true }),
	O('armadio2', 'Armadio 2 ante', 1.5, 't-armadio', { sm: 1.4, s: 'guardaroba' }),
	O('armadio3', 'Armadio 3 ante', 2, 't-armadio', { sm: 2.1, s: 'guardaroba' }),
	O('armadio4', 'Armadio 4 ante', 3, 't-armadiog', { sm: 2.6, s: 'guardaroba' }),
	O('armadio6', 'Armadio 5 o 6 ante', 3.5, 't-armadiog', { sm: 3.6, s: 'guardaroba grande' }),
	O('como', 'Comò o cassettiera', 0.8, 'drawers', { s: 'cassettone' }),
	O('comodino', 'Comodino', 0.2, 't-comodino'),
	O('scrivania', 'Scrivania', 0.8, 't-scrivania', { sm: 0.5, s: 'tavolo studio' }),
	O('sediaU', 'Sedia da ufficio', 0.3, 't-sediau', { s: 'poltrona ufficio girevole' }),
	O('stender', 'Stender o appendiabiti', 0.2, 't-abiti', { s: 'attaccapanni' }),
	// Bagno
	O('mobiliBagno', 'Mobili del bagno', 1, 't-bagno', { sm: 1.5, s: 'mobile lavabo pensile specchiera' }),
	O('lavatrice', 'Lavatrice', 0.5, 't-lavatrice', { s: 'lavabiancheria' }),
	O('asciugatrice', 'Asciugatrice', 0.5, 't-asciugatrice'),
	O('stendino', 'Stendino', 0.2, 't-stendino', { s: 'stendibiancheria' }),
	// Studio e ingresso
	O('schedario', 'Cassettiera da ufficio', 0.3, 't-schedario', { s: 'classificatore', stima: true }),
	O('scarpiera', 'Scarpiera', 0.4, 't-scarpiera', { s: 'scarpe', stima: true }),
	// Ripostiglio e cantina
	O('scaffale', 'Scaffale', 0.6, 't-scaffale', { sm: 0.3, s: 'scaffalatura mensole', stima: true }),
	O('armadioR', 'Armadio da ripostiglio', 1.5, 't-armadio', { sm: 1, s: 'armadietto', stima: true }),
	O('asse', 'Asse da stiro', 0.1, 't-asse', { s: 'stiro', stima: true }),
	O('aspirapolvere', 'Aspirapolvere', 0.1, 't-aspirapolvere', { s: 'scopa elettrica folletto', stima: true }),
	O('valigia', 'Valigia', 0.15, 't-valigia', { s: 'trolley borsone' }),
	O('scala', 'Scala', 0.2, 't-scala', { s: 'scaletta', stima: true }),
	O('attrezzi', 'Cassetta degli attrezzi', 0.1, 't-attrezzi', { s: 'utensili trapano', stima: true }),
	// Garage
	O('bici', 'Bicicletta', 0.6, 't-bici', { s: 'bici mtb' }),
	O('biciB', 'Bici da bambino', 0.3, 't-bici', { stima: true }),
	O('monopattino', 'Monopattino', 0.15, 't-monopattino', { stima: true }),
	O('scooter', 'Scooter', 1.5, 't-scooter', { extra: 40, s: 'motorino vespa', stima: true }),
	O('moto', 'Moto', 2.5, 't-moto', { extra: 40, s: 'motocicletta' }),
	O('tagliaerba', 'Tagliaerba', 0.5, 't-tagliaerba', { s: 'rasaerba tosaerba', stima: true }),
	O('banco', 'Banco da lavoro', 1, 't-banco', { sm: 0.5, s: 'tavolo da lavoro', stima: true }),
	O('gomme', 'Gomme (set da 4)', 0.4, 't-gomme', { s: 'pneumatici ruote', stima: true }),
	O('sci', 'Sci o snowboard', 0.1, 't-sci', { stima: true }),
	O('surf', 'Tavola da surf o SUP', 0.2, 't-surf', { s: 'sup', stima: true }),
	O('kayak', 'Kayak o canoa', 0.7, 't-kayak', { valuta: true, s: 'canoa' }),
	O('carriola', 'Carriola', 0.4, 't-carriola', { stima: true }),
	// Giardino e terrazzo
	O('tavoloGiardino', 'Tavolo da giardino', 1, 't-tavolo', { s: 'tavolo esterno terrazzo' }),
	O('sediaGiardino', 'Sedia da giardino', 0.2, 't-sedia', { s: 'sedie esterno', stima: true }),
	O('sdraio', 'Sdraio o lettino', 0.4, 't-sdraio', { s: 'chaise longue', stima: true }),
	O('ombrellone', 'Ombrellone', 0.2, 't-ombrellone', { stima: true }),
	O('barbecue', 'Barbecue', 0.5, 't-barbecue', { s: 'bbq griglia', stima: true }),
	O('pianta', 'Pianta o vaso grande', 0.3, 't-pianta', { s: 'vaso fioriera piante', stima: true }),
	O('gazebo', 'Gazebo', 0.5, 't-gazebo', { sm: 1, s: 'pergola tenda', stima: true }),
	O('altalena', 'Altalena', 1, 't-altalena', { sm: 1, s: 'giochi bambini', stima: true }),
	O('dondolo', 'Dondolo', 1.5, 't-dondolo', { sm: 0.5, stima: true }),
	O('casetta', 'Casetta da giardino', 2, 't-casetta', { valuta: true, s: 'casetta attrezzi' }),
	// Oggetti particolari
	O('pianoforte', 'Pianoforte verticale', 1.5, 't-pianoforte', { extra: 150, squadra: 3, s: 'piano' }),
	O('pianoCoda', 'Pianoforte a coda', 3, 't-pianoforte', { valuta: true, s: 'piano' }),
	O('cassaforte', 'Cassaforte fino a 50 kg', 0.3, 't-cassaforte', { extra: 60 }),
	O('cassaforteP', 'Cassaforte oltre 50 kg', 0.5, 't-cassaforte', { valuta: true, s: 'cassaforte pesante' }),
	O('acquario', 'Acquario', 0.3, 't-acquario', { extra: 30, nota: 'Va svuotato prima.', s: 'pesci', stima: true }),
	O('biliardo', 'Biliardo', 3, 't-biliardo', { valuta: true }),
	O('balilla', 'Calcio balilla', 1, 't-balilla', { s: 'biliardino', stima: true }),
	O('tapis', 'Tapis roulant', 1, 't-tapis', { s: 'tapirulan corsa', stima: true }),
	O('cyclette', 'Cyclette', 0.5, 't-cyclette', { s: 'bici da camera spinning', stima: true }),
	O('panca', 'Panca o attrezzi palestra', 0.5, 't-cyclette', { s: 'pesi manubri', stima: true }),
	O('opera', "Opera d'arte", 0.2, 't-quadro', { valuta: true, s: 'quadro di valore scultura statua' })
];
export const oggetti = Object.fromEntries(catalogo.map((o) => [o.id, o]));

/** Le stanze: gli oggetti che si vedono subito (gli altri si cercano). n: scatoloni stimati per stanza (DA VERIFICARE). */
export const tipiStanza = [
	{ id: 'soggiorno', nome: 'Soggiorno', icona: 't-divano', n: 10, oggetti: ['divano2', 'divano3', 'divanoL', 'poltrona', 'tavolino', 'tavolo', 'sedia', 'mobileTv', 'tv', 'libreriaP', 'libreriaG', 'credenza', 'vetrina', 'lampada', 'tappeto', 'quadro'] },
	{ id: 'cucina', nome: 'Cucina', icona: 't-cucina', n: 10, oggetti: ['cucinaM', 'frigo', 'frigoA', 'forno', 'lavastoviglie', 'microonde', 'tavoloC', 'sedia', 'sgabello', 'dispensa'] },
	{ id: 'camera', nome: 'Camera', icona: 't-letto', n: 8, oggetti: ['lettoM', 'lettoS', 'castello', 'culla', 'armadio2', 'armadio3', 'armadio4', 'armadio6', 'como', 'comodino', 'scrivania', 'sediaU', 'stender', 'tv'] },
	{ id: 'bagno', nome: 'Bagno', icona: 't-bagno', n: 3, oggetti: ['mobiliBagno', 'lavatrice', 'asciugatrice', 'stendino'] },
	{ id: 'studio', nome: 'Studio e ingresso', icona: 't-scrivania', n: 6, oggetti: ['scrivania', 'sediaU', 'libreriaP', 'libreriaG', 'schedario', 'scarpiera', 'stender', 'quadro'] },
	{ id: 'ripostiglio', nome: 'Ripostiglio e cantina', icona: 't-scaffale', n: 6, oggetti: ['scaffale', 'armadioR', 'stendino', 'asse', 'aspirapolvere', 'valigia', 'scala', 'attrezzi', 'congelatore'] },
	{ id: 'garage', nome: 'Garage', icona: 't-garage', n: 4, oggetti: ['bici', 'biciB', 'monopattino', 'scooter', 'moto', 'tagliaerba', 'banco', 'scaffale', 'gomme', 'sci', 'surf', 'kayak', 'carriola', 'attrezzi'] },
	{ id: 'esterno', nome: 'Giardino e terrazzo', icona: 't-ombrellone', n: 2, oggetti: ['tavoloGiardino', 'sediaGiardino', 'sdraio', 'ombrellone', 'barbecue', 'pianta', 'gazebo', 'altalena', 'dondolo', 'casetta'] }
];
export const tipo = Object.fromEntries(tipiStanza.map((t) => [t.id, t]));
/** "Poche cose": le più comuni, poi si cerca */
export const pocheCose = ['divano3', 'poltrona', 'tavolo', 'sedia', 'frigo', 'lavatrice', 'lettoM', 'armadio3', 'como', 'scrivania', 'bici'];
/** Scorciatoie in "Manca qualcosa?" */
export const particolari = ['pianoforte', 'pianoCoda', 'cassaforte', 'cassaforteP', 'acquario', 'biliardo', 'opera', 'tapis'];

/** Scatoloni standard (misure in cm: lunghezza × larghezza × altezza) */
export const scatole = [
	{ id: 'piccolo', nome: 'Piccolo', misure: [40, 30, 30], uso: 'Libri, piatti' },
	{ id: 'medio', nome: 'Medio', misure: [50, 35, 40], uso: 'Vestiti, cucina' },
	{ id: 'grande', nome: 'Grande', misure: [60, 40, 50], uso: 'Cuscini, coperte' }
];
export const m3Scatola = (s) => (s.misure[0] * s.misure[1] * s.misure[2]) / 1e6;
const M3_SCATOLA_MEDIA = 0.07; // quando si conosce solo il numero (stima dalle stanze)

/** Esempi da controllare (dai vecchi "case tipo"): stanze con oggetti. Gli scatoloni li stimano le stanze. */
export const esempi = {
	mono: {
		nome: 'Monolocale',
		stanze: [
			['camera', { lettoM: 1, armadio3: 1, comodino: 1, divano2: 1, mobileTv: 1, tv: 1 }],
			['cucina', { frigo: 1, tavoloC: 1, sedia: 2 }], // l'angolo cottura di solito resta nella casa
			['bagno', { lavatrice: 1 }]
		]
	},
	bi: {
		nome: 'Bilocale',
		stanze: [
			['soggiorno', { divano3: 1, tavolo: 1, sedia: 4, mobileTv: 1, tv: 1, libreriaG: 1 }],
			['cucina', { cucinaM: 3, frigo: 1 }],
			['camera', { lettoM: 1, armadio3: 1, comodino: 2, como: 1 }],
			['bagno', { lavatrice: 1, mobiliBagno: 1 }]
		]
	},
	tri: {
		nome: 'Trilocale',
		stanze: [
			['soggiorno', { divano3: 1, poltrona: 1, tavolo: 1, sedia: 4, mobileTv: 1, tv: 1, libreriaG: 1, credenza: 1 }],
			['cucina', { cucinaM: 3.5, frigo: 1 }],
			['camera', { lettoM: 1, armadio6: 1, comodino: 2, como: 1 }],
			['camera', { lettoS: 1, armadio3: 1, scrivania: 1, sediaU: 1 }],
			['bagno', { lavatrice: 1, mobiliBagno: 1 }]
		]
	},
	quattro: {
		nome: '4 o più locali',
		stanze: [
			['soggiorno', { divano3: 1, divanoL: 1, poltrona: 1, tavolo: 1, sedia: 6, mobileTv: 1, tv: 1, libreriaG: 1, credenza: 1 }],
			['cucina', { cucinaM: 4, frigo: 1 }],
			['camera', { lettoM: 1, armadio6: 1, comodino: 2, como: 1 }],
			['camera', { lettoS: 1, armadio3: 1, scrivania: 1, sediaU: 1 }],
			['camera', { lettoS: 1, armadio3: 1, comodino: 1 }],
			['bagno', { lavatrice: 1, mobiliBagno: 1 }],
			['bagno', { mobiliBagno: 1, asciugatrice: 1 }],
			['ripostiglio', { scaffale: 1, stendino: 1, bici: 2 }]
		]
	}
};

/** Stato vuoto: niente è precompilato */
export const statoIniziale = () => ({
	partenza: { comune: '', zona: '', piano: '', ascensore: '' },
	arrivo: { comune: '', zona: '', piano: '', ascensore: '' },
	cosa: '', // 'casa' | 'poche'
	stanze: [], // { uid, tipo, oggetti: { id: q }, esempio }
	poche: {}, // { id: q }
	altri: {}, // "Manca qualcosa?": { id: q }
	personali: [], // { nome, q, l, p, a, peso, foto (quante foto), note }
	chi: '', // chi imballa: 'noi' | 'io' | 'niente'
	scatole: '', // chi porta gli scatoloni: 'nostre' | 'mie'
	nonSo: false,
	quanti: '', // solo per "Imballiamo noi" senza stanze: numero indicativo
	formati: { piccolo: 0, medio: 0, grande: 0 },
	altreMisure: [], // { l, p, a, q } in cm
	smontaggio: false,
	deposito: 0
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
const numTesto = (x) => String(x).replace('.', ',');

/** Nome della stanza con il numero quando ce n'è più d'una dello stesso tipo: "Camera 2" */
export function nomeStanza(stanze, st) {
	const stesse = stanze.filter((x) => x.tipo === st.tipo);
	const t = tipo[st.tipo];
	return stesse.length > 1 ? `${t.nome} ${stesse.indexOf(st) + 1}` : t.nome;
}

/** "Frigorifero", "Sedia ×4", "Cucina componibile 3 m" */
export function voceOggetto(id, q) {
	const o = oggetti[id];
	if (!o) return '';
	return `${o.nome}${o.unita === 'm' ? ` ${numTesto(q)} m` : q > 1 ? ` ×${q}` : ''}`;
}

/** Scatoloni stimati dalle stanze (solo quelle con almeno un oggetto) */
export const scatoloniStimati = (s) =>
	s.cosa === 'casa' ? s.stanze.filter((st) => Object.values(st.oggetti).some((q) => n(q) > 0)).reduce((t, st) => t + (tipo[st.tipo]?.n ?? 0), 0) : 0;

const zonaDi = (lato) => (lato?.comune === 'Venezia' ? zoneVenezia.find((z) => z.id === lato.zona) : null);
const pianoNum = (lato) => (lato.piano === '' || lato.piano == null ? null : Math.round(Number(lato.piano) || 0));

/** Quanto costa in più muovere le cose da/per quel lato (1 = piano terra) */
function fatica(lato) {
	const z = zonaDi(lato);
	const p = pianoNum(lato) ?? 0;
	// seminterrato: una rampa di scale a piedi (l'ascensore si chiede solo dal 1° piano)
	const piano = p < 0 ? 1 : p;
	// ascensore non indicato: si conta come piccolo (a metà) e la stima lo segnala tra le cose che mancano
	const tipoAsc = p <= 0 ? 'no' : lato.ascensore || 'piccolo';
	let k = 1 + piano * (tt.piano[tipoAsc] ?? tt.piano.no);
	if (z?.barca) k += tt.isola + tt.ponti.pochi; // in laguna si contano 1 o 2 ponti
	return k;
}

/** Tutte le righe dell'inventario: { id, q, dove } (dove = nome della stanza o del gruppo) */
export function inventario(s) {
	const righe = [];
	const aggiungi = (mappa, dove) => {
		for (const [id, q0] of Object.entries(mappa || {})) {
			const q = n(q0);
			if (q && oggetti[id]) righe.push({ id, q, dove });
		}
	};
	if (s.cosa === 'casa') for (const st of s.stanze) aggiungi(st.oggetti, nomeStanza(s.stanze, st));
	if (s.cosa === 'poche') aggiungi(s.poche, 'Le tue cose');
	aggiungi(s.altri, 'Altri oggetti');
	return righe;
}

/** Scatoloni: quanti, che volume, se sono stimati. nonContati: il cliente non lo sa e non c'è niente da cui stimarli */
export function contaScatoloni(s) {
	const stimati = scatoloniStimati(s);
	if (s.chi === 'niente') return { n: 0, m3: 0, stimati: false };
	if (s.chi === 'noi' || (s.chi === 'io' && s.nonSo)) {
		const q = stimati || (s.chi === 'noi' ? Math.round(n(s.quanti)) : 0);
		return { n: q, m3: q * M3_SCATOLA_MEDIA, stimati: Boolean(stimati), manuale: !stimati && q > 0, nonContati: s.chi === 'io' && !stimati };
	}
	if (s.chi === 'io') {
		let q = 0;
		let m3 = 0;
		const dettaglio = [];
		for (const sc of scatole) {
			const k = Math.round(n(s.formati?.[sc.id]));
			q += k;
			m3 += k * m3Scatola(sc);
			if (k) dettaglio.push(`${k} ${sc.nome.toLowerCase()} (${sc.misure.join('×')} cm)`);
		}
		if (s.scatole === 'mie') {
			for (const r of s.altreMisure || []) {
				const k = Math.round(n(r.q, 1));
				const v = (n(r.l) * n(r.p) * n(r.a)) / 1e6;
				if (!v || !k) continue;
				q += k;
				m3 += k * v;
				dettaglio.push(`${k} da ${n(r.l)}×${n(r.p)}×${n(r.a)} cm`);
			}
		}
		return { n: q, m3, stimati: false, dettaglio };
	}
	// non si sa ancora chi imballa: per la stima si usano gli scatoloni stimati dalle stanze
	return { n: stimati, m3: stimati * M3_SCATOLA_MEDIA, stimati: Boolean(stimati) };
}

/** Cose che mancano per una stima completa: { testo, passo } */
export function cosaManca(s) {
	// campo: dove portare il cliente quando tocca la voce (selettore CSS dentro il passo)
	const m = [];
	for (const [k, nome] of [['partenza', 'partenza'], ['arrivo', 'arrivo']]) {
		const l = s[k];
		if (!l.comune) m.push({ testo: `Comune di ${nome}`, passo: 1, campo: `[data-tr-comune="${k}"]` });
		else if (l.comune === 'Venezia' && !l.zona) m.push({ testo: `Zona di Venezia (${nome})`, passo: 1, campo: `[name="${k}-zona"]` });
		const p = pianoNum(l);
		if (p == null) m.push({ testo: `Piano di ${nome}`, passo: 5, campo: `[name="${k}-piano"]` });
		else if (p > 0 && !l.ascensore) m.push({ testo: `Ascensore (${nome})`, passo: 5, campo: `[name="${k}-ascensore"]` });
	}
	if (!s.cosa) m.push({ testo: 'Cosa portiamo', passo: 2, campo: '[name="cosa"]' });
	else if (s.cosa === 'casa' && !s.stanze.length) m.push({ testo: 'Le stanze', passo: 2, campo: '[data-tipo]' });
	const esempio = s.cosa === 'casa' ? s.stanze.filter((st) => st.esempio).length : 0;
	if (esempio) m.push({ testo: esempio === 1 ? `Controlla la stanza d'esempio` : `Controlla le ${esempio} stanze d'esempio`, passo: 2, campo: '[data-stanza] button' });
	if ((s.personali || []).some((p) => !String(p.nome || '').trim())) m.push({ testo: "Nome dell'oggetto tuo", passo: 3, campo: '[data-pers-nome]' });
	if (!s.chi) m.push({ testo: 'Chi imballa', passo: 4, campo: '[name="chi"]' });
	else if (s.chi !== 'niente') {
		if (!s.scatole) m.push({ testo: 'Chi porta gli scatoloni', passo: 4, campo: '[name="scatole"]' });
		const sc = contaScatoloni(s);
		if (!sc.n && !sc.nonContati) m.push({ testo: 'Quanti scatoloni', passo: 4, campo: s.chi === 'io' ? '[name^="f-"]' : '[name="quanti"]' });
	}
	return m;
}

/** Partenza e arrivo indicati: senza, la strada non si conosce e il prezzo sarebbe inventato */
export const comuniPronti = (s) => ['partenza', 'arrivo'].every((k) => s[k].comune && !(s[k].comune === 'Venezia' && !s[k].zona));

/** "Jesolo, 2° piano, ascensore piccolo" */
function testoLato(x, z) {
	const p = pianoNum(x);
	const piano = p == null ? 'piano da indicare' : p < 0 ? 'seminterrato' : p === 0 ? 'piano terra' : `${p}° piano`;
	const asc = { no: 'senza ascensore', piccolo: 'ascensore piccolo', grande: 'ascensore grande' }[x.ascensore] ?? 'ascensore da indicare';
	return `${x.comune || 'comune da indicare'}${z ? ` (${z.nome})` : x.comune === 'Venezia' ? ' (zona da indicare)' : ''}, ${piano}${p > 0 ? `, ${asc}` : ''}`;
}

/** Oggetti tuoi: "Statua ×2 (60 × 60 × 180 cm, oltre 100 kg, 2 foto, fragile)" */
function testoPersonali(s) {
	const out = [];
	for (const p of s.personali || []) {
		if (!String(p.nome || '').trim()) continue;
		const q = Math.max(1, Math.round(n(p.q, 1)));
		const foto = Number(p.foto) || 0;
		const dett = [
			n(p.l) && n(p.p) && n(p.a) ? `${n(p.l)} × ${n(p.p)} × ${n(p.a)} cm` : '',
			{ leggero: 'fino a 30 kg', medio: '30–100 kg', pesante: 'oltre 100 kg' }[p.peso] || '',
			foto ? `${foto} ${foto === 1 ? 'foto' : 'foto'}` : '',
			String(p.note || '').trim()
		].filter(Boolean);
		out.push(`${p.nome.trim()}${q > 1 ? ` ×${q}` : ''}${dett.length ? ` (${dett.join(', ')})` : ''}`);
	}
	return out;
}

/**
 * @param s stato del calcolatore (vedi statoIniziale)
 * @param strada { mp, pa, am, stima } km stradali magazzino→partenza, partenza→arrivo, arrivo→magazzino
 */
export function calcolaTrasloco(s, strada) {
	const voci = [];
	const avvisi = [];
	const daValutare = [];
	const incluso = [];
	const mancano = cosaManca(s);
	const zp = zonaDi(s.partenza);
	const za = zonaDi(s.arrivo);

	// 1. Volume (gli oggetti "da valutare" e quelli aggiunti a mano non entrano nella stima)
	let m3Mobili = 0;
	let oreSmontaggio = 0;
	let extra = 0;
	let squadraMin = 2;
	let nOggetti = 0;
	const extraNomi = [];
	const righe = inventario(s);
	for (const { id, q } of righe) {
		const o = oggetti[id];
		if (o.valuta) {
			daValutare.push(voceOggetto(id, q));
			continue;
		}
		nOggetti += o.unita === 'm' ? 1 : q;
		m3Mobili += o.m3 * q;
		if (o.sm) oreSmontaggio += o.sm * q;
		if (o.extra) {
			extra += o.extra * q;
			if (!extraNomi.includes(o.nome.toLowerCase())) extraNomi.push(o.nome.toLowerCase());
		}
		if (o.squadra) squadraMin = Math.max(squadraMin, o.squadra);
	}
	daValutare.push(...testoPersonali(s));
	const sc = contaScatoloni(s);
	const mesi = Math.round(n(s.deposito));

	// Riepilogo per Fabri: si distingue ciò che il cliente ha detto da ciò che è stimato o da controllare.
	// Si scrive anche quando non c'è niente da stimare (es. solo oggetti da valutare).
	const perGruppo = new Map();
	for (const r of righe) {
		if (oggetti[r.id].valuta) continue;
		if (!perGruppo.has(r.dove)) perGruppo.set(r.dove, []);
		perGruppo.get(r.dove).push(voceOggetto(r.id, r.q));
	}
	const esempioDi = new Map(s.cosa === 'casa' ? s.stanze.map((x) => [nomeStanza(s.stanze, x), x.esempio]) : []);
	const gruppi = [...perGruppo].map(([dove, lista]) => `- ${dove}: ${lista.join(', ')}${esempioDi.get(dove) ? ' (esempio non controllato)' : ''}`);
	const imb =
		s.chi === 'niente'
			? 'nessuno scatolone'
			: !s.chi
				? 'chi imballa: da indicare'
				: `${s.chi === 'noi' ? 'lo fa ArtigianaMente' : 'lo fa il cliente'}, ${s.scatole === 'nostre' ? 'scatoloni di ArtigianaMente' : s.scatole === 'mie' ? 'scatoloni del cliente' : 'scatoloni: da indicare'}`;
	const scatTesto =
		s.chi === 'niente'
			? ''
			: sc.nonContati
				? '; quanti scatoloni: il cliente non lo sa ancora, da contare al sopralluogo'
				: sc.n
					? `; ${sc.stimati ? 'circa ' : ''}${sc.n} scatoloni${sc.stimati ? ' (stimati dalle stanze)' : sc.manuale ? ' (numero indicativo)' : sc.dettaglio?.length ? `: ${sc.dettaglio.join(', ')}` : ''}`
					: '; quanti scatoloni: da indicare';
	const servizi = [s.smontaggio && 'smontaggio e rimontaggio', mesi && `deposito ${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`].filter(Boolean);
	const parti = [
		`Trasloco da ${testoLato(s.partenza, zp)} a ${testoLato(s.arrivo, za)}.`,
		gruppi.length ? `Oggetti:\n${gruppi.join('\n')}` : '',
		daValutare.length ? `Da valutare al sopralluogo (non nella stima): ${daValutare.join('; ')}.` : '',
		`Imballo: ${imb}${scatTesto}.`,
		`Servizi: ${servizi.length ? servizi.join(', ') : 'nessuno'}${!s.smontaggio && oreSmontaggio ? ' (smontaggio non richiesto)' : ''}.`,
		mancano.length ? `Mancano: ${mancano.map((x) => x.testo.toLowerCase()).join(', ')}.` : ''
	];

	const netto = m3Mobili + sc.m3;
	const V = netto * (1 + tt.margine);
	if (V < 0.05) {
		const qualcosa = daValutare.length > 0;
		return {
			vuoto: true,
			messaggio: qualcosa ? 'Per gli oggetti da valutare il prezzo lo facciamo al sopralluogo.' : 'Aggiungi qualcosa da portare per vedere la stima.',
			voci: [],
			avvisi: [],
			incluso: [],
			daValutare,
			mancano,
			nOggetti: 0,
			riepilogo: qualcosa ? [...parti, 'Stima: da fare al sopralluogo.'].filter(Boolean).join('\n') : ''
		};
	}

	// 2. Strada, mezzi e squadra
	const st = strada && strada.mp != null ? strada : { mp: 10, pa: 10, am: 10, stima: true, mancante: true };
	const dep = mesi > 0;
	const lungo = !dep && st.pa > tt.lungo;
	const kmP = st.mp + (zp?.km ?? 0);
	const kmA = st.am + (za?.km ?? 0);
	const kmPA = st.pa + (zp?.km ?? 0) + (za?.km ?? 0);
	let furgoni, giri, squadra, kmFurgone, oreStrada;
	if (lungo) {
		furgoni = Math.ceil(V / tt.camion);
		giri = 1;
		squadra = V <= 20 ? 2 : 3;
		kmFurgone = kmP + kmPA + kmA;
		oreStrada = kmFurgone / tt.velocitaLunga;
	} else {
		furgoni = V <= tt.capienza ? 1 : tt.furgoniMax;
		giri = Math.max(1, Math.ceil(V / (tt.capienza * furgoni)));
		squadra = V <= 12 ? 2 : V <= 28 ? 3 : 4;
		kmFurgone = dep ? 2 * giri * kmP + 2 * giri * kmA : kmP + kmPA * (2 * giri - 1) + kmA;
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
	const durata = oreMani / squadra + oreStrada;
	const giornate = Math.max(dep ? 2 : 1, Math.ceil(durata / (lungo ? 10 : 9)));
	const notti = lungo && st.pa > 350 ? (st.pa > 800 ? 2 : 1) : 0;

	// 4. Costi netti
	const lavoro = (carico + scarico + magazzinoOre + fisse + oreStrada * squadra) * tt.operaio;
	const costoSmont = smont * tt.operaio;
	const mezzi = lungo
		? kmFurgone * furgoni * tt.kmCamion + tt.uscitaCamion * furgoni * giornate
		: kmFurgone * furgoni * tt.kmFurgone + tt.uscita * furgoni * giornate;
	const pedaggi = !lungo && kmFurgone > 120 ? kmFurgone * furgoni * tt.pedaggioKm : 0;
	const trasferta = notti * squadra * tt.trasferta;
	// Imballo: chi imballa × chi porta gli scatoloni (stesse tariffe di prima)
	let imballo = 0;
	if (s.chi === 'noi') {
		imballo = sc.n * (tt.scatolaNoi.ore * tt.operaio + (s.scatole === 'mie' ? 0 : tt.scatolaNoi.materiale)) + m3Mobili * tt.protezioneM3;
	} else if (s.chi === 'io' && s.scatole === 'nostre') {
		imballo = sc.n * tt.scatolaKit;
	}
	const barche = (zp?.barca ? giri : 0) + (za?.barca ? giri : 0);
	const ferry = ((zp?.ferry ? 1 : 0) + (za?.ferry ? 1 : 0)) * giri * furgoni;
	const costoAcqua = barche * tt.barca + ferry * tt.ferry;
	const costoDeposito = mesi * V * tt.depositoM3;

	let totale = lavoro + costoSmont + mezzi + pedaggi + trasferta + imballo + costoAcqua + extra + costoDeposito;
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
	const nomeImballo = s.chi === 'noi' ? (s.scatole === 'mie' ? 'Imballo con i tuoi scatoloni' : 'Imballo con i nostri materiali') : 'Scatoloni e materiali nostri';
	voce(nomeImballo, 'box', imballo, `${sc.stimati ? 'circa ' : ''}${sc.n} scatoloni`);
	voce('Barca e traghetto', 't-barca', costoAcqua, [barche && `${barche} ${barche === 1 ? 'viaggio' : 'viaggi'} in barca`, ferry && 'ferry-boat'].filter(Boolean).join(', '));
	voce('Oggetti particolari', 't-pianoforte', extra, extraNomi.join(', '));
	voce(`Deposito per ${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`, 'warehouse', costoDeposito, `${euro(conIva(V * tt.depositoM3))} € al mese`);

	// Cosa è incluso, in parole semplici
	const mezziTesto = lungo ? `${furgoni} camion` : `${furgoni} ${furgoni === 1 ? 'furgone' : 'furgoni'}`;
	const cosaInclusa = [nOggetti && `${nOggetti} ${nOggetti === 1 ? 'oggetto' : 'oggetti'}`, sc.n && `${sc.stimati ? 'circa ' : ''}${sc.n} scatoloni`].filter(Boolean).join(' e ');
	incluso.push(`Squadra di ${squadra} persone e ${mezziTesto}`);
	incluso.push(`Carico, trasporto e scarico: ${cosaInclusa}`);
	if (s.smontaggio && oreSmontaggio) incluso.push('Smontaggio e rimontaggio dei mobili');
	if (s.chi === 'noi') incluso.push(s.scatole === 'mie' ? 'Imballo con i tuoi scatoloni e protezione dei mobili' : 'Imballo con scatoloni e materiali nostri');
	else if (s.chi === 'io' && s.scatole === 'nostre') incluso.push('Scatoloni, nastro e carta, portati prima');
	if (barche) incluso.push('Barca per la laguna');
	if (ferry) incluso.push('Ferry-boat');
	if (mesi) incluso.push(`Deposito per ${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`);
	if (extra) incluso.push(`Oggetti particolari: ${extraNomi.join(', ')}`);

	if (sottoMinimo) avvisi.push(`Uscita minima ${euro(conIva(tt.minimo))} €.`);
	if (lungo) avvisi.push('Oltre 150 km il preventivo lo facciamo su misura.');
	if (!st.mancante && st.stima) avvisi.push('Km stimati: li controlliamo noi.');
	if (zp?.barca || za?.barca) avvisi.push('A Venezia il carico va in barca: ponti e calli li vediamo al sopralluogo.');
	for (const [nome, lato] of [['partenza', s.partenza], ['arrivo', s.arrivo]]) {
		const p = pianoNum(lato) ?? 0;
		if (lato.ascensore === 'no' && p >= 3) avvisi.push(`${p}° piano senza ascensore (${nome}): al sopralluogo vediamo se serve la piattaforma.`);
	}
	if (!s.smontaggio && oreSmontaggio >= 2) avvisi.push('Armadi e letti di solito vanno smontati: puoi aggiungerlo qui sopra.');
	if (sc.stimati && s.chi !== 'niente') avvisi.push('Scatoloni stimati dalle stanze: li contiamo al sopralluogo.');
	if (sc.nonContati) avvisi.push('Gli scatoloni non sono nella stima: li contiamo al sopralluogo.');

	const min = bello(totale * k * tt.forbice[0]);
	const max = bello(totale * k * tt.forbice[1]);
	const provvisoria = mancano.length > 0;
	// Il prezzo si mostra solo con partenza e arrivo indicati; se manca altro è una stima parziale
	const pronta = comuniPronti(s);
	const kmStimati = Boolean(st.mancante || st.stima);
	const riepilogo = [
		...parti,
		`Volume circa ${m3Testo(V)} m³ (mobili ${m3Testo(m3Mobili)} m³, scatoloni ${m3Testo(sc.m3)} m³, più il 10% di margine). ${furgoni} ${lungo ? 'camion' : furgoni === 1 ? 'furgone' : 'furgoni'}, ${giri} ${giri === 1 ? 'viaggio' : 'viaggi'}, squadra di ${squadra}, ${euro(kmFurgone)} km per mezzo${kmStimati ? ' (stimati)' : ''}.`,
		pronta ? `Stima${provvisoria ? ' parziale' : ''}: ${euro(min)}–${euro(max)} €, IVA 22% inclusa.` : 'Stima: si calcola quando il cliente indica partenza e arrivo.'
	]
		.filter(Boolean)
		.join('\n');

	return {
		pronta,
		min,
		max,
		nettoMin: bello(totale * tt.forbice[0]),
		nettoMax: bello(totale * tt.forbice[1]),
		m3: V,
		m3Mobili,
		m3Scatole: sc.m3,
		nScatole: sc.n,
		scatoloniStimati: sc.stimati,
		nOggetti,
		furgoni,
		giri,
		lungo,
		capienza: lungo ? tt.camion : tt.capienza,
		squadra,
		durata,
		giornate,
		km: kmFurgone,
		kmStimati,
		voci,
		avvisi,
		incluso,
		daValutare,
		mancano,
		provvisoria,
		esempio: s.cosa === 'casa' && s.stanze.some((x) => x.esempio),
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

/** Ricerca nel catalogo: ogni parola scritta deve essere l'inizio di una parola del nome o dei sinonimi */
const normCerca = (t) =>
	String(t || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
const parole = Object.fromEntries(catalogo.map((o) => [o.id, { nome: normCerca(o.nome).split(' '), tutte: normCerca(`${o.nome} ${o.s || ''}`).split(' ') }]));
const VUOTE = new Set(['da', 'di', 'del', 'della', 'il', 'la', 'lo', 'le', 'i', 'gli', 'un', 'una', 'e', 'o', 'per', 'con']);
export function cercaOggetti(testo, max = 8) {
	const q = normCerca(testo)
		.split(' ')
		.filter((w) => w && !VUOTE.has(w))
		.map((w) => (w.length >= 4 ? w.replace(/[ie]$/, '') : w)); // plurali: sedie → sedi, armadi → armad, letti → lett
	if (!q.length) return [];
	const ris = [];
	for (const o of catalogo) {
		const p = parole[o.id];
		if (!q.every((w) => p.tutte.some((x) => x.startsWith(w)))) continue;
		const punti = (p.nome[0].startsWith(q[0]) ? 0 : 2) + (q.every((w) => p.nome.some((x) => x.startsWith(w))) ? 0 : 1);
		ris.push([punti, o.nome.length, o]);
	}
	return ris
		.sort((a, b) => a[0] - b[0] || a[1] - b[1])
		.slice(0, max)
		.map((r) => r[2]);
}

/* REVISIONI (backend, Fase 1): le tariffe tt sono i parametri; catalogo e formule restano nel codice.
   versioneFormule: da aumentare quando si cambia il modo di calcolare. */
export const versioneFormule = 1;
const copiaTt = () => JSON.parse(JSON.stringify(tt));
export const parametri = () => ({ tt: copiaTt() });
/** Esegue fn con le tariffe di una revisione, poi rimette quelle di prima. fn deve essere sincrona. */
export function conParametri(p, fn) {
	const prima = copiaTt();
	const metti = (x) => {
		for (const k of Object.keys(tt)) delete tt[k];
		Object.assign(tt, JSON.parse(JSON.stringify(x)));
	};
	try {
		if (p?.tt) metti(p.tt);
		return fn();
	} finally {
		metti(prima);
	}
}

// Sito costruito da una revisione pubblicata: le sue tariffe valgono per tutta la pagina (consegna B)
if (datiRevisione?.parametri?.trasloco?.tt) {
	for (const k of Object.keys(tt)) delete tt[k];
	Object.assign(tt, JSON.parse(JSON.stringify(datiRevisione.parametri.trasloco.tt)));
}
