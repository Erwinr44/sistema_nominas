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
  Chip,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '../../utils/dayjs';
import SolicitudService from '../../services/solicitud.service';
import { useAuth } from '../../contexts/AuthContext';

const FormularioVacaciones = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fecha_inicio: null,
    fecha_fin: null,
    comentario: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [vacacionesInfo, setVacacionesInfo] = useState(null);
  const [diasSolicitados, setDiasSolicitados] = useState(0);

  useEffect(() => {
    if (open) {
      loadVacacionesDisponibles();
    }
  }, [open]);

  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      calculateDays();
    }
  }, [formData.fecha_inicio, formData.fecha_fin]);

  const loadVacacionesDisponibles = async () => {
    try {
      const data = await SolicitudService.getVacacionesDisponibles(user.id);
      setVacacionesInfo(data);
    } catch (error) {
      console.error('Error al cargar vacaciones:', error);
    }
  };

  const calculateDays = () => {
    const inicio = dayjs(formData.fecha_inicio);
    const fin = dayjs(formData.fecha_fin);
    
    if (inicio.isValid() && fin.isValid() && fin.isAfter(inicio)) {
      // Calcular días hábiles (excluyendo fines de semana)
      let dias = 0;
      let current = inicio;
      
      while (current.isSameOrBefore(fin)) {
        // Si no es sábado (6) ni domingo (0)
        if (current.day() !== 0 && current.day() !== 6) {
          dias++;
        }
        current = current.add(1, 'day');
      }
      
      setDiasSolicitados(dias);
    } else {
      setDiasSolicitados(0);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es obligatoria';
    }

    if (formData.fecha_inicio && formData.fecha_fin) {
      if (dayjs(formData.fecha_fin).isBefore(formData.fecha_inicio)) {
        newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }

      if (dayjs(formData.fecha_inicio).isBefore(dayjs().add(1, 'day'))) {
        newErrors.fecha_inicio = 'Las vacaciones deben solicitarse con al menos 1 día de anticipación';
      }

      if (vacacionesInfo && diasSolicitados > vacacionesInfo.dias_pendientes) {
        newErrors.dias = `Solo tienes ${vacacionesInfo.dias_pendientes} días de vacaciones disponibles`;
      }
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
        tipo: 'vacaciones',
        fecha_inicio: formData.fecha_inicio.format('YYYY-MM-DD'),
        fecha_fin: formData.fecha_fin.format('YYYY-MM-DD'),
        comentario: formData.comentario || null
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
      fecha_inicio: null,
      fecha_fin: null,
      comentario: ''
    });
    setErrors({});
    setDiasSolicitados(0);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Solicitar Vacaciones
        </DialogTitle>
        <DialogContent>
          {vacacionesInfo && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Días disponibles:</strong> {vacacionesInfo.dias_pendientes} días
              </Typography>
              <Typography variant="body2">
                <strong>Años de servicio:</strong> {vacacionesInfo.anios_servicio} años
              </Typography>
            </Alert>
          )}

          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          {errors.dias && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errors.dias}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Inicio"
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
                minDate={dayjs().add(1, 'day')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Fin"
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
                minDate={formData.fecha_inicio || dayjs().add(1, 'day')}
              />
            </Grid>

            {diasSolicitados > 0 && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" my={2}>
                  <Chip
                    label={`Días solicitados: ${diasSolicitados} días hábiles`}
                    color={diasSolicitados <= (vacacionesInfo?.dias_pendientes || 0) ? 'success' : 'error'}
                    variant="outlined"
                    size="large"
                  />
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentario (opcional)"
                multiline
                rows={3}
                value={formData.comentario}
                onChange={(e) => setFormData({...formData, comentario: e.target.value})}
                placeholder="Motivo de las vacaciones o comentarios adicionales..."
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
            disabled={loading || diasSolicitados === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Solicitar Vacaciones'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default FormularioVacaciones;
