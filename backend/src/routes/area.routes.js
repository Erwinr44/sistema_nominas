// backend/src/routes/area.routes.js
const express = require('express');
const { pool } = require('../database/connection');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/areas - Obtener todas las áreas
router.get('/', verifyToken, async (req, res) => {
  try {
    const [areas] = await pool.query(`
      SELECT a.*, 
             (SELECT COUNT(*) FROM empleados e WHERE e.area_id = a.id AND e.activo = true) as total_empleados
      FROM areas a
      ORDER BY a.area_padre_id, a.id
    `);
    
    res.json({
      error: false,
      data: areas
    });
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    res.status(500).json({
      error: true,
      message: 'Error al obtener áreas'
    });
  }
});

// POST /api/areas - Crear nueva área
router.post('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, area_padre_id } = req.body;
    
    if (!nombre) {
      return res.status(400).json({
        error: true,
        message: 'El nombre del área es obligatorio'
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO areas (nombre, descripcion, area_padre_id) VALUES (?, ?, ?)',
      [nombre, descripcion || null, area_padre_id || null]
    );
    
    res.status(201).json({
      error: false,
      message: 'Área creada correctamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear área:', error);
    res.status(500).json({
      error: true,
      message: 'Error al crear área'
    });
  }
});

// PUT /api/areas/:id - Actualizar área
router.put('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, area_padre_id } = req.body;
    
    if (!nombre) {
      return res.status(400).json({
        error: true,
        message: 'El nombre del área es obligatorio'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE areas SET nombre = ?, descripcion = ?, area_padre_id = ? WHERE id = ?',
      [nombre, descripcion || null, area_padre_id || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: true,
        message: 'Área no encontrada'
      });
    }
    
    res.json({
      error: false,
      message: 'Área actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar área:', error);
    res.status(500).json({
      error: true,
      message: 'Error al actualizar área'
    });
  }
});

// DELETE /api/areas/:id - Eliminar área
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que no tenga empleados
    const [empleados] = await pool.query(
      'SELECT COUNT(*) as total FROM empleados WHERE area_id = ? AND activo = true',
      [id]
    );
    
    if (empleados[0].total > 0) {
      return res.status(400).json({
        error: true,
        message: 'No se puede eliminar un área que tiene empleados asignados'
      });
    }
    
    // Verificar que no tenga sub-áreas
    const [subAreas] = await pool.query(
      'SELECT COUNT(*) as total FROM areas WHERE area_padre_id = ?',
      [id]
    );
    
    if (subAreas[0].total > 0) {
      return res.status(400).json({
        error: true,
        message: 'No se puede eliminar un área que tiene sub-áreas'
      });
    }
    
    const [result] = await pool.query('DELETE FROM areas WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: true,
        message: 'Área no encontrada'
      });
    }
    
    res.json({
      error: false,
      message: 'Área eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar área:', error);
    res.status(500).json({
      error: true,
      message: 'Error al eliminar área'
    });
  }
});

module.exports = router;
