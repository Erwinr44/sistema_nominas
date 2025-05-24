// src/components/liquidaciones/FormularioLiquidacion.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '../../utils/dayjs';
import LiquidacionService from '../../services/liquidacion.service';
import EmpleadoService from '../../services/empleado.service';

const FormularioLiquidacion = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    empleado_id: null,
    motivo: '',
    fecha_fin: dayjs(),
    observaciones: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  const motivosLiquidacion = [
    { value: 'renuncia', label: 'Renuncia Voluntaria', description: 'El empleado presenta su renuncia' },
    { value: 'despido', label: 'Despido sin Causa Justificada', description: 'Despido por necesidades de la empresa' },
    { value: 'despido_justificado', label: 'Despido con Causa Justificada', description: 'Despido por falta grave del empleado' }
  ];

  useEffect(() => {
    if (open) {
      loadEmpleados();
    }
  }, [open]);

  const loadEmpleados = async () => {
    try {
      setLoadingEmpleados(true);
      const data = await EmpleadoService.getAll({ activo: true });
      setEmpleados(data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setErrors({ empleados: 'Error al cargar lista de empleados' });
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.empleado_id) {
      newErrors.empleado_id = 'Debe seleccionar un empleado';
    }

    if (!formData.motivo) {
      newErrors.motivo = 'Debe seleccionar el motivo de la liquidación';
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de finalización es obligatoria';
    } else if (dayjs(formData.fecha_fin).isAfter(dayjs(), 'day')) {
      newErrors.fecha_fin = 'La fecha de finalización no puede ser futura';
    }

    // Validación específica para despido justificado
    if (formData.motivo === 'despido_justificado' && !formData.observaciones.trim()) {
      newErrors.observaciones = 'Las observaciones son obligatorias para despido justificado';
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
      const liquidacionData = {
        empleado_id: formData.empleado_id,
        motivo: formData.motivo,
        fecha_fin: formData.fecha_fin.format('YYYY-MM-DD'),
        observaciones: formData.observaciones || null
      };

      await LiquidacionService.calcular(liquidacionData);
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
      empleado_id: null,
      motivo: '',
      fecha_fin: dayjs(),
      observaciones: ''
    });
    setErrors({});
    onClose();
  };

  const getEmpleadoCompleto = (empleadoId) => {
    return empleados.find(emp => emp.id === empleadoId);
  };

  const getMotivoInfo = (motivo) => {
    return motivosLiquidacion.find(m => m.value === motivo);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Calcular Liquidación de Empleado
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Una vez calculada la liquidación, el empleado será marcado como inactivo 
              y no podrá revertirse esta acción.
            </Typography>
          </Alert>

          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          {errors.empleados && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errors.empleados}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={empleados}
                getOptionLabel={(option) => `${option.nombre} ${option.apellido} - ${option.codigo}`}
                value={empleados.find(emp => emp.id === formData.empleado_id) || null}
                onChange={(event, newValue) => {
                  setFormData({...formData, empleado_id: newValue?.id || null});
                }}
                loading={loadingEmpleados}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Empleado a Liquidar"
                    error={!!errors.empleado_id}
                    helperText={errors.empleado_id}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingEmpleados ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">
                        <strong>{option.nombre} {option.apellido}</strong>
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.codigo} - {option.area_nombre || 'Sin área'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No hay empleados disponibles"
              />
            </Grid>

            {formData.empleado_id && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    Información del Empleado Seleccionado
                  </Typography>
                  {(() => {
                    const emp = getEmpleadoCompleto(formData.empleado_id);
                    return emp ? (
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Código:</strong> {emp.codigo}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Área:</strong> {emp.area_nombre || 'Sin área'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Fecha Ingreso:</strong> {dayjs(emp.fecha_ingreso).format('DD/MM/YYYY')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Salario:</strong> Q{parseFloat(emp.salario).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : null;
                  })()}
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.motivo}>
                <InputLabel>Motivo de la Liquidación</InputLabel>
                <Select
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  label="Motivo de la Liquidación"
                >
                  {motivosLiquidacion.map((motivo) => (
                    <MenuItem key={motivo.value} value={motivo.value}>
                      <Box>
                        <Typography variant="body2">
                          {motivo.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {motivo.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.motivo && <Typography variant="caption" color="error">{errors.motivo}</Typography>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Finalización"
                value={formData.fecha_fin}
                onChange={(date) => setFormData({...formData, fecha_fin: date})}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.fecha_fin}
                    helperText={errors.fecha_fin}
                  />
                )}
                maxDate={dayjs()}
              />
            </Grid>

            {formData.motivo && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Información sobre {getMotivoInfo(formData.motivo)?.label}
                  </Typography>
                  <Typography variant="body2">
                    {getMotivoInfo(formData.motivo)?.description}
                  </Typography>
                  {formData.motivo === 'despido_justificado' && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      <strong>Nota:</strong> Para despido justificado, las observaciones son obligatorias.
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={4}
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                error={!!errors.observaciones}
                helperText={errors.observaciones || 'Detalle del motivo de la liquidación'}
                placeholder="Describe los detalles de la liquidación..."
                required={formData.motivo === 'despido_justificado'}
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
            color="warning"
          >
            {loading ? <CircularProgress size={20} /> : 'Calcular Liquidación'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default FormularioLiquidacion;