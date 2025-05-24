// src/routes/solicitud.routes.js
const express = require('express');
const SolicitudController = require('../controllers/solicitud.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');
const router = express.Router();

// Rutas para todos los usuarios autenticados
router.get('/', verifyToken, SolicitudController.getAll);
router.get('/pendientes', verifyToken, isAdmin, SolicitudController.getPendientes);
router.get('/:id', verifyToken, SolicitudController.getById);
router.post('/', verifyToken, SolicitudController.create);
router.delete('/:id', verifyToken, SolicitudController.delete);

// Rutas solo para administradores
router.patch('/:id/aprobar', verifyToken, isAdmin, SolicitudController.aprobar);
router.patch('/:id/rechazar', verifyToken, isAdmin, SolicitudController.rechazar);

// Rutas para vacaciones
router.get('/empleado/:id/vacaciones-disponibles', verifyToken, SolicitudController.getVacacionesDisponibles);
router.get('/empleado/:id/vacaciones-tomadas', verifyToken, SolicitudController.getVacacionesTomadas);

module.exports = router;
