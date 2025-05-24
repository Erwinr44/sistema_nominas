const express = require('express');
const NominaController = require('../controllers/nomina.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');
const router = express.Router();

// Rutas existentes
router.get('/', verifyToken, isAdmin, NominaController.getAllNominas);
router.get('/periodos-sugeridos', verifyToken, isAdmin, NominaController.getPeriodosSugeridos);
router.get('/periodo', verifyToken, isAdmin, NominaController.getNominasByPeriodo);
router.get('/empleado/:id', verifyToken, NominaController.getNominasByEmpleado);
router.get('/:id', verifyToken, NominaController.getNominaById); 
router.post('/calcular', verifyToken, isAdmin, NominaController.calcularNomina);
router.patch('/:id/pagar', verifyToken, isAdmin, NominaController.marcarComoPagada);
router.get('/:id/pdf', verifyToken, NominaController.generarReciboPDF);

module.exports = router;