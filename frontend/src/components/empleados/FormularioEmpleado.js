// src/components/empleados/FormularioEmpleado.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Divider,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import EmpleadoService from '../../services/empleado.service';

const FormularioEmpleado = ({ 
  open, 
  onClose, 
  onSuccess, 
  empleado = null, 
  areas = [] 
}) => {
  const [formData, setFormData] = useState({
    numero_empleado: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    dpi: '',
    fecha_nacimiento: null,
    fecha_contratacion: dayjs(),
    salario_base: '',
    tipo_nomina: 'quincenal',
    area_id: '',
    rol_id: 3,
    jefe_directo_id: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [empleadosParaJefe, setEmpleadosParaJefe] = useState([]);

  const isEditing = !!empleado;

  useEffect(() => {
    if (open) {
      loadEmpleadosParaJefe();
      if (empleado) {
        setFormData({
          numero_empleado: empleado.numero_empleado || '',
          nombre: empleado.nombre || '',
          apellido: empleado.apellido || '',
          email: empleado.email || '',
          password: '', // No cargar password para edición
          dpi: empleado.dpi || '',
          fecha_nacimiento: empleado.fecha_nacimiento ? dayjs(empleado.fecha_nacimiento) : null,
          fecha_contratacion: empleado.fecha_contratacion ? dayjs(empleado.fecha_contratacion) : dayjs(),
          salario_base: empleado.salario_base?.toString() || '',
          tipo_nomina: empleado.tipo_nomina || 'quincenal',
          area_id: empleado.area_id?.toString() || '',
          rol_id: empleado.rol_id || 3,
          jefe_directo_id: empleado.jefe_directo_id?.toString() || ''
        });
      } else {
        // Resetear formulario para nuevo empleado
        setFormData({
          numero_empleado: '',
          nombre: '',
          apellido: '',
          email: '',
          password: '',
          dpi: '',
          fecha_nacimiento: null,
          fecha_contratacion: dayjs(),
          salario_base: '',
          tipo_nomina: 'quincenal',
          area_id: '',
          rol_id: 3,
          jefe_directo_id: ''
        });
      }
      setErrors({});
    }
  }, [open, empleado]);

  const loadEmpleadosParaJefe = async () => {
    try {
      const empleados = await EmpleadoService.getAll();
      // Filtrar solo administradores y superadmins para ser jefes
      const posiblesJefes = empleados.filter(emp => 
        emp.rol_id <= 2 && emp.activo && (!isEditing || emp.id !== empleado?.id)
      );
      setEmpleadosParaJefe(posiblesJefes);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'La contraseña es obligatoria para nuevos empleados';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.dpi.trim()) {
      newErrors.dpi = 'El DPI es obligatorio';
    } else if (!/^\d{13}$/.test(formData.dpi.replace(/\s/g, ''))) {
      newErrors.dpi = 'El DPI debe tener 13 dígitos';
    }

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    } else if (dayjs().diff(formData.fecha_nacimiento, 'year') < 18) {
      newErrors.fecha_nacimiento = 'El empleado debe ser mayor de edad';
    }

    if (!formData.fecha_contratacion) {
      newErrors.fecha_contratacion = 'La fecha de contratación es obligatoria';
    } else if (formData.fecha_contratacion.isAfter(dayjs())) {
      newErrors.fecha_contratacion = 'La fecha de contratación no puede ser futura';
    }

    if (!formData.salario_base || parseFloat(formData.salario_base) <= 0) {
      newErrors.salario_base = 'El salario debe ser mayor a 0';
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
      const empleadoData = {
        ...formData,
        fecha_nacimiento: formData.fecha_nacimiento?.format('YYYY-MM-DD'),
        fecha_contratacion: formData.fecha_contratacion?.format('YYYY-MM-DD'),
        salario_base: parseFloat(formData.salario_base),
        area_id: formData.area_id || null,
        jefe_directo_id: formData.jefe_directo_id || null,
        dpi: formData.dpi.replace(/\s/g, '') // Quitar espacios del DPI
      };

      // Si está editando y no hay password, no enviar password
      if (isEditing && !formData.password) {
        delete empleadoData.password;
      }

      if (isEditing) {
        await EmpleadoService.update(empleado.id, empleadoData);
      } else {
        await EmpleadoService.create(empleadoData);
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
      numero_empleado: '',
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      dpi: '',
      fecha_nacimiento: null,
      fecha_contratacion: dayjs(),
      salario_base: '',
      tipo_nomina: 'quincenal',
      area_id: '',
      rol_id: 3,
      jefe_directo_id: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
        </DialogTitle>
        
        <DialogContent sx={{ pb: 1 }}>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Información Personal */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Información Personal
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                error={!!errors.apellido}
                helperText={errors.apellido}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                error={!!errors.email}
                helperText={errors.email}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                error={!!errors.password}
                helperText={errors.password || (isEditing ? "Dejar vacío para mantener la actual" : "")}
                required={!isEditing}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="DPI"
                value={formData.dpi}
                onChange={(e) => setFormData({...formData, dpi: e.target.value})}
                error={!!errors.dpi}
                helperText={errors.dpi}
                required
                disabled={loading}
                placeholder="1234567890123"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Nacimiento"
                value={formData.fecha_nacimiento}
                onChange={(date) => setFormData({...formData, fecha_nacimiento: date})}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.fecha_nacimiento}
                    helperText={errors.fecha_nacimiento}
                    required
                    disabled={loading}
                  />
                )}
                maxDate={dayjs().subtract(18, 'year')}
              />
            </Grid>

            {/* Información Laboral */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Información Laboral
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Empleado (opcional)"
                value={formData.numero_empleado}
                onChange={(e) => setFormData({...formData, numero_empleado: e.target.value})}
                disabled={loading}
                placeholder="Se generará automáticamente si se deja vacío"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Contratación"
                value={formData.fecha_contratacion}
                onChange={(date) => setFormData({...formData, fecha_contratacion: date})}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.fecha_contratacion}
                    helperText={errors.fecha_contratacion}
                    required
                    disabled={loading}
                  />
                )}
                maxDate={dayjs()}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salario Base"
                type="number"
                value={formData.salario_base}
                onChange={(e) => setFormData({...formData, salario_base: e.target.value})}
                error={!!errors.salario_base}
                helperText={errors.salario_base}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Q</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel>Tipo de Nómina</InputLabel>
                <Select
                  value={formData.tipo_nomina}
                  label="Tipo de Nómina"
                  onChange={(e) => setFormData({...formData, tipo_nomina: e.target.value})}
                >
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="quincenal">Quincenal</MenuItem>
                  <MenuItem value="mensual">Mensual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Área</InputLabel>
                <Select
                  value={formData.area_id}
                  label="Área"
                  onChange={(e) => setFormData({...formData, area_id: e.target.value})}
                >
                  <MenuItem value="">Sin área asignada</MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol_id}
                  label="Rol"
                  onChange={(e) => setFormData({...formData, rol_id: e.target.value})}
                >
                  <MenuItem value={3}>Empleado</MenuItem>
                  <MenuItem value={2}>Administrador</MenuItem>
                  <MenuItem value={1}>Superadministrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Jefe Directo (opcional)</InputLabel>
                <Select
                  value={formData.jefe_directo_id}
                  label="Jefe Directo (opcional)"
                  onChange={(e) => setFormData({...formData, jefe_directo_id: e.target.value})}
                >
                  <MenuItem value="">Sin jefe directo</MenuItem>
                  {empleadosParaJefe.map((jefe) => (
                    <MenuItem key={jefe.id} value={jefe.id}>
                      {jefe.nombre} {jefe.apellido} - {jefe.area_nombre || 'Sin área'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
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
              isEditing ? 'Actualizar Empleado' : 'Crear Empleado'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default FormularioEmpleado;
