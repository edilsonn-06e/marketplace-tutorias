import http from 'node:http';
import app from './app';
import { env } from './config/env';
// import { initChatSocket } from './sockets/chat.socket'; // descomenta en la sección 11

const server = http.createServer(app);
// initChatSocket(server);

server.listen(env.PORT, () => {
  console.log(`API escuchando en http://localhost:${env.PORT}`);
});
