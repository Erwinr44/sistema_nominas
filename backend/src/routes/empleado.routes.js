// src/routes/empleado.routes.js
const express = require('express');
const EmpleadoController = require('../controllers/empleado.controller');
const { verifyToken, isAdmin, isSuperAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Rutas públicas (ninguna en este caso)

// Rutas protegidas (requieren autenticación)
router.get('/', verifyToken, isAdmin, EmpleadoController.getAll);
router.get('/organigrama', verifyToken, EmpleadoController.getOrganigrama);
router.get('/:id', verifyToken, EmpleadoController.getById);
router.post('/', verifyToken, isAdmin, EmpleadoController.create);
router.put('/:id', verifyToken, isAdmin, EmpleadoController.update);
router.patch('/:id/password', verifyToken, isAdmin, EmpleadoController.updatePassword);
router.delete('/:id', verifyToken, isAdmin, EmpleadoController.deactivate);

// backend/src/routes/empleado.routes.js (agregar estas rutas)

// GET /api/roles - Obtener todos los roles
router.get('/roles', verifyToken, async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY id');
    res.json({
      error: false,
      data: roles
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      error: true,
      message: 'Error al obtener roles'
    });
  }
});

// GET /api/empleados/:id/historial-salario
router.get('/:id/historial-salario', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [historial] = await pool.query(`
      SELECT h.*, e.nombre as registrado_por_nombre, e.apellido as registrado_por_apellido
      FROM historial_salarios h
      LEFT JOIN empleados e ON h.registrado_por = e.id
      WHERE h.empleado_id = ?
      ORDER BY h.fecha_cambio DESC
    `, [id]);
    
    res.json({
      error: false,
      data: historial
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      error: true,
      message: 'Error al obtener historial de salarios'
    });
  }
});

module.exports = router;
