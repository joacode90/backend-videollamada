const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db'); // Nuestra conexión a MySQL

// 📝 1. RUTA DE REGISTRO (/api/auth/register)
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Validación básica de campos vacíos
    if (!email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // 🔍 Controlar si el usuario YA existe en el sistema
        const [usuariosExistentes] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // 🔒 Encriptar la contraseña (seguridad ante todo)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 💾 Insertar el nuevo usuario en la base de datos de MySQL
        await db.query(
            'INSERT INTO usuarios (email, password_hash) VALUES (?, ?)',
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
        // 🔍 Buscar al usuario por su email
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);

        if (usuarios.length === 0) {
            return res.status(400).json({ error: 'Credenciales inválidas (usuario no encontrado)' });
        }

        const usuario = usuarios[0];

        // 🔑 Comparar la contraseña ingresada con el Hash guardado en MySQL
        const contrasenaValida = await bcrypt.compare(password, usuario.password_hash);

        if (!contrasenaValida) {
            return res.status(400).json({ error: 'Credenciales inválidas (contraseña incorrecta)' });
        }

        // 🔓 Login Exitoso
        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            user: { id: usuario.id, email: usuario.email }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
    }
});

module.exports = router;