// src/services/empleado.service.js
import api from './api';

class EmpleadoService {
  /**
   * Obtener todos los empleados
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Array>} - Lista de empleados
   */
  static async getAll(params = {}) {
    try {
      const response = await api.get('/empleados', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener empleados');
    }
  }

  /**
   * Obtener un empleado por ID
   * @param {number} id - ID del empleado
   * @returns {Promise<Object>} - Datos del empleado
   */
  static async getById(id) {
    try {
      const response = await api.get(`/empleados/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener empleado');
    }
  }

  /**
   * Crear un nuevo empleado
   * @param {Object} empleadoData - Datos del empleado
   * @returns {Promise<Object>} - Respuesta de la creación
   */
  static async create(empleadoData) {
    try {
      const response = await api.post('/empleados', empleadoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear empleado');
    }
  }

  /**
   * Actualizar un empleado
   * @param {number} id - ID del empleado
   * @param {Object} empleadoData - Datos a actualizar
   * @returns {Promise<Object>} - Respuesta de la actualización
   */
  static async update(id, empleadoData) {
    try {
      const response = await api.put(`/empleados/${id}`, empleadoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar empleado');
    }
  }

  /**
   * Desactivar un empleado
   * @param {number} id - ID del empleado
   * @returns {Promise<Object>} - Respuesta de la desactivación
   */
  static async deactivate(id) {
    try {
      const response = await api.delete(`/empleados/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al desactivar empleado');
    }
  }

  /**
   * Obtener organigrama
   * @returns {Promise<Object>} - Datos del organigrama
   */
  static async getOrganigrama() {
    try {
      const response = await api.get('/empleados/organigrama');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener organigrama');
    }
  }
  // src/services/empleado.service.js (agregar estos métodos al existente)

/**
 * Cambiar contraseña de un empleado
 * @param {number} id - ID del empleado
 * @param {string} password - Nueva contraseña
 * @returns {Promise<Object>} - Respuesta del cambio
 */
static async changePassword(id, password) {
  try {
    const response = await api.patch(`/empleados/${id}/password`, { password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al cambiar contraseña');
  }
}

/**
 * Obtener roles disponibles
 * @returns {Promise<Array>} - Lista de roles
 */
static async getRoles() {
  try {
    const response = await api.get('/roles');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener roles');
  }
}

/**
 * Obtener historial de salarios de un empleado
 * @param {number} id - ID del empleado
 * @returns {Promise<Array>} - Historial de salarios
 */
static async getHistorialSalario(id) {
  try {
    const response = await api.get(`/empleados/${id}/historial-salario`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener historial');
  }
}
}

export default EmpleadoService;
