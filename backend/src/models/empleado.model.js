// src/models/empleado.model.js
const { pool } = require('../database/connection');
const AuthService = require('../services/auth.service');

class EmpleadoModel {
  /**
   * Obtiene todos los empleados
   * @param {boolean} soloActivos - Si solo debe retornar empleados activos
   * @returns {Promise<Array>} - Lista de empleados
   */
  static async getAll(soloActivos = true) {
    try {
      let query = `
        SELECT e.*, r.nombre as rol_nombre, a.nombre as area_nombre
        FROM empleados e
        LEFT JOIN roles r ON e.rol_id = r.id
        LEFT JOIN areas a ON e.area_id = a.id
      `;
      
      if (soloActivos) {
        query += ' WHERE e.activo = true';
      }
      
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  }

  /**
   * Obtiene un empleado por su ID
   * @param {number} id - ID del empleado
   * @returns {Promise<Object>} - Datos del empleado
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT e.*, r.nombre as rol_nombre, a.nombre as area_nombre
         FROM empleados e
         LEFT JOIN roles r ON e.rol_id = r.id
         LEFT JOIN areas a ON e.area_id = a.id
         WHERE e.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error al obtener empleado por ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene un empleado por su email
   * @param {string} email - Email del empleado
   * @returns {Promise<Object>} - Datos del empleado
   */
  static async getByEmail(email) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM empleados WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      console.error('Error al obtener empleado por email:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo empleado
   * @param {Object} empleadoData - Datos del empleado
   * @returns {Promise<number>} - ID del empleado creado
   */
  static async create(empleadoData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Hash de la contraseña
      if (empleadoData.password) {
        empleadoData.password = await AuthService.hashPassword(empleadoData.password);
      }
      
      const [result] = await connection.query(
        `INSERT INTO empleados (
          numero_empleado, nombre, apellido, email, password, 
          dpi, fecha_nacimiento, fecha_contratacion, 
          salario_base, tipo_nomina, area_id, rol_id, jefe_directo_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empleadoData.numero_empleado,
          empleadoData.nombre,
          empleadoData.apellido,
          empleadoData.email,
          empleadoData.password,
          empleadoData.dpi,
          empleadoData.fecha_nacimiento,
          empleadoData.fecha_contratacion,
          empleadoData.salario_base,
          empleadoData.tipo_nomina,
          empleadoData.area_id,
          empleadoData.rol_id,
          empleadoData.jefe_directo_id || null
        ]
      );
      
      // Registrar historial de salario inicial
      await connection.query(
        `INSERT INTO historial_salarios (
          empleado_id, salario_anterior, salario_nuevo, motivo, registrado_por
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          result.insertId,
          0,
          empleadoData.salario_base,
          'Salario inicial',
          empleadoData.registrado_por || result.insertId
        ]
      );
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear empleado:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualiza un empleado existente
   * @param {number} id - ID del empleado
   * @param {Object} empleadoData - Datos a actualizar
   * @returns {Promise<boolean>} - True si se actualizó correctamente
   */
  static async update(id, empleadoData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Obtener empleado actual para comparar
      const [empleadoActual] = await connection.query(
        'SELECT * FROM empleados WHERE id = ?',
        [id]
      );
      
      if (!empleadoActual || empleadoActual.length === 0) {
        throw new Error('Empleado no encontrado');
      }
      
      // Verificar si hay cambio de salario
      const salarioActual = empleadoActual[0].salario_base;
      const nuevoSalario = empleadoData.salario_base;
      
      if (nuevoSalario && nuevoSalario !== salarioActual) {
        // Registrar cambio en historial de salarios
        await connection.query(
          `INSERT INTO historial_salarios (
            empleado_id, salario_anterior, salario_nuevo, motivo, registrado_por
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            salarioActual,
            nuevoSalario,
            empleadoData.motivo_cambio_salario || 'Actualización de salario',
            empleadoData.registrado_por
          ]
        );
      }
      
      // Actualizar empleado
      const [result] = await connection.query(
        `UPDATE empleados SET
          nombre = COALESCE(?, nombre),
          apellido = COALESCE(?, apellido),
          email = COALESCE(?, email),
          dpi = COALESCE(?, dpi),
          fecha_nacimiento = COALESCE(?, fecha_nacimiento),
          fecha_contratacion = COALESCE(?, fecha_contratacion),
          salario_base = COALESCE(?, salario_base),
          tipo_nomina = COALESCE(?, tipo_nomina),
          area_id = COALESCE(?, area_id),
          rol_id = COALESCE(?, rol_id),
          jefe_directo_id = COALESCE(?, jefe_directo_id)
        WHERE id = ?`,
        [
          empleadoData.nombre,
          empleadoData.apellido,
          empleadoData.email,
          empleadoData.dpi,
          empleadoData.fecha_nacimiento,
          empleadoData.fecha_contratacion,
          empleadoData.salario_base,
          empleadoData.tipo_nomina,
          empleadoData.area_id,
          empleadoData.rol_id,
          empleadoData.jefe_directo_id,
          id
        ]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar empleado:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualiza la contraseña de un empleado
   * @param {number} id - ID del empleado
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} - True si se actualizó correctamente
   */
  static async updatePassword(id, newPassword) {
    try {
      // Hash de la nueva contraseña
      const hashedPassword = await AuthService.hashPassword(newPassword);
      
      const [result] = await pool.query(
        'UPDATE empleados SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  }

  /**
   * Desactiva un empleado (baja)
   * @param {number} id - ID del empleado
   * @returns {Promise<boolean>} - True si se desactivó correctamente
   */
  static async deactivate(id) {
    try {
      const [result] = await pool.query(
        'UPDATE empleados SET activo = false WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al desactivar empleado:', error);
      throw error;
    }
  }

  /**
   * Obtiene el organigrama de la empresa
   * @returns {Promise<Object>} - Datos del organigrama
   */
  static async getOrganigrama() {
    try {
      // Obtener áreas
      const [areas] = await pool.query(`
        SELECT a.*, 
              (SELECT COUNT(*) FROM empleados e WHERE e.area_id = a.id AND e.activo = true) as total_empleados
        FROM areas a
        ORDER BY a.area_padre_id, a.id
      `);
      
      // Obtener empleados para el organigrama
      const [empleados] = await pool.query(`
        SELECT e.id, e.nombre, e.apellido, e.jefe_directo_id, e.area_id, a.nombre as area_nombre
        FROM empleados e
        JOIN areas a ON e.area_id = a.id
        WHERE e.activo = true
      `);
      
      return { areas, empleados };
    } catch (error) {
      console.error('Error al obtener organigrama:', error);
      throw error;
    }
  }
// AGREGAR este método al final de tu EmpleadoModel (antes del cierre de la clase)

/**
 * Obtiene el historial salarial de un empleado
 * @param {number} empleadoId - ID del empleado
 * @returns {Promise<Array>} - Historial salarial
 */
static async getHistorialSalario(empleadoId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        hs.*,
        CONCAT(e.nombre, ' ', e.apellido) as registrado_por_nombre
      FROM historial_salarios hs
      LEFT JOIN empleados e ON hs.registrado_por = e.id
      WHERE hs.empleado_id = ?
      ORDER BY hs.fecha_cambio DESC`,
      [empleadoId]
    );
    return rows;
  } catch (error) {
    console.error('Error al obtener historial salarial:', error);
    throw error;
  }
}
}

module.exports = EmpleadoModel;