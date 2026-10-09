// Calcolatore del trasloco: comuni, strada, oggetti, scatoloni, stima.
// La logica dei prezzi sta in trasloco.js (la stessa usata per la prima visualizzazione della pagina).
import { calcolaTrasloco, caseTipo, zoneVenezia, magazzino, linea, euro, m3Testo, durataTesto, scatole } from './trasloco.js?v=2026100910';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const norm = (t) =>
	String(t || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function avviaTrasloco(box) {
	const form = $('[data-tr-form]', box);
	const ris = $('[data-tr-ris]', box);
	const barra = $('[data-tr-barra]', box);
	const icone = $('[data-tr-icone]', box);
	const riepilogo = document.querySelector('[data-riepilogo]');
	const campoComune = document.querySelector('[data-richiesta] input[name="comune"]');

	/* ---------- Comuni (elenco caricato solo quando serve) ---------- */
	let comuni = null;
	let caricamento = null;
	const caricaComuni = () =>
		(caricamento ??= fetch(new URL('../data/comuni.json', import.meta.url))
			.then((r) => r.json())
			.then((lista) => {
				comuni = lista.map(([nome, sigla, lat, lon]) => ({ nome, sigla, lat, lon, k: norm(nome) }));
				return comuni;
			})
			.catch(() => (comuni = [])));

	const scelti = { partenza: null, arrivo: null };

	const trova = (testo) => {
		const q = norm(testo);
		if (!q || !comuni) return [];
		const inizio = [];
		const dentro = [];
		for (const c of comuni) {
			if (c.k.startsWith(q)) inizio.push(c);
			else if (q.length >= 3 && c.k.includes(q)) dentro.push(c);
			if (inizio.length >= 8) break;
		}
		// i comuni vicini a noi prima (Veneto e Friuli), poi gli altri
		const vicino = (c) => (['VE', 'TV', 'PD', 'RO', 'VI', 'VR', 'BL', 'UD', 'PN', 'GO', 'TS'].includes(c.sigla) ? 0 : 1);
		return [...inizio.sort((a, b) => vicino(a) - vicino(b) || a.nome.length - b.nome.length), ...dentro].slice(0, 7);
	};

	for (const input of $$('[data-tr-comune]', box)) {
		const lato = input.dataset.trComune;
		const lista = $(`[data-tr-lista="${lato}"]`, box);
		let voci = [];
		let attiva = -1;

		const chiudi = () => {
			lista.hidden = true;
			input.setAttribute('aria-expanded', 'false');
			attiva = -1;
		};
		const scegli = (c) => {
			scelti[lato] = c;
			input.value = c.nome;
			input.classList.add('is-ok');
			chiudi();
			aggiornaLato(lato);
			strada();
			aggiorna();
		};
		const mostra = () => {
			voci = trova(input.value);
			lista.replaceChildren(
				...voci.map((c, i) => {
					const li = document.createElement('li');
					li.role = 'option';
					li.id = `${lista.id}-${i}`;
					li.innerHTML = `<span></span><small>${c.sigla}</small>`;
					li.firstChild.textContent = c.nome;
					li.addEventListener('mousedown', (e) => e.preventDefault()); // Safari: non perdere il fuoco
					li.addEventListener('click', () => scegli(c));
					return li;
				})
			);
			if (!voci.length && norm(input.value).length >= 3 && comuni) {
				const li = document.createElement('li');
				li.className = 'tr__lista-vuota';
				li.textContent = 'Nessun comune con questo nome';
				lista.append(li);
			}
			const aperta = lista.children.length > 0;
			lista.hidden = !aperta;
			input.setAttribute('aria-expanded', String(aperta));
			attiva = -1;
		};

		input.addEventListener('focus', () => caricaComuni().then(() => input.value && document.activeElement === input && mostra()));
		input.addEventListener('input', () => {
			if (scelti[lato] && norm(input.value) !== scelti[lato].k) {
				scelti[lato] = null;
				input.classList.remove('is-ok');
				aggiornaLato(lato);
				strada();
			}
			caricaComuni().then(mostra);
		});
		input.addEventListener('keydown', (e) => {
			const li = $$('li[role="option"]', lista);
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				if (!li.length) return;
				e.preventDefault();
				attiva = (attiva + (e.key === 'ArrowDown' ? 1 : -1) + li.length) % li.length;
				li.forEach((x, i) => x.classList.toggle('is-attiva', i === attiva));
				input.setAttribute('aria-activedescendant', li[attiva].id);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (voci.length) scegli(voci[Math.max(0, attiva)]);
			} else if (e.key === 'Escape') {
				chiudi();
			}
		});
		input.addEventListener('blur', () => {
			setTimeout(chiudi, 120);
			// scritto per intero senza toccare la lista: lo prendo lo stesso
			if (!scelti[lato] && comuni) {
				const esatto = comuni.find((c) => c.k === norm(input.value));
				if (esatto) scegli(esatto);
			}
		});
	}

	/* ---------- Venezia: zona, barca e ponti ---------- */
	const zonaScelta = (lato) => $(`input[name="${lato}-zona"]:checked`, form)?.value || 'terraferma';
	const zona = (lato) => (scelti[lato]?.nome === 'Venezia' ? zoneVenezia.find((z) => z.id === zonaScelta(lato)) : null);
	const aggiornaLato = (lato) => {
		const venezia = scelti[lato]?.nome === 'Venezia';
		$(`[data-tr-zona="${lato}"]`, box).hidden = !venezia;
		$(`[data-tr-ponti="${lato}"]`, box).hidden = !zona(lato)?.barca;
	};
	for (const lato of ['partenza', 'arrivo']) {
		for (const r of $$(`input[name="${lato}-zona"]`, form))
			r.addEventListener('change', () => {
				aggiornaLato(lato);
				strada();
			});
	}

	/* ---------- Strada vera (OpenStreetMap), con riserva in linea d'aria ---------- */
	let km = null; // { mp, pa, am, stima }
	let richiesta = 0;
	const cache = new Map();
	const punto = (lato) => {
		const z = zona(lato);
		const c = scelti[lato];
		return z ? { lat: z.lat, lon: z.lon } : { lat: c.lat, lon: c.lon };
	};
	const testoStrada = $('[data-tr-strada] span', box);
	const strada = async () => {
		if (!scelti.partenza || !scelti.arrivo) {
			km = null;
			testoStrada.textContent = 'Scegli i due comuni e calcoliamo i chilometri.';
			return;
		}
		const pts = [magazzino, punto('partenza'), punto('arrivo'), magazzino];
		const chiave = pts.map((p) => `${p.lon.toFixed(4)},${p.lat.toFixed(4)}`).join(';');
		const n = ++richiesta;
		const stesso = scelti.partenza === scelti.arrivo && zonaScelta('partenza') === zonaScelta('arrivo');
		const sistema = (legs, stima) => {
			const [mp, pa, am] = legs;
			km = { mp, pa: stesso ? Math.max(pa, 3) : pa, am, stima };
			testoStrada.textContent = `${stima ? 'Circa ' : ''}${euro(km.mp)} km dal nostro magazzino alla partenza, ${euro(km.pa)} km fino all’arrivo, ${euro(km.am)} km per tornare.${stima ? ' Stima in linea d’aria.' : ''}`;
			aggiorna();
		};
		if (cache.has(chiave)) return sistema(...cache.get(chiave));
		testoStrada.textContent = 'Calcolo la strada…';
		const servizi = [
			`https://routing.openstreetmap.de/routed-car/route/v1/driving/${chiave}?overview=false`,
			`https://router.project-osrm.org/route/v1/driving/${chiave}?overview=false`
		];
		for (const url of servizi) {
			try {
				const ctrl = new AbortController();
				const t = setTimeout(() => ctrl.abort(), 6000);
				const r = await fetch(url, { signal: ctrl.signal });
				clearTimeout(t);
				const j = await r.json();
				if (j.code !== 'Ok' || !j.routes?.[0]?.legs) throw new Error('strada');
				const legs = j.routes[0].legs.map((l) => Math.round(l.distance / 1000));
				cache.set(chiave, [legs, false]);
				if (n === richiesta) sistema(legs, false);
				return;
			} catch {
				// provo il servizio successivo
			}
		}
		// Nessuna risposta: linea d'aria × 1,35
		const legs = [0, 1, 2].map((i) => Math.max(1, Math.round(linea(pts[i], pts[i + 1]) * 1.35)));
		cache.set(chiave, [legs, true]);
		if (n === richiesta) sistema(legs, true);
	};

	/* ---------- Righe con le misure (oggetti e scatoloni) ---------- */
	for (const b of $$('[data-tr-aggiungi]', box)) {
		b.addEventListener('click', () => {
			const tipo = b.dataset.trAggiungi;
			const riga = $(`template[data-tr-riga="${tipo}"]`, box).content.firstElementChild.cloneNode(true);
			$(`[data-tr-righe="${tipo}"]`, box).append(riga);
			$('input', riga).focus();
			aggiorna();
		});
	}
	box.addEventListener('click', (e) => {
		const t = e.target.closest('[data-tr-togli]');
		if (!t) return;
		t.closest('.tr__riga').remove();
		aggiorna();
	});

	/* ---------- Casa tipo: riempie mobili e scatoloni ---------- */
	const suggerisciScatole = (tot) => {
		const parti = { piccolo: 0.3, medio: 0.5, grande: 0.15, abiti: 0.05, valigia: 0 };
		for (const [k, f] of Object.entries(parti)) {
			const el = $(`[name="s-${k}"]`, form);
			if (el) el.value = String(Math.round(tot * f));
		}
	};
	for (const r of $$('input[name="casa"]', form)) {
		r.addEventListener('change', () => {
			const c = caseTipo[r.value];
			if (!c) return;
			for (const el of $$('input[name^="o-"]', form)) el.value = String(c.oggetti[el.name.slice(2)] ?? 0);
			$('[name="scatoloniNoi"]', form).value = String(c.scatoloni);
			suggerisciScatole(c.scatoloni);
			aggiorna();
		});
	}
	suggerisciScatole(Number($('[name="scatoloniNoi"]', form).value) || 0);

	/* ---------- Lettura del modulo ---------- */
	const val = (nome) => $(`[name="${nome}"]`, form)?.value;
	const radio = (nome, def) => $(`input[name="${nome}"]:checked`, form)?.value ?? def;
	const spunta = (nome) => Boolean($(`[name="${nome}"]`, form)?.checked);
	const lato = (k) => ({
		comune: scelti[k]?.nome || '',
		zona: zonaScelta(k),
		piano: Number(val(`${k}-piano`)) || 0,
		ascensore: radio(`${k}-ascensore`, 'grande'),
		porta: radio(`${k}-porta`, 'vicino'),
		ponti: radio(`${k}-ponti`, '0'),
		piattaforma: spunta(`${k}-piattaforma`)
	});
	const leggi = () => ({
		casa: radio('casa', 'bi'),
		partenza: lato('partenza'),
		arrivo: lato('arrivo'),
		oggetti: Object.fromEntries($$('input[name^="o-"]', form).map((el) => [el.name.slice(2), Number(String(el.value).replace(',', '.')) || 0])),
		misure: $$('[data-tr-righe="misure"] .tr__riga', box).map((r) => ({
			nome: $('[name="m-nome"]', r).value.trim(),
			l: $('[name="m-l"]', r).value,
			p: $('[name="m-p"]', r).value,
			a: $('[name="m-a"]', r).value,
			q: $('[name="m-q"]', r).value || 1
		})),
		imballo: radio('imballo', 'noi'),
		scatoloniNoi: val('scatoloniNoi'),
		scatole: Object.fromEntries(scatole.map((s) => [s.id, val(`s-${s.id}`)])),
		scatoleMisure: $$('[data-tr-righe="scatole"] .tr__riga', box).map((r) => ({
			l: $('[name="b-l"]', r).value,
			p: $('[name="b-p"]', r).value,
			a: $('[name="b-a"]', r).value,
			q: $('[name="b-q"]', r).value || 1
		})),
		smontaggio: spunta('smontaggio'),
		permesso: spunta('permesso'),
		deposito: val('deposito'),
		smaltimento: val('smaltimento'),
		giorno: radio('giorno', 'feriale')
	});

	/* ---------- Disegno del risultato ---------- */
	const icona = (n, size) => {
		const svg = $(`[data-icona="${n}"] svg`, icone) ?? $('[data-icona="info"] svg', icone);
		const c = svg.cloneNode(true);
		if (size) {
			c.setAttribute('width', size);
			c.setAttribute('height', size);
		}
		return c;
	};
	const scrivi = (sel, testo) => {
		const el = $(sel, box);
		if (el) el.textContent = testo;
	};
	const pausa = (el) => {
		if (ridotto || !el) return;
		el.classList.add('sta-cambiando');
		clearTimeout(el._t);
		el._t = setTimeout(() => el.classList.remove('sta-cambiando'), 140);
	};

	function aggiorna() {
		const s = leggi();
		// al piano terra la domanda sull'ascensore non serve
		for (const k of ['partenza', 'arrivo']) {
			const g = $(`[data-tr-gruppo="${k}-asc"]`, box);
			if (g) g.hidden = s[k].piano === 0;
		}
		// mostra solo i campi dell'imballo scelto
		for (const g of $$('[data-tr-se]', box)) g.hidden = !g.dataset.trSe.split(' ').includes(s.imballo);
		// contatori delle stanze
		for (const el of $$('[data-tr-conto]', box)) {
			if (el.dataset.trConto === 'misure') {
				const q = s.misure.filter((m) => Number(m.l) && Number(m.p) && Number(m.a)).length;
				el.textContent = q ? `${q} ${q === 1 ? 'oggetto' : 'oggetti'}` : '';
				continue;
			}
			let q = 0;
			let v = 0;
			for (const inp of $$('input[name^="o-"]', el.closest('.tr__stanza'))) {
				const x = Number(String(inp.value).replace(',', '.')) || 0;
				if (!x) continue;
				const m3 = Number(inp.closest('.tr__ogg').dataset.m3 || 0);
				q += inp.step === '0.5' ? 1 : x;
				v += x * m3;
			}
			el.textContent = q ? `${q} ${q === 1 ? 'cosa' : 'cose'} · ${m3Testo(v)} m³` : '';
		}
		// mobili da smontare
		const daSmontare = $$('input[name^="o-"]', form).reduce((t, el) => t + (el.closest('.tr__ogg').dataset.sm ? (el.step === '0.5' ? (Number(el.value) ? 1 : 0) : Number(el.value) || 0) : 0), 0);
		scrivi('[data-tr-smontaggio]', daSmontare ? `${daSmontare} ${daSmontare === 1 ? 'mobile da smontare' : 'mobili da smontare'} e rimontare: armadi, letti, cucina…` : 'Nessun mobile da smontare tra quelli scelti.');

		const r = calcolaTrasloco(s, km);
		pausa(ris);
		const cifra = $('[data-tr-cifra]', box);
		if (r.vuoto) {
			cifra.textContent = '—';
			scrivi('[data-tr-iva]', r.messaggio);
			scrivi('[data-tr-barra-cifra]', '—');
			scrivi('[data-tr-barra-m3]', '0 m³');
			$('[data-tr-voci]', box).replaceChildren();
			$('[data-tr-avvisi]', box).replaceChildren();
			$('[data-tr-carico]', box).replaceChildren();
			if (riepilogo && !box.closest('[hidden]')) riepilogo.value = 'Trasloco: nessun oggetto indicato.';
			return;
		}
		cifra.textContent = `${euro(r.min)}–${euro(r.max)} € `;
		const iva = document.createElement('span');
		iva.className = 'risultato__iva';
		iva.textContent = 'IVA inclusa';
		cifra.append(iva);
		scrivi('[data-tr-iva]', `Senza IVA: ${euro(r.nettoMin)}–${euro(r.nettoMax)} €. IVA al 22%.`);
		scrivi('[data-tr-num="m3"]', `${m3Testo(r.m3)} m³`);
		scrivi('[data-tr-num="mezzi"]', r.lungo ? `${r.furgoni} camion` : `${r.furgoni} ${r.furgoni === 1 ? 'furgone' : 'furgoni'}`);
		scrivi('[data-tr-num="viaggi"]', `${r.giri} ${r.giri === 1 ? 'viaggio' : 'viaggi'}`);
		scrivi('[data-tr-num="squadra"]', `${r.squadra} persone`);
		scrivi('[data-tr-num="tempo"]', durataTesto(r));
		scrivi('[data-tr-num="km"]', km ? `${euro(r.km)} km per mezzo` : 'di lavoro');
		scrivi('[data-tr-barra-cifra]', `${euro(r.min)}–${euro(r.max)} €`);
		scrivi('[data-tr-barra-m3]', `${m3Testo(r.m3)} m³`);
		scrivi('[data-tr-extra]', `${euro(r.extraM3)} €`);

		// furgoni pieni: una sagoma per ogni carico
		const carico = $('[data-tr-carico]', box);
		const carichi = [];
		let resto = r.m3;
		const tot = r.furgoni * r.giri;
		for (let i = 0; i < Math.min(tot, 8); i++) {
			const pieno = Math.max(0, Math.min(1, resto / r.capienza));
			resto -= r.capienza;
			const d = document.createElement('div');
			d.className = 'tr-carico__mezzo';
			d.style.setProperty('--pieno', String(pieno));
			d.append(icona('furgone', 44), icona('furgone', 44));
			const p = document.createElement('span');
			p.textContent = `${Math.round(pieno * 100)}%`;
			d.append(p);
			carichi.push(d);
		}
		const nota = document.createElement('p');
		nota.className = 'tr-carico__nota';
		nota.textContent = r.lungo
			? `Un camion da ${r.capienza} m³ per ${r.furgoni === 1 ? 'tutto il carico' : 'carico'}.`
			: `${tot === 1 ? 'Un carico' : `${tot} carichi`} da ${String(r.capienza).replace('.', ',')} m³ (${r.furgoni} ${r.furgoni === 1 ? 'furgone' : 'furgoni'} × ${r.giri} ${r.giri === 1 ? 'viaggio' : 'viaggi'}).`;
		carico.replaceChildren(...carichi, nota);

		$('[data-tr-voci]', box).replaceChildren(
			...r.voci.map((v) => {
				const li = document.createElement('li');
				const ic = document.createElement('span');
				ic.className = 'scontrino__icona';
				ic.append(icona(v.icona));
				const a = document.createElement('span');
				a.className = 'scontrino__nome';
				a.textContent = v.nome;
				if (v.nota) {
					const sm = document.createElement('small');
					sm.textContent = v.nota;
					a.append(sm);
				}
				const b = document.createElement('span');
				b.className = 'scontrino__euro';
				b.textContent = `${euro(v.euro)} €`;
				li.append(ic, a, b);
				return li;
			})
		);
		$('[data-tr-avvisi]', box).replaceChildren(
			...r.avvisi.map((t) => {
				const li = document.createElement('li');
				li.append(icona('info'), t);
				return li;
			})
		);

		// "Mandami il riepilogo" e modulo della pagina Preventivo
		const testo = [
			'Stima del mio trasloco, da ArtigianaMente',
			r.riepilogo,
			...r.voci.map((v) => `- ${v.nome}: ${euro(v.euro)} €`),
			`Cose in più il giorno del trasloco: ${euro(r.extraM3)} € al m³.`,
			'Stima orientativa non vincolante. Il preventivo scritto arriva dopo il sopralluogo gratuito.',
			location.href.split('#')[0] + '#traslochi'
		].join('\n');
		$('[data-tr-whatsapp]', box).href = 'https://wa.me/?text=' + encodeURIComponent(testo);
		$('[data-tr-email]', box).href = 'mailto:?subject=' + encodeURIComponent('Stima del mio trasloco – ArtigianaMente') + '&body=' + encodeURIComponent(testo);
		if (riepilogo && !box.closest('[hidden]')) {
			riepilogo.value = r.riepilogo;
			if (campoComune && !campoComune.value && scelti.partenza) campoComune.value = scelti.partenza.nome;
		}
	}

	form.addEventListener('submit', (e) => e.preventDefault());
	form.addEventListener('input', (e) => {
		if (e.target.matches('[data-tr-comune]')) return;
		aggiorna();
	});
	form.addEventListener('change', (e) => {
		if (e.target.matches('[data-tr-comune]')) return;
		aggiorna();
	});

	/* ---------- Barretta sul telefono e PDF ---------- */
	const vaiRisultato = () => ris.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
	barra.addEventListener('click', vaiRisultato);
	barra.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), vaiRisultato()));
	new IntersectionObserver(([e]) => barra.classList.toggle('is-nascosta', e.isIntersecting), { threshold: 0.1 }).observe(ris);
	$('[data-tr-stampa]', box).addEventListener('click', () => {
		document.documentElement.classList.add('stampa-trasloco');
		for (const d of $$('details', ris)) d.open = true;
		print();
		setTimeout(() => document.documentElement.classList.remove('stampa-trasloco'), 500);
	});

	aggiorna();
}

for (const box of $$('[data-trasloco]')) avviaTrasloco(box);
