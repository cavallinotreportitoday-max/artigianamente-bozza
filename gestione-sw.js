// GESTIONE INSTALLABILE · service worker (ambito: solo la Gestione).
// Regola: NESSUN dato privato in cache. Si tengono solo una pagina "Senza rete" e l'icona, senza dati.
// Tutto il resto (pagina, programmi, chiamate al server) va sempre in rete: chi apre la Gestione senza connessione
// vede "Senza rete", non dati vecchi o di un altro accesso.
const VERSIONE = 'am-gestione-1';
const FISSI = ['./gestione-offline.html', './icone/gestione-192.png'];

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(FISSI)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((k) => Promise.all(k.filter((x) => x !== VERSIONE).map((x) => caches.delete(x))))
			.then(() => self.clients.claim())
	);
});
self.addEventListener('fetch', (e) => {
	if (e.request.mode !== 'navigate') return; // niente cache: rete normale
	e.respondWith(fetch(e.request).catch(() => caches.match('./gestione-offline.html')));
});
