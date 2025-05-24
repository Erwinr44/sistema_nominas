// src/components/nominas/FormularioCalcularNomina.js
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
  CircularProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '../../utils/dayjs';
import NominaService from '../../services/nomina.service';

const FormularioCalcularNomina = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tipo: '',
    fechaInicio: null,
    fechaFin: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [periodosSugeridos, setPeriodosSugeridos] = useState(null);
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);

  const tiposNomina = [
    { 
      value: 'semanal', 
      label: 'Semanal', 
      description: 'Nómina semanal (Lunes a Domingo)',
      frequency: 'Cada 7 días'
    },
    { 
      value: 'quincenal', 
      label: 'Quincenal', 
      description: 'Nómina quincenal (1-15 y 16-fin de mes)',
      frequency: 'Cada 15 días'
    },
    { 
      value: 'mensual', 
      label: 'Mensual', 
      description: 'Nómina mensual (1 al último día del mes)',
      frequency: 'Cada mes'
    }
  ];

  useEffect(() => {
    if (open) {
      loadPeriodosSugeridos();
    }
  }, [open]);

  const loadPeriodosSugeridos = async () => {
    try {
      setLoadingPeriodos(true);
      const data = await NominaService.getPeriodosSugeridos();
      setPeriodosSugeridos(data);
    } catch (error) {
      console.error('Error al cargar períodos sugeridos:', error);
    } finally {
      setLoadingPeriodos(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tipo) {
      newErrors.tipo = 'Debe seleccionar el tipo de nómina';
    }

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es obligatoria';
    }

    if (formData.fechaInicio && formData.fechaFin) {
      if (dayjs(formData.fechaFin).isBefore(formData.fechaInicio)) {
        newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }

      const diasDiferencia = dayjs(formData.fechaFin).diff(formData.fechaInicio, 'day') + 1;
      
      // Validaciones específicas por tipo
      if (formData.tipo === 'semanal' && diasDiferencia !== 7) {
        newErrors.fechaFin = 'Para nómina semanal, el período debe ser exactamente de 7 días';
      } else if (formData.tipo === 'quincenal' && (diasDiferencia < 14 || diasDiferencia > 16)) {
        newErrors.fechaFin = 'Para nómina quincenal, el período debe ser entre 14 y 16 días';
      } else if (formData.tipo === 'mensual' && (diasDiferencia < 28 || diasDiferencia > 31)) {
        newErrors.fechaFin = 'Para nómina mensual, el período debe ser de un mes completo';
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
      const nominaData = {
        tipo: formData.tipo,
        fechaInicio: formData.fechaInicio.format('YYYY-MM-DD'),
        fechaFin: formData.fechaFin.format('YYYY-MM-DD')
      };

      await NominaService.calcular(nominaData);
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
      tipo: '',
      fechaInicio: null,
      fechaFin: null
    });
    setErrors({});
    onClose();
  };

  const usarPeriodoSugerido = (tipo) => {
    if (!periodosSugeridos || !periodosSugeridos[tipo]) return;
    
    const periodo = periodosSugeridos[tipo];
    setFormData({
      ...formData,
      tipo,
      fechaInicio: dayjs(periodo.fechaInicio),
      fechaFin: dayjs(periodo.fechaFin)
    });
  };

  const getTipoInfo = (tipo) => {
    return tiposNomina.find(t => t.value === tipo);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Calcular Nómina
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Al calcular la nómina se procesarán los pagos de todos los empleados 
              activos para el período seleccionado.
            </Typography>
          </Alert>

          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.tipo}>
                <InputLabel>Tipo de Nómina</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  label="Tipo de Nómina"
                >
                  {tiposNomina.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      <Box>
                        <Typography variant="body2">
                          {tipo.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {tipo.description} - {tipo.frequency}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.tipo && <Typography variant="caption" color="error">{errors.tipo}</Typography>}
              </FormControl>
            </Grid>

            {/* Períodos Sugeridos */}
            {periodosSugeridos && !loadingPeriodos && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Períodos Sugeridos (Haz clic para usar)
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(periodosSugeridos).map(([tipo, periodo]) => (
                    <Grid item key={tipo}>
                      <Chip
                        label={`${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: ${dayjs(periodo.fechaInicio).format('DD/MM')} - ${dayjs(periodo.fechaFin).format('DD/MM')}`}
                        onClick={() => usarPeriodoSugerido(tipo)}
                        color={formData.tipo === tipo ? 'primary' : 'default'}
                        variant={formData.tipo === tipo ? 'filled' : 'outlined'}
                        clickable
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Inicio"
                value={formData.fechaInicio}
                onChange={(date) => setFormData({...formData, fechaInicio: date})}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.fechaInicio}
                    helperText={errors.fechaInicio}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Fin"
                value={formData.fechaFin}
                onChange={(date) => setFormData({...formData, fechaFin: date})}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.fechaFin}
                    helperText={errors.fechaFin}
                  />
                )}
              />
            </Grid>

            {formData.tipo && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Información sobre {getTipoInfo(formData.tipo)?.label}
                    </Typography>
                    <Typography variant="body2">
                      {getTipoInfo(formData.tipo)?.description}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Frecuencia: {getTipoInfo(formData.tipo)?.frequency}
                    </Typography>
                    
                    {formData.fechaInicio && formData.fechaFin && (
                      <Box mt={2}>
                        <Typography variant="body2">
                          <strong>Período seleccionado:</strong> {' '}
                          {dayjs(formData.fechaInicio).format('DD/MM/YYYY')} al {' '}
                          {dayjs(formData.fechaFin).format('DD/MM/YYYY')} {' '}
                          ({dayjs(formData.fechaFin).diff(formData.fechaInicio, 'day') + 1} días)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
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
            color="primary"
          >
            {loading ? <CircularProgress size={20} /> : 'Calcular Nómina'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default FormularioCalcularNomina;