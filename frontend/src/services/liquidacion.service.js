// src/services/liquidacion.service.js
import api from './api';

class LiquidacionService {
  /**
   * Obtener todas las liquidaciones
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Array>} - Lista de liquidaciones
   */
  static async getAll(params = {}) {
    try {
      const response = await api.get('/liquidaciones', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener liquidaciones');
    }
  }

  /**
   * Obtener liquidación por ID
   * @param {number} id - ID de la liquidación
   * @returns {Promise<Object>} - Datos de la liquidación
   */
  static async getById(id) {
    try {
      const response = await api.get(`/liquidaciones/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener liquidación');
    }
  }

  /**
   * Calcular nueva liquidación
   * @param {Object} liquidacionData - Datos para la liquidación
   * @returns {Promise<Object>} - Respuesta del cálculo
   */
  static async calcular(liquidacionData) {
    try {
      const response = await api.post('/liquidaciones/calcular', liquidacionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al calcular liquidación');
    }
  }

  /**
   * Marcar liquidación como pagada
   * @param {number} id - ID de la liquidación
   * @returns {Promise<Object>} - Respuesta de la actualización
   */
  static async marcarComoPagada(id) {
    try {
      const response = await api.patch(`/liquidaciones/${id}/pagar`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al marcar como pagada');
    }
  }

  /**
   * Obtener resumen detallado de liquidación
   * @param {number} id - ID de la liquidación
   * @returns {Promise<Object>} - Resumen de la liquidación
   */
  static async getResumen(id) {
    try {
      const response = await api.get(`/liquidaciones/${id}/resumen`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener resumen');
    }
  }

  /**
   * Descargar PDF del finiquito
   * @param {number} id - ID de la liquidación
   * @returns {Promise<Blob>} - Archivo PDF
   */
  static async descargarPDF(id) {
    try {
      const response = await api.get(`/liquidaciones/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Crear un objeto URL para el blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear un elemento <a> para descargar
      const link = document.createElement('a');
      link.href = url;
      link.download = `liquidacion-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar el objeto URL
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al descargar PDF');
    }
  }
}

export default LiquidacionService;