// src/components/empleados/FiltrosEmpleados.js
import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Search,
  FilterAlt,
  Clear
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const FiltrosEmpleados = ({ 
  filters, 
  onFiltersChange, 
  areas = [], 
  stats = {} 
}) => {
  const handleFilterChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      busqueda: '',
      area: '',
      rol: '',
      activo: '',
      fechaInicio: null,
      fechaFin: null
    });
  };

  const hasFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <FilterAlt color="primary" />
            <Typography variant="h6" color="primary">
              Filtros de Búsqueda
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            {stats.total && (
              <Chip
                label={`${stats.total} empleados`}
                color="primary"
                variant="outlined"
              />
            )}
            {hasFilters && (
              <Tooltip title="Limpiar todos los filtros">
                <IconButton onClick={clearFilters} size="small">
                  <Clear />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Búsqueda general */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar empleado"
              placeholder="Nombre, email o número..."
              value={filters.busqueda}
              onChange={(e) => handleFilterChange('busqueda', e.target.value)}
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>

          {/* Filtro por área */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Área</InputLabel>
              <Select
                value={filters.area}
                label="Área"
                onChange={(e) => handleFilterChange('area', e.target.value)}
              >
                <MenuItem value="">Todas las áreas</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por rol */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={filters.rol}
                label="Rol"
                onChange={(e) => handleFilterChange('rol', e.target.value)}
              >
                <MenuItem value="">Todos los roles</MenuItem>
                <MenuItem value="1">Superadmin</MenuItem>
                <MenuItem value="2">Administrador</MenuItem>
                <MenuItem value="3">Empleado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por estado */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.activo}
                label="Estado"
                onChange={(e) => handleFilterChange('activo', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Activos</MenuItem>
                <MenuItem value="false">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por fecha de contratación */}
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Contratado desde"
              value={filters.fechaInicio}
              onChange={(date) => handleFilterChange('fechaInicio', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Contratado hasta"
              value={filters.fechaFin}
              onChange={(date) => handleFilterChange('fechaFin', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
        </Grid>

        {/* Filtros activos */}
        {hasFilters && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Filtros activos:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {filters.busqueda && (
                <Chip
                  label={`Búsqueda: "${filters.busqueda}"`}
                  onDelete={() => handleFilterChange('busqueda', '')}
                  size="small"
                  color="primary"
                />
              )}
              {filters.area && (
                <Chip
                  label={`Área: ${areas.find(a => a.id === parseInt(filters.area))?.nombre}`}
                  onDelete={() => handleFilterChange('area', '')}
                  size="small"
                  color="secondary"
                />
              )}
              {filters.rol && (
                <Chip
                  label={`Rol: ${filters.rol === '1' ? 'Superadmin' : filters.rol === '2' ? 'Admin' : 'Empleado'}`}
                  onDelete={() => handleFilterChange('rol', '')}
                  size="small"
                  color="info"
                />
              )}
              {filters.activo && (
                <Chip
                  label={`Estado: ${filters.activo === 'true' ? 'Activos' : 'Inactivos'}`}
                  onDelete={() => handleFilterChange('activo', '')}
                  size="small"
                  color="warning"
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default FiltrosEmpleados;
