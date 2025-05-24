// src/services/nomina.service.js (archivo completo)
import api from './api';

class NominaService {
  /**
   * Calcular nómina
   * @param {Object} params - Parámetros para el cálculo
   * @returns {Promise<Object>} - Resultado del cálculo
   */
  static async calcular(params) {
    try {
      const response = await api.post('/nominas/calcular', params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al calcular nómina');
    }
  }

  /**
   * Obtener todas las nóminas (para administradores)
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Array>} - Lista de nóminas
   */
  static async getAll(params = {}) {
    try {
      const response = await api.get('/nominas', { params });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nóminas');
    }
  }

  /**
   * Obtener nóminas por período
   * @param {Object} params - Parámetros del período
   * @returns {Promise<Object>} - Nóminas del período
   */
  static async getByPeriodo(params) {
    try {
      const response = await api.get('/nominas/periodo', { params });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nóminas del período');
    }
  }

  /**
   * Obtener nóminas de un empleado
   * @param {number} empleadoId - ID del empleado
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Array>} - Lista de nóminas
   */
  static async getByEmpleado(empleadoId, params = {}) {
    try {
      const response = await api.get(`/nominas/empleado/${empleadoId}`, { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nóminas');
    }
  }

  /**
   * Obtener nómina por ID
   * @param {number} id - ID de la nómina
   * @returns {Promise<Object>} - Datos de la nómina
   */
  static async getById(id) {
    try {
      const response = await api.get(`/nominas/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nómina');
    }
  }

  /**
   * Obtener períodos sugeridos
   * @returns {Promise<Object>} - Períodos sugeridos
   */
  static async getPeriodosSugeridos() {
    try {
      const response = await api.get('/nominas/periodos-sugeridos');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener períodos');
    }
  }

  /**
   * Descargar recibo PDF
   * @param {number} id - ID de la nómina
   * @returns {Promise<Blob>} - PDF como blob
   */
  static async descargarReciboPDF(id) {
    try {
      const response = await api.get(`/nominas/${id}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al descargar PDF');
    }
  }

  /**
   * Marcar nómina como pagada
   * @param {number} id - ID de la nómina
   * @returns {Promise<Object>} - Respuesta de la actualización
   */
  static async marcarComoPagada(id) {
    try {
      const response = await api.patch(`/nominas/${id}/pagar`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al marcar como pagada');
    }
  }
}

export default NominaService;