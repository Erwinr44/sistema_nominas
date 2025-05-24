import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Clear,
  Search,
  FilterAlt
} from '@mui/icons-material';

const BuscadorOrganigrama = ({ 
  searchTerm, 
  onSearchChange, 
  selectedArea, 
  onAreaChange, 
  areas = [],
  stats = {} 
}) => {
  const handleClearFilters = () => {
    onSearchChange('');
    onAreaChange('');
  };

  const hasFilters = searchTerm || selectedArea;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <FilterAlt color="primary" />
        <Typography variant="h6" color="primary">
          Buscar en el Organigrama
        </Typography>
        {hasFilters && (
          <Tooltip title="Limpiar filtros">
            <IconButton onClick={handleClearFilters} size="small">
              <Clear />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
        {/* Búsqueda por nombre */}
        <TextField
          label="Buscar empleado"
          placeholder="Nombre o apellido..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <Search color="action" sx={{ mr: 1 }} />
          }}
          sx={{ minWidth: 250 }}
        />

        {/* Filtro por área */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por área</InputLabel>
          <Select
            value={selectedArea}
            label="Filtrar por área"
            onChange={(e) => onAreaChange(e.target.value)}
          >
            <MenuItem value="">
              <em>Todas las áreas</em>
            </MenuItem>
            {areas.map((area) => (
              <MenuItem key={area.id} value={area.id}>
                {area.nombre}
                {area.total_empleados !== undefined && (
                  <Chip
                    label={area.total_empleados}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Estadísticas rápidas */}
        {stats.totalEmpleados && (
          <Box display="flex" gap={1} ml="auto">
            <Chip
              label={`${stats.totalEmpleados} empleados`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${stats.totalAreas} áreas`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {/* Filtros activos */}
      {hasFilters && (
        <Box display="flex" gap={1} mt={2}>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Filtros activos:
          </Typography>
          {searchTerm && (
            <Chip
              label={`Búsqueda: "${searchTerm}"`}
              onDelete={() => onSearchChange('')}
              size="small"
              color="primary"
            />
          )}
          {selectedArea && (
            <Chip
              label={`Área: ${areas.find(a => a.id === parseInt(selectedArea))?.nombre}`}
              onDelete={() => onAreaChange('')}
              size="small"
              color="secondary"
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default BuscadorOrganigrama;
