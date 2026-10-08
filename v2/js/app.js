// ArtigianaMente — interazioni della bozza (menu, preventivo guidato, moduli, visore foto).
import { calcola, euro } from './calcoli.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const CHECK =
	'<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" vector-effect="non-scaling-stroke"/></svg>';

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
	const soglia = () => Math.max(80, ($('[data-slider]')?.offsetHeight || 400) - 90);
	const aggiornaHeader = () => header.classList.toggle('is-scrolled', window.scrollY > soglia());
	addEventListener('scroll', aggiornaHeader, { passive: true });
	aggiornaHeader();
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

	const aggiorna = () => {
		const v = leggi(inputs);
		if (!conCalcolo) {
			if (riepilogo) riepilogo.value = riepilogoLibero(servizio, inputs);
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
			iva.textContent = '+ IVA';
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
		if (riepilogo) {
			riepilogo.value =
				(r.riepilogo || servizio) + (r.min ? ` Stima orientativa: ${euro(r.min)}–${euro(r.max)} € + IVA.` : '');
		}
	};
	inputs.addEventListener('input', aggiorna);
	inputs.addEventListener('change', aggiorna);
	aggiorna();
}

/* Moduli: nella bozza non inviano, mostrano solo la conferma */
for (const form of $$('[data-richiesta]')) {
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}
		const ok = $('[data-conferma]', form);
		ok.hidden = false;
		ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});
}

/* Modulo generale: campi del trasloco solo quando servono */
const sel = $('[data-servizio-select]');
const soloTraslochi = $('[data-solo-traslochi]');
if (sel && soloTraslochi) {
	const mostra = () => (soloTraslochi.hidden = sel.value !== 'Traslochi');
	sel.addEventListener('change', mostra);
	mostra();
}

/* Visore foto */
const visore = $('[data-visore]');
if (visore && typeof visore.showModal === 'function') {
	const img = $('[data-visore-img]', visore);
	for (const a of $$('[data-visore-link]')) {
		a.addEventListener('click', (e) => {
			e.preventDefault();
			const thumb = $('img', a);
			img.src = a.getAttribute('href');
			img.alt = thumb?.alt || '';
			visore.showModal();
		});
	}
	$('[data-visore-chiudi]', visore).addEventListener('click', () => visore.close());
	visore.addEventListener('click', (e) => {
		if (e.target === visore || e.target.hasAttribute('data-visore-chiudi-sfondo')) visore.close();
	});
}
