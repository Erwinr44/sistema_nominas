// src/routes/nomina.routes.js
const express = require('express');
const NominaController = require('../controllers/nomina.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Rutas públicas (ninguna en este caso)

// Rutas protegidas (requieren autenticación)
router.get('/periodos-sugeridos', verifyToken, NominaController.getPeriodosSugeridos);
router.get('/empleado/:id', verifyToken, NominaController.getNominasByEmpleado);
router.get('/periodo', verifyToken, isAdmin, NominaController.getNominasByPeriodo);
router.get('/', verifyToken, isAdmin, NominaController.getAllNominas);
router.get('/:id', verifyToken, NominaController.getNominaById);
router.get('/:id/pdf', verifyToken, NominaController.generarReciboPDF);
router.post('/calcular', verifyToken, isAdmin, NominaController.calcularNomina);
router.patch('/:id/pagar', verifyToken, isAdmin, NominaController.marcarComoPagada);

module.exports = router;
