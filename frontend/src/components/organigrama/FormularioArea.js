// src/components/organigrama/FormularioArea.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import AreaService from '../../services/area.service';

const FormularioArea = ({ 
  open, 
  onClose, 
  onSuccess, 
  area = null, 
  areas = [] 
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    area_padre_id: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEditing = !!area;

  useEffect(() => {
    if (area) {
      setFormData({
        nombre: area.nombre || '',
        descripcion: area.descripcion || '',
        area_padre_id: area.area_padre_id || ''
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        area_padre_id: ''
      });
    }
    setErrors({});
  }, [area, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del área es obligatorio';
    }

    if (formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar que no se seleccione a sí mismo como padre
    if (isEditing && formData.area_padre_id === area.id) {
      newErrors.area_padre_id = 'Un área no puede ser padre de sí misma';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const areaData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        area_padre_id: formData.area_padre_id || null
      };

      if (isEditing) {
        await AreaService.update(area.id, areaData);
      } else {
        await AreaService.create(areaData);
      }

      onSuccess();
      handleClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      area_padre_id: ''
    });
    setErrors({});
    onClose();
  };

  // Filtrar áreas que pueden ser padre (excluir el área actual si está editando)
  const areasDisponibles = areas.filter(a => !isEditing || a.id !== area.id);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Editar Área' : 'Crear Nueva Área'}
      </DialogTitle>
      
      <DialogContent>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del Área"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              error={!!errors.nombre}
              helperText={errors.nombre}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Área Padre (Opcional)</InputLabel>
              <Select
                value={formData.area_padre_id}
                label="Área Padre (Opcional)"
                onChange={(e) => setFormData({...formData, area_padre_id: e.target.value})}
                error={!!errors.area_padre_id}
              >
                <MenuItem value="">
                  <em>Sin área padre (Área principal)</em>
                </MenuItem>
                {areasDisponibles.map((areaOp) => (
                  <MenuItem key={areaOp.id} value={areaOp.id}>
                    {areaOp.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.area_padre_id && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.area_padre_id}
              </Alert>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción (Opcional)"
              multiline
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              error={!!errors.descripcion}
              helperText={errors.descripcion}
              placeholder="Describe las funciones y responsabilidades de esta área..."
              disabled={loading}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            isEditing ? 'Actualizar' : 'Crear Área'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormularioArea;
