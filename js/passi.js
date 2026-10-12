// Calcolatori a passi, come Traslochi (11/10, Gian: «tutti come traslochi, con le tendine»).
// Imbiancatura, Parquet, Montaggio, Ristrutturazioni, Risanamento e Falegnameria: un passo aperto alla volta,
// riga di riassunto e «Modifica» sui passi chiusi. Sul telefono (pagina Preventivo, classe pv-foglio) il passo sale
// da sotto come tendina: × e ‹ in alto, in fondo la stima e «Avanti»; si chiude anche tirandola giù, toccando il velo,
// con Esc o con il tasto indietro del telefono. L'ultimo «Avanti» porta alla stima (il riquadro nero sotto i passi,
// a destra sul computer). I conti restano in app.js (calcola, calcolaBagno): qui si legge solo quello che mostrano.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const telefono = () => matchMedia('(max-width: 860px)').matches;
const testo = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

export function avviaPassi(box) {
	const form = $('[data-calc-inputs]', box);
	const velo = $('[data-passi-velo]', box);
	const fondo = $('[data-passi-fondo]', box);
	const header = document.querySelector('[data-header]');
	const testaFoglio = document.querySelector('[data-foglio-testa]');
	const visti = new WeakSet(); // passi già aperti almeno una volta

	const passi = () => $$('.tr2-passo', box).filter((p) => !p.hidden);
	const aperto = () => passi().find((p) => p.classList.contains('is-aperto'));
	const risultato = () => $$('.risultato', box).find((r) => !r.hidden);
	// tendina solo sul telefono, nella pagina Preventivo, e solo se questo calcolatore è quello in vista
	const foglio = () => document.documentElement.classList.contains('pv-foglio') && telefono() && !box.closest('[hidden]');
	const tendina = (p) => Boolean(p) && foglio() && !p.hasAttribute('data-passo-stima');
	const inAlto = () => (foglio() && testaFoglio?.offsetHeight ? testaFoglio.offsetHeight : header?.offsetHeight || 60) + 12;

	/* ---------- Cosa manca: i campi che servono per la stima (data-serve) ---------- */
	function manca(p) {
		const sel = p.dataset.serve;
		if (!sel) return null;
		for (const el of $$(sel, p)) {
			if (el.matches('[data-somma]')) {
				const tot = $$('input[type="number"]', el).reduce((t, i) => t + (Number(i.value) || 0), 0);
				if (!tot) return el;
			} else if (el.matches('input') && !(Number(String(el.value).replace(',', '.')) > 0)) return el.closest('.campo') || el;
		}
		return null;
	}

	/* ---------- Riga di riassunto sotto il titolo di un passo chiuso ---------- */
	function sintesi(p) {
		const corpo = $('[data-passo-corpo]', p);
		const parti = [];
		for (const c of $$('fieldset, .campo, label.check', corpo)) {
			if (c.closest('label.check') && c !== c.closest('label.check')) continue;
			if (c.matches('fieldset')) {
				// nei livelli del bagno basta il nome (Base, Comfort, Top), senza prezzo e punti
				const scelti = $$('input:checked', c).map((i) => testo($('.livello__nome', i.closest('label')) || i.closest('label')));
				if (scelti.length) parti.push(scelti.join(', '));
			} else if (c.matches('label.check')) {
				if ($('input', c)?.checked) parti.push(c.dataset.sintesi || testo(c));
			} else if (c.matches('[data-somma]')) {
				for (const r of $$('.riga-mobile', c)) {
					const n = Number($('input', r)?.value) || 0;
					if (!n) continue;
					const un = testo($('.numero__unita', r));
					const nome = testo($('label', r));
					parti.push(un ? `${nome} ${n} ${un}` : `${n} × ${nome.toLowerCase()}`);
				}
			} else if (!c.matches('fieldset .campo, [data-somma] *')) {
				const inp = $('input[type="number"]', c);
				if (inp && inp.value) parti.push(`${inp.value} ${testo($('.numero__unita', c))}`.trim());
			}
		}
		return parti.join(' · ');
	}

	/* ---------- La stima, letta dal riquadro che app.js tiene aggiornato ---------- */
	function stima() {
		const r = risultato();
		const prima = passi().find((p) => manca(p));
		if (prima) return { cifra: '', sotto: `Da completare: ${testo($('.tr2-passo__titolo', prima)).toLowerCase()}`, azione: 'manca', passo: prima };
		const c = r && $('.risultato__cifra', r);
		if (!c) return { cifra: '', sotto: 'Prezzo dopo il sopralluogo', azione: 'stima' };
		const t = testo(c).replace(/\s*IVA inclusa\s*$/i, '');
		if (/a partire da/i.test(testo($('.risultato__label', r)))) return { cifra: `Da ${t}`, sotto: 'Prezzo finale dopo il sopralluogo', azione: 'stima' };
		if (!/€/.test(t)) return { cifra: '', sotto: t && t !== '—' ? t : 'Prezzo dopo il sopralluogo', azione: 'stima' };
		return { cifra: t, sotto: 'IVA inclusa · stima indicativa', azione: 'stima' };
	}

	/* ---------- Disegno: numeri, linea dei passi, riassunti, stato, stima in fondo ---------- */
	function aggiorna() {
		const tutti = passi();
		const s = stima();
		tutti.forEach((p, i) => {
			const n = i + 1;
			const ultimo = n === tutti.length;
			$('.tr2-passo__n', p).textContent = String(n);
			const ind = $('[data-passo-indietro]', p);
			if (ind && ind.hidden !== (n === 1)) ind.hidden = n === 1;
			const strada = $('[data-passi-strada]', p);
			if (strada && strada.children.length !== tutti.length + 1)
				strada.replaceChildren(...Array.from({ length: tutti.length + 1 }, () => document.createElement('i')));
			if (strada) $$('i', strada).forEach((x, k) => x.classList.toggle('is-fatto', k < n));
			const quale = $('[data-passi-quale]', p);
			if (quale) quale.textContent = `Passo ${n} di ${tutti.length}`;
			const av = $('[data-passo-avanti]', p);
			const m = manca(p);
			av.textContent = ultimo ? 'Vedi la stima' : 'Avanti';
			av.setAttribute('aria-disabled', m ? 'true' : 'false');
			// riassunto e stato: fatto (spunta), aperto, da completare
			const chiuso = !p.classList.contains('is-aperto');
			const t = sintesi(p);
			const daFare = visti.has(p) && chiuso && m;
			$('[data-passo-sintesi]', p).textContent = daFare ? (t ? `${t} · da completare` : 'Da completare') : t;
			p.classList.toggle('ha-sintesi', Boolean(t) || Boolean(daFare));
			p.classList.toggle('is-fatto', visti.has(p) && chiuso && !m);
			p.classList.toggle('is-dafare', Boolean(daFare));
		});
		for (const st of $$('[data-passi-stima]', box)) {
			st.dataset.azione = s.azione;
			$('strong', st).textContent = s.cifra;
			$('small', st).textContent = s.sotto;
		}
		if (fondo) {
			const finito = tutti.every((p) => visti.has(p) && !manca(p));
			$('[data-passi-fondo-titolo]', fondo).textContent = s.cifra ? 'La tua stima' : 'Il tuo preventivo';
			$('[data-passi-fondo-sotto]', fondo).textContent = finito ? 'Sopralluogo gratuito' : 'Rispondi a poche domande';
			$('[data-passi-continua]', fondo).textContent = finito ? 'Vedi la stima' : 'Continua';
		}
	}

	/* ---------- Aprire e chiudere ---------- */
	function scorriA(el) {
		const y = el.getBoundingClientRect().top + scrollY - inAlto();
		if (Math.abs(y - scrollY) > 8) scrollTo({ top: Math.max(0, y), behavior: ridotto ? 'auto' : 'smooth' });
	}
	function apri(p, scorri = true) {
		if (!p) return;
		visti.add(p);
		// da una tendina all'altra (Avanti, ‹): niente risalita da sotto, cambia solo il contenuto
		const prima = passi().find((q) => q.classList.contains('is-aperto') && !q.classList.contains('is-chiude') && tendina(q));
		const tutti = passi();
		for (const q of $$('.tr2-passo', box)) {
			clearTimeout(q._chiude);
			q.classList.remove('is-chiude');
			const si = q === p;
			q.classList.toggle('senza-salita', si && Boolean(prima));
			if (si && prima) q.dataset.verso = prima === q ? 'fermo' : tutti.indexOf(q) > tutti.indexOf(prima) ? 'avanti' : 'indietro';
			q.classList.toggle('is-aperto', si);
			$('[data-passo-corpo]', q).hidden = !si;
			$('[data-passo-apri]', q).setAttribute('aria-expanded', String(si));
		}
		aggiorna();
		if (tendina(p)) {
			segna();
			$('[data-passo-corpo]', p).scrollTop = 0;
			// il fuoco va nella tendina (sulla ×): la tastiera del telefono non si apre da sola
			requestAnimationFrame(() => $('[data-passo-chiudi]', p)?.focus({ preventScroll: true }));
		} else if (scorri) requestAnimationFrame(() => scorriA(p));
	}
	function chiudi(p, subito = false) {
		if (!p) return;
		const fine = () => {
			p.classList.remove('is-aperto', 'is-chiude');
			$('[data-passo-corpo]', p).hidden = true;
			$('[data-passo-apri]', p).setAttribute('aria-expanded', 'false');
			aggiorna();
		};
		clearTimeout(p._chiude);
		if (tendina(p)) togliSegno();
		if (tendina(p) && !ridotto && !subito) {
			p.classList.add('is-chiude');
			p._chiude = setTimeout(fine, 330);
		} else fine();
	}
	/** Alla stima: si chiude la tendina e la pagina va al riquadro nero, che si illumina un attimo */
	function allaStima() {
		const p = aperto();
		if (p) chiudi(p, !tendina(p));
		const r = risultato();
		if (!r) return;
		setTimeout(() => {
			scorriA(r);
			r.classList.remove('tr2-evidenzia');
			void r.offsetWidth;
			r.classList.add('tr2-evidenzia');
			setTimeout(() => r.classList.remove('tr2-evidenzia'), 1700);
			$('a.btn, .btn', r)?.focus({ preventScroll: true });
		}, p && tendina(p) && !ridotto ? 340 : 0);
	}
	/** Porta al campo che manca, in risalto */
	function mostraCosaManca(p) {
		const el = manca(p);
		if (!el) return;
		if (!p.classList.contains('is-aperto')) apri(p, false);
		requestAnimationFrame(() => {
			const corpo = $('[data-passo-corpo]', p);
			if (tendina(p)) corpo.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top - corpo.getBoundingClientRect().top + corpo.scrollTop - 12), behavior: ridotto ? 'auto' : 'smooth' });
			else scorriA(el);
			el.classList.remove('tr2-evidenzia');
			void el.offsetWidth;
			el.classList.add('tr2-evidenzia');
			setTimeout(() => el.classList.remove('tr2-evidenzia'), 1700);
			const inp = $('input:not([type="hidden"])', el);
			if (inp && !foglio()) inp.focus({ preventScroll: true });
		});
	}

	/* ---------- Tendina tirata giù col dito (come Traslochi): oltre un certo punto si chiude ---------- */
	function tiraGiu(p) {
		const corpo = $('[data-passo-corpo]', p);
		let y0 = null;
		let dy = 0;
		let tira = false;
		let ultimi = [];
		const vale = () => p.classList.contains('is-aperto') && tendina(p);
		const pulisci = (el) => el && ((el.style.transition = ''), (el.style.transform = ''), (el.style.opacity = ''));
		p.addEventListener('touchstart', (e) => {
			y0 = e.touches.length === 1 && vale() ? e.touches[0].clientY : null;
			dy = 0;
			tira = false;
			ultimi = [];
		}, { passive: true });
		p.addEventListener('touchmove', (e) => {
			if (y0 == null) return;
			dy = e.touches[0].clientY - y0;
			if (!tira) {
				const daTesta = !corpo.contains(e.target);
				if (dy > 8 && (daTesta || corpo.scrollTop <= 0)) {
					tira = true;
					p.style.transition = 'none';
					if (velo) velo.style.transition = 'none';
				} else if (dy < -4 || (dy > 8 && corpo.scrollTop > 0)) {
					y0 = null;
					return;
				} else return;
			}
			e.preventDefault();
			p.style.transform = `translateY(${dy > 0 ? dy : dy * 0.2}px)`;
			if (velo) velo.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / (p.offsetHeight * 0.8)));
			ultimi.push([e.timeStamp, dy]);
			if (ultimi.length > 5) ultimi.shift();
		}, { passive: false });
		const fine = () => {
			if (y0 == null) return;
			y0 = null;
			if (!tira) return;
			tira = false;
			const [a, b] = [ultimi[0], ultimi[ultimi.length - 1]];
			const v = a && b && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
			if (dy > Math.min(140, p.offsetHeight * 0.18) || (v > 0.45 && dy > 16)) {
				p.style.transition = 'transform 280ms var(--molla)';
				p.style.transform = 'translateY(100%)';
				if (velo) {
					velo.style.transition = 'opacity 280ms ease';
					velo.style.opacity = '0';
				}
				setTimeout(() => {
					chiudi(p, true);
					pulisci(p);
					requestAnimationFrame(() => pulisci(velo));
				}, 270);
			} else {
				p.style.transition = 'transform 420ms var(--molla)';
				p.style.transform = '';
				if (velo) {
					velo.style.transition = 'opacity 420ms var(--molla)';
					velo.style.opacity = '';
				}
				setTimeout(() => {
					p.style.transition = '';
					if (velo) velo.style.transition = '';
				}, 440);
			}
		};
		p.addEventListener('touchend', fine);
		p.addEventListener('touchcancel', fine);
	}

	/* ---------- Tasto indietro del telefono: con la tendina aperta porta al passo prima ---------- */
	let segno = false;
	let ignora = false;
	function segna() {
		if (segno || !foglio()) return;
		try {
			if (!history.state?.pvTendina) history.pushState({ ...(history.state || {}), pvTendina: 1 }, '');
			segno = true;
		} catch {
			// in alcune anteprime la cronologia non si può toccare
		}
	}
	function togliSegno() {
		if (!segno) return;
		segno = false;
		ignora = true;
		history.back();
	}
	addEventListener('popstate', () => {
		if (ignora) {
			ignora = false;
			return;
		}
		if (!segno) return;
		segno = false;
		const p = aperto();
		if (!p || !tendina(p)) return;
		const tutti = passi();
		const i = tutti.indexOf(p);
		if (i > 0) apri(tutti[i - 1]);
		else chiudi(p);
	});

	/* ---------- Comandi ---------- */
	for (const p of $$('.tr2-passo', box)) {
		tiraGiu(p);
		$('[data-passo-apri]', p).addEventListener('click', () => (p.classList.contains('is-aperto') ? chiudi(p) : apri(p)));
		$('[data-passo-chiudi]', p)?.addEventListener('click', () => chiudi(p));
		$('[data-passo-indietro]', p)?.addEventListener('click', () => {
			const tutti = passi();
			const i = tutti.indexOf(p);
			if (i > 0) apri(tutti[i - 1]);
		});
		$('[data-passo-avanti]', p).addEventListener('click', () => {
			if (manca(p)) return mostraCosaManca(p);
			const tutti = passi();
			const dopo = tutti[tutti.indexOf(p) + 1];
			if (dopo) apri(dopo);
			else allaStima();
		});
	}
	box.addEventListener('click', (e) => {
		const st = e.target.closest('[data-passi-stima]');
		if (!st) return;
		const s = stima();
		if (s.passo) {
			if (aperto() !== s.passo) apri(s.passo, false);
			mostraCosaManca(s.passo);
		} else allaStima();
	});
	$('[data-passi-continua]', box)?.addEventListener('click', () => {
		const p = passi().find((q) => !visti.has(q) || manca(q));
		if (p) apri(p);
		else allaStima();
	});
	velo?.addEventListener('click', () => {
		const p = aperto();
		if (tendina(p)) chiudi(p);
	});
	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
		const p = aperto();
		if (tendina(p)) chiudi(p);
	});
	// le scelte cambiano la stima (app.js la ricalcola prima): poi si aggiornano riassunti e riquadri
	for (const ev of ['input', 'change']) form.addEventListener(ev, () => requestAnimationFrame(aggiorna));
	// passi che compaiono o spariscono con le scelte (bagno o altro, nelle ristrutturazioni)
	new MutationObserver((voci) => {
		if (voci.some((v) => v.target.matches?.('.tr2-passo'))) requestAnimationFrame(aggiorna);
	}).observe(box, { attributes: true, attributeFilter: ['hidden'], subtree: true });
	// la tendina si apre anche scegliendo il lavoro nella pagina (la classe pv-foglio arriva dopo): voce per il tasto indietro
	new MutationObserver(() => {
		const p = aperto();
		if (tendina(p)) segna();
	}).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	// quando la stima si vede nella pagina, il riquadro in fondo scende via
	if (fondo && 'IntersectionObserver' in window) {
		const inVista = new Set();
		const io = new IntersectionObserver((voci) => {
			for (const v of voci) v.isIntersecting ? inVista.add(v.target) : inVista.delete(v.target);
			fondo.classList.toggle('is-nascosta', inVista.size > 0);
		});
		for (const r of $$('.risultato', box)) io.observe(r);
	}
	const p0 = aperto();
	if (p0) visti.add(p0);
	aggiorna();
}

for (const box of $$('[data-passi]')) avviaPassi(box);
