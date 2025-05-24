import api from './api';

class AreaService {
  /**
   * Obtener todas las áreas
   * @returns {Promise<Array>} - Lista de áreas
   */
  static async getAll() {
    try {
      const response = await api.get('/areas');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener áreas');
    }
  }

  /**
   * Crear una nueva área
   * @param {Object} areaData - Datos del área
   * @returns {Promise<Object>} - Respuesta de la creación
   */
  static async create(areaData) {
    try {
      const response = await api.post('/areas', areaData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear área');
    }
  }

  /**
   * Actualizar un área
   * @param {number} id - ID del área
   * @param {Object} areaData - Datos a actualizar
   * @returns {Promise<Object>} - Respuesta de la actualización
   */
  static async update(id, areaData) {
    try {
      const response = await api.put(`/areas/${id}`, areaData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar área');
    }
  }

  /**
   * Eliminar un área
   * @param {number} id - ID del área
   * @returns {Promise<Object>} - Respuesta de la eliminación
   */
  static async delete(id) {
    try {
      const response = await api.delete(`/areas/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar área');
    }
  }
}

export default AreaService;
