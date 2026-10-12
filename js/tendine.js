// Cose in comune alle tendine dei calcolatori (passi.js e trasloco-ui.js), lotto «Movimento rifinito» (12/10).
// - durate lette dal CSS (:root), così JS e CSS non si contraddicono
// - il posto della riga nella lista mentre il passo è aperto come tendina (niente scatto quando si richiude):
//   all'inizio della chiusura si misura la riga come sarà da chiusa, col suo riassunto
// - fine dell'«arrivo»: la tendina con cui si arriva da una pagina di servizio è già al suo posto, senza salita;
//   al primo comando dell'utente si torna ai movimenti normali
// - tastiera o dito: dopo la chiusura il fuoco torna sul passo solo a chi usa la tastiera (niente riquadro col dito)
const radice = document.documentElement;
const ridotto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Durata in ms di una variabile del CSS (es. '--t-chiudi'); 0 con «Riduci movimento» */
export function durata(nome, riserva = 300, rispettaRidotto = true) {
	if (rispettaRidotto && ridotto()) return 0;
	const v = getComputedStyle(radice).getPropertyValue(nome).trim();
	const n = parseFloat(v);
	if (!Number.isFinite(n)) return riserva;
	return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
}

/** Un valore appena cambiato (stima, testi di un esempio) compare con una dissolvenza breve.
 *  Solo decorazione: il testo nuovo c'è già; al massimo una volta ogni --t-rapido (scrivendo in fretta niente lampeggi) */
export function ravviva(el) {
	if (!el || ridotto()) return;
	const ora = performance.now();
	if (el._ravvivato && ora - el._ravvivato < durata('--t-rapido', 150)) return;
	el._ravvivato = ora;
	el.classList.remove('is-nuovo');
	void el.offsetWidth;
	el.classList.add('is-nuovo');
}

/** La tendina d'arrivo diventa normale: da qui in poi sale e scende come le altre */
export function finisciArrivo() {
	radice.classList.remove('pv-arrivo');
}

/* ---------- Posto della riga nella lista ---------- */
/** Altezza stimata della riga chiusa di un passo: quella di un passo vicino chiuso, simile se possibile */
function altezzaStimata(p) {
	const fratelli = [...p.parentElement.children].filter(
		(q) => q !== p && q.matches('.tr2-passo, [data-passo]') && !q.hidden && !q.classList.contains('is-saltato') && !q.classList.contains('is-aperto') && q.offsetHeight > 0
	);
	const simile = fratelli.find((q) => q.classList.contains('ha-sintesi') === p.classList.contains('ha-sintesi'));
	return (simile || fratelli[0])?.getBoundingClientRect().height || 64;
}
/** Altezza vera della riga chiusa di p (aperto come tendina): una copia chiusa, invisibile e senza campi
 *  (niente nomi né id: i campi veri non cambiano), messa un attimo al suo posto e misurata */
export function rigaChiusa(p) {
	if (!p?.parentElement || p.closest('[hidden]')) return 0;
	const copia = p.cloneNode(true);
	copia.querySelector('[data-passo-corpo]')?.remove();
	for (const x of copia.querySelectorAll('[id], [name]')) x.removeAttribute('id'), x.removeAttribute('name');
	copia.removeAttribute('id');
	copia.classList.remove('is-aperto', 'is-chiude', 'senza-salita');
	copia.setAttribute('aria-hidden', 'true');
	copia.inert = true;
	copia.style.cssText = 'visibility:hidden;animation:none;transition:none';
	const posto = p.previousElementSibling?.classList.contains('tr2-posto') ? p.previousElementSibling : null;
	if (posto) posto.style.display = 'none';
	p.before(copia);
	const h = copia.getBoundingClientRect().height;
	copia.remove();
	if (posto) posto.style.display = '';
	return h;
}
/** Tiene il posto della riga di p (aperto come tendina, quindi fuori dalla lista) */
export function tieniPosto(p, altezza = 0) {
	let posto = p.previousElementSibling;
	if (!posto?.classList.contains('tr2-posto')) {
		posto = document.createElement('div');
		posto.className = 'tr2-posto';
		posto.setAttribute('aria-hidden', 'true');
		p.before(posto);
	}
	posto.style.height = `${altezza || rigaChiusa(p) || altezzaStimata(p)}px`;
}
/** Toglie i posti tenuti (in un contenitore, o quello di un passo) */
export function liberaPosti(dove) {
	const posti = dove.matches?.('.tr2-passo, [data-passo]') ? [dove.previousElementSibling].filter((x) => x?.classList.contains('tr2-posto')) : [...dove.querySelectorAll('.tr2-posto')];
	for (const x of posti) x.remove();
}

/* ---------- Tastiera o dito ---------- */
let tastiera = false;
addEventListener('keydown', (e) => {
	if (!e.metaKey && !e.ctrlKey && !e.altKey) tastiera = true;
}, true);
addEventListener('pointerdown', () => (tastiera = false), true);
/** L'ultimo comando è arrivato dalla tastiera? (col dito niente fuoco spostato e niente riquadro) */
export const daTastiera = () => tastiera;
/** Dopo la chiusura: con la tastiera il fuoco torna al comando del passo; col dito si toglie solo dal passo chiuso */
export function fuocoDopoChiusura(p, comando) {
	const f = document.activeElement;
	const nelPasso = !f || f === document.body || p.contains(f);
	if (!nelPasso) return;
	if (tastiera && comando) comando.focus({ preventScroll: true });
	else if (f && f !== document.body) f.blur();
}
