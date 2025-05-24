import React, { useState } from 'react';
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
  Chip,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SolicitudService from '../../services/solicitud.service';

const FormularioHorasExtra = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fecha_inicio: dayjs(),
    horas: '',
    comentario: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha es obligatoria';
    }

    if (!formData.horas || parseFloat(formData.horas) <= 0) {
      newErrors.horas = 'Las horas deben ser mayor a 0';
    } else if (parseFloat(formData.horas) > 12) {
      newErrors.horas = 'No se pueden reportar más de 12 horas extra por día';
    }

    if (!formData.comentario.trim()) {
      newErrors.comentario = 'El comentario es obligatorio para justificar las horas extra';
    }

    // No permitir fechas futuras más allá de hoy
    if (formData.fecha_inicio && dayjs(formData.fecha_inicio).isAfter(dayjs(), 'day')) {
      newErrors.fecha_inicio = 'No se pueden reportar horas extra de fechas futuras';
    }

    // No permitir fechas muy antiguas (más de 30 días)
    if (formData.fecha_inicio && dayjs(formData.fecha_inicio).isBefore(dayjs().subtract(30, 'day'))) {
      newErrors.fecha_inicio = 'No se pueden reportar horas extra de más de 30 días atrás';
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
      const solicitudData = {
        tipo: 'horas_extra',
        fecha_inicio: formData.fecha_inicio.format('YYYY-MM-DD'),
        horas: parseFloat(formData.horas),
        comentario: formData.comentario
      };

      await SolicitudService.create(solicitudData);
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
      fecha_inicio: dayjs(),
      horas: '',
      comentario: ''
    });
    setErrors({});
    onClose();
  };

  const calcularValorEstimado = () => {
    const horas = parseFloat(formData.horas);
    if (horas > 0) {
      // Estimación basada en salario mínimo guatemalteco (aproximado)
      const valorHoraNormal = 12.67; // Aproximado
      const valorHoraExtra = valorHoraNormal * 1.5;
      return (horas * valorHoraExtra).toFixed(2);
    }
    return 0;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reportar Horas Extra
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Las horas extra se pagan al 150% del valor de la hora normal y deben ser aprobadas por tu supervisor.
            </Typography>
          </Alert>

          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DatePicker
                label="Fecha del Trabajo Extra"
                value={formData.fecha_inicio}
                onChange={(date) => setFormData({...formData, fecha_inicio: date})}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.fecha_inicio}
                    helperText={errors.fecha_inicio}
                  />
                )}
                maxDate={dayjs()}
                minDate={dayjs().subtract(30, 'day')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cantidad de Horas"
                type="number"
                value={formData.horas}
                onChange={(e) => setFormData({...formData, horas: e.target.value})}
                error={!!errors.horas}
                helperText={errors.horas}
                inputProps={{
                  min: 0.5,
                  max: 12,
                  step: 0.5
                }}
                placeholder="Ej: 2.5"
              />
            </Grid>

            {formData.horas && parseFloat(formData.horas) > 0 && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" my={2}>
                  <Chip
                    label={`Valor estimado: Q${calcularValorEstimado()}`}
                    color="success"
                    variant="outlined"
                    size="large"
                  />
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción del Trabajo Realizado"
                multiline
                rows={4}
                value={formData.comentario}
                onChange={(e) => setFormData({...formData, comentario: e.target.value})}
                error={!!errors.comentario}
                helperText={errors.comentario}
                placeholder="Describe detalladamente las actividades realizadas durante las horas extra..."
                required
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
            {loading ? <CircularProgress size={20} /> : 'Reportar Horas Extra'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default FormularioHorasExtra;
