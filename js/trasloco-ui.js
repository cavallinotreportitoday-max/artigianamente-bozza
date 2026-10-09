// Calcolatore del trasloco, versione semplice: comuni, piano, casa tipo, scatoloni, due servizi.
// La logica dei prezzi sta in trasloco.js (la stessa usata per la prima visualizzazione della pagina).
import { calcolaTrasloco, caseTipo, zoneVenezia, magazzino, linea, euro, m3Testo, scatole } from './trasloco.js?v=2026100911';

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
const VICINI = ['VE', 'TV', 'PD', 'RO', 'VI', 'VR', 'BL', 'UD', 'PN', 'GO', 'TS'];

export function avviaTrasloco(box) {
	const form = $('[data-tr-form]', box);
	const ris = $('[data-tr-ris]', box);
	const barra = $('[data-tr-barra]', box);
	const icone = $('[data-tr-icone]', box);
	const riepilogo = document.querySelector('[data-riepilogo]');
	const campoComune = document.querySelector('[data-richiesta] input[name="comune"]');

	/* ---------- Comuni: elenco caricato solo quando si scrive ---------- */
	let comuni = null;
	let caricamento = null;
	const caricaComuni = () =>
		(caricamento ??= fetch(new URL('../data/comuni.json', import.meta.url))
			.then((r) => r.json())
			.then((lista) => (comuni = lista.map(([nome, sigla, lat, lon]) => ({ nome, sigla, lat, lon, k: norm(nome) }))))
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
		}
		const vicino = (c) => (VICINI.includes(c.sigla) ? 0 : 1);
		return [...inizio.sort((a, b) => vicino(a) - vicino(b) || a.nome.length - b.nome.length), ...dentro].slice(0, 6);
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
					li.innerHTML = '<span></span><small></small>';
					li.firstChild.textContent = c.nome;
					li.lastChild.textContent = c.sigla;
					li.addEventListener('mousedown', (e) => e.preventDefault()); // Safari: non perdere il fuoco
					li.addEventListener('click', () => scegli(c));
					return li;
				})
			);
			lista.hidden = !voci.length;
			input.setAttribute('aria-expanded', String(voci.length > 0));
			attiva = -1;
		};
		input.addEventListener('focus', () => caricaComuni().then(() => input.value && document.activeElement === input && mostra()));
		input.addEventListener('input', () => {
			if (scelti[lato] && norm(input.value) !== scelti[lato].k) {
				scelti[lato] = null;
				input.classList.remove('is-ok');
				aggiornaLato(lato);
				strada();
				aggiorna();
			}
			caricaComuni().then(mostra);
		});
		input.addEventListener('keydown', (e) => {
			const li = $$('li[role="option"]', lista);
			if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && li.length) {
				e.preventDefault();
				attiva = (attiva + (e.key === 'ArrowDown' ? 1 : -1) + li.length) % li.length;
				li.forEach((x, i) => x.classList.toggle('is-attiva', i === attiva));
				input.setAttribute('aria-activedescendant', li[attiva].id);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (voci.length) scegli(voci[Math.max(0, attiva)]);
			} else if (e.key === 'Escape') chiudi();
		});
		input.addEventListener('blur', () => {
			setTimeout(chiudi, 120);
			if (!scelti[lato] && comuni) {
				const esatto = comuni.find((c) => c.k === norm(input.value));
				if (esatto) scegli(esatto);
			}
		});
	}

	/* ---------- Venezia: in quale zona ---------- */
	const zonaScelta = (lato) => $(`input[name="${lato}-zona"]:checked`, form)?.value || 'terraferma';
	const zona = (lato) => (scelti[lato]?.nome === 'Venezia' ? zoneVenezia.find((z) => z.id === zonaScelta(lato)) : null);
	const aggiornaLato = (lato) => ($(`[data-tr-zona="${lato}"]`, box).hidden = scelti[lato]?.nome !== 'Venezia');
	for (const lato of ['partenza', 'arrivo']) for (const r of $$(`input[name="${lato}-zona"]`, form)) r.addEventListener('change', () => strada());

	/* ---------- Km veri (OpenStreetMap); se non risponde, linea d'aria ---------- */
	let km = null;
	let richiesta = 0;
	const cache = new Map();
	const punto = (lato) => zona(lato) ?? scelti[lato];
	const strada = async () => {
		if (!scelti.partenza || !scelti.arrivo) {
			km = null;
			return;
		}
		const pts = [magazzino, punto('partenza'), punto('arrivo'), magazzino];
		const chiave = pts.map((p) => `${p.lon.toFixed(4)},${p.lat.toFixed(4)}`).join(';');
		const n = ++richiesta;
		const stesso = scelti.partenza === scelti.arrivo && zonaScelta('partenza') === zonaScelta('arrivo');
		const sistema = ([mp, pa, am], stima) => {
			km = { mp, pa: stesso ? Math.max(pa, 3) : pa, am, stima };
			aggiorna();
		};
		if (cache.has(chiave)) return sistema(...cache.get(chiave));
		for (const url of [
			`https://routing.openstreetmap.de/routed-car/route/v1/driving/${chiave}?overview=false`,
			`https://router.project-osrm.org/route/v1/driving/${chiave}?overview=false`
		]) {
			try {
				const ctrl = new AbortController();
				const t = setTimeout(() => ctrl.abort(), 6000);
				const j = await fetch(url, { signal: ctrl.signal }).then((r) => r.json());
				clearTimeout(t);
				if (j.code !== 'Ok' || !j.routes?.[0]?.legs) throw new Error('strada');
				const legs = j.routes[0].legs.map((l) => Math.round(l.distance / 1000));
				cache.set(chiave, [legs, false]);
				if (n === richiesta) sistema(legs, false);
				return;
			} catch {
				// provo il servizio successivo
			}
		}
		const legs = [0, 1, 2].map((i) => Math.max(1, Math.round(linea(pts[i], pts[i + 1]) * 1.35)));
		cache.set(chiave, [legs, true]);
		if (n === richiesta) sistema(legs, true);
	};

	/* ---------- Casa tipo: riempie mobili e scatoloni ---------- */
	for (const r of $$('input[name="casa"]', form)) {
		r.addEventListener('change', () => {
			const c = caseTipo[r.value];
			if (!c) return;
			for (const el of $$('input[name^="o-"]', form)) el.value = String(c.oggetti[el.name.slice(2)] ?? 0);
			$('[name="scatoloniNoi"]', form).value = String(c.scatoloni);
			aggiorna();
		});
	}

	/* ---------- Scatoloni di misura diversa ---------- */
	$('[data-tr-aggiungi="scatole"]', box).addEventListener('click', () => {
		const riga = $('template[data-tr-riga="scatole"]', box).content.firstElementChild.cloneNode(true);
		$('[data-tr-righe="scatole"]', box).append(riga);
		$('input', riga).focus();
		aggiorna();
	});
	box.addEventListener('click', (e) => {
		const t = e.target.closest('[data-tr-togli]');
		if (!t) return;
		t.closest('.tr__riga').remove();
		aggiorna();
	});
	const misure = $('[data-tr-misure]', box);
	misure.addEventListener('toggle', () => aggiorna());

	/* ---------- Lettura del modulo ---------- */
	const val = (nome) => $(`[name="${nome}"]`, form)?.value;
	const radio = (nome, def) => $(`input[name="${nome}"]:checked`, form)?.value ?? def;
	const spunta = (nome) => Boolean($(`[name="${nome}"]`, form)?.checked);
	const lato = (k) => ({
		comune: scelti[k]?.nome || '',
		zona: zonaScelta(k),
		piano: Number(val(`${k}-piano`)) || 0,
		ascensore: radio(`${k}-ascensore`, 'grande'),
		porta: 'vicino'
	});
	const leggi = () => {
		const scatoleMisure = $$('[data-tr-righe="scatole"] .tr__riga', box).map((r) => ({
			l: $('[name="b-l"]', r).value,
			p: $('[name="b-p"]', r).value,
			a: $('[name="b-a"]', r).value,
			q: $('[name="b-q"]', r).value || 1
		}));
		const perMisura = Object.fromEntries(scatole.map((s) => [s.id, val(`s-${s.id}`)]));
		// le misure contano solo se il riquadro è aperto e c'è almeno uno scatolone
		const conMisure =
			misure.open && (Object.values(perMisura).some((x) => Number(x) > 0) || scatoleMisure.some((r) => Number(r.l) && Number(r.p) && Number(r.a)));
		return {
			casa: radio('casa', 'bi'),
			partenza: lato('partenza'),
			arrivo: lato('arrivo'),
			oggetti: Object.fromEntries($$('input[name^="o-"]', form).map((el) => [el.name.slice(2), Number(String(el.value).replace(',', '.')) || 0])),
			imballo: radio('imballo', 'noi'),
			scatoloniNoi: val('scatoloniNoi'),
			conMisure,
			scatole: perMisura,
			scatoleMisure,
			smontaggio: spunta('smontaggio'),
			deposito: spunta('deposito-si') ? val('deposito') : 0
		};
	};

	/* ---------- Risultato ---------- */
	const icona = (n) => ($(`[data-icona="${n}"] svg`, icone) ?? $('[data-icona="info"] svg', icone)).cloneNode(true);
	const scrivi = (sel, testo) => {
		const el = $(sel, box);
		if (el) el.textContent = testo;
	};

	function aggiorna() {
		const s = leggi();
		$('[data-tr-mesi]', box).hidden = !spunta('deposito-si');
		$('[data-tr-numero]', box).hidden = s.conMisure;
		const r = calcolaTrasloco(s, km);
		if (!ridotto) {
			ris.classList.add('sta-cambiando');
			clearTimeout(ris._t);
			ris._t = setTimeout(() => ris.classList.remove('sta-cambiando'), 140);
		}
		const cifra = $('[data-tr-cifra]', box);
		if (r.vuoto) {
			cifra.textContent = '—';
			scrivi('[data-tr-riga]', 'Aggiungi qualcosa da portare.');
			scrivi('[data-tr-avvisi]', '');
			scrivi('[data-tr-barra-cifra]', '—');
			scrivi('[data-tr-barra-m3]', '0 m³');
			$('[data-tr-voci]', box).replaceChildren();
			return;
		}
		cifra.textContent = `${euro(r.min)}–${euro(r.max)} € `;
		const iva = document.createElement('span');
		iva.className = 'risultato__iva';
		iva.textContent = 'IVA inclusa';
		cifra.append(iva);
		const mezzi = r.lungo ? `${r.furgoni} camion` : `${r.furgoni} ${r.furgoni === 1 ? 'furgone' : 'furgoni'}`;
		scrivi('[data-tr-riga]', [`${m3Testo(r.m3)} m³`, mezzi, `${r.squadra} persone`, km && `${euro(r.km)} km`].filter(Boolean).join(' · '));
		scrivi('[data-tr-avvisi]', r.avvisi.slice(0, 2).join(' '));
		scrivi('[data-tr-barra-cifra]', `${euro(r.min)}–${euro(r.max)} €`);
		scrivi('[data-tr-barra-m3]', `${m3Testo(r.m3)} m³`);
		scrivi('[data-tr-extra]', euro(r.extraM3));
		$('[data-tr-voci]', box).replaceChildren(
			...r.voci.map((v) => {
				const li = document.createElement('li');
				const ic = document.createElement('span');
				ic.className = 'scontrino__icona';
				ic.append(icona(v.icona));
				const a = document.createElement('span');
				a.className = 'scontrino__nome';
				a.textContent = v.nome;
				const b = document.createElement('span');
				b.className = 'scontrino__euro';
				b.textContent = `${euro(v.euro)} €`;
				li.append(ic, a, b);
				return li;
			})
		);
		// riepilogo per il modulo "I tuoi dati" della pagina Preventivo
		if (riepilogo && !box.closest('[hidden]')) {
			riepilogo.value = r.riepilogo;
			if (campoComune && !campoComune.value && scelti.partenza) campoComune.value = scelti.partenza.nome;
		}
	}

	form.addEventListener('submit', (e) => e.preventDefault());
	for (const ev of ['input', 'change']) form.addEventListener(ev, (e) => !e.target.matches('[data-tr-comune]') && aggiorna());

	/* ---------- Barretta sul telefono ---------- */
	const vaiRisultato = () => ris.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
	barra.addEventListener('click', vaiRisultato);
	barra.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), vaiRisultato()));
	new IntersectionObserver(([e]) => barra.classList.toggle('is-nascosta', e.isIntersecting), { threshold: 0.1 }).observe(ris);

	aggiorna();
}

for (const box of $$('[data-trasloco]')) avviaTrasloco(box);
