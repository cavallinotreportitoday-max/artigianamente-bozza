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

export const predefiniti = {
	imbiancatura: { mq: 80, soffitti: true, pittura: 'traspirante', pareti: 'buone', stanze: 'arredate', colore: 'bianco' },
	parquet: { lavoro: 'prefinito', mq: 40, rimozione: false, battiscopa: false },
	montaggio: {
		armadioPiccolo: 0,
		armadioGrande: 1,
		cucinaMl: 0,
		letto: 1,
		cassettiera: 1,
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

export const euro = (n) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(n);

/**
 * @returns {{ min?: number, max?: number, valutazione?: boolean, vuoto?: boolean, messaggio?: string,
 *            dettaglio: string, comprende: string[], esclude: string[], riepilogo: string }}
 */
export function calcola(tipo, v) {
	const t = tariffe[tipo];
	if (tipo === 'imbiancatura') {
		const mq = num(v.mq, 0);
		const sup = Math.round(mq * 2.6 + (si(v.soffitti) ? mq : 0));
		const extra = t.pareti[v.pareti] ?? 0;
		const k = (t.pittura[v.pittura] ?? 1) * (t.stanze[v.stanze] ?? 1) * (t.colore[v.colore] ?? 1);
		const min = Math.max(t.minimo, tondo(sup * (t.euroMq[0] + extra) * k));
		const max = Math.max(t.minimo + 150, tondo(sup * (t.euroMq[1] + extra) * k));
		return {
			min,
			max,
			dettaglio: `Circa ${euro(sup)} m² da pitturare (pareti${si(v.soffitti) ? ' e soffitti' : ''}).`,
			comprende: ['Manodopera e pittura', 'Protezione di mobili e pavimenti', 'Due mani di pittura', 'Pulizia finale'],
			esclude: ['Riparazioni di intonaco importanti', 'Lavori in altezza oltre i 3,5 m'],
			riepilogo: `Imbiancatura: ${mq} m² di pavimento, soffitti ${si(v.soffitti) ? 'sì' : 'no'}, pittura ${v.pittura}, pareti ${{ buone: 'in buono stato', crepe: 'con qualche crepa o buco', rasare: 'da rasare' }[v.pareti] ?? ''}, stanze ${v.stanze}, colore ${v.colore}.`
		};
	}
	if (tipo === 'parquet') {
		const mq = num(v.mq, 0);
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
			comprende: ['Montaggio e messa in bolla', 'Fissaggio a muro', 'Attrezzatura e minuteria'],
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
