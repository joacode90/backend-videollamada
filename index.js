require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*', // mejor limitar en producción
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);

const meetingRoutes = require('./meetings');
app.use('/api/meetings', meetingRoutes);

app.get('/', (req, res) => {
    res.send('Servidor de Videollamadas corriendo con WebSockets activos.');
});

// WebSockets
io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado: ${socket.id}`);

    socket.on('join-room', (codigoSala, usuarioId) => {
        socket.join(codigoSala);
        console.log(`👤 Usuario [${usuarioId}] se unió a la sala: [${codigoSala}]`);
        socket.to(codigoSala).emit('user-connected', usuarioId);
    });

    socket.on('offer', (codigoSala, offer) => {
        socket.to(codigoSala).emit('offer', offer);
    });

    socket.on('answer', (codigoSala, answer) => {
        socket.to(codigoSala).emit('answer', answer);
    });

    socket.on('ice-candidate', (codigoSala, candidate) => {
        socket.to(codigoSala).emit('ice-candidate', candidate);
    });

    socket.on('leave-room', (codigoSala) => {
        socket.to(codigoSala).emit('user-disconnected', socket.id);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
