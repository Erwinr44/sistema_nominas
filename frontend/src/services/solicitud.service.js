// CORREGIDO - src/services/solicitud.service.js
import api from './api';

class SolicitudService {
  /**
   * Obtener todas las solicitudes del usuario actual
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Array>} - Lista de solicitudes
   */
  static async getAll(params = {}) {
    try {
      const response = await api.get('/solicitudes', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener solicitudes');
    }
  }

  /**
   * Crear una nueva solicitud
   * @param {Object} solicitudData - Datos de la solicitud
   * @returns {Promise<Object>} - Respuesta de la creación
   */
  static async create(solicitudData) {
    try {
      const response = await api.post('/solicitudes', solicitudData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear solicitud');
    }
  }

  /**
   * Obtener vacaciones disponibles del empleado
   * @param {number} empleadoId - ID del empleado
   * @returns {Promise<Object>} - Información de vacaciones
   */
  static async getVacacionesDisponibles(empleadoId) {
    try {
      const response = await api.get(`/solicitudes/empleado/${empleadoId}/vacaciones-disponibles`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener vacaciones');
    }
  }

  /**
   * Eliminar una solicitud pendiente
   * @param {number} id - ID de la solicitud
   * @returns {Promise<Object>} - Respuesta de la eliminación
   */
  static async delete(id) {
    try {
      const response = await api.delete(`/solicitudes/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar solicitud');
    }
  }

  // MÉTODOS FALTANTES PARA ADMINISTRADORES:
  
  /**
   * Obtener solicitudes pendientes (solo admin)
   * @returns {Promise<Array>} - Lista de solicitudes pendientes
   */
  static async getPendientes() {
    try {
      const response = await api.get('/solicitudes/pendientes');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener solicitudes pendientes');
    }
  }

  /**
   * Aprobar una solicitud (solo admin)
   * @param {number} id - ID de la solicitud
   * @param {string} comentario - Comentario opcional
   * @returns {Promise<Object>} - Respuesta de la aprobación
   */
  static async aprobar(id, comentario = '') {
    try {
      const response = await api.patch(`/solicitudes/${id}/aprobar`, { comentario });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al aprobar solicitud');
    }
  }

  /**
   * Rechazar una solicitud (solo admin)
   * @param {number} id - ID de la solicitud
   * @param {string} comentario - Comentario del rechazo
   * @returns {Promise<Object>} - Respuesta del rechazo
   */
  static async rechazar(id, comentario) {
    try {
      const response = await api.patch(`/solicitudes/${id}/rechazar`, { comentario });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al rechazar solicitud');
    }
  }
}

export default SolicitudService;