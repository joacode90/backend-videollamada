const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db');

// 📝 1. RUTA DE REGISTRO (/api/auth/register)
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar si el usuario ya existe
        const [usuariosExistentes] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertar nuevo usuario en la BD
        await db.query(
            'INSERT INTO usuarios (email, password_hash, activo) VALUES (?, ?, 1)',
            [email, passwordHash]
        );

        return res.status(201).json({ message: 'Usuario registrado con éxito' });

    } catch (error) {
        console.error('Error en el registro:', error);
        return res.status(500).json({ error: 'Error interno del servidor al registrar' });
    }
});

// 🔑 2. RUTA DE LOGIN (/api/auth/login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Buscar usuario activo por email
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(400).json({ error: 'Credenciales inválidas (usuario no encontrado o inactivo)' });
        }

        const usuario = usuarios[0];

        // Comparar contraseña ingresada con el hash
        const contrasenaValida = await bcrypt.compare(password, usuario.password_hash);

        if (!contrasenaValida) {
            return res.status(400).json({ error: 'Credenciales inválidas (contraseña incorrecta)' });
        }

        // Login exitoso
        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            user: {
                id: usuario.id,
                email: usuario.email,
                activo: usuario.activo
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
    }
});

module.exports = router;
