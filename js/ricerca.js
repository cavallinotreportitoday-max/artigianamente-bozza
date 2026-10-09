// Parole che la gente scrive davvero, collegate ai lavori. Bozza: si allarga col tempo.
// Le parole sono "radici": "imbianc" trova imbiancare, imbiancatura, imbianchino.
// Il "!" davanti indica una parola forte (vale il doppio): "muffa in bagno" porta al risanamento, non alla ristrutturazione.
// Il "=" davanti vuol dire solo la parola intera: "=porta" trova porta ma non portare.

export const paroleServizi = {
	ristrutturazioni: [
		'!ristruttur', 'rinnov', 'rifare', 'rifacimento', 'bagno', 'doccia', 'vasca', 'sanitari', 'box doccia', 'cucin',
		'demoli', '!cartongess', 'controsoffitt', 'piastrell', 'rivestiment', 'massetto', 'tetto', 'copertur', 'tegol',
		'coppi', 'lamiera', 'grondai', 'guaina', 'impermeabilizz', 'terrazz', 'balcon', 'impiant', 'appartament',
		'casa intera', 'rifare casa', 'negozio', 'ufficio', 'locale', 'ristorante', 'albergo', 'hotel', 'muratur',
		'!muratore', 'edil', 'impresa edile', 'muro nuovo', 'abbattere', 'parete divisoria', '!tramezz', 'soppalc',
		'ampliament', 'facciat', 'cappotto', 'cantiere', 'lavori in casa', 'pratiche', 'progetto', 'geometra'
	],
	imbiancatura: [
		'!imbianc', '!pittur', '!pitturare', '!dipinger', '!tinteggi', 'tinta', 'colore', 'colori', 'ridipinger',
		'dare il bianco', 'pareti', 'parete', 'soffitt', 'muri', 'muro', 'rullo', 'pennello', '!rasatur', 'rasare',
		'stucc', 'crepe', 'crepa', 'buchi', 'fori', 'smalt', 'vernici', 'ringhier', 'cancell', 'bianco', 'lavabile',
		'traspirante', 'ingiallit', 'annerit', 'sporc', 'ritocc', 'antimuffa', 'facciat', 'esterno', 'condomini',
		'scale condominiali', 'vano scala', 'decoraz', 'stucco veneziano', 'spugnat', 'effetto'
	],
	'risanamento-umidita': [
		'!muffa', '!muffe', '!umid', '!risalita', '!salnitro', '!salin', 'sale', 'sali', '!efflorescen', '!acqua',
		'bagnat', 'muro bagnato', 'infiltraz', 'macchi', 'macchie nere', 'muffa nera', 'polvere bianca',
		'bianco sui muri', '!scrost', 'stacc', 'si stacca', 'gonfi', 'sbriciol', 'intonac', '!condensa', 'appann',
		'vetri appannati', 'ponte termico', 'odore', 'puzza', 'capillar', 'deumidific', 'barriera', 'iniezion',
		'vespaio', 'muro rovinato', 'piano terra', 'cantina', 'seminterrat', 'taverna', 'zoccol', 'mattoni',
		'calce', 'acqua alta', 'marea', 'laguna', 'venezia', 'casa vecchia', 'case vecchie'
	],
	falegnameria: [
		'!legno', '!falegnam', 'su misura', 'mobile su misura', 'ripar', 'aggiust', '!=porta', 'la porta', 'una porta', 'porta blindata', 'porta interna', 'porte', '!serrament',
		'finestr', '!infiss', '!tapparell', 'avvolgibil', 'cinghia', 'persian', 'scuri', 'cernier', 'manigli',
		'serratur', 'cassett', 'anta', 'ante', 'antine', 'scorrevol', 'cigola', 'non chiude', 'restaur', 'antico',
		'antichi', 'tarli', 'tarlo', 'impregnant', '!pergol', 'pompeian', 'gazebo', 'tettoi', 'staccionat',
		'recinzion', 'cancell', 'decking', 'passerell', 'pontil', 'cabine', 'spiaggia', 'chiosco', 'bancone', 'arredo negozio',
		'scala', 'scale', 'tavolo', 'mensol', 'zanzarier'
	],
	'montaggio-mobili': [
		'!montaggio', '!montare', 'monta', '!ikea', '!assembl', 'mondo convenienza', 'leroy', 'amazon', 'kit',
		'istruzioni', 'mobil', 'cucin', 'cucina componibile', 'armadi', 'guardaroba', 'cabina armadio', 'letto',
		'letto a castello', 'cameretta', 'pensil', 'mensol', 'libreria', 'scrivania', 'comò', 'como', 'cassettiera',
		'scarpiera', 'divano', 'sedie', 'tavolo', 'appendere', 'fissare', 'tassell', 'quadri', 'tv a muro', 'staffa',
		'specchio', 'tende', 'bastone', 'elettrodomestic', 'lavastoviglie', 'forno', 'smontare', 'smontaggio',
		'mobili ufficio'
	],
	traslochi: [
		'!trasloc', 'traslocare', 'trasferiment', 'mi trasferisco', 'cambio casa', 'cambiare casa', 'cambio ufficio',
		'trasport', 'spostare', 'sposta', 'portare', '!portare via', 'furgone', 'camion', 'piattaforma', 'autoscala', 'montacarichi',
		'piani alti', 'senza ascensore', 'ascensore', '!imball', 'scatol', 'cartoni', 'pluriball', 'deposito',
		'magazzino', 'custodia', 'pianoforte', 'cassaforte', 'pesant', 'ingombrant', 'fragile', 'svuot', '!metri cubi', 'calcolatore trasloco', 'quanto costa un trasloco', 'kit trasloco', 'traghetto', 'barca',
		'!sgombero', 'sgomberare', 'svuota cantine', 'smaltiment', 'ritiro mobili', 'piccolo trasloco'
	],
	parquet: [
		'!parquet', 'pavimento', 'pavimenti', 'pavimento in legno', '!laminato', 'vinilico', 'pvc', 'lvt', 'spc',
		'!levig', '!lamatur', 'lamare', 'carteggi', 'rovere', 'teak', 'iroko', 'doussie', 'noce', 'flottante',
		'incollato', 'prefinito', 'listoni', 'listelli', 'tavole', 'spina di pesce', 'spina ungherese', 'posa',
		'posare', 'graffi', 'graffiato', 'scricchiol', 'si alza', 'rovinato', 'cera', 'olio', 'oliare', 'vernice',
		'battiscopa', 'zoccolino', 'riscaldamento a pavimento', 'radiante'
	],
	// La scheda "L'azienda"
	azienda: [
		'!aziend', '!appalt', 'chi siete', 'chi siamo', 'chi e', 'titolare', 'fabrizio', 'alzetta', 'squadra',
		'mezzi', '!festool', 'partner', 'officina', 'enti', 'pubblic', 'comune', 'collabor', 'referenze',
		'esperienz', 'anni', 'certificaz', 'assicuraz', 'albo', 'dove siete', 'sede', 'indirizz', 'contatti',
		'telefono', 'orari', 'cavallino', 'treporti'
	]
};

export const suggerimenti = [
	'Muffa sui muri',
	'Montare una cucina IKEA',
	'Imbiancare casa',
	'Trasloco',
	'Riparare una tapparella',
	'Levigare il parquet',
	'Rifare il bagno'
];

export const normalizza = (t) =>
	String(t || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9 ]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

/** Restituisce gli slug dei lavori ordinati per pertinenza (punteggio > 0). */
export function cerca(testo) {
	const q = normalizza(testo);
	if (q.length < 2) return [];
	const parole = q.split(' ').filter((w) => w.length >= 2);
	const punteggi = Object.entries(paroleServizi).map(([slug, radici]) => {
		let p = 0;
		for (const r of radici) {
			const forte = r.includes('!');
			const intera = r.includes('='); // "=" : solo la parola intera (porta sì, portare no)
			const rn = normalizza(r.replace(/[!=]/g, ''));
			const peso = forte ? 4 : 2;
			if (rn.includes(' ')) {
				if (q.includes(rn)) p += peso + 1;
			} else if (intera ? parole.includes(rn) : parole.some((w) => w.startsWith(rn) || (w.length >= 4 && rn.startsWith(w)))) {
				p += peso;
			}
		}
		const primo = parole[0] || '';
		if (primo.length >= 3 && normalizza(slug).split(' ')[0].startsWith(primo)) p += 1;
		return [slug, p];
	});
	const trovati = punteggi
		.filter(([, p]) => p > 0)
		.sort((a, b) => b[1] - a[1])
		.map(([s]) => s);
	return trovati.length ? trovati : cercaConErrori(parole);
}

// Distanza tra due parole (quante lettere cambiare): serve per gli errori di battitura
const distanza = (a, b) => {
	const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
	for (let j = 1; j <= b.length; j++) d[0][j] = j;
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
	return d[a.length][b.length];
};

/** Se non trova niente: "muffs", "trasloko", "parqet"… una lettera sbagliata (due per parole lunghe) va bene. */
function cercaConErrori(parole) {
	const lunghe = parole.filter((w) => w.length >= 5);
	if (!lunghe.length) return [];
	const punteggi = Object.entries(paroleServizi).map(([slug, radici]) => {
		let p = 0;
		for (const r of radici) {
			const rn = normalizza(r.replace(/[!=]/g, ''));
			if (rn.includes(' ') || rn.length < 4) continue;
			for (const w of lunghe) {
				const pezzo = w.slice(0, Math.max(rn.length, 4));
				if (distanza(pezzo, rn) <= (rn.length >= 8 ? 2 : 1)) p += r.startsWith('!') ? 4 : 2;
			}
		}
		return [slug, p];
	});
	return punteggi
		.filter(([, p]) => p > 0)
		.sort((a, b) => b[1] - a[1])
		.map(([s]) => s);
}
