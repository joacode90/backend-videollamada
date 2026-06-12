const express = require('express');
const router = express.Router();
const db = require('./db'); // Conexión a MySQL

// Funcionalidad auxiliar para generar un código estilo "abc-defg-hij" o "abc-123"
function generarCodigoSala() {
    const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let parte1 = '';
    let parte2 = '';

    for (let i = 0; i < 3; i++) {
        parte1 += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    for (let i = 0; i < 3; i++) {
        parte2 += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    return `${parte1}-${parte2}`;
}

// 📹 RUTA PARA CREAR NUEVA REUNIÓN (/api/meetings/create)
router.post('/create', async (req, res) => {
    const { creador_id } = req.body; // Necesitamos saber qué usuario la está creando

    if (!creador_id) {
        return res.status(400).json({ error: 'El ID del creador es obligatorio.' });
    }

    try {
        const codigoSala = generarCodigoSala();

        // Guardar en la tabla 'reuniones' de MySQL
        await db.query(
            'INSERT INTO reuniones (codigo_sala, creador_id) VALUES (?, ?)',
            [codigoSala, creador_id]
        );

        // Devolvemos el código generado para que React lo use
        return res.status(201).json({
            message: 'Reunión creada con éxito',
            codigo_sala: codigoSala
        });

    } catch (error) {
        console.error('Error al crear reunión en la BD:', error);
        return res.status(500).json({ error: 'Error interno del servidor al crear la sala.' });
    }
});

// 🔍 RUTA PARA VALIDAR SI UNA SALA EXISTE (/api/meetings/validate/:codigo)
router.get('/validate/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        // Buscamos en la base de datos si existe el código de sala ingresado
        const [salas] = await db.query(
            'SELECT * FROM reuniones WHERE codigo_sala = ?',
            [codigo]
        );

        // Si la consulta no devuelve ninguna fila, la sala no existe
        if (salas.length === 0) {
            return res.status(404).json({ error: 'El código de reunión no existe o es inválido.' });
        }

        // Si existe, respondemos con éxito y devolvemos los datos de la sala
        return res.status(200).json({
            message: 'Sala válida',
            sala: salas[0]
        });

    } catch (error) {
        console.error('Error al validar la sala en MySQL:', error);
        return res.status(500).json({ error: 'Error interno del servidor al validar la sala.' });
    }
});

module.exports = router;