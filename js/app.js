// ArtigianaMente — interazioni della bozza (menu, ricerca in home, preventivo guidato, moduli, visore foto).
import { calcola, euro, calcolaBagno } from './calcoli.js';
import { cerca } from './ricerca.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
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
	const aggiornaHeader = () =>
		header.classList.toggle(
			'is-scrolled',
			icone
				? scrollY > 10 && icone.getBoundingClientRect().top <= header.offsetHeight + 1
				: window.scrollY > soglia()
		);
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
	// Nella pagina Preventivo ci sono tutti i lavori: scrive il riepilogo solo quello scelto
	const attivo = () => riepilogo && !calc.closest('[hidden]');

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
			'Budget indicativo del mio bagno, da ArtigianaMente',
			r.riepilogo,
			...r.voci.map((x) => `- ${x.nome}: ${x.daValutare ? 'da valutare' : `${euro(x.min)}–${euro(x.max)} €`}`),
			`Durata indicativa: ${r.durata}.`,
			'Stima orientativa non vincolante. Il preventivo scritto arriva dopo il sopralluogo gratuito.',
			location.href.split('#')[0] + '#ristrutturazioni'
		].join('\n');
		$('[data-b-whatsapp]', box).href = 'https://wa.me/?text=' + encodeURIComponent(testo);
		$('[data-b-email]', box).href =
			'mailto:?subject=' + encodeURIComponent('Budget del mio bagno – ArtigianaMente') + '&body=' + encodeURIComponent(testo);
		if (attivo()) riepilogo.value = r.riepilogo;
	};

	const aggiorna = () => {
		if (tipo === 'ristrutturazioni') return aggiornaRistr();
		const v = leggi(inputs);
		if (!conCalcolo) {
			if (attivo()) riepilogo.value = riepilogoLibero(servizio, inputs);
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
				(r.riepilogo || servizio) + (r.min ? ` Stima orientativa: ${euro(r.min)}–${euro(r.max)} €, IVA ${r.ivaPerc}% inclusa.` : '');
		}
	};
	inputs.addEventListener('submit', (e) => e.preventDefault()); // Invio in un campo non ricarica la pagina
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

/* Home: la foto di sfondo arriva fino al fondo delle icone; le icone tornano scure quando restano fisse in alto */
const sfondo = $('[data-sfondo]');
const barraIcone = $('[data-chips]');
const zonaCerca = $('.v3-cerca');
if (sfondo && barraIcone && zonaCerca) {
	// Altezza = ricerca + icone. Non si usa offsetTop delle icone: quando restano fisse in alto
	// cambia con lo scroll e su iPhone (barra di Safari che si chiude) la foto copriva la pagina.
	// + lo spazio di foto sotto le icone (margine sopra il contenuto), così le icone stanno un po' più su
	const sotto = $('[data-contenuto]');
	const misura = () =>
		(sfondo.style.height = `${
			zonaCerca.offsetTop + zonaCerca.offsetHeight + barraIcone.offsetHeight + (sotto ? parseFloat(getComputedStyle(sotto).marginTop) || 0 : 0)
		}px`);
	const fissa = () =>
		barraIcone.classList.toggle(
			'is-fissa',
			scrollY > 10 && barraIcone.getBoundingClientRect().top <= (header?.offsetHeight || 76) + 1
		);
	misura();
	fissa();
	addEventListener('resize', misura);
	addEventListener('load', misura);
	addEventListener('scroll', fissa, { passive: true });
}

/* Home: ricerca, pulsanti dei lavori e schede */
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
	const barraChips = $('[data-chips]');
	const chips = $$('[data-chip]');
	const esitoBox = $('[data-esito-box]');
	const esito = $('[data-esito]');
	const anche = $('[data-anche]');
	const panoramica = $('[data-panoramica]');
	const schede = $$('[data-scheda]');
	const vuoto = $('[data-vuoto]');
	const slugs = schede.map((s) => s.dataset.scheda);
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const nome = (slug) => $(`[data-chip="${slug}"] span`)?.textContent.trim() || slug;

	const attivaChip = (slug) => {
		for (const c of chips) {
			const si = c.dataset.chip === slug;
			c.classList.toggle('is-active', si);
			c.setAttribute('aria-pressed', String(si));
			if (si) {
				const box = c.parentElement;
				const x = c.offsetLeft - box.clientWidth / 2 + c.offsetWidth / 2;
				box.scrollTo({ left: Math.max(0, x), behavior: ridotto ? 'auto' : 'smooth' });
			}
		}
	};

	const bottone = (slug) => {
		const b = document.createElement('button');
		b.type = 'button';
		b.dataset.vai = slug;
		b.textContent = nome(slug);
		return b;
	};

	// modo: 'tutto' = vista iniziale, 'lavoro' = una scheda, 'ricerca' = risultato di una ricerca
	const vista = (modo, trovati = [], testo = '') => {
		const primo = trovati[0];
		panoramica.hidden = modo !== 'tutto';
		for (const s of schede) s.hidden = s.dataset.scheda !== primo;
		vuoto.hidden = !(modo === 'ricerca' && !primo);
		attivaChip(modo === 'tutto' ? 'tutto' : primo);
		anche.replaceChildren();
		esitoBox.hidden = modo !== 'ricerca';
		if (modo !== 'ricerca') return;
		if (!primo) {
			esito.textContent = `Nessun risultato per «${testo}».`;
			return;
		}
		const forte = document.createElement('strong');
		forte.textContent = nome(primo);
		esito.replaceChildren(`Per «${testo}» il lavoro giusto è `, forte, '.');
		const altri = trovati.slice(1, 3);
		if (altri.length) {
			const t = document.createElement('span');
			t.textContent = 'Guarda anche:';
			anche.append(t, ...altri.map(bottone));
		}
	};

	// Porta l'inizio del contenuto subito sotto i pulsanti fissi
	const scorri = () => {
		const sopra = (header?.offsetHeight || 0) + (barraChips?.offsetHeight || 0);
		const y = contenuto.getBoundingClientRect().top + scrollY - sopra;
		if (Math.abs(scrollY - y) > 4) scrollTo({ top: y, behavior: ridotto ? 'auto' : 'smooth' });
	};

	const indirizzo = (slug, nuovo) => {
		const url = location.pathname + (slug ? '#' + slug : '');
		if (url === location.pathname + location.hash) return;
		try {
			history[nuovo ? 'pushState' : 'replaceState'](null, '', url);
		} catch {
			// in alcune anteprime l'indirizzo non si può cambiare: la pagina funziona lo stesso
		}
	};

	const aggiornaPulisci = () => (pulisci.hidden = !input.value);

	const apri = (slug) => {
		input.value = '';
		aggiornaPulisci();
		if (slug === 'tutto') {
			indirizzo('', true);
			vista('tutto');
		} else {
			indirizzo(slug, true);
			vista('lavoro', [slug]);
		}
		scorri();
	};

	const esegui = (conferma) => {
		const testo = input.value.trim();
		aggiornaPulisci();
		if (!testo) {
			indirizzo('', false);
			vista('tutto');
			return;
		}
		if (testo.length < 2 && !conferma) return;
		const trovati = cerca(testo);
		indirizzo(trovati[0] || '', false);
		vista('ricerca', trovati, testo);
		if (conferma) {
			sugg.hidden = true;
			input.blur();
			scorri();
		}
	};

	// Tendina sotto la barra: ricerche frequenti se è vuota, i lavori trovati mentre scrivi (si vedono subito, anche col telefono)
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

	let attesa;
	input.addEventListener('input', () => {
		sugg.hidden = document.activeElement !== input;
		tendina();
		aggiornaPulisci();
		clearTimeout(attesa);
		attesa = setTimeout(() => esegui(false), 180);
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
	form.addEventListener('focusout', () =>
		setTimeout(() => {
			if (!form.contains(document.activeElement)) sugg.hidden = true;
		}, 0)
	);
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		clearTimeout(attesa);
		esegui(true);
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
			sugg.hidden = true;
			input.blur();
			apri(r.dataset.risultato);
			return;
		}
		const b = e.target.closest('[data-suggerimento]');
		if (!b) return;
		input.value = b.dataset.suggerimento;
		esegui(true);
	});
	pulisci.addEventListener('click', () => {
		input.value = '';
		esegui(false);
		input.focus();
	});

	for (const c of chips) c.addEventListener('click', () => apri(c.dataset.chip));
	anche.addEventListener('click', (e) => {
		const b = e.target.closest('[data-vai]');
		if (b) apri(b.dataset.vai);
	});
	for (const a of $$('[data-apri]')) {
		a.addEventListener('click', (e) => {
			if (e.metaKey || e.ctrlKey || e.shiftKey) return;
			e.preventDefault();
			apri(a.dataset.apri);
		});
	}

	// "‹ Tutti i lavori" sopra la scheda
	for (const b of $$('[data-torna]')) b.addEventListener('click', () => apri('tutto'));

	// Sul telefono: trascinare la foto della scheda porta al lavoro dopo o prima
	for (const s of schede) {
		const img = $('.v3-scheda__img', s);
		const i = slugs.indexOf(s.dataset.scheda);
		scorriColDito(img, (avanti) => apri(slugs[(i + (avanti ? 1 : -1) + slugs.length) % slugs.length]));
	}

	// Indirizzo con #lavoro: apre direttamente quella scheda (anche col tasto indietro)
	const daIndirizzo = (primaVolta) => {
		const h = decodeURIComponent(location.hash.slice(1));
		if (slugs.includes(h)) {
			vista('lavoro', [h]);
			if (primaVolta) requestAnimationFrame(scorri);
		} else if (!input.value.trim()) {
			vista('tutto');
		}
	};
	addEventListener('popstate', () => {
		input.value = '';
		aggiornaPulisci();
		daIndirizzo(false);
	});
	daIndirizzo(true);
}

/* Pagina Preventivo: un solo posto per tutti i lavori (1 scegli, 2 domande, 3 dati) */
const pv = $('[data-pv]');
if (pv) {
	const lavori = $$('[data-scegli]', pv);
	const pannelli = $$('[data-pannello]', pv);
	const domande = $('[data-pv-domande]', pv);
	const dati = $('[data-pv-dati]', pv);
	const campoLavoro = $('[data-pv-lavoro]', pv);
	const riepilogo = $('[data-riepilogo]', pv);
	const msg = $('[data-pv-msg]', pv);
	const facolt = $('[data-pv-facolt]', pv);
	const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

	const scegli = (slug, scorri) => {
		const scelto = lavori.find((b) => b.dataset.scegli === slug);
		if (!scelto) return;
		for (const b of lavori) {
			const si = b === scelto;
			b.classList.toggle('is-active', si);
			b.setAttribute('aria-pressed', String(si));
		}
		for (const p of pannelli) p.hidden = p.dataset.pannello !== slug;
		domande.hidden = false;
		dati.hidden = false;
		campoLavoro.value = $('.v3-pv__nome', scelto).textContent.trim();
		const altro = slug === 'altro';
		msg.required = altro;
		facolt.hidden = altro;
		if (altro) riepilogo.value = 'Altro lavoro: vedi la descrizione.';
		else $(`[data-pannello="${slug}"] [data-calc-inputs]`, pv)?.dispatchEvent(new Event('input', { bubbles: true }));
		try {
			history.replaceState(null, '', location.pathname + '#' + slug);
		} catch {
			// in alcune anteprime l'indirizzo non si può cambiare
		}
		if (scorri) domande.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
	};

	for (const b of lavori) b.addEventListener('click', () => scegli(b.dataset.scegli, true));

	// Arrivo da "Calcola il preventivo" (preventivo.html#parquet): lavoro già scelto
	$('[data-pv-cambia]', pv)?.addEventListener('click', () =>
		$('.v3-pv__passo', pv).scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' })
	);

	// #ristrutturazioni:cucina → ristrutturazioni con "Cucina" già scelta
	const daIndirizzo = () => {
		const [h, sub] = decodeURIComponent(location.hash.slice(1)).split(':');
		if (!lavori.some((b) => b.dataset.scegli === h)) return;
		requestAnimationFrame(() => {
			if (sub) {
				const r = $(`[data-pannello="${h}"] input[name="cosa"][value="${sub}"]`, pv);
				if (r) r.checked = true;
			}
			scegli(h, true);
		});
	};
	addEventListener('hashchange', daIndirizzo);
	daIndirizzo();
}

/* "PDF": stampa solo il riepilogo del bagno (dal menu di stampa si salva come PDF) */
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

/* Pagina di un lavoro: col dito sulla foto di copertina si va al lavoro dopo o prima */
const copertina = $('[data-copertina]');
const succ = $('[data-succ]');
const prec = $('[data-prec]');
if (copertina && succ && prec) scorriColDito(copertina, (avanti) => (location.href = (avanti ? succ : prec).href));

/* Tipi di ristrutturazione: pulsanti che cambiano la scheda sotto */
const tipi = $$('[data-tipo]');
if (tipi.length) {
	const pannelli = $$('[data-tipo-pannello]');
	const mostra = (id) => {
		for (const b of tipi) {
			const si = b.dataset.tipo === id;
			b.classList.toggle('is-active', si);
			b.setAttribute('aria-selected', String(si));
		}
		for (const pn of pannelli) pn.hidden = pn.dataset.tipoPannello !== id;
	};
	for (const b of tipi) b.addEventListener('click', () => mostra(b.dataset.tipo));
	// ristrutturazioni.html#tipo-cucina apre subito la cucina
	const daIndirizzo = () => {
		const h = decodeURIComponent(location.hash.slice(1));
		if (h.startsWith('tipo-') && tipi.some((b) => b.dataset.tipo === h.slice(5))) {
			mostra(h.slice(5));
			requestAnimationFrame(() => $('#tipi')?.scrollIntoView({ block: 'start' }));
		}
	};
	addEventListener('hashchange', daIndirizzo);
	daIndirizzo();
}
