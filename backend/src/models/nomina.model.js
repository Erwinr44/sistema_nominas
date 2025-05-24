// src/models/nomina.model.js
const { pool } = require('../database/connection');
const moment = require('moment');

class NominaModel {

  /**
   * Obtiene todas las nóminas con filtros opcionales
   * @param {Object} filtros - Filtros para las nóminas
   * @returns {Promise<Array>} - Lista de nóminas
   */
  static async getAllNominas(filtros = {}) {
    try {
      let query = `
        SELECT n.*, 
               e.nombre, e.apellido, e.numero_empleado,
               a.nombre as area_nombre
        FROM nominas n
        JOIN empleados e ON n.empleado_id = e.id
        LEFT JOIN areas a ON e.area_id = a.id
      `;
      
      const params = [];
      const condiciones = [];
      
      // Filtrar por empleado
      if (filtros.empleadoId) {
        condiciones.push('n.empleado_id = ?');
        params.push(filtros.empleadoId);
      }
      
      // Filtrar por tipo
      if (filtros.tipo) {
        condiciones.push('n.tipo = ?');
        params.push(filtros.tipo);
      }
      
      // Filtrar por fechas
      if (filtros.fechaInicio) {
        condiciones.push('n.fecha_inicio >= ?');
        params.push(filtros.fechaInicio);
      }
      
      if (filtros.fechaFin) {
        condiciones.push('n.fecha_fin <= ?');
        params.push(filtros.fechaFin);
      }
      
      // Agregar todas las condiciones a la consulta
      if (condiciones.length > 0) {
        query += ' WHERE ' + condiciones.join(' AND ');
      }
      
      // Ordenar por fecha de procesamiento (más recientes primero)
      query += ' ORDER BY n.fecha_procesamiento DESC';
      
      // Agregar límite si existe
      if (filtros.limite) {
        query += ' LIMIT ?';
        params.push(parseInt(filtros.limite));
      }
      
      // Ejecutar la consulta
      const [nominas] = await pool.query(query, params);
      return nominas;
    } catch (error) {
      console.error('Error al obtener todas las nóminas:', error);
      throw error;
    }
  }
  /**
   * Calcula la nómina quincenal para todos los empleados correspondientes
   * @param {string} fechaInicio - Fecha de inicio del período
   * @param {string} fechaFin - Fecha de fin del período
   * @param {number} procesadoPor - ID del usuario que procesa la nómina
   * @returns {Promise<Array>} - Resultados del cálculo
   */
  static async calcularNominaQuincenal(fechaInicio, fechaFin, procesadoPor) {
    try {
      // Verificar que no exista una nómina ya procesada para este período
      const [nominasExistentes] = await pool.query(
        `SELECT COUNT(*) as total FROM nominas 
         WHERE fecha_inicio = ? AND fecha_fin = ? AND tipo = 'quincenal'`,
        [fechaInicio, fechaFin]
      );
      
      if (nominasExistentes[0].total > 0) {
        throw new Error('Ya existe una nómina procesada para este período');
      }
      
      // Llamar al procedimiento almacenado
      await pool.query('CALL CalcularNominaQuincenal(?, ?)', [
        fechaInicio, 
        fechaFin
      ]);
      
      // Obtener las nóminas generadas
      const [nominas] = await pool.query(
        `SELECT n.*, e.nombre, e.apellido 
         FROM nominas n
         JOIN empleados e ON n.empleado_id = e.id
         WHERE n.fecha_inicio = ? AND n.fecha_fin = ? AND n.tipo = 'quincenal'`,
        [fechaInicio, fechaFin]
      );
      
      return nominas;
    } catch (error) {
      console.error('Error al calcular nómina quincenal:', error);
      throw error;
    }
  }
  
  /**
   * Calcula la nómina semanal para todos los empleados correspondientes
   * @param {string} fechaInicio - Fecha de inicio del período
   * @param {string} fechaFin - Fecha de fin del período
   * @param {number} procesadoPor - ID del usuario que procesa la nómina
   * @returns {Promise<Array>} - Resultados del cálculo
   */
  static async calcularNominaSemanal(fechaInicio, fechaFin, procesadoPor) {
    try {
      // Verificar que no exista una nómina ya procesada para este período
      const [nominasExistentes] = await pool.query(
        `SELECT COUNT(*) as total FROM nominas 
         WHERE fecha_inicio = ? AND fecha_fin = ? AND tipo = 'semanal'`,
        [fechaInicio, fechaFin]
      );
      
      if (nominasExistentes[0].total > 0) {
        throw new Error('Ya existe una nómina procesada para este período');
      }
      
      // Llamar al procedimiento almacenado
      await pool.query('CALL CalcularNominaSemanal(?, ?)', [
        fechaInicio, 
        fechaFin
      ]);
      
      // Obtener las nóminas generadas
      const [nominas] = await pool.query(
        `SELECT n.*, e.nombre, e.apellido 
         FROM nominas n
         JOIN empleados e ON n.empleado_id = e.id
         WHERE n.fecha_inicio = ? AND n.fecha_fin = ? AND n.tipo = 'semanal'`,
        [fechaInicio, fechaFin]
      );
      
      return nominas;
    } catch (error) {
      console.error('Error al calcular nómina semanal:', error);
      throw error;
    }
  }
  
  /**
   * Calcula la nómina mensual para todos los empleados correspondientes
   * @param {string} fechaInicio - Fecha de inicio del período
   * @param {string} fechaFin - Fecha de fin del período
   * @param {number} procesadoPor - ID del usuario que procesa la nómina
   * @returns {Promise<Array>} - Resultados del cálculo
   */
  static async calcularNominaMensual(fechaInicio, fechaFin, procesadoPor) {
    try {
      // Verificar que no exista una nómina ya procesada para este período
      const [nominasExistentes] = await pool.query(
        `SELECT COUNT(*) as total FROM nominas 
         WHERE fecha_inicio = ? AND fecha_fin = ? AND tipo = 'mensual'`,
        [fechaInicio, fechaFin]
      );
      
      if (nominasExistentes[0].total > 0) {
        throw new Error('Ya existe una nómina procesada para este período');
      }
      
      // Llamar al procedimiento almacenado
      await pool.query('CALL CalcularNominaMensual(?, ?)', [
        fechaInicio, 
        fechaFin
      ]);
      
      // Obtener las nóminas generadas
      const [nominas] = await pool.query(
        `SELECT n.*, e.nombre, e.apellido 
         FROM nominas n
         JOIN empleados e ON n.empleado_id = e.id
         WHERE n.fecha_inicio = ? AND n.fecha_fin = ? AND n.tipo = 'mensual'`,
        [fechaInicio, fechaFin]
      );
      
      return nominas;
    } catch (error) {
      console.error('Error al calcular nómina mensual:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene la nómina de un empleado específico
   * @param {number} empleadoId - ID del empleado
   * @param {Object} filtros - Filtros adicionales (fechaInicio, fechaFin, tipo)
   * @returns {Promise<Array>} - Nóminas del empleado
   */
  static async getNominasByEmpleado(empleadoId, filtros = {}) {
    try {
      let query = `
        SELECT n.*, e.nombre, e.apellido, e.numero_empleado
        FROM nominas n
        JOIN empleados e ON n.empleado_id = e.id
        WHERE n.empleado_id = ?
      `;
      
      const params = [empleadoId];
      
      // Agregar filtros adicionales si existen
      if (filtros.fechaInicio) {
        query += ' AND n.fecha_inicio >= ?';
        params.push(filtros.fechaInicio);
      }
      
      if (filtros.fechaFin) {
        query += ' AND n.fecha_fin <= ?';
        params.push(filtros.fechaFin);
      }
      
      if (filtros.tipo) {
        query += ' AND n.tipo = ?';
        params.push(filtros.tipo);
      }
      
      query += ' ORDER BY n.fecha_procesamiento DESC';
      
      // Agregar límite si existe
      if (filtros.limite) {
        query += ' LIMIT ?';
        params.push(parseInt(filtros.limite));
      }
      
      const [nominas] = await pool.query(query, params);
      return nominas;
    } catch (error) {
      console.error('Error al obtener nóminas del empleado:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene una nómina específica por su ID
   * @param {number} nominaId - ID de la nómina
   * @returns {Promise<Object>} - Datos de la nómina
   */
  static async getNominaById(nominaId) {
    try {
      const [rows] = await pool.query(
        `SELECT n.*, e.nombre, e.apellido, e.numero_empleado, a.nombre as area_nombre
         FROM nominas n
         JOIN empleados e ON n.empleado_id = e.id
         LEFT JOIN areas a ON e.area_id = a.id
         WHERE n.id = ?`,
        [nominaId]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error al obtener nómina por ID:', error);
      throw error;
    }
  }
  
  /**
   * Marca una nómina como pagada
   * @param {number} nominaId - ID de la nómina
   * @returns {Promise<boolean>} - True si se actualizó correctamente
   */
  static async marcarComoPagada(nominaId) {
    try {
      const [result] = await pool.query(
        `UPDATE nominas SET estado = 'pagada' WHERE id = ?`,
        [nominaId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al marcar nómina como pagada:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las nóminas de un período específico
   * @param {string} fechaInicio - Fecha de inicio del período
   * @param {string} fechaFin - Fecha de fin del período
   * @param {string} tipo - Tipo de nómina (opcional)
   * @returns {Promise<Array>} - Nóminas del período
   */
  static async getNominasByPeriodo(fechaInicio, fechaFin, tipo = null) {
    try {
      let query = `
        SELECT n.*, e.nombre, e.apellido, e.numero_empleado
        FROM nominas n
        JOIN empleados e ON n.empleado_id = e.id
        WHERE n.fecha_inicio >= ? AND n.fecha_fin <= ?
      `;
      
      const params = [fechaInicio, fechaFin];
      
      if (tipo) {
        query += ' AND n.tipo = ?';
        params.push(tipo);
      }
      
      query += ' ORDER BY n.fecha_procesamiento DESC';
      
      const [nominas] = await pool.query(query, params);
      return nominas;
    } catch (error) {
      console.error('Error al obtener nóminas por período:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene los períodos de nómina sugeridos (actuales y siguientes)
   * @returns {Promise<Object>} - Períodos de nómina sugeridos
   */
  static async getPeriodosSugeridos() {
    try {
      const hoy = moment();
      
      // Para nómina quincenal
      let periodoQuincenal = {};
      if (hoy.date() <= 15) {
        // Primera quincena del mes (1-15)
        periodoQuincenal = {
          fechaInicio: hoy.clone().startOf('month').format('YYYY-MM-DD'),
          fechaFin: hoy.clone().date(15).format('YYYY-MM-DD')
        };
      } else {
        // Segunda quincena del mes (16-fin)
        periodoQuincenal = {
          fechaInicio: hoy.clone().date(16).format('YYYY-MM-DD'),
          fechaFin: hoy.clone().endOf('month').format('YYYY-MM-DD')
        };
      }
      
      // Para nómina semanal (tomando lunes a domingo)
      const periodoSemanal = {
        fechaInicio: hoy.clone().startOf('week').add(1, 'day').format('YYYY-MM-DD'), // Lunes
        fechaFin: hoy.clone().endOf('week').add(1, 'day').format('YYYY-MM-DD')      // Domingo
      };
      
      // Para nómina mensual
      const periodoMensual = {
        fechaInicio: hoy.clone().startOf('month').format('YYYY-MM-DD'),
        fechaFin: hoy.clone().endOf('month').format('YYYY-MM-DD')
      };
      
      return {
        quincenal: periodoQuincenal,
        semanal: periodoSemanal,
        mensual: periodoMensual
      };
    } catch (error) {
      console.error('Error al obtener períodos sugeridos:', error);
      throw error;
    }
  }
}

module.exports = NominaModel;
