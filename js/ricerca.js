// Parole che la gente scrive davvero, collegate ai lavori. Bozza: si allarga col tempo.
// Le parole sono "radici": "imbianc" trova imbiancare, imbiancatura, imbianchino.
// Il "!" davanti indica una parola forte (vale il doppio): "muffa in bagno" porta al risanamento, non alla ristrutturazione.

export const paroleServizi = {
	ristrutturazioni: [
		'!ristruttur', 'rinnov', 'rifare', 'bagno', 'demoli', '!cartongess', 'controsoffitt', 'piastrell',
		'rivestiment', 'tetto', 'copertur', 'impiant', 'appartament', 'casa intera', 'negozio', 'ufficio',
		'muratur', 'muro nuovo', '!tramezz', 'facciat', 'cantiere', 'lavori in casa'
	],
	imbiancatura: [
		'!imbianc', '!pittur', '!pitturare', '!dipinger', '!tinteggi', 'pareti', 'parete', 'soffitt', 'colore',
		'!rasatur', 'rasare', 'stucc', 'crepe', 'crepa', 'buchi', 'smalt', 'ringhier', 'vernici', 'bianco',
		'facciat', 'antimuffa', 'muri', 'muro'
	],
	'risanamento-umidita': [
		'!muffa', '!muffe', '!umid', '!risalita', '!salnitro', 'sali', '!efflorescen', 'macchi', '!scrost', 'stacc',
		'si stacca', 'intonaco', '!condensa', 'bagnato', 'laguna', 'odore', 'muro rovinato', 'piano terra',
		'cantina', 'zoccol'
	],
	falegnameria: [
		'!legno', '!falegnam', 'su misura', 'ripar', 'porta', 'porte', '!serrament', 'finestr', '!infiss',
		'!tapparell', 'cernier', 'manigli', 'cassett', 'restaur', 'antico', 'antichi', '!pergol', 'pompeian',
		'scala', 'scale', 'persian', 'scuri', 'tavolo', 'mensol'
	],
	'montaggio-mobili': [
		'!montaggio', '!montare', 'monta', '!ikea', 'mobil', 'cucina', 'armadi', 'letto', 'pensil', 'mensol',
		'smontare', 'smontaggio', '!assembl', 'comò', 'como', 'cassettiera', 'libreria', 'scrivania'
	],
	traslochi: [
		'!trasloc', 'trasport', 'spostare', 'sposta', 'cambio casa', 'cambiare casa', '!imball', 'scatol',
		'deposito', 'piattaforma', 'furgone', 'pianoforte', 'pesant', 'ingombrant', 'svuot', '!sgombero'
	],
	parquet: [
		'!parquet', 'pavimento', 'pavimenti', '!laminato', '!levig', '!lamatur', 'rovere', 'flottante',
		'prefinito', 'graffi', 'cera', 'olio', 'battiscopa', 'listoni', 'spina di pesce'
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
			const forte = r.startsWith('!');
			const rn = normalizza(forte ? r.slice(1) : r);
			const peso = forte ? 4 : 2;
			if (rn.includes(' ')) {
				if (q.includes(rn)) p += peso + 1;
			} else if (parole.some((w) => w.startsWith(rn) || (w.length >= 4 && rn.startsWith(w)))) {
				p += peso;
			}
		}
		const primo = parole[0] || '';
		if (primo.length >= 3 && normalizza(slug).split(' ')[0].startsWith(primo)) p += 1;
		return [slug, p];
	});
	return punteggi
		.filter(([, p]) => p > 0)
		.sort((a, b) => b[1] - a[1])
		.map(([s]) => s);
}
