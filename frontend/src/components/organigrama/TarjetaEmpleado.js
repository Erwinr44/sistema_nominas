// src/components/organigrama/TarjetaEmpleado.js
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  SupervisorAccount
} from '@mui/icons-material';

const TarjetaEmpleado = ({ empleado, compact = false }) => {
  const getRolColor = (rolId) => {
    switch (rolId) {
      case 1: return 'error';    // Superadmin
      case 2: return 'warning';  // Admin
      case 3: return 'primary';  // Empleado
      default: return 'default';
    }
  };

  const getRolLabel = (rolId) => {
    switch (rolId) {
      case 1: return 'Superadmin';
      case 2: return 'Admin';
      case 3: return 'Empleado';
      default: return 'Usuario';
    }
  };

  const generateInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  if (compact) {
    return (
      <Card 
        elevation={2} 
        sx={{ 
          minWidth: 200, 
          maxWidth: 220,
          height: 120,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          '&:hover': {
            elevation: 4,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: 2 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              mb: 1, 
              mx: 'auto',
              bgcolor: getRolColor(empleado.rol_id) + '.main'
            }}
          >
            {generateInitials(empleado.nombre, empleado.apellido)}
          </Avatar>
          <Typography variant="body2" fontWeight="bold" noWrap>
            {empleado.nombre} {empleado.apellido}
          </Typography>
          <Chip 
            label={getRolLabel(empleado.rol_id)} 
            size="small" 
            color={getRolColor(empleado.rol_id)}
            sx={{ mt: 1 }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={3} 
      sx={{ 
        maxWidth: 300,
        '&:hover': {
          elevation: 6,
          transform: 'translateY(-4px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              mr: 2,
              bgcolor: getRolColor(empleado.rol_id) + '.main'
            }}
          >
            {generateInitials(empleado.nombre, empleado.apellido)}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {empleado.nombre} {empleado.apellido}
            </Typography>
            <Chip 
              label={getRolLabel(empleado.rol_id)} 
              color={getRolColor(empleado.rol_id)}
              size="small"
            />
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap={1}>
          {empleado.email && (
            <Box display="flex" alignItems="center" gap={1}>
              <Email fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {empleado.email}
              </Typography>
            </Box>
          )}

          {empleado.numero_empleado && (
            <Box display="flex" alignItems="center" gap={1}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                ID: {empleado.numero_empleado}
              </Typography>
            </Box>
          )}

          {empleado.area_nombre && (
            <Box display="flex" alignItems="center" gap={1}>
              <Business fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {empleado.area_nombre}
              </Typography>
            </Box>
          )}

          {empleado.jefe_directo_id && (
            <Box display="flex" alignItems="center" gap={1}>
              <SupervisorAccount fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Reporta a supervisor
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TarjetaEmpleado;
