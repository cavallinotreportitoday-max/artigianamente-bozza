// ArtigianaMente — interazioni della bozza (menu, ricerca in home, preventivo guidato, moduli, visore foto).
import { calcola, euro, calcolaBagno } from './calcoli.js?v=2026101021-r4';
import { cerca } from './ricerca.js?v=2026100914-r4';
import { attivaModuli } from './invio.js?v=2026101021-r4';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
// Arrivati col tasto indietro o ricaricando: il browser rimette la pagina dov'era, gli script non devono scorrere
const tornato = (() => {
	try {
		const t = performance.getEntriesByType('navigation')[0]?.type;
		return t === 'back_forward' || t === 'reload';
	} catch {
		return false;
	}
})();
const CHECK =
	'<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" vector-effect="non-scaling-stroke"/></svg>';

/* Trascinare col dito a destra o a sinistra (solo tocco, non il mouse) */
function scorriColDito(el, fai) {
	if (!el) return;
	let x0 = null;
	let y0 = null;
	el.addEventListener('touchstart', (e) => {
		x0 = e.touches[0].clientX;
		y0 = e.touches[0].clientY;
	}, { passive: true });
	el.addEventListener('touchend', (e) => {
		if (x0 === null) return;
		const dx = e.changedTouches[0].clientX - x0;
		const dy = e.changedTouches[0].clientY - y0;
		x0 = null;
		if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) fai(dx < 0);
	});
}

/* Menu a tutto schermo */
const toggle = $('[data-menu-toggle]');
const menu = $('[data-menu]');
if (toggle && menu) {
	const apri = (si) => {
		toggle.setAttribute('aria-expanded', String(si));
		menu.hidden = !si;
		document.documentElement.style.overflow = si ? 'hidden' : '';
		$('.sr-only', toggle).textContent = si ? 'Chiudi il menu' : 'Apri il menu';
	};
	toggle.addEventListener('click', () => apri(toggle.getAttribute('aria-expanded') !== 'true'));
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !menu.hidden) apri(false);
	});
	for (const a of $$('a', menu)) a.addEventListener('click', () => apri(false));
}

/* Intestazione: fondo scuro dopo la copertina */
const header = $('[data-header]');
if (header) {
	const chiaro = header.classList.contains('mm-header--chiaro');
	const soglia = () => (chiaro ? 4 : Math.max(80, ($('[data-slider], [data-copertina], [data-sfondo]')?.offsetHeight || 400) - 90));
	// In home l'intestazione diventa bianca insieme alle icone dei lavori, quando restano fisse in alto
	const icone = $('[data-sfondo]') && $('[data-chips]');
	// sul telefono, scendendo alle icone, logo e menu spariscono (10/10): le icone vanno in cima
	const telefono = matchMedia('(max-width: 860px)');
	// computer: si confronta con l'altezza piena dell'intestazione (76 px), non con quella del momento,
	// che scendendo diventa 64: così non salta avanti e indietro
	const altezzaPiena = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || header.offsetHeight;
	const aggiornaHeader = () =>
		header.classList.toggle(
			'is-scrolled',
			icone
				? scrollY > 10 && icone.getBoundingClientRect().top <= (telefono.matches ? 0 : altezzaPiena()) + 1
				: window.scrollY > soglia()
		);
	addEventListener('scroll', aggiornaHeader, { passive: true });
	aggiornaHeader();
}

/* Barra in fondo alle pagine dei lavori (10/10): scendendo nella pagina si restringe, risalendo torna estesa.
   Cambia solo dopo un movimento di almeno 24 px nella stessa direzione: niente cambi continui per piccoli
   aggiustamenti o per il rimbalzo di Safari in cima e in fondo. */
const fondoBarra = $('[data-fondo]');
if (fondoBarra) {
	let ultimo = scrollY;
	let corsa = 0;
	const SOGLIA = 24;
	const segui = () => {
		const y = scrollY;
		const max = document.documentElement.scrollHeight - innerHeight;
		const d = y - ultimo;
		ultimo = y;
		if (y <= 40) {
			corsa = 0;
			fondoBarra.classList.remove('is-compatta');
			return;
		}
		if (y < 0 || y > max - 2) return; // rimbalzo in fondo: resta com'è
		if (d === 0) return;
		if (Math.sign(d) !== Math.sign(corsa)) corsa = 0;
		corsa += d;
		if (corsa > SOGLIA) fondoBarra.classList.add('is-compatta');
		else if (corsa < -SOGLIA) fondoBarra.classList.remove('is-compatta');
	};
	addEventListener('scroll', segui, { passive: true });
}

/* Slider a tutto schermo */
for (const slider of $$('[data-slider]')) {
	const track = $('[data-track]', slider);
	const slides = $$('[data-slide]', slider);
	if (slides.length < 2) continue;
	const conta = $('[data-current]', slider);
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let i = 0;
	let timer;
	const vai = (n) => {
		i = (n + slides.length) % slides.length;
		track.style.transform = `translateX(${-100 * i}%)`;
		slides.forEach((s, k) => {
			const attiva = k === i;
			s.classList.toggle('is-active', attiva);
			if (attiva) s.removeAttribute('aria-hidden');
			else s.setAttribute('aria-hidden', 'true');
			const link = $('a', s);
			if (link) link.tabIndex = attiva ? 0 : -1;
		});
		if (conta) conta.textContent = String(i + 1).padStart(2, '0');
	};
	const avvia = () => {
		clearInterval(timer);
		if (!ridotto) timer = setInterval(() => vai(i + 1), 6500);
	};
	$('[data-next]', slider)?.addEventListener('click', () => {
		vai(i + 1);
		avvia();
	});
	$('[data-prev]', slider)?.addEventListener('click', () => {
		vai(i - 1);
		avvia();
	});
	slider.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') {
			vai(i + 1);
			avvia();
		}
		if (e.key === 'ArrowLeft') {
			vai(i - 1);
			avvia();
		}
	});
	let x0 = null;
	slider.addEventListener('pointerdown', (e) => {
		if (e.pointerType !== 'mouse') x0 = e.clientX;
	});
	slider.addEventListener('pointerup', (e) => {
		if (x0 === null) return;
		const dx = e.clientX - x0;
		x0 = null;
		if (Math.abs(dx) > 40) {
			vai(dx < 0 ? i + 1 : i - 1);
			avvia();
		}
	});
	slider.addEventListener('mouseenter', () => clearInterval(timer));
	slider.addEventListener('mouseleave', avvia);
	document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(timer) : avvia()));
	avvia();
}

/* Campi numerici con + e − */
for (const box of $$('[data-stepper]')) {
	const input = $('input', box);
	for (const btn of $$('[data-step]', box)) {
		btn.addEventListener('click', () => {
			const passo = Number(input.step) || 1;
			const min = input.min === '' ? -Infinity : Number(input.min);
			const max = input.max === '' ? Infinity : Number(input.max);
			const val = Number(input.value) || 0;
			input.value = String(Math.min(max, Math.max(min, val + Number(btn.dataset.step) * passo)));
			input.dispatchEvent(new Event('input', { bubbles: true }));
		});
	}
}

/* Lettura dei valori del preventivo */
function leggi(box) {
	const v = {};
	for (const el of $$('input', box)) {
		if (!el.name) continue;
		if (el.type === 'radio') {
			if (el.checked) v[el.name] = el.value;
		} else if (el.type === 'checkbox' && el.closest('.scelta')) {
			v[el.name] = v[el.name] || [];
			if (el.checked) v[el.name].push(el.value);
		} else if (el.type === 'checkbox') {
			v[el.name] = el.checked;
		} else {
			v[el.name] = el.value;
		}
	}
	return v;
}

function riepilogoLibero(servizio, box) {
	const parti = [servizio + '.'];
	for (const fs of $$('fieldset', box)) {
		const leg = $('legend', fs)?.textContent.trim();
		const sel = $$('input:checked', fs).map((i) => i.closest('label').textContent.trim());
		if (leg && sel.length) parti.push(`${leg} ${sel.join(', ')}.`);
	}
	for (const st of $$('[data-stepper]', box)) {
		const lab = st.parentElement.querySelector('label')?.textContent.trim();
		const inp = $('input', st);
		const un = $('.numero__unita', st)?.textContent.trim() ?? '';
		if (lab && inp.value) parti.push(`${lab}: ${inp.value} ${un}.`);
	}
	return parti.join(' ');
}

for (const calc of $$('[data-calc]')) {
	const tipo = calc.dataset.calc;
	const servizio = calc.dataset.servizio;
	const inputs = $('[data-calc-inputs]', calc);
	const riepilogo = $('[data-riepilogo]');
	const cifra = $('[data-out-cifra]', calc);
	const dettaglio = $('[data-out-dettaglio]', calc);
	const liste = $('[data-out-liste]', calc);
	const conCalcolo = Boolean(cifra);
	// Nella pagina Preventivo ci sono tutti i lavori: scrive il riepilogo solo quello scelto
	const attivo = () => riepilogo && !calc.closest('[hidden]');
	// Le scelte del calcolatore vanno al server, che rifà il conto (backend, Fase 1)
	const segna = (lavoro, calcolo) => {
		if (riepilogo?.form) riepilogo.form._am = { lavoro, calcolo };
	};

	// Ristrutturazioni: simulatore del bagno, oppure prezzo dopo il sopralluogo per gli altri lavori
	const aggiornaRistr = () => {
		const v = leggi(inputs);
		const isBagno = v.cosa === 'bagno';
		for (const g of $$('[data-se]', calc)) g.hidden = g.dataset.se !== (isBagno ? 'bagno' : 'altro');
		for (const a of $$('[data-ris]', calc)) a.hidden = a.dataset.ris !== (isBagno ? 'bagno' : 'altro');
		const barra = $('[data-bagno-barra]', calc);
		if (barra) barra.hidden = !isBagno;
		if (!isBagno) {
			if (attivo()) {
				const cosa = $('input[name="cosa"]:checked', inputs)?.closest('label').textContent.trim();
				riepilogo.value = riepilogoLibero(`${servizio}: ${cosa}`, $('[data-se="altro"]', calc));
				segna(v.cosa || null, null);
			}
			return;
		}
		const r = calcolaBagno(v);
		const cifra = `${euro(r.min)}–${euro(r.max)} €`;
		const box = $('[data-ris="bagno"]', calc);
		if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
			box.classList.add('sta-cambiando');
			clearTimeout(box._t);
			box._t = setTimeout(() => box.classList.remove('sta-cambiando'), 140);
		}
		const c = $('[data-b-cifra]', box);
		c.textContent = cifra + ' ';
		const iva = document.createElement('span');
		iva.className = 'risultato__iva';
		iva.textContent = 'IVA inclusa';
		c.append(iva);
		$('[data-b-iva]', box).textContent = `Senza IVA: ${euro(r.nettoMin)}–${euro(r.nettoMax)} €. IVA al 10% per i lavori sulla casa (aziende ed enti: 22%).`;
		$('[data-b-durata]', box).textContent = r.durata;
		$('[data-barra-cifra]', calc).textContent = cifra;
		const ul = $('[data-b-voci]', box);
		const icona = (n) => {
			const span = document.createElement('span');
			span.className = 'scontrino__icona';
			const svg = $(`[data-icone-set] [data-icona="${n}"] svg`, calc) ?? $('[data-icone-set] svg', calc);
			if (svg) span.append(svg.cloneNode(true));
			return span;
		};
		ul.replaceChildren(
			...r.voci.map((x) => {
				const li = document.createElement('li');
				const a = document.createElement('span');
				const b = document.createElement('span');
				a.className = 'scontrino__nome';
				b.className = 'scontrino__euro';
				a.textContent = x.nome;
				b.textContent = x.daValutare ? 'da valutare' : `${euro(x.min)}–${euro(x.max)} €`;
				li.append(icona(x.icona), a, b);
				return li;
			})
		);
		// Prezzo di ogni livello con le altre scelte di adesso
		for (const el of $$('[data-prezzo-livello]', calc)) {
			const x = calcolaBagno({ ...v, livello: el.dataset.prezzoLivello });
			el.textContent = `${euro(x.min)}–${euro(x.max)} €`;
		}
		// "Mandami il riepilogo": il testo che il cliente si tiene
		const testo = [
			'Stima del mio bagno, da ArtigianaMente',
			r.riepilogo,
			...r.voci.map((x) => `- ${x.nome}: ${x.daValutare ? 'da valutare' : `${euro(x.min)}–${euro(x.max)} €`}`),
			`Durata indicativa: ${r.durata}.`,
			'Stima indicativa, non un’offerta vincolante. Il preventivo scritto arriva dopo il sopralluogo gratuito.',
			location.href.split('#')[0] + '#ristrutturazioni'
		].join('\n');
		$('[data-b-whatsapp]', box).href = 'https://wa.me/?text=' + encodeURIComponent(testo);
		$('[data-b-email]', box).href =
			'mailto:?subject=' + encodeURIComponent('Stima del mio bagno – ArtigianaMente') + '&body=' + encodeURIComponent(testo);
		if (attivo()) {
			riepilogo.value = r.riepilogo;
			segna('bagno', { input: v, mostrato: { min: r.min, max: r.max } });
		}
	};

	const aggiorna = () => {
		if (tipo === 'ristrutturazioni') return aggiornaRistr();
		const v = leggi(inputs);
		if (!conCalcolo) {
			if (attivo()) {
				riepilogo.value = riepilogoLibero(servizio, inputs);
				segna(null, null);
			}
			return;
		}
		const r = calcola(tipo, v);
		const pannello = cifra.closest('.risultato');
		if (pannello && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
			pannello.classList.add('sta-cambiando');
			clearTimeout(pannello._t);
			pannello._t = setTimeout(() => pannello.classList.remove('sta-cambiando'), 140);
		}
		if (r.valutazione || r.vuoto) {
			cifra.textContent = r.vuoto ? '—' : 'Su sopralluogo';
			dettaglio.textContent = r.messaggio || '';
			liste.hidden = true;
		} else {
			cifra.innerHTML = '';
			cifra.append(`${euro(r.min)}–${euro(r.max)} € `);
			const iva = document.createElement('span');
			iva.className = 'risultato__iva';
			iva.textContent = 'IVA inclusa';
			cifra.append(iva);
			dettaglio.textContent = r.dettaglio;
			liste.hidden = false;
			liste.innerHTML = '';
			const ul = document.createElement('ul');
			for (const c of r.comprende) {
				const li = document.createElement('li');
				li.innerHTML = CHECK;
				li.append(c);
				ul.append(li);
			}
			liste.append(ul);
			if (r.esclude.length) {
				const p = document.createElement('p');
				p.className = 'risultato__dettaglio';
				p.style.marginTop = '12px';
				p.textContent = 'Non comprende: ' + r.esclude.join(', ').toLowerCase() + '.';
				liste.append(p);
			}
		}
		if (attivo()) {
			riepilogo.value =
				(r.riepilogo || servizio) + (r.min ? ` Stima indicativa: ${euro(r.min)}–${euro(r.max)} €, IVA ${r.ivaPerc}% inclusa.` : '');
			segna(null, { input: v, mostrato: r.min ? { min: r.min, max: r.max } : null });
		}
	};
	inputs.addEventListener('submit', (e) => e.preventDefault()); // Invio in un campo non ricarica la pagina
	inputs.addEventListener('input', aggiorna);
	inputs.addEventListener('change', aggiorna);
	aggiorna();
}

/* Moduli: con il server collegato inviano davvero (invio.js); nella bozza senza server mostrano solo la prova */
attivaModuli($$('[data-richiesta]'));

/* Modulo generale: campi del trasloco solo quando servono */
const sel = $('[data-servizio-select]');
const soloTraslochi = $('[data-solo-traslochi]');
if (sel && soloTraslochi) {
	const mostra = () => (soloTraslochi.hidden = sel.value !== 'Traslochi');
	sel.addEventListener('change', mostra);
	mostra();
}

/* Visore foto, come Airbnb, su fondo bianco.
   "Tutte le foto": griglia a due colonne. Una foto alla volta: si scorre col dito, "3 di 17", frecce e tasti ← → col computer.
   La galleria in cima alle pagine apre la griglia (data-visore-apri="griglia"); le altre foto aprono subito quella toccata.
   Le foto con lo stesso data-visore-gruppo si sfogliano insieme. */
const visore = $('[data-visore]');
if (visore && typeof visore.showModal === 'function') {
	const vistaGriglia = $('[data-visore-vista="griglia"]', visore);
	const vistaFoto = $('[data-visore-vista="foto"]', visore);
	const griglia = $('[data-visore-griglia]', visore);
	const riga = $('[data-visore-riga]', visore);
	const conta = $('[data-visore-conta]', visore);
	const tutte = $('[data-visore-tutte]', visore);
	const prec = $('[data-visore-prec]', visore);
	const succ = $('[data-visore-succ]', visore);
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let gruppo = [];

	// una foto presa dal link: stessa immagine (e stesse misure) della miniatura, il link ha quella grande
	const immagine = (a, grande) => {
		const mini = $('img', a);
		const img = document.createElement('img');
		img.alt = mini?.alt || '';
		img.decoding = 'async';
		if (grande) {
			img.src = a.getAttribute('href');
			if (mini?.srcset) {
				img.srcset = mini.srcset;
				img.sizes = '100vw';
			}
		} else {
			img.src = mini?.currentSrc || mini?.src || a.getAttribute('href');
			img.loading = 'lazy';
		}
		if (mini?.width && mini?.height) {
			img.width = mini.width;
			img.height = mini.height;
		}
		return img;
	};
	const indice = () => Math.round(riga.scrollLeft / (riga.clientWidth || 1));
	const segna = () => {
		const i = Math.min(gruppo.length - 1, Math.max(0, indice()));
		conta.textContent = `${i + 1} di ${gruppo.length}`;
		prec.disabled = i <= 0;
		succ.disabled = i >= gruppo.length - 1;
	};
	const mostraFoto = (i, morbido = false) => {
		vistaGriglia.hidden = true;
		vistaFoto.hidden = false;
		// con una foto sola niente "Tutte le foto" né "1 di 1" (nascosti senza spostare la ×)
		tutte.style.visibility = conta.style.visibility = gruppo.length < 2 ? 'hidden' : '';
		requestAnimationFrame(() => {
			riga.scrollTo({ left: i * riga.clientWidth, behavior: morbido && !lento ? 'smooth' : 'instant' });
			segna();
		});
	};
	const mostraGriglia = () => {
		vistaFoto.hidden = true;
		vistaGriglia.hidden = false;
		vistaGriglia.scrollTop = 0;
	};
	const apri = (a) => {
		const nome = a.dataset.visoreGruppo;
		gruppo = nome ? $$(`[data-visore-gruppo="${nome}"]`) : [a];
		griglia.replaceChildren(
			...gruppo.map((x, i) => {
				const b = document.createElement('button');
				b.type = 'button';
				b.className = 'visore__mini';
				b.setAttribute('aria-label', `Apri la foto ${i + 1} di ${gruppo.length}`);
				b.append(immagine(x, false));
				b.addEventListener('click', () => mostraFoto(i));
				return b;
			})
		);
		riga.replaceChildren(
			...gruppo.map((x) => {
				const d = document.createElement('div');
				d.className = 'visore__pagina';
				d.append(immagine(x, true));
				return d;
			})
		);
		visore.showModal();
		// il fuoco va sulla finestra, non sul primo pulsante: niente cerchio intorno alla × all'apertura
		visore.focus({ preventScroll: true });
		document.documentElement.classList.add('visore-aperto');
		if (a.dataset.visoreApri === 'griglia' && gruppo.length > 1) mostraGriglia();
		else mostraFoto(gruppo.indexOf(a));
	};
	for (const a of $$('[data-visore-link]')) {
		a.addEventListener('click', (e) => {
			e.preventDefault();
			apri(a);
		});
	}
	const vai = (verso) => mostraFoto(Math.min(gruppo.length - 1, Math.max(0, indice() + verso)), true);
	tutte.addEventListener('click', mostraGriglia);
	prec.addEventListener('click', () => vai(-1));
	succ.addEventListener('click', () => vai(1));
	riga.addEventListener('scroll', segna, { passive: true });
	addEventListener('resize', () => {
		if (visore.open && !vistaFoto.hidden) mostraFoto(indice());
	});
	visore.addEventListener('keydown', (e) => {
		if (vistaFoto.hidden || gruppo.length < 2) return;
		if (e.key === 'ArrowRight') vai(1);
		else if (e.key === 'ArrowLeft') vai(-1);
	});
	// chiudendo, la libreria scende piano e poi sparisce (anche con Esc)
	const chiudi = () => {
		if (!visore.open || visore.classList.contains('is-chiude')) return;
		if (lento) return visore.close();
		visore.classList.add('is-chiude');
		setTimeout(() => {
			visore.close();
			visore.classList.remove('is-chiude');
		}, 250);
	};
	for (const b of $$('[data-visore-chiudi]', visore)) b.addEventListener('click', chiudi);
	visore.addEventListener('cancel', (e) => {
		e.preventDefault();
		chiudi();
	});
	visore.addEventListener('close', () => {
		document.documentElement.classList.remove('visore-aperto');
		riga.replaceChildren();
		griglia.replaceChildren();
	});
}

/* Pagina Lavori: pallini sotto ogni fila di foto, uno per ogni posizione in cui la fila si ferma */
for (const riga of $$('[data-punti-riga]')) {
	const box = riga.nextElementSibling?.matches('[data-punti]') ? riga.nextElementSibling : null;
	if (!box) continue;
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const passo = () => (riga.firstElementChild?.offsetWidth || riga.clientWidth) + (parseFloat(getComputedStyle(riga).columnGap) || 0);
	const max = () => riga.scrollWidth - riga.clientWidth;
	let punti = [];
	const disegna = () => {
		const n = max() > 2 ? Math.ceil(max() / passo() - 0.05) + 1 : 0;
		if (n === punti.length) return;
		punti = Array.from({ length: n }, (_, i) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = 'v3-galleria__punto';
			b.tabIndex = -1;
			b.addEventListener('click', () => riga.scrollTo({ left: Math.min(max(), i * passo()), behavior: lento ? 'auto' : 'smooth' }));
			return b;
		});
		box.replaceChildren(...punti);
		segna();
	};
	const segna = () => {
		if (!punti.length) return;
		const i = riga.scrollLeft >= max() - 2 ? punti.length - 1 : Math.round(riga.scrollLeft / passo());
		punti.forEach((p, k) => p.classList.toggle('is-attivo', k === i));
	};
	riga.addEventListener('scroll', segna, { passive: true });
	if ('ResizeObserver' in window) new ResizeObserver(disegna).observe(riga);
	else addEventListener('resize', disegna);
	disegna();
}

/* Gallerie (in cima alle pagine, schede della home, tipi di ristrutturazione…): si scorrono col dito,
   "1 / 6" segue la foto (dove c'è), frecce ‹ › col mouse, pallini sotto */
for (const g of $$('[data-galleria]')) {
	const riga = $('[data-galleria-riga]', g);
	const n = $('[data-galleria-n]', g);
	const prec = $('[data-galleria-prec]', g);
	const succ = $('[data-galleria-succ]', g);
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const quale = () => Math.round(riga.scrollLeft / (riga.clientWidth || 1));
	// pallini sotto la galleria: quello acceso è la foto che stai guardando; toccandone uno si va a quella foto
	const punti = $$('[data-galleria-punto]', g.parentElement);
	const stato = () => {
		const i = quale();
		if (n) n.textContent = String(i + 1);
		if (prec) prec.disabled = i <= 0;
		if (succ) succ.disabled = i >= riga.children.length - 1;
		punti.forEach((p, k) => p.classList.toggle('is-attivo', k === i));
	};
	const vai = (verso) => riga.scrollTo({ left: (quale() + verso) * riga.clientWidth, behavior: lento ? 'auto' : 'smooth' });
	for (const p of punti)
		p.addEventListener('click', () =>
			riga.scrollTo({ left: Number(p.dataset.galleriaPunto) * riga.clientWidth, behavior: lento ? 'auto' : 'smooth' })
		);
	prec?.addEventListener('click', () => vai(-1));
	succ?.addEventListener('click', () => vai(1));
	riga.addEventListener('scroll', stato, { passive: true });
	stato();
}

/* Home: la foto di sfondo è alta quanto la prima schermata (titolo e ricerca);
   le icone dei lavori arrivano subito sotto, la freccia ↓ ci porta lì */
const sfondo = $('[data-sfondo]');
const zonaCerca = $('.v3-cerca');
if (sfondo && zonaCerca) {
	const fine = () => zonaCerca.offsetTop + zonaCerca.offsetHeight;
	const misura = () => (sfondo.style.height = `${fine()}px`);
	misura();
	addEventListener('resize', misura);
	document.addEventListener('sfondo-misura', misura);
	addEventListener('load', misura);
	$('[data-giu]')?.addEventListener('click', () =>
		scrollTo({
			top: fine(), // le icone salgono in cima (sul computer nella riga dell'intestazione)
			behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		})
	);
}

/* Icone dei lavori (in ogni pagina): l'icona attiva si vede subito, anche quando la riga scorre di lato.
   Si centra solo se non si vede già intera (lo fa già lo script in fondo alla pagina, prima del primo disegno). */
const barraChips = $('[data-chips]');
const chipAttiva = barraChips && $('.v3-chip.is-active', barraChips);
if (chipAttiva) {
	const riga = chipAttiva.parentElement;
	const fuori = chipAttiva.offsetLeft + chipAttiva.offsetWidth > riga.scrollLeft + riga.clientWidth - 8 || chipAttiva.offsetLeft < riga.scrollLeft;
	if (fuori) riga.scrollLeft = Math.max(0, chipAttiva.offsetLeft - riga.clientWidth / 2 + chipAttiva.offsetWidth / 2);
}

/* Home: la vetrina. La ricerca e le icone portano alla pagina di ogni lavoro */
const contenuto = $('[data-contenuto]');
if (contenuto) {
	const form = $('[data-ricerca-form]');
	const input = $('[data-ricerca]');
	const pulisci = $('[data-ricerca-pulisci]');
	const sugg = $('[data-suggerimenti]');
	const frequenti = $('[data-sugg-frequenti]');
	const risultati = $('[data-sugg-risultati]');
	const vuotoSugg = $('[data-sugg-vuoto]');
	const bottoniRis = $$('[data-risultato]');
	const vuoto = $('[data-vuoto]');
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const pagina = (slug) => `./${slug}.html`;

	// Porta la vetrina subito sotto le icone fisse
	const scorriAiLavori = (morbido) => {
		// telefono: in cima solo le icone; computer: icone e intestazione stanno nella stessa riga
		const alto = barraChips?.offsetHeight || 0; // in cima restano solo le icone (sul computer nella riga dell'intestazione)
		const y = contenuto.getBoundingClientRect().top + scrollY - alto;
		scrollTo({ top: Math.max(0, y), behavior: morbido && !ridotto ? 'smooth' : 'instant' });
	};

	// Indirizzi vecchi (#traslochi, #azienda…): ora ogni lavoro ha la sua pagina
	const daIndirizzo = (primaVolta) => {
		const h = decodeURIComponent(location.hash.slice(1));
		if (h && h !== 'tutto' && bottoniRis.some((b) => b.dataset.risultato === h)) location.replace(pagina(h));
		else if (h === 'tutto' && !(primaVolta && tornato)) requestAnimationFrame(() => scorriAiLavori(!primaVolta));
	};
	daIndirizzo(true);
	addEventListener('hashchange', () => daIndirizzo(false));

	// "Tutto" in home: resta qui e scende alla vetrina
	$('[data-chip="tutto"]')?.addEventListener('click', (e) => {
		e.preventDefault();
		try {
			history.replaceState(null, '', location.pathname + '#tutto');
		} catch {
			// in alcune anteprime l'indirizzo non si può cambiare
		}
		scorriAiLavori(true);
	});

	const aggiornaPulisci = () => (pulisci.hidden = !input.value);

	const vai = (testo) => {
		const trovati = cerca(testo);
		if (trovati.length) {
			location.href = pagina(trovati[0]);
			return;
		}
		// niente trovato: un messaggio gentile sopra la vetrina
		sugg.hidden = true;
		input.blur();
		vuoto.hidden = false;
		scorriAiLavori(true);
	};

	// Tendina sotto la barra: ricerche frequenti se è vuota, i lavori trovati mentre scrivi
	const tendina = () => {
		const testo = input.value.trim();
		const scrivo = testo.length >= 2;
		frequenti.hidden = scrivo;
		risultati.hidden = !scrivo;
		if (!scrivo) return;
		const trovati = cerca(testo).slice(0, matchMedia('(max-width: 760px)').matches ? 3 : 4);
		for (const b of bottoniRis) b.hidden = !trovati.includes(b.dataset.risultato);
		for (const slug of trovati) {
			const b = bottoniRis.find((x) => x.dataset.risultato === slug);
			if (b) risultati.insertBefore(b, vuotoSugg);
		}
		vuotoSugg.hidden = trovati.length > 0;
	};

	input.addEventListener('input', () => {
		sugg.hidden = document.activeElement !== input;
		vuoto.hidden = true;
		tendina();
		aggiornaPulisci();
	});
	input.addEventListener('focus', () => {
		sugg.hidden = false;
		tendina();
		// Sul telefono la barra sale sotto l'intestazione, così i suggerimenti restano sopra la tastiera
		if (matchMedia('(max-width: 760px)').matches) {
			setTimeout(() => {
				const titolo = $('.v3-cerca__titolo') || form;
				const y = titolo.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 60) - 10;
				if (y > scrollY + 8) scrollTo({ top: y, behavior: ridotto ? 'auto' : 'smooth' });
			}, 280);
		}
	});
	// Su Safari (Mac e iPhone) un bottone toccato non prende il fuoco: senza questo la tendina si chiudeva
	// prima del clic e i risultati non si potevano scegliere
	sugg.addEventListener('mousedown', (e) => {
		if (e.target.closest('button')) e.preventDefault();
	});
	form.addEventListener('focusout', () =>
		setTimeout(() => {
			if (!form.contains(document.activeElement) && !sugg.matches(':hover')) sugg.hidden = true;
		}, 150)
	);
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const testo = input.value.trim();
		if (testo) vai(testo);
	});
	form.addEventListener('keydown', (e) => {
		const voci = $$('button', sugg).filter((b) => b.offsetParent !== null);
		const i = voci.indexOf(document.activeElement);
		if (e.key === 'Escape') {
			sugg.hidden = true;
			input.focus();
		} else if (!sugg.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			e.preventDefault();
			const n = e.key === 'ArrowDown' ? i + 1 : i - 1;
			if (n < 0) input.focus();
			else voci[Math.min(n, voci.length - 1)].focus();
		}
	});
	sugg.addEventListener('click', (e) => {
		const r = e.target.closest('[data-risultato]');
		if (r) {
			location.href = pagina(r.dataset.risultato);
			return;
		}
		const b = e.target.closest('[data-suggerimento]');
		if (!b) return;
		input.value = b.dataset.suggerimento;
		vai(b.dataset.suggerimento);
	});
	pulisci.addEventListener('click', () => {
		input.value = '';
		aggiornaPulisci();
		vuoto.hidden = true;
		tendina();
		input.focus();
	});
}

/* Pagina Preventivo: scegli il servizio, rispondi, vedi la stima; i dati solo se chiedi il sopralluogo */
const pv = $('[data-pv]');
if (pv) {
	const lavori = $$('[data-scegli]', pv);
	const pannelli = $$('[data-pannello]', pv);
	const scelta = $('[data-pv-scelta]', pv);
	const scelto = $('[data-pv-scelto]', pv);
	const domande = $('[data-pv-domande]', pv);
	const dati = $('[data-pv-dati]', pv);
	const campoLavoro = $('[data-pv-lavoro]', pv);
	const riepilogo = $('[data-riepilogo]', pv);
	const riepTesto = $('[data-pv-riep]', pv);
	const riepBox = $('[data-pv-riep-box]', pv);
	const comuneCampo = $('[data-pv-comune-campo]', pv);
	const msg = $('[data-pv-msg]', pv);
	const facolt = $('[data-pv-facolt]', pv);
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const vai = (el) => el.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });

	// "La tua richiesta": riepilogo leggibile, niente casella da riempire
	const mostraRiep = () => {
		riepTesto.textContent = riepilogo.value;
		riepBox.hidden = !riepilogo.value;
	};
	const apriDati = () => {
		mostraRiep();
		dati.hidden = false;
		vai(dati);
	};

	const telefono = () => matchMedia('(max-width: 860px)').matches;
	// × della tendina: si torna alla pagina di prima del sito (es. Traslochi), altrimenti alla scelta del servizio
	$('[data-foglio-chiudi]')?.addEventListener('click', () => {
		let primaNelSito = false;
		try {
			primaNelSito = !!document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1;
		} catch {
			// referrer non leggibile: si resta qui
		}
		if (primaNelSito) history.back();
		else $('[data-pv-cambia]', pv).click();
	});
	const scegli = (slug, scorri) => {
		const btn = lavori.find((b) => b.dataset.scegli === slug);
		if (!btn) return;
		// una domanda già risposta dalla pagina di prima (es. "Cucina") torna visibile se si cambia lavoro
		for (const f of $$('[data-pv-fissata]', pv)) {
			f.hidden = false;
			delete f.dataset.pvFissata;
		}
		for (const b of lavori) {
			b.classList.toggle('is-active', b === btn);
			b.setAttribute('aria-pressed', String(b === btn));
		}
		for (const pan of pannelli) pan.hidden = pan.dataset.pannello !== slug;
		const nome = $('.v3-pv__nome', btn).textContent.trim();
		scelta.hidden = true;
		scelto.hidden = false;
		$('[data-pv-scelto-nome]', scelto).textContent = nome;
		$('[data-pv-scelto-icona]', scelto).replaceChildren($('svg', btn).cloneNode(true));
		domande.hidden = false;
		campoLavoro.value = nome;
		if (campoLavoro.form) {
			campoLavoro.form.dataset.servizio = slug;
			if (slug === 'altro') campoLavoro.form._am = null;
		}
		const altro = slug === 'altro';
		msg.required = altro;
		facolt.hidden = altro;
		// nei traslochi partenza e arrivo li abbiamo già: niente terza domanda sul comune
		const trasloco = slug === 'traslochi';
		// traslochi: titolo più corto e meno spazio sopra, così il passo aperto arriva prima
		document.documentElement.classList.toggle('pv-trasloco', trasloco);
		// sul telefono la stima del trasloco diventa una tendina a tutto schermo
		document.documentElement.classList.toggle('pv-foglio', trasloco);
		comuneCampo.hidden = trasloco;
		$('input', comuneCampo).required = !trasloco;
		dati.hidden = !altro;
		$('[data-conferma]', dati).hidden = true;
		if (altro) riepilogo.value = 'Altro lavoro: vedi la descrizione.';
		else $(`[data-pannello="${slug}"] [data-calc-inputs]`, pv)?.dispatchEvent(new Event('input', { bubbles: true }));
		mostraRiep();
		try {
			history.replaceState(null, '', location.pathname + '#' + slug);
		} catch {
			// in alcune anteprime l'indirizzo non si può cambiare
		}
		// nella tendina del trasloco si parte dall'alto; altrimenti si va al servizio scelto
		if (scorri) trasloco && telefono() ? scrollTo({ top: 0, behavior: 'instant' }) : vai(scelto);
	};

	for (const b of lavori) b.addEventListener('click', () => scegli(b.dataset.scegli, true));
	$('[data-pv-cambia]', pv).addEventListener('click', () => {
		scelta.hidden = false;
		scelto.hidden = true;
		document.documentElement.classList.remove('pv-trasloco', 'pv-foglio');
		vai(scelta);
	});
	// "Richiedi un sopralluogo", "Parliamone insieme": aprono il modulo dei dati
	pv.addEventListener('click', (e) => {
		const a = e.target.closest('a[href="#dati"]');
		if (!a) return;
		e.preventDefault();
		apriDati();
	});
	for (const ev of ['input', 'change']) pv.addEventListener(ev, () => setTimeout(mostraRiep, 0));

	// Arrivo da una pagina del servizio (preventivo.html#parquet): servizio già scelto, si va alle domande
	// #ristrutturazioni:cucina → ristrutturazioni con "Cucina" già scelta
	const daIndirizzo = (primaVolta) => {
		const [h, sub] = decodeURIComponent(location.hash.slice(1)).split(':');
		if (h === 'dati') return;
		if (!lavori.some((b) => b.dataset.scegli === h)) return;
		const fai = () => {
			const r = sub && $(`[data-pannello="${h}"] input[name="cosa"][value="${sub}"]`, pv);
			if (r) r.checked = true;
			scegli(h, !(primaVolta && tornato));
			// "Parliamo della tua cucina": la cucina è già scelta, niente domanda "Quale spazio vuoi rinnovare?".
			// Si vede in alto: "Ristrutturazioni · Cucina · Modifica"
			if (r) {
				const domanda = r.closest('fieldset');
				domanda.hidden = true;
				domanda.dataset.pvFissata = '';
				const nome = $('[data-pv-scelto-nome]', scelto);
				nome.textContent = `${nome.textContent} · ${r.closest('label').textContent.trim()}`;
			}
		};
		// la prima volta subito, così la pagina è già quella giusta quando il browser la rimette dov'era
		if (primaVolta === true) fai();
		else requestAnimationFrame(fai);
	};
	addEventListener('hashchange', () => daIndirizzo(false));
	daIndirizzo(true);
}

/* "Stampa il riepilogo": stampa solo il riepilogo del bagno (dal menu di stampa si salva come PDF) */
for (const b of $$('[data-stampa]')) {
	b.addEventListener('click', () => {
		document.documentElement.classList.add('stampa-bagno');
		print();
		setTimeout(() => document.documentElement.classList.remove('stampa-bagno'), 500);
	});
}

/* Telefono: barretta con il budget sempre a portata, sparisce quando il riepilogo è sullo schermo */
for (const barra of $$('[data-bagno-barra]')) {
	const box = barra.parentElement.querySelector('[data-ris="bagno"]');
	if (!box || !('IntersectionObserver' in window)) continue;
	new IntersectionObserver(([e]) => barra.classList.toggle('is-nascosta', e.isIntersecting), { threshold: 0.15 }).observe(box);
	barra.addEventListener('click', () => box.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

/* Freccia "indietro": torna alla pagina di prima del sito, altrimenti va alla home */
for (const a of $$('[data-indietro]')) {
	a.addEventListener('click', (e) => {
		let dalSito = false;
		try {
			dalSito = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
		} catch {
			dalSito = false;
		}
		if (dalSito && history.length > 1) {
			e.preventDefault();
			history.back();
		}
	});
}

/* Mappe "Dove siamo": disegnate con MapLibre e la mappa libera di OpenFreeMap (nitida anche su iPhone).
   Il programma (nel sito, cartella vendor) si carica solo quando una mappa sta per vedersi. */
const mappe = $$('[data-mappa]');
if (mappe.length && 'IntersectionObserver' in window) {
	const base = new URL('../vendor/maplibre/', import.meta.url);
	let libreria;
	const carica = () =>
		(libreria ||= new Promise((ok, no) => {
			const css = document.createElement('link');
			css.rel = 'stylesheet';
			css.href = new URL('maplibre-gl.css', base).href;
			document.head.append(css);
			const s = document.createElement('script');
			s.src = new URL('maplibre-gl.js', base).href;
			s.onload = ok;
			s.onerror = no;
			document.head.append(s);
		}));
	const disegna = async (el) => {
		try {
			await carica();
			const mappa = new window.maplibregl.Map({
				container: el,
				style: 'https://tiles.openfreemap.org/styles/bright',
				center: [Number(el.dataset.lon), Number(el.dataset.lat)],
				zoom: el.clientWidth < 600 ? 12.2 : 12.8,
				interactive: false,
				attributionControl: false,
				fadeDuration: 0
			});
			mappa.once('load', () => el.classList.add('is-pronta'));
		} catch {
			// senza mappa resta il fondo chiaro con il pallino: si può sempre toccare per aprire Mappe
		}
	};
	const guarda = new IntersectionObserver(
		(voci) => {
			for (const v of voci) {
				if (!v.isIntersecting) continue;
				guarda.unobserve(v.target);
				disegna(v.target);
			}
		},
		{ rootMargin: '300px' }
	);
	for (const m of mappe) guarda.observe(m);
}

/* "Portami qui": su iPhone, iPad e Mac apre Mappe di Apple, altrimenti Google Maps */
if (/iPhone|iPad|Macintosh/.test(navigator.userAgent)) {
	for (const a of $$('[data-portami]')) a.href = `https://maps.apple.com/?daddr=${encodeURIComponent(a.dataset.portami)}`;
}

/* Righe con frecce ‹ › (come Airbnb): scorrono di una pagina e si spengono agli estremi. Sul telefono si usa il dito. */
for (const box of $$('[data-scorri]')) {
	const riga = $('[data-scorri-riga]', box);
	const indietro = $('[data-scorri-prec]', box);
	const avanti = $('[data-scorri-succ]', box);
	if (!riga || !indietro || !avanti) continue;
	const lento = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const stato = () => {
		indietro.disabled = riga.scrollLeft <= 2;
		avanti.disabled = riga.scrollLeft >= riga.scrollWidth - riga.clientWidth - 2;
	};
	const vai = (verso) => {
		const card = riga.firstElementChild;
		const spazio = parseFloat(getComputedStyle(riga).columnGap) || 0;
		const larga = card ? card.offsetWidth + spazio : riga.clientWidth;
		const quante = Math.max(1, Math.floor((riga.clientWidth + spazio) / larga));
		riga.scrollBy({ left: verso * larga * quante, behavior: lento ? 'auto' : 'smooth' });
	};
	indietro.addEventListener('click', () => vai(-1));
	avanti.addEventListener('click', () => vai(1));
	riga.addEventListener('scroll', stato, { passive: true });
	// anche quando la riga diventa visibile (schede della home) o cambia la finestra
	if ('ResizeObserver' in window) new ResizeObserver(stato).observe(riga);
	else addEventListener('resize', stato);
	stato();
}


/* Tipi di ristrutturazione: pulsanti che cambiano la scheda sotto */
const tipi = $$('[data-tipo]');
if (tipi.length) {
	const pannelli = $$('[data-tipo-pannello]');
	// riquadro di lato e barra in fondo seguono il tipo scelto: prezzo (o "Prezzo dopo il sopralluogo"),
	// condizione e pulsante che porta al preventivo di quel tipo (10/10, brief: il caso Tetti con "Da 4.000 €")
	const base = $('[data-vivo-href]')?.getAttribute('href')?.split('#')[0] || '';
	const vivo = (b) => {
		const prezzo = b.dataset.tipoPrezzo;
		for (const el of $$('[data-vivo-prezzo]'))
			el.innerHTML = prezzo ? `<span>Da <strong>${prezzo}</strong></span><small>IVA inclusa</small>` : '<span>Prezzo dopo il sopralluogo</span>';
		for (const el of $$('[data-vivo-nota]')) el.textContent = prezzo ? b.dataset.tipoNota : 'Lo definiamo dopo aver visto il lavoro.';
		if (base) for (const el of $$('[data-vivo-href]')) el.setAttribute('href', `${base}#ristrutturazioni:${b.dataset.tipoSub}`);
	};
	const mostra = (id, segnaIndirizzo = false) => {
		for (const b of tipi) {
			const si = b.dataset.tipo === id;
			b.classList.toggle('is-active', si);
			b.setAttribute('aria-selected', String(si));
			if (si) vivo(b);
		}
		for (const pn of pannelli) pn.hidden = pn.dataset.tipoPannello !== id;
		// il tipo resta anche ricaricando o tornando indietro
		if (segnaIndirizzo)
			try {
				history.replaceState(history.state, '', `${location.pathname}${location.search}#tipo-${id}`);
			} catch {
				// alcune anteprime non lasciano cambiare l'indirizzo
			}
	};
	for (const b of tipi) b.addEventListener('click', () => mostra(b.dataset.tipo, true));
	// all'apertura il riquadro porta già al preventivo del tipo mostrato (es. bagno)
	const attivo = tipi.find((b) => b.classList.contains('is-active'));
	if (attivo) vivo(attivo);
	// ristrutturazioni.html#tipo-cucina apre subito la cucina
	const daIndirizzo = () => {
		const h = decodeURIComponent(location.hash.slice(1));
		if (h.startsWith('tipo-') && tipi.some((b) => b.dataset.tipo === h.slice(5))) {
			mostra(h.slice(5));
			// ricaricando o tornando indietro il browser rimette la pagina dov'era: niente salti
			if (!tornato) requestAnimationFrame(() => $('#tipi')?.scrollIntoView({ block: 'start' }));
		}
	};
	addEventListener('hashchange', daIndirizzo);
	daIndirizzo();
}

/* Calcolatore del trasloco: lo script si carica solo dove serve */
/* Entrata morbida (10/10): schede e sezioni che arrivano scorrendo salgono piano, solo la prima volta.
   Quello che si vede già all'apertura resta fermo (niente lampi); col tasto indietro e con "Riduci movimento" niente. */
if (
	'IntersectionObserver' in window &&
	!matchMedia('(prefers-reduced-motion: reduce)').matches &&
	!document.documentElement.classList.contains('torna')
) {
	const vista = new IntersectionObserver(
		(voci) => {
			for (const v of voci) {
				if (!v.isIntersecting) continue;
				v.target.classList.add('si-vede');
				vista.unobserve(v.target);
				// a fine entrata si tolgono le classi: niente trasformazioni rimaste addosso
				setTimeout(() => v.target.classList.remove('entra', 'si-vede'), 900);
			}
		},
		{ rootMargin: '0px 0px -6% 0px' }
	);
	const candidati = $$('.v3-card, .v3-sezione:not(:has(.v3-griglia)):not(.v3-pv__passo)').filter((e) => !e.closest('.v3-pv'));
	for (const e of candidati) {
		if (e.getBoundingClientRect().top < innerHeight) continue;
		e.classList.add('entra');
		vista.observe(e);
	}
}

if ($('[data-trasloco]')) import('./trasloco-ui.js?v=2026101021-r4');

/* Link alla stessa pagina (es. "Scrivici" → #scrivici): scorrimento morbido fatto qui, non dal CSS */
document.addEventListener('click', (e) => {
	const a = e.target.closest('a[href^="#"]');
	if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
	const id = decodeURIComponent(a.getAttribute('href').slice(1));
	const el = id && document.getElementById(id);
	if (!el) return;
	e.preventDefault();
	el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});

/* Calendario unico, come Airbnb (10/10): giorno del sopralluogo e inizio desiderato. Sono PREFERENZE, non
   prenotazioni. Lo aprono le caselle del riquadro di lato (pagine dei lavori, computer) e le righe di
   "Quando ti va bene?" nel modulo. Le date scelte restano nella sessione e arrivano già scritte nel modulo.
   Niente fine prevista finché Fabri non approva le durate (MOSTRA_FINE). Giorni esclusi: passati, sabati,
   domeniche, festivi (Pasquetta compresa, 4 ottobre dal 2026) e ferie di Fabri (data.js, ferie). */
const cal = $('[data-cal]');
if (cal) {
	const MOSTRA_FINE = false;
	const CHIAVE = 'am-date';
	const mesiBox = $('[data-cal-mesi]', cal);
	const titolo = $('[data-cal-titolo]', cal);
	const sceltaTesto = $('[data-cal-scelta]', cal);
	const salva = $('[data-cal-salva]', cal);
	const ferie = (() => {
		try {
			return JSON.parse(cal.dataset.ferie || '[]');
		} catch {
			return [];
		}
	})();
	const pv = $('[data-pv]');
	const avviso = $('[data-quando-avviso]');
	let modo = 'sopralluogo';
	let provvisoria = null;

	// giorni civili, senza ore: niente spostamenti di un giorno col cambio dell'ora
	const oggi = () => {
		const d = new Date();
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	};
	const piu = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
	const piuMesi = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
	const chiave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const daChiave = (k) => {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(k || '')) return null;
		const [y, m, g] = k.split('-').map(Number);
		return new Date(y, m - 1, g);
	};
	const pasqua = (y) => {
		const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
		const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
		const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
		const mese = Math.floor((h + l - 7 * m + 114) / 31), giorno = ((h + l - 7 * m + 114) % 31) + 1;
		return new Date(y, mese - 1, giorno);
	};
	const festivi = new Map();
	const festivo = (d) => {
		const y = d.getFullYear();
		if (!festivi.has(y)) {
			const f = new Set(['01-01', '01-06', '04-25', '05-01', '06-02', '08-15', '11-01', '12-08', '12-25', '12-26', chiave(piu(pasqua(y), 1)).slice(5)]);
			if (y >= 2026) f.add('10-04'); // San Francesco, di nuovo festa nazionale (legge 151/2025)
			festivi.set(y, f);
		}
		return festivi.get(y).has(chiave(d).slice(5));
	};
	const inFerie = (d) => {
		const k = chiave(d);
		return ferie.some(([da, a]) => k >= da && k <= (a || da));
	};
	const lavorativo = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !festivo(d) && !inFerie(d);

	// il servizio di cui parliamo: pagina del lavoro, oppure quello scelto nel Preventivo
	const servizio = () => cal.dataset.servizio || $('[data-scegli].is-active')?.dataset.scegli || '';
	const trasloco = () => servizio() === 'traslochi';

	// un'unica sorgente: la sessione (niente dati personali nell'indirizzo)
	const leggi = () => {
		try {
			const v = JSON.parse(sessionStorage.getItem(CHIAVE) || '{}');
			return { servizio: v.servizio || '', sopralluogo: daChiave(v.sopralluogo), inizio: daChiave(v.inizio) };
		} catch {
			return { servizio: '', sopralluogo: null, inizio: null };
		}
	};
	const valori = leggi();
	const scrivi = () => {
		try {
			sessionStorage.setItem(
				CHIAVE,
				JSON.stringify({ servizio: valori.servizio, sopralluogo: valori.sopralluogo ? chiave(valori.sopralluogo) : '', inizio: valori.inizio ? chiave(valori.inizio) : '' })
			);
		} catch {
			// sessione non disponibile (navigazione privata): le date valgono solo in questa pagina
		}
	};

	// limiti delle preferenze (non disponibilità reali)
	const limiti = (k) => {
		const o = oggi();
		if (k === 'sopralluogo') return [piu(o, 2), piuMesi(o, 3)];
		return [valori.sopralluogo ? piu(valori.sopralluogo, 1) : piu(o, 7), piuMesi(o, 12)];
	};
	const valida = (k, d) => {
		if (!d) return false;
		const [min, max] = limiti(k);
		return d >= min && d <= max && lavorativo(d);
	};
	// ogni volta che cambia qualcosa, si ricontrollano tutte: una preferenza non più valida si toglie, non si sposta
	const rivalida = () => {
		if (valori.sopralluogo && !valida('sopralluogo', valori.sopralluogo)) valori.sopralluogo = null;
		if (valori.inizio && !valida('inizio', valori.inizio)) valori.inizio = null;
	};

	const anno = (d) => (d.getFullYear() !== oggi().getFullYear() ? { year: 'numeric' } : {});
	const lungo = (d) => d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', ...anno(d) });
	const corto = (d) => d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', ...anno(d) });

	const aggiorna = () => {
		for (const t of $$('[data-quando-etichetta]')) t.textContent = trasloco() ? 'Giorno del trasloco' : 'Inizio desiderato';
		for (const k of ['sopralluogo', 'inizio']) {
			const v = valori[k];
			for (const t of $$(`[data-quando-testo="${k}"]`)) {
				const mini = !!t.closest('[data-quando-mini]');
				t.textContent = v ? (mini ? corto(v) : lungo(v)) : 'Scegli un giorno';
				t.closest('button')?.classList.toggle('is-pieno', !!v);
			}
			for (const i of $$(`[data-quando-valore="${k}"]`)) i.value = v ? chiave(v) : '';
		}
	};

	// cambio di lavoro: l'inizio desiderato si toglie (e lo diciamo); il sopralluogo resta se è ancora valido
	const controllaServizio = () => {
		const s = servizio();
		if (!s) return;
		if (valori.servizio && valori.servizio !== s && valori.inizio) {
			valori.inizio = null;
			if (avviso) {
				avviso.textContent = 'Hai cambiato lavoro: scegli di nuovo l’inizio desiderato.';
				avviso.hidden = false;
			}
		}
		valori.servizio = s;
		rivalida();
		scrivi();
		aggiorna();
	};

	const segna = () => {
		const kp = provvisoria && chiave(provvisoria);
		for (const b of $$('.cal__giorno', mesiBox)) {
			const scelto = b.dataset.giorno === kp;
			b.classList.toggle('is-scelto', scelto);
			b.setAttribute('aria-pressed', String(scelto));
		}
		sceltaTesto.textContent = provvisoria ? lungo(provvisoria) : 'Nessuna preferenza: puoi andare avanti anche senza';
		salva.disabled = !provvisoria && !valori[modo];
	};
	const disegna = () => {
		const [min, max] = limiti(modo);
		const o = oggi();
		const frag = document.createDocumentFragment();
		const mesi = (max.getFullYear() - o.getFullYear()) * 12 + max.getMonth() - o.getMonth() + 1;
		for (let m = 0; m < mesi; m++) {
			const primo = new Date(o.getFullYear(), o.getMonth() + m, 1);
			const sez = document.createElement('section');
			sez.className = 'cal__mese';
			const nome = document.createElement('h3');
			nome.className = 'cal__nome';
			const testo = primo.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
			nome.textContent = testo.charAt(0).toUpperCase() + testo.slice(1);
			const griglia = document.createElement('div');
			griglia.className = 'cal__griglia';
			for (let i = 0; i < (primo.getDay() + 6) % 7; i++) griglia.append(document.createElement('span'));
			const ultimo = new Date(primo.getFullYear(), primo.getMonth() + 1, 0).getDate();
			for (let g = 1; g <= ultimo; g++) {
				const d = new Date(primo.getFullYear(), primo.getMonth(), g);
				const ok = d >= min && d <= max && lavorativo(d);
				const b = document.createElement('button');
				b.type = 'button';
				b.className = 'cal__giorno';
				b.textContent = g;
				b.disabled = !ok;
				b.dataset.giorno = chiave(d);
				b.setAttribute('aria-label', lungo(d) + (ok ? '' : ', non disponibile'));
				griglia.append(b);
			}
			sez.append(nome, griglia);
			frag.append(sez);
		}
		mesiBox.replaceChildren(frag);
	};

	let daChi = null; // il pulsante che ha aperto il calendario: ci torna il fuoco alla chiusura
	const apri = (k, chi) => {
		controllaServizio();
		modo = k;
		daChi = chi;
		provvisoria = valori[k];
		titolo.textContent = k === 'sopralluogo' ? 'Giorno del sopralluogo' : trasloco() ? 'Giorno del trasloco' : 'Inizio desiderato';
		disegna();
		segna();
		cal.showModal();
		document.documentElement.classList.add('cal-aperto');
		const vedi = $('.cal__giorno.is-scelto', mesiBox) || $('.cal__giorno:not(:disabled)', mesiBox);
		mesiBox.scrollTop = vedi ? Math.max(0, vedi.closest('.cal__mese').offsetTop - mesiBox.offsetTop) : 0;
		vedi?.focus({ preventScroll: true });
	};
	const chiudi = () => {
		if (cal.open) cal.close();
	};
	cal.addEventListener('close', () => {
		document.documentElement.classList.remove('cal-aperto');
		daChi?.focus({ preventScroll: true });
	});
	cal.addEventListener('click', (e) => {
		if (e.target === cal) chiudi();
	});
	mesiBox.addEventListener('click', (e) => {
		const b = e.target.closest('.cal__giorno');
		if (!b || b.disabled) return;
		provvisoria = daChiave(b.dataset.giorno);
		segna();
	});
	$('[data-cal-chiudi]', cal).addEventListener('click', chiudi);
	$('[data-cal-annulla]', cal).addEventListener('click', () => {
		provvisoria = null;
		segna();
	});
	salva.addEventListener('click', () => {
		valori[modo] = provvisoria;
		valori.servizio = servizio();
		rivalida();
		scrivi();
		aggiorna();
		chiudi();
	});
	document.addEventListener('click', (e) => {
		const b = e.target.closest?.('[data-quando-apri]');
		if (b) apri(b.dataset.quandoApri, b);
	});
	// Preventivo: quando si sceglie o cambia il lavoro
	if (pv) {
		document.addEventListener('click', (e) => {
			if (e.target.closest?.('[data-scegli]')) setTimeout(controllaServizio, 0);
		});
		addEventListener('hashchange', () => setTimeout(controllaServizio, 0));
	}
	// date scadute o non più valide (es. tornando dopo qualche giorno): si tolgono
	rivalida();
	setTimeout(controllaServizio, 0);
	aggiorna();
	void MOSTRA_FINE;
}

/* Recensioni: "Mostra tutte e N le recensioni" apre le altre (sul computer se ne vedono 4) */
for (const sez of $$('[data-recensioni]')) {
	const b = $('[data-recensioni-tutte]', sez);
	if (!b) continue;
	const testo = b.textContent;
	b.addEventListener('click', () => {
		const aperte = sez.classList.toggle('is-tutte');
		b.setAttribute('aria-expanded', String(aperte));
		b.textContent = aperte ? 'Mostra meno' : testo;
		if (!aperte) sez.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
	});
}

/* Barre in fondo assenti quando non servono (10/10, brief): con il modulo della richiesta aperto
   (nei Traslochi sparisce "Inserisci partenza e arrivo / Continua") e mentre si scrive (tastiera). */
const datiPv = $('[data-pv-dati]');
if (datiPv) {
	const segnaModulo = () => document.documentElement.classList.toggle('pv-modulo', !datiPv.hidden);
	new MutationObserver(segnaModulo).observe(datiPv, { attributes: true, attributeFilter: ['hidden'] });
	segnaModulo();
}
{
	const campo = (el) => el?.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]), textarea, select');
	let via;
	document.addEventListener('focusin', (e) => {
		if (!campo(e.target)) return;
		clearTimeout(via);
		document.documentElement.classList.add('tastiera');
	});
	document.addEventListener('focusout', (e) => {
		if (!campo(e.target)) return;
		via = setTimeout(() => {
			if (!campo(document.activeElement)) document.documentElement.classList.remove('tastiera');
		}, 120);
	});
}
