// src/components/organigrama/ArbolOrganigrama.js
import React from 'react';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import TarjetaArea from './TarjetaArea';
import TarjetaEmpleado from './TarjetaEmpleado';

const ArbolOrganigrama = ({ 
  areas, 
  empleados, 
  searchTerm = '', 
  selectedArea = '',
  onEditArea,
  onDeleteArea 
}) => {
  // Filtrar empleados según criterios de búsqueda
  const filteredEmpleados = empleados.filter(emp => {
    const matchesSearch = !searchTerm || 
      `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = !selectedArea || emp.area_id === parseInt(selectedArea);
    
    return matchesSearch && matchesArea;
  });

  // Filtrar áreas que tienen empleados visibles o no hay filtros
  const getVisibleAreas = () => {
    if (!searchTerm && !selectedArea) {
      return areas;
    }

    const areasWithEmployees = new Set(filteredEmpleados.map(emp => emp.area_id));
    const visibleAreaIds = new Set();

    // Agregar áreas con empleados
    areasWithEmployees.forEach(areaId => {
      visibleAreaIds.add(areaId);
      
      // Agregar áreas padre
      let area = areas.find(a => a.id === areaId);
      while (area && area.area_padre_id) {
        visibleAreaIds.add(area.area_padre_id);
        area = areas.find(a => a.id === area.area_padre_id);
      }
    });

    // Si se seleccionó un área específica, mostrar toda su jerarquía
    if (selectedArea) {
      const selected = areas.find(a => a.id === parseInt(selectedArea));
      if (selected) {
        visibleAreaIds.add(selected.id);
        
        // Agregar sub-áreas
        const addSubAreas = (parentId) => {
          areas.filter(a => a.area_padre_id === parentId).forEach(subArea => {
            visibleAreaIds.add(subArea.id);
            addSubAreas(subArea.id);
          });
        };
        addSubAreas(selected.id);
      }
    }

    return areas.filter(area => visibleAreaIds.has(area.id));
  };

  const visibleAreas = getVisibleAreas();
  const rootAreas = visibleAreas.filter(area => !area.area_padre_id);

  // Si hay filtros de búsqueda y hay empleados sin área asignada
  const empleadosSinArea = filteredEmpleados.filter(emp => !emp.area_id);

  if (visibleAreas.length === 0 && filteredEmpleados.length === 0) {
    return (
      <Alert severity="info">
        No se encontraron resultados con los filtros aplicados.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Áreas con estructura jerárquica */}
      {rootAreas.map((rootArea) => (
        <TarjetaArea
          key={rootArea.id}
          area={rootArea}
          empleados={filteredEmpleados}
          subAreas={visibleAreas}
          onEditArea={onEditArea}
          onDeleteArea={onDeleteArea}
          level={0}
        />
      ))}

      {/* Empleados sin área asignada */}
      {empleadosSinArea.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Empleados sin área asignada
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {empleadosSinArea.map((empleado) => (
              <TarjetaEmpleado 
                key={empleado.id} 
                empleado={empleado} 
                compact={true}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Mostrar solo empleados si hay filtro de búsqueda muy específico */}
      {searchTerm && visibleAreas.length === 0 && filteredEmpleados.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Empleados encontrados
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {filteredEmpleados.map((empleado) => (
              <TarjetaEmpleado 
                key={empleado.id} 
                empleado={empleado} 
                compact={false}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ArbolOrganigrama;
