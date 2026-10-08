import { io } from 'socket.io-client';

// Connect to socket server
// In production or separate deploy, honors VITE_API_URL or current domain
const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' && window.location.port !== '5000'
    ? 'http://localhost:5000'
    : window.location.origin);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
