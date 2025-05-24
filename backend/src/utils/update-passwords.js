// src/utils/update-passwords.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function updatePasswords() {
  // Crear conexión directa a la base de datos
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });

  try {
    // Obtener todos los usuarios
    const [users] = await connection.query('SELECT id, email FROM empleados');
    console.log(`Encontrados ${users.length} usuarios`);

    // Contraseña simple para desarrollo: '123456'
    const newPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar cada usuario
    for (const user of users) {
      await connection.query('UPDATE empleados SET password = ? WHERE id = ?', [
        passwordHash, 
        user.id
      ]);
      console.log(`Actualizada contraseña para ${user.email}`);
    }

    console.log('¡Todas las contraseñas han sido actualizadas a "123456"!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

// Ejecutar la función
updatePasswords();
