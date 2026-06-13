const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    ssl: {
        rejectUnauthorized: false // prueba con false si da error
    }
});

// Test de conexión
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ ¡Conexión exitosa a la base de datos MySQL!");
        connection.release();
    } catch (err) {
        console.error("❌ Error al conectar a la base de datos:", err.message);
    }
})();

module.exports = pool;
