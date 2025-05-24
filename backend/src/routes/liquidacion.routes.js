// src/routes/liquidacion.routes.js
const express = require('express');
const LiquidacionController = require('../controllers/liquidacion.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas de liquidación requieren permisos de administrador
router.get('/', verifyToken, isAdmin, LiquidacionController.getAll);
router.get('/:id', verifyToken, isAdmin, LiquidacionController.getById);
router.get('/:id/resumen', verifyToken, isAdmin, LiquidacionController.getResumen);
router.get('/:id/pdf', verifyToken, isAdmin, LiquidacionController.generarFiniquitoPDF);
router.post('/calcular', verifyToken, isAdmin, LiquidacionController.calcularLiquidacion);
router.patch('/:id/pagar', verifyToken, isAdmin, LiquidacionController.marcarComoPagada);

module.exports = router;
