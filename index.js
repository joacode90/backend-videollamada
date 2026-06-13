require('dotenv').config(); // 👈 ¡AQUÍ! En la línea 1, antes que cualquier otra cosa

const express = require('express');
const cors = require('cors');
const http = require('http'); // 👈 Requerimos el módulo nativo HTTP de Node
const { Server } = require('socket.io'); // 👈 Requerimos Socket.io

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar el Servidor HTTP tradicional usando Express
const server = http.createServer(app);

// Configurar el Servidor de WebSockets con CORS permitido para tu React (puerto 5173)
const io = new Server(server, {
    cors: {
        origin: '*',//Permite que se conecten desde el celular o cualquier IP remota
        methods: ["GET", "POST"]
    }
});

// Middlewares tradicionales
app.use(cors());
app.use(express.json());

// Rutas existentes (MySQL y Autenticación)
const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);

const meetingRoutes = require('./meetings');
app.use('/api/meetings', meetingRoutes);

// Ruta base de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Videollamadas corriendo con WebSockets activos.');
});

// 🔌 LÓGICA DE WEBSOCKETS PARA WEBRTC (Signaling)
io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado al WebSocket: ${socket.id}`);

    // 🚪 Evento: Cuando un usuario se une a una sala específica
    socket.on('join-room', (codigoSala, usuarioId) => {
        socket.join(codigoSala);
        console.log(`👤 Usuario [${usuarioId}] se unió a la sala: [${codigoSala}]`);

        // Le avisamos a los demás miembros de la sala que alguien nuevo llegó
        socket.to(codigoSala).emit('user-connected', usuarioId);
    });

    // Reenviar oferta al otro usuario de la sala
    socket.on('offer', (codigoSala, offer) => {
        socket.to(codigoSala).emit('offer', offer);
    });

    // Reenviar respuesta al creador de la oferta
    socket.on('answer', (codigoSala, answer) => {
        socket.to(codigoSala).emit('answer', answer);
    });

    // Reenviar los candidatos ICE de red
    socket.on('ice-candidate', (codigoSala, candidate) => {
        socket.to(codigoSala).emit('ice-candidate', candidate);
    });

    // Reenviar evento de que un usuario abandonó la sala
    socket.on('leave-room', (codigoSala) => {
        socket.to(codigoSala).emit('user-disconnected', socket.id);
    });

    // 🛑 Evento: Desconexión voluntaria o cierre de pestaña
    socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.id}`);
    });
});

// 🚨 IMPORTANTE: Cambiamos app.listen por server.listen para activar HTTP + WebSockets juntos
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});