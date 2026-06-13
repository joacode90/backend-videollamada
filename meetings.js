const express = require('express');
const router = express.Router();
const db = require('./db');

function generarCodigoSala() {
    const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let parte1 = '';
    let parte2 = '';

    for (let i = 0; i < 3; i++) parte1 += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    for (let i = 0; i < 3; i++) parte2 += caracteres.charAt(Math.floor(Math.random() * caracteres.length));

    return `${parte1}-${parte2}`;
}

router.post('/create', async (req, res) => {
    const { creador_id } = req.body;

    if (!creador_id) {
        return res.status(400).json({ error: 'El ID del creador es obligatorio.' });
    }

    try {
        let codigoSala;
        let existe = true;

        // Generar hasta que no exista duplicado
        while (existe) {
            codigoSala = generarCodigoSala();
            const [salas] = await db.query('SELECT * FROM reuniones WHERE codigo_sala = ?', [codigoSala]);
            existe = salas.length > 0;
        }

        await db.query(
            'INSERT INTO reuniones (codigo_sala, creador_id) VALUES (?, ?)',
            [codigoSala, creador_id]
        );

        return res.status(201).json({
            message: 'Reunión creada con éxito',
            codigo_sala: codigoSala
        });

    } catch (error) {
        console.error('Error al crear reunión en la BD:', error);
        return res.status(500).json({ error: 'Error interno del servidor al crear la sala.' });
    }
});

router.get('/validate/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const [salas] = await db.query('SELECT * FROM reuniones WHERE codigo_sala = ?', [codigo]);

        if (salas.length === 0) {
            return res.status(404).json({ error: 'El código de reunión no existe o es inválido.' });
        }

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
