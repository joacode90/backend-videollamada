const mysql = require('mysql2');
require('dotenv').config(); // Carga las variables del archivo .env

// 🏊‍♂️ Creamos el pool de conexiones a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // 👈 Agrega el puerto por si tu BD en la nube no usa el 3306
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // 🔽 Quitamos el SSL para adaptarnos al MySQL gratuito de Railway
    ssl: false,
});

// 🔄 Convertimos el pool para poder usar "Promises" (async/await) lo cual hace el código más limpio
const promisePool = pool.promise();

// 🧪 Bloque de prueba para verificar que la conexión funcione al iniciar
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos de MySQL:', err.message);
    } else {
        console.log('✅ ¡Conexión exitosa a la base de datos MySQL!');
        connection.release(); // Libera la conexión de prueba
    }
});

module.exports = promisePool;