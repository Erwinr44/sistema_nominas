// src/components/organigrama/TarjetaArea.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Business,
  People,
  Edit,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import TarjetaEmpleado from './TarjetaEmpleado';

const TarjetaArea = ({ 
  area, 
  empleados = [], 
  subAreas = [], 
  onEditArea, 
  onDeleteArea,
  level = 0 
}) => {
  const { isSuperAdmin } = useAuth();
  const [expanded, setExpanded] = useState(level < 2); // Expandir automáticamente los primeros 2 niveles

  const empleadosDelArea = empleados.filter(emp => emp.area_id === area.id);
  const subAreasDelArea = subAreas.filter(sub => sub.area_padre_id === area.id);

  const getColorByLevel = (level) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'info'];
    return colors[level % colors.length];
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Box ml={level * 2}>
      <Card 
        elevation={3} 
        sx={{ 
          mb: 2,
          border: level === 0 ? '2px solid' : '1px solid',
          borderColor: `${getColorByLevel(level)}.main`,
          '&:hover': {
            elevation: 6,
            transform: 'translateX(4px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" flex={1}>
              <Business 
                color={getColorByLevel(level)} 
                sx={{ mr: 1, fontSize: level === 0 ? 28 : 24 }} 
              />
              <Box>
                <Typography 
                  variant={level === 0 ? 'h5' : level === 1 ? 'h6' : 'subtitle1'} 
                  fontWeight="bold"
                  color={`${getColorByLevel(level)}.main`}
                >
                  {area.nombre}
                </Typography>
                {area.descripcion && (
                  <Typography variant="body2" color="text.secondary">
                    {area.descripcion}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {/* Estadísticas */}
              <Badge badgeContent={empleadosDelArea.length} color="primary">
                <Chip
                  icon={<People />}
                  label="Empleados"
                  size="small"
                  variant="outlined"
                />
              </Badge>

              {subAreasDelArea.length > 0 && (
                <Chip
                  label={`${subAreasDelArea.length} sub-áreas`}
                  size="small"
                  color={getColorByLevel(level)}
                  variant="outlined"
                />
              )}

              {/* Acciones para superadmin */}
              {isSuperAdmin() && (
                <>
                  <Tooltip title="Editar área">
                    <IconButton 
                      size="small" 
                      onClick={() => onEditArea(area)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  
                  {empleadosDelArea.length === 0 && subAreasDelArea.length === 0 && (
                    <Tooltip title="Eliminar área">
                      <IconButton 
                        size="small" 
                        onClick={() => onDeleteArea(area)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}

              {/* Botón de expandir/colapsar */}
              {(empleadosDelArea.length > 0 || subAreasDelArea.length > 0) && (
                <IconButton onClick={handleToggleExpand}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>
          </Box>

          <Collapse in={expanded}>
            <Box mt={2}>
              {/* Empleados del área */}
              {empleadosDelArea.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    Empleados ({empleadosDelArea.length})
                  </Typography>
                  <Box 
                    display="flex" 
                    flexWrap="wrap" 
                    gap={2}
                    sx={{ 
                      maxHeight: 300, 
                      overflowY: empleadosDelArea.length > 6 ? 'auto' : 'visible' 
                    }}
                  >
                    {empleadosDelArea.map((empleado) => (
                      <TarjetaEmpleado 
                        key={empleado.id} 
                        empleado={empleado} 
                        compact={true}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Sub-áreas */}
              {subAreasDelArea.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    Departamentos ({subAreasDelArea.length})
                  </Typography>
                  {subAreasDelArea.map((subArea) => (
                    <TarjetaArea
                      key={subArea.id}
                      area={subArea}
                      empleados={empleados}
                      subAreas={subAreas}
                      onEditArea={onEditArea}
                      onDeleteArea={onDeleteArea}
                      level={level + 1}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TarjetaArea;
