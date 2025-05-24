// src/models/liquidacion.model.js
const { pool } = require('../database/connection');

class LiquidacionModel {
  /**
   * Obtiene todas las liquidaciones con filtros opcionales
   * @param {Object} filtros - Filtros para las liquidaciones
   * @returns {Promise<Array>} - Lista de liquidaciones
   */
  static async getAll(filtros = {}) {
    try {
      let query = `
        SELECT l.*, 
               e.nombre as empleado_nombre, e.apellido as empleado_apellido,
               p.nombre as procesado_por_nombre, p.apellido as procesado_por_apellido
        FROM liquidaciones l
        JOIN empleados e ON l.empleado_id = e.id
        JOIN empleados p ON l.procesado_por = p.id
      `;
      
      const params = [];
      const condiciones = [];
      
      // Filtrar por empleado
      if (filtros.empleadoId) {
        condiciones.push('l.empleado_id = ?');
        params.push(filtros.empleadoId);
      }
      
      // Filtrar por motivo
      if (filtros.motivo) {
        condiciones.push('l.motivo = ?');
        params.push(filtros.motivo);
      }
      
      // Filtrar por estado
      if (filtros.estado) {
        condiciones.push('l.estado = ?');
        params.push(filtros.estado);
      }
      
      // Filtrar por fechas
      if (filtros.fechaInicio) {
        condiciones.push('l.fecha_procesamiento >= ?');
        params.push(filtros.fechaInicio);
      }
      
      if (filtros.fechaFin) {
        condiciones.push('l.fecha_procesamiento <= ?');
        params.push(filtros.fechaFin);
      }
      
      // Agregar todas las condiciones a la consulta
      if (condiciones.length > 0) {
        query += ' WHERE ' + condiciones.join(' AND ');
      }
      
      // Ordenar por fecha de procesamiento (más recientes primero)
      query += ' ORDER BY l.fecha_procesamiento DESC';
      
      // Ejecutar la consulta
      const [liquidaciones] = await pool.query(query, params);
      return liquidaciones;
    } catch (error) {
      console.error('Error al obtener liquidaciones:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene una liquidación específica por su ID
   * @param {number} id - ID de la liquidación
   * @returns {Promise<Object>} - Datos de la liquidación
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT l.*, 
                e.nombre as empleado_nombre, e.apellido as empleado_apellido,
                p.nombre as procesado_por_nombre, p.apellido as procesado_por_apellido
         FROM liquidaciones l
         JOIN empleados e ON l.empleado_id = e.id
         JOIN empleados p ON l.procesado_por = p.id
         WHERE l.id = ?`,
        [id]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error al obtener liquidación por ID:', error);
      throw error;
    }
  }
  
  /**
   * Calcula y crea una liquidación para un empleado
   * @param {Object} liquidacionData - Datos para la liquidación
   * @returns {Promise<number>} - ID de la liquidación creada
   */
  static async calcularLiquidacion(liquidacionData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar que el empleado existe y está activo
      const [empleado] = await connection.query(
        'SELECT * FROM empleados WHERE id = ? AND activo = TRUE',
        [liquidacionData.empleado_id]
      );
      
      if (!empleado || empleado.length === 0) {
        throw new Error('Empleado no encontrado o inactivo');
      }
      
      // Validar motivo de liquidación
      if (!['renuncia', 'despido', 'despido_justificado'].includes(liquidacionData.motivo)) {
        throw new Error('Motivo de liquidación inválido');
      }
      
      // Llamar al procedimiento almacenado para calcular la liquidación
      await connection.query('CALL CalcularLiquidacion(?, ?, ?, ?)', [
        liquidacionData.empleado_id,
        liquidacionData.fecha_fin || new Date(),
        liquidacionData.motivo,
        liquidacionData.procesado_por
      ]);
      
      // Obtener la liquidación generada
      const [liquidacion] = await connection.query(
        `SELECT id FROM liquidaciones 
         WHERE empleado_id = ? 
         ORDER BY fecha_procesamiento DESC 
         LIMIT 1`,
        [liquidacionData.empleado_id]
      );
      
      if (!liquidacion || liquidacion.length === 0) {
        throw new Error('Error al generar la liquidación');
      }
      
      await connection.commit();
      return liquidacion[0].id;
    } catch (error) {
      await connection.rollback();
      console.error('Error al calcular liquidación:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Marca una liquidación como pagada
   * @param {number} id - ID de la liquidación
   * @returns {Promise<boolean>} - True si se actualizó correctamente
   */
  static async marcarComoPagada(id) {
    try {
      const [result] = await pool.query(
        `UPDATE liquidaciones SET estado = 'pagada' WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al marcar liquidación como pagada:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si un empleado ya tiene una liquidación
   * @param {number} empleadoId - ID del empleado
   * @returns {Promise<boolean>} - True si ya tiene liquidación
   */
  static async verificarLiquidacionExistente(empleadoId) {
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) as total FROM liquidaciones WHERE empleado_id = ?',
        [empleadoId]
      );
      
      return rows[0].total > 0;
    } catch (error) {
      console.error('Error al verificar liquidación existente:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene un resumen de la liquidación calculada
   * @param {number} id - ID de la liquidación
   * @returns {Promise<Object>} - Resumen detallado de la liquidación
   */
  static async getResumenLiquidacion(id) {
    try {
      // Obtener datos de la liquidación
      const liquidacion = await this.getById(id);
      
      if (!liquidacion) {
        throw new Error('Liquidación no encontrada');
      }
      
      // Obtener detalles adicionales del empleado
      const [empleado] = await pool.query(
        `SELECT e.*, a.nombre as area_nombre
         FROM empleados e
         LEFT JOIN areas a ON e.area_id = a.id
         WHERE e.id = ?`,
        [liquidacion.empleado_id]
      );
      
      // Calcular período trabajado
      const fechaInicio = new Date(liquidacion.fecha_inicio);
      const fechaFin = new Date(liquidacion.fecha_fin);
      const diasTrabajados = Math.floor((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
      
      return {
        liquidacion,
        empleado: empleado[0],
        detalles: {
          periodo_trabajado: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            años: liquidacion.años_servicio,
            dias_totales: diasTrabajados
          },
          desglose: {
            indemnizacion: liquidacion.indemnizacion,
            aguinaldo_proporcional: liquidacion.aguinaldo_proporcional,
            bono14_proporcional: liquidacion.bono14_proporcional,
            vacaciones_pendientes: liquidacion.vacaciones_pendientes,
            otros_pagos: liquidacion.otros_pagos
          },
          total: liquidacion.total_liquidacion
        }
      };
    } catch (error) {
      console.error('Error al obtener resumen de liquidación:', error);
      throw error;
    }
  }
}

module.exports = LiquidacionModel;
