// src/models/solicitud.model.js
const { pool } = require('../database/connection');

class SolicitudModel {
  /**
   * Obtiene todas las solicitudes con filtros opcionales
   * @param {Object} filtros - Filtros para las solicitudes
   * @returns {Promise<Array>} - Lista de solicitudes
   */
  static async getAll(filtros = {}) {
    try {
      let query = `
        SELECT s.*, 
               e.nombre as empleado_nombre, e.apellido as empleado_apellido,
               a.nombre as aprobador_nombre, a.apellido as aprobador_apellido
        FROM solicitudes s
        JOIN empleados e ON s.empleado_id = e.id
        LEFT JOIN empleados a ON s.aprobado_por = a.id
      `;
      
      const params = [];
      const condiciones = [];
      
      // Filtrar por empleado
      if (filtros.empleadoId) {
        condiciones.push('s.empleado_id = ?');
        params.push(filtros.empleadoId);
      }
      
      // Filtrar por tipo
      if (filtros.tipo) {
        condiciones.push('s.tipo = ?');
        params.push(filtros.tipo);
      }
      
      // Filtrar por estado
      if (filtros.estado) {
        condiciones.push('s.estado = ?');
        params.push(filtros.estado);
      }
      
      // Filtrar por fechas
      if (filtros.fechaInicio) {
        condiciones.push('s.fecha_inicio >= ?');
        params.push(filtros.fechaInicio);
      }
      
      if (filtros.fechaFin) {
        condiciones.push('s.fecha_fin <= ?');
        params.push(filtros.fechaFin);
      }
      
      // Agregar todas las condiciones a la consulta
      if (condiciones.length > 0) {
        query += ' WHERE ' + condiciones.join(' AND ');
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      query += ' ORDER BY s.creado_en DESC';
      
      // Ejecutar la consulta
      const [solicitudes] = await pool.query(query, params);
      return solicitudes;
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene una solicitud específica por su ID
   * @param {number} id - ID de la solicitud
   * @returns {Promise<Object>} - Datos de la solicitud
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, 
                e.nombre as empleado_nombre, e.apellido as empleado_apellido,
                a.nombre as aprobador_nombre, a.apellido as aprobador_apellido
         FROM solicitudes s
         JOIN empleados e ON s.empleado_id = e.id
         LEFT JOIN empleados a ON s.aprobado_por = a.id
         WHERE s.id = ?`,
        [id]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error al obtener solicitud por ID:', error);
      throw error;
    }
  }
  
  /**
   * Crea una nueva solicitud
   * @param {Object} solicitudData - Datos de la solicitud
   * @returns {Promise<number>} - ID de la solicitud creada
   */
  static async create(solicitudData) {
    try {
      // Validar datos según el tipo de solicitud
      if (solicitudData.tipo === 'vacaciones' && (!solicitudData.fecha_inicio || !solicitudData.fecha_fin)) {
        throw new Error('Las solicitudes de vacaciones requieren fecha de inicio y fin');
      }
      
      if (solicitudData.tipo === 'horas_extra' && !solicitudData.horas) {
        throw new Error('Las solicitudes de horas extra requieren la cantidad de horas');
      }
      
      // Insertar la solicitud
      const [result] = await pool.query(
        `INSERT INTO solicitudes (
          empleado_id, tipo, fecha_inicio, fecha_fin, horas, comentario
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          solicitudData.empleado_id,
          solicitudData.tipo,
          solicitudData.fecha_inicio,
          solicitudData.fecha_fin || solicitudData.fecha_inicio, // Para horas extra, la fecha_fin puede ser igual a fecha_inicio
          solicitudData.horas || null,
          solicitudData.comentario || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza el estado de una solicitud (aprobar o rechazar)
   * @param {number} id - ID de la solicitud
   * @param {string} estado - Nuevo estado (aprobada o rechazada)
   * @param {number} aprobadoPor - ID del empleado que aprueba/rechaza
   * @param {string} comentario - Comentario opcional
   * @returns {Promise<boolean>} - True si se actualizó correctamente
   */
  static async updateEstado(id, estado, aprobadoPor, comentario = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Obtener la solicitud actual
      const [solicitudActual] = await connection.query(
        'SELECT * FROM solicitudes WHERE id = ?',
        [id]
      );
      
      if (!solicitudActual || solicitudActual.length === 0) {
        throw new Error('Solicitud no encontrada');
      }
      
      // Actualizar estado de la solicitud
      const [result] = await connection.query(
        `UPDATE solicitudes 
         SET estado = ?, aprobado_por = ?, comentario = COALESCE(?, comentario)
         WHERE id = ?`,
        [estado, aprobadoPor, comentario, id]
      );
      
      // Si es una solicitud de vacaciones aprobada, registrar en la tabla de vacaciones
      if (estado === 'aprobada' && solicitudActual[0].tipo === 'vacaciones') {
        await connection.query('CALL AprobarSolicitudVacaciones(?, ?)', [
          id,
          aprobadoPor
        ]);
      }
      
      // Si es una solicitud de horas extra aprobada, registrar en el procedimiento correspondiente
      if (estado === 'aprobada' && solicitudActual[0].tipo === 'horas_extra') {
        await connection.query('CALL AprobarSolicitudHorasExtra(?, ?)', [
          id,
          aprobadoPor
        ]);
      }
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar estado de solicitud:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Elimina una solicitud pendiente
   * @param {number} id - ID de la solicitud
   * @returns {Promise<boolean>} - True si se eliminó correctamente
   */
  static async delete(id) {
    try {
      // Solo permitir eliminar solicitudes pendientes
      const [result] = await pool.query(
        `DELETE FROM solicitudes 
         WHERE id = ? AND estado = 'pendiente'`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene las solicitudes pendientes que requieren aprobación
   * @returns {Promise<Array>} - Lista de solicitudes pendientes
   */
  static async getPendientes() {
    try {
      const [solicitudes] = await pool.query(
        `SELECT s.*, 
                e.nombre as empleado_nombre, e.apellido as empleado_apellido
         FROM solicitudes s
         JOIN empleados e ON s.empleado_id = e.id
         WHERE s.estado = 'pendiente'
         ORDER BY s.creado_en ASC`
      );
      
      return solicitudes;
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si un empleado tiene vacaciones disponibles
   * @param {number} empleadoId - ID del empleado
   * @returns {Promise<Object>} - Información de vacaciones disponibles
   */
  static async verificarVacacionesDisponibles(empleadoId) {
    try {
      // Llamar al procedimiento almacenado que ya creamos
      const [result] = await pool.query('CALL ConsultarEstadoVacaciones(?)', [empleadoId]);
      
      // El resultado viene en un formato particular debido al procedimiento almacenado
      return result[0][0]; // Primer conjunto de resultados, primera fila
    } catch (error) {
      console.error('Error al verificar vacaciones disponibles:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si existe solapamiento de fechas para vacaciones
   * @param {number} empleadoId - ID del empleado
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Promise<boolean>} - True si hay solapamiento
   */
  static async verificarSolapamiento(empleadoId, fechaInicio, fechaFin) {
    try {
      const [solicitudes] = await pool.query(
        `SELECT * FROM solicitudes 
         WHERE empleado_id = ? 
         AND tipo = 'vacaciones'
         AND estado != 'rechazada'
         AND ((fecha_inicio <= ? AND fecha_fin >= ?) OR
              (fecha_inicio <= ? AND fecha_fin >= ?) OR
              (fecha_inicio >= ? AND fecha_fin <= ?))`,
        [empleadoId, fechaFin, fechaInicio, fechaFin, fechaInicio, fechaInicio, fechaFin]
      );
      
      return solicitudes.length > 0;
    } catch (error) {
      console.error('Error al verificar solapamiento de fechas:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene las vacaciones tomadas por un empleado
   * @param {number} empleadoId - ID del empleado
   * @returns {Promise<Array>} - Lista de períodos de vacaciones
   */
  static async getVacacionesTomadas(empleadoId) {
    try {
      const [vacaciones] = await pool.query(
        `SELECT v.*, s.estado
         FROM vacaciones v
         LEFT JOIN solicitudes s ON v.solicitud_id = s.id
         WHERE v.empleado_id = ?
         ORDER BY v.fecha_inicio DESC`,
        [empleadoId]
      );
      
      return vacaciones;
    } catch (error) {
      console.error('Error al obtener vacaciones tomadas:', error);
      throw error;
    }
  }
}

module.exports = SolicitudModel;
