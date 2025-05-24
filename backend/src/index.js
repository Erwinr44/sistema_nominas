// src/index.js
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { testConnection } = require('./database/connection');

// Inicializar la aplicación Express
const app = express();

// Configurar middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Middleware para logs básicos
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API del Sistema de Nómina', version: '1.0.0' });
});

// Las rutas se importarán aquí más adelante
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/empleados', require('./routes/empleado.routes'));
app.use('/api/nominas', require('./routes/nomina.routes'));
app.use('/api/solicitudes', require('./routes/solicitud.routes'));
app.use('/api/liquidaciones', require('./routes/liquidacion.routes'));
app.use('/api/areas', require('./routes/area.routes'));
app.use('/api/roles', require('./routes/empleado.routes'));
// ...

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Error interno del servidor',
    details: config.server.nodeEnv === 'development' ? err.message : undefined
  });
});

// Iniciar el servidor
const PORT = config.server.port;
app.listen(PORT, async () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  // Probar conexión a la base de datos
  await testConnection();
});
