// Calcolatori a passi, come Traslochi (11/10, Gian: «tutti come traslochi, con le tendine»).
// Imbiancatura, Parquet, Montaggio, Ristrutturazioni, Risanamento e Falegnameria: un passo aperto alla volta,
// riga di riassunto e «Modifica» sui passi chiusi. Sul telefono (pagina Preventivo, classe pv-foglio) il passo sale
// da sotto come tendina: × e ‹ in alto, in fondo la stima e «Avanti»; si chiude anche tirandola giù, toccando il velo,
// con Esc o con il tasto indietro del telefono. L'ultimo «Avanti» porta alla stima (il riquadro nero sotto i passi,
// a destra sul computer). I conti restano in app.js (calcola, calcolaBagno): qui si legge solo quello che mostrano.
import { durata, finisciArrivo, tieniPosto, rigaChiusa, liberaPosti, fuocoDopoChiusura, daTastiera, ravviva } from './tendine.js?v=2026101214';
import { ambientiManca, ambientiSintesi } from './ambienti.js?v=2026101503';
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

	// passo senza domande da fare: la sua domanda ha già la risposta dalla pagina di prima
	// (es. preventivo.html#ristrutturazioni:bagno → «Lo spazio» è già «Bagno»; app.js la segna data-pv-fissata)
	const giaRisposto = (p) => {
		const domande = $$('fieldset, .campo, label.check', $('[data-passo-corpo]', p)).filter((el) => !el.closest('.tr2-avanti'));
		return domande.length > 0 && domande.every((el) => el.closest('[data-pv-fissata]'));
	};
	const passi = () => $$('.tr2-passo', box).filter((p) => !p.hidden && !giaRisposto(p));
	const aperto = () => passi().find((p) => p.classList.contains('is-aperto'));
	const risultato = () => $$('.risultato', box).find((r) => !r.hidden);
	const ris = $('[data-pv-ris]', box); // «Il tuo progetto»: lo scrive app.js (titolo, stima o prezzo dopo il sopralluogo)
	// tendina solo sul telefono, nella pagina Preventivo, e solo se questo calcolatore è quello in vista
	const foglio = () => document.documentElement.classList.contains('pv-foglio') && telefono() && !box.closest('[hidden]');
	const tendina = (p) => Boolean(p) && foglio() && !p.hasAttribute('data-passo-stima');
	const inAlto = () => (foglio() && testaFoglio?.offsetHeight ? testaFoglio.offsetHeight : header?.offsetHeight || 60) + 12;

	/* ---------- Cosa manca: le risposte che servono per andare avanti (data-obbligo, 12/10 flussi guidati) ----------
	   Solo le domande in vista: una domanda nascosta per le risposte date non è mai obbligatoria. Un campo spento non
	   manca (es. «Non so i m²»: i metri li misuriamo al sopralluogo). I facoltativi non bloccano mai. */
	function manca(p) {
		for (const el of $$('[data-obbligo]', p)) {
			if (el.closest('[data-mostra-se][hidden]') || el.closest('[data-pv-fissata]')) continue;
			// schede delle stanze (imbiancatura): la prima scheda incompleta
			if (el.matches('[data-ambienti]')) {
				const scheda = ambientiManca(el);
				if (scheda) return scheda;
				continue;
			}
			if (el.matches('[data-somma]')) {
				const tot = $$('input[type="number"]', el).reduce((t, i) => t + (Number(i.value) || 0), 0);
				const o = el.dataset.sommaO && $(`input[name="${el.dataset.sommaO}"]`, form);
				if (!tot && !(o && o.checked && !o.disabled)) return el;
			} else if (el.matches('fieldset')) {
				if (!$$('input', el).some((i) => i.checked && !i.disabled)) return el;
			} else {
				const i = $('input, textarea', el);
				if (!i || i.disabled) continue;
				if (i.type === 'number' ? !(Number(String(i.value).replace(',', '.')) > 0) : !i.value.trim()) return el;
			}
		}
		return null;
	}

	/* ---------- Riga di riassunto sotto il titolo di un passo chiuso ---------- */
	function sintesi(p) {
		const corpo = $('[data-passo-corpo]', p);
		const parti = [];
		for (const c of $$('fieldset, .campo, label.check', corpo)) {
			if (c.closest('label.check') && c !== c.closest('label.check')) continue;
			// le domande nascoste per le risposte date non entrano nel riassunto (12/10, «percorsi più chiari»)
			if (c.closest('[data-mostra-se][hidden]') || c.closest('.tr2-avanti')) continue;
			// schede delle stanze: una riga sola («Camera 4 × 3 m, Bagno, misure da prendere»)
			if (c.matches('[data-ambienti]')) {
				const t = ambientiSintesi(c);
				if (t) parti.push(t);
				continue;
			}
			if (c.closest('[data-ambienti]')) continue;
			if (c.matches('fieldset')) {
				// nei livelli del bagno basta il nome (Base, Comfort, Top), nelle schede il titolo (senza l'esempio)
				const scelti = $$('input:checked', c).filter((i) => !i.disabled).map((i) => testo($('.livello__nome, .tr__imballo-nome', i.closest('label')) || i.closest('label')));
				// sì/no con il nome della domanda («Soffitti: sì»), le altre risposte così come sono
				if (scelti.length) parti.push(c.dataset.sintesi ? `${c.dataset.sintesi}: ${scelti.join(', ').toLowerCase()}` : scelti.join(', '));
			} else if (c.matches('label.check')) {
				if ($('input', c)?.checked && !$('input', c).disabled) parti.push(c.dataset.sintesi || testo(c));
			} else if (c.matches('[data-testo]')) {
				const t = $('input, textarea', c)?.value.trim();
				if (t) parti.push(t.length > 40 ? t.slice(0, 38).trimEnd() + '…' : t);
			} else if (c.matches('[data-somma]')) {
				for (const r of $$('.riga-mobile', c)) {
					const n = Number($('input', r)?.value) || 0;
					if (!n) continue;
					const un = testo($('.numero__unita', r));
					const nome = testo($('label', r));
					parti.push(un ? `${nome} ${n} ${un}` : `${n} × ${nome.toLowerCase()}`);
				}
			} else if (!c.matches('fieldset .campo, [data-somma] *')) {
				const tutti = $$('input[type="number"]', c);
				const nums = tutti.filter((i) => i.value && !i.disabled);
				const un = (i) => testo($('.numero__unita', i.parentElement));
				if (nums.length) parti.push(nums.map((i) => `${tutti.length > 1 && i.placeholder ? i.placeholder + ' ' : ''}${i.value} ${un(i)}`.trim()).join(', '));
			}
		}
		return parti.join(' · ');
	}

	/* ---------- La stima, letta dal riquadro che app.js tiene aggiornato ---------- */
	function stima() {
		// solo i passi già visti (o quello aperto): un passo che deve ancora arrivare non è «da completare»
		const prima = passi().find((p) => manca(p) && (visti.has(p) || p.classList.contains('is-aperto')));
		if (prima) return { cifra: '', sotto: `Da completare: ${testo($('.tr2-passo__titolo', prima)).toLowerCase().replace(/\?$/, '')}`, azione: 'manca', passo: prima };
		const cifra = ris?.dataset.cifra || '';
		if (!cifra) return { cifra: '', sotto: 'Prezzo dopo il sopralluogo', azione: 'stima' };
		return { cifra, sotto: 'IVA inclusa · stima indicativa', azione: 'stima' };
	}
	/* ---------- «Il tuo progetto»: le righe dei passi (riassunto e Modifica) sono i gruppi del riepilogo; qui solo
	   il testo d'invito finché non c'è niente ---------- */
	function gruppi(tutti) {
		const vuotoBox = ris && $('[data-pv-ris-vuoto]', ris);
		if (vuotoBox) vuotoBox.hidden = Boolean(ris.dataset.iniziato) || tutti.some((p) => sintesi(p));
		const ul = ris && $('[data-pv-ris-gruppi]', ris);
		if (!ul) return;
		const voci = tutti.map((p) => [p, testo($('.tr2-passo__titolo', p)).replace(/\?$/, ''), sintesi(p)]).filter(([, , t]) => t);
		const chiave = voci.map(([, a, b]) => a + '|' + b).join('§');
		if (ul.dataset.chiave !== chiave) {
			ul.dataset.chiave = chiave;
			ul.replaceChildren(
				...voci.map(([p, titolo, t]) => {
					const li = document.createElement('li');
					const a = document.createElement('span');
					a.className = 'pv-gruppo__titolo';
					a.textContent = titolo;
					const b = document.createElement('span');
					b.className = 'pv-gruppo__testo';
					b.textContent = t;
					const m = document.createElement('button');
					m.type = 'button';
					m.className = 'link pv-gruppo__modifica';
					m.textContent = 'Modifica';
					m.setAttribute('aria-label', `Modifica: ${titolo.toLowerCase()}`);
					m.addEventListener('click', () => apri(p));
					li.append(a, b, m);
					return li;
				})
			);
		}
		const vuoto = $('[data-pv-ris-vuoto]', ris);
		if (vuoto) vuoto.hidden = voci.length > 0;
	}

	/* ---------- Disegno: numeri, linea dei passi, riassunti, stato, stima in fondo ---------- */
	function aggiorna() {
		// il passo con la domanda già risposta non si vede proprio (né tendina né riga nella lista)
		for (const p of $$('.tr2-passo', box)) p.classList.toggle('is-saltato', giaRisposto(p));
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
			// dopo l'ultimo passo il riepilogo; contatti e invio vengono dopo, a parte
			const poi = $('[data-passi-poi]', p);
			if (poi) poi.textContent = ultimo ? 'Poi il riepilogo del tuo progetto' : `Poi: ${testo($('.tr2-passo__titolo', tutti[i + 1])).replace(/\?$/, '').toLowerCase()}`;
			const av = $('[data-passo-avanti]', p);
			const m = manca(p);
			// «Vedi la stima» solo se porta davvero a una stima; altrimenti «Rivedi il progetto»
			av.textContent = ultimo ? (ris?.dataset.esito === 'S' ? 'Vedi la stima' : 'Rivedi il progetto') : 'Avanti';
			av.setAttribute('aria-disabled', m ? 'true' : 'false');
			// riassunto e stato: fatto (spunta), aperto, da completare
			// una tendina che sta scendendo conta già come chiusa: riassunto e stato pronti prima che si veda la riga
			const chiuso = !p.classList.contains('is-aperto') || p.classList.contains('is-chiude');
			const t = sintesi(p);
			const daFare = visti.has(p) && chiuso && m;
			$('[data-passo-sintesi]', p).textContent = daFare ? (t ? `${t} · da completare` : 'Da completare') : t;
			p.classList.toggle('ha-sintesi', Boolean(t) || Boolean(daFare));
			p.classList.toggle('is-fatto', visti.has(p) && chiuso && !m);
			p.classList.toggle('is-dafare', Boolean(daFare));
		});
		for (const st of $$('[data-passi-stima]', box)) {
			st.dataset.azione = s.azione;
			const forte = $('strong', st);
			if (forte.textContent !== s.cifra) {
				forte.textContent = s.cifra; // subito il valore nuovo; la dissolvenza è solo decorazione
				ravviva(forte);
			}
			$('small', st).textContent = s.sotto;
		}
		const finito = tutti.length > 0 && tutti.every((p) => visti.has(p) && !manca(p));
		if (fondo) {
			$('[data-passi-fondo-titolo]', fondo).textContent = s.cifra ? 'La tua stima' : 'Il tuo progetto';
			$('[data-passi-fondo-sotto]', fondo).textContent = finito ? 'Riepilogo pronto' : 'Rispondi a poche domande';
			$('[data-passi-continua]', fondo).textContent = finito ? (s.cifra ? 'Vedi la stima' : 'Rivedi il progetto') : 'Continua';
		}
		if (ris) {
			gruppi(tutti);
			ris.classList.toggle('is-finito', finito);
			const prossimo = $('[data-pv-ris-prossimo]', ris);
			const dopo = tutti.find((p) => !visti.has(p) || manca(p));
			if (prossimo) {
				const manca2 = ris.dataset.manca;
				prossimo.textContent = dopo && ris.dataset.iniziato ? `Prossimo passo: ${testo($('.tr2-passo__titolo', dopo)).replace(/\?$/, '').toLowerCase()}.${manca2 && !s.cifra ? ` La stima compare con ${manca2}.` : ''}` : '';
				prossimo.hidden = !prossimo.textContent;
			}
		}
	}

	/* ---------- Tendina come finestra (revisione 12/10, B2): con la tendina aperta il resto della pagina è inerte
	   (tastiera e lettori di schermo non ci arrivano); chiusa, tutto torna come prima ---------- */
	let inerti = [];
	function libera() {
		for (const el of inerti) el.inert = false;
		inerti = [];
		for (const q of $$('.tr2-passo[role="dialog"]', box)) {
			q.removeAttribute('role');
			q.removeAttribute('aria-modal');
			q.removeAttribute('aria-label');
		}
	}
	function isola(p) {
		libera();
		for (let el = p; el && el.parentElement && el !== document.body; el = el.parentElement)
			for (const fratello of el.parentElement.children) {
				if (fratello === el || fratello === velo || fratello.inert || fratello.matches('script, style, link')) continue;
				fratello.inert = true;
				inerti.push(fratello);
			}
		p.setAttribute('role', 'dialog');
		p.setAttribute('aria-modal', 'true');
		p.setAttribute('aria-label', testo($('.tr2-passo__titolo', p)));
	}
	/** Tiene allineati finestra e resto della pagina con il passo aperto (anche girando il telefono) */
	function sincronizza() {
		const p = aperto();
		const chiude = p?.classList.contains('is-chiude');
		if (chiude) return; // a fine discesa ci pensa chiudi()
		if (tendina(p)) {
			isola(p);
			if (!p.previousElementSibling?.classList.contains('tr2-posto')) tieniPosto(p);
		} else {
			libera();
			liberaPosti(box);
		}
	}

	/* ---------- Aprire e chiudere ---------- */
	function scorriA(el) {
		const y = el.getBoundingClientRect().top + scrollY - inAlto();
		if (Math.abs(y - scrollY) > 8) scrollTo({ top: Math.max(0, y), behavior: ridotto ? 'auto' : 'smooth' });
	}
	function apri(p, scorri = true, iniziale = false) {
		if (!p) return;
		if (!iniziale) finisciArrivo();
		visti.add(p);
		p._aperto = performance.now(); // B3: un secondo tocco rapido su «Avanti» non salta il passo nuovo
		// da una tendina all'altra (Avanti, ‹): niente risalita da sotto, cambia solo il contenuto
		const prima = passi().find((q) => q.classList.contains('is-aperto') && !q.classList.contains('is-chiude') && tendina(q));
		const tutti = passi();
		// altezza della riga chiusa, prima che diventi tendina: il suo posto resta nella lista (niente scatto chiudendo)
		const riga = p.classList.contains('is-aperto') ? 0 : p.getBoundingClientRect().height;
		liberaPosti(box);
		for (const q of $$('.tr2-passo', box)) {
			clearTimeout(q._chiude);
			q._fine = null; // una chiusura in corso non può più chiudere questa apertura
			q.classList.remove('is-chiude');
			const si = q === p;
			q.classList.toggle('senza-salita', si && Boolean(prima));
			if (si && prima) q.dataset.verso = prima === q ? 'fermo' : tutti.indexOf(q) > tutti.indexOf(prima) ? 'avanti' : 'indietro';
			q.classList.toggle('is-aperto', si);
			$('[data-passo-corpo]', q).hidden = !si;
			$('[data-passo-apri]', q).setAttribute('aria-expanded', String(si));
		}
		aggiorna();
		sincronizza();
		if (tendina(p)) {
			tieniPosto(p, riga);
			$('[data-passo-corpo]', p).scrollTop = 0;
			if (iniziale) return entraNellaTendina(p); // all'arrivo nella pagina: senza voce nella cronologia
			segna();
			// il fuoco va nella tendina (sulla ×): la tastiera del telefono non si apre da sola
			requestAnimationFrame(() => $('[data-passo-chiudi]', p)?.focus({ preventScroll: true }));
		} else if (scorri) requestAnimationFrame(() => scorriA(p));
	}
	/** Se il passo aperto non c'è più (domanda già risposta, o passo sparito), si apre il primo che resta */
	function riallinea(iniziale = false) {
		const ap = $$('.tr2-passo.is-aperto', box)[0];
		const tutti = passi();
		if (ap && !tutti.includes(ap)) {
			if (tutti[0]) apri(tutti[0], false, iniziale);
			else chiudi(ap, true);
		}
		aggiorna();
	}
	/** All'arrivo il fuoco entra nella tendina (sulla tendina stessa: niente anello intorno alla ×) */
	function entraNellaTendina(p) {
		p.tabIndex = -1;
		requestAnimationFrame(() => tendina(p) && p.classList.contains('is-aperto') && p.focus({ preventScroll: true }));
	}
	function chiudi(p, subito = false) {
		if (!p) return;
		finisciArrivo();
		const eraTendina = tendina(p);
		const fine = () => {
			clearTimeout(p._chiude);
			p._fine = null;
			p.classList.remove('is-aperto', 'is-chiude', 'senza-salita');
			$('[data-passo-corpo]', p).hidden = true;
			$('[data-passo-apri]', p).setAttribute('aria-expanded', 'false');
			// la riga torna nella lista nello stesso momento in cui il suo posto sparisce: niente scatto
			liberaPosti(p);
			aggiorna();
			if (!eraTendina) return;
			// a movimento finito: voce della cronologia, pagina di nuovo raggiungibile, fuoco
			// (fatto prima, su iPhone rubava i primi fotogrammi della discesa)
			togliSegno();
			libera();
			fuocoDopoChiusura(p, $('[data-passo-apri]', p));
		};
		clearTimeout(p._chiude);
		if (eraTendina) {
			// B4: la × della pagina sta dove c'era quella della tendina: un secondo tocco subito dopo non deve chiudere anche la stima
			window.amTendinaChiusaIl = performance.now();
		}
		const ms = durata('--t-chiudi', 300);
		if (eraTendina && ms && !subito) {
			// D1: la discesa vale anche dopo «Avanti» o «‹» (senza-salita toglieva l'animazione)
			p.classList.remove('senza-salita');
			p.classList.add('is-chiude');
			// il posto nella lista prende subito l'altezza della riga come sarà da chiusa (col riassunto):
			// la lista si sistema sotto il velo mentre la tendina scende, e alla fine non scatta (Fable, video iPhone)
			aggiorna();
			tieniPosto(p, rigaChiusa(p));
			p._fine = fine;
			p._chiude = setTimeout(fine, ms);
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
			setTimeout(() => r.classList.remove('tr2-evidenzia'), 1000);
			if (daTastiera()) $('a.btn, .btn', r)?.focus({ preventScroll: true });
		}, p && tendina(p) ? durata('--t-chiudi', 300) : 0);
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
		let x0 = 0;
		let y0 = null;
		let dy = 0;
		let tira = false;
		let ultimi = [];
		const vale = () => p.classList.contains('is-aperto') && tendina(p);
		const pulisci = (el) => el && ((el.style.transition = ''), (el.style.transform = ''), (el.style.opacity = ''));
		p.addEventListener('touchstart', (e) => {
			y0 = e.touches.length === 1 && vale() ? e.touches[0].clientY : null;
			x0 = e.touches[0]?.clientX ?? 0;
			dy = 0;
			tira = false;
			ultimi = [];
		}, { passive: true });
		p.addEventListener('touchmove', (e) => {
			if (y0 == null) return;
			dy = e.touches[0].clientY - y0;
			if (!tira) {
				// M1 (revisione 12/10): un gesto più di lato che verso il basso è uno scorrimento (es. le schede dello stile):
				// la tendina non lo segue
				const dx = e.touches[0].clientX - x0;
				if (Math.abs(dx) > 8 && Math.abs(dx) >= Math.abs(dy)) {
					y0 = null;
					return;
				}
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
			if (e.cancelable) e.preventDefault();
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
			const giu = durata('--t-chiudi', 300);
			const su = durata('--t-tendina', 400);
			if (dy > Math.min(140, p.offsetHeight * 0.18) || (v > 0.45 && dy > 16)) {
				// lanciata giù: continua il gesto (curva «molla», parte svelta come il dito) e il velo va via subito
				p.style.transition = `transform ${giu}ms var(--molla)`;
				p.style.transform = 'translateY(100%)';
				if (velo) {
					velo.style.transition = `opacity ${durata('--t-velo-via', 120)}ms ease-out`;
					velo.style.opacity = '0';
				}
				setTimeout(() => {
					chiudi(p, true);
					pulisci(p);
					requestAnimationFrame(() => pulisci(velo));
				}, Math.max(0, giu - 10));
			} else {
				p.style.transition = `transform ${su}ms var(--molla)`;
				p.style.transform = '';
				if (velo) {
					velo.style.transition = `opacity ${su}ms var(--molla)`;
					velo.style.opacity = '';
				}
				setTimeout(() => {
					p.style.transition = '';
					if (velo) velo.style.transition = '';
				}, su + 20);
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
		// indietro mentre la tendina sta già scendendo: vale la chiusura, che finisce subito
		if (p._fine) return p._fine();
		const tutti = passi();
		const i = tutti.indexOf(p);
		if (i > 0) apri(tutti[i - 1]);
		else chiudi(p);
	});

	/* ---------- Comandi ---------- */
	for (const p of $$('.tr2-passo', box)) {
		tiraGiu(p);
		// una tendina che sta scendendo conta come chiusa: toccandola si riapre (prima ripartiva la chiusura)
		$('[data-passo-apri]', p).addEventListener('click', () => (p.classList.contains('is-aperto') && !p.classList.contains('is-chiude') ? chiudi(p) : apri(p)));
		$('[data-passo-chiudi]', p)?.addEventListener('click', () => chiudi(p));
		$('[data-passo-indietro]', p)?.addEventListener('click', () => {
			const tutti = passi();
			const i = tutti.indexOf(p);
			if (i > 0) apri(tutti[i - 1]);
		});
		$('[data-passo-avanti]', p).addEventListener('click', () => {
			// B3: tocco doppio. La finestra è lunga quanto il cambio di passo (250 ms): un secondo tocco voluto non si perde
			if (performance.now() - (p._aperto || 0) < durata('--t-passo', 250, false)) return;
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
		// e domande nascoste perché già risposte (fieldset con data-pv-fissata): il passo aperto può cambiare
		if (voci.some((v) => v.target.matches?.('.tr2-passo, fieldset'))) requestAnimationFrame(() => riallinea());
	}).observe(box, { attributes: true, attributeFilter: ['hidden'], subtree: true });
	// la tendina si apre anche scegliendo il lavoro nella pagina (la classe pv-foglio arriva dopo): voce per il tasto indietro
	new MutationObserver(() => {
		const p = aperto();
		if (tendina(p)) segna();
		sincronizza();
	}).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	// il pannello di questo lavoro sparisce (si sceglie un altro lavoro): niente finestra rimasta a metà
	const pannello = box.closest('[data-pannello]');
	if (pannello) new MutationObserver(sincronizza).observe(pannello, { attributes: true, attributeFilter: ['hidden'] });
	// B8 (revisione 12/10): girando il telefono o allargando oltre 860 px la tendina torna un passo nella pagina:
	// la voce in più della cronologia si toglie (e si rimette se lo schermo torna stretto)
	matchMedia('(max-width: 860px)').addEventListener('change', () => {
		// una discesa in corso finisce subito; via gli stili lasciati da un trascinamento
		for (const q of $$('.tr2-passo', box)) {
			if (q._fine) q._fine();
			q.style.transition = q.style.transform = '';
		}
		if (velo) velo.style.transition = velo.style.opacity = '';
		const p = aperto();
		if (tendina(p)) segna();
		else togliSegno();
		sincronizza();
	});
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
	riallinea(true);
	sincronizza();
	if (tendina(aperto())) entraNellaTendina(aperto());
}

for (const box of $$('[data-passi]')) avviaPassi(box);
