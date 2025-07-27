// O evento 'install' é acionado quando o service worker é instalado.
// Usamos isso para "pré-cache" os arquivos principais da nossa aplicação.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
  // Por enquanto, não vamos adicionar lógica de cache para manter simples.
});

// O evento 'activate' é acionado após a instalação.
// É um bom lugar para limpar caches antigos.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativado');
});

// O evento 'fetch' intercepta todas as requisições de rede da página.
// É aqui que a mágica do offline acontece.
self.addEventListener('fetch', (event) => {
  // Por enquanto, apenas deixamos a requisição passar para a rede.
  // A simples existência deste listener já é suficiente para o critério do PWA.
  event.respondWith(fetch(event.request));
});