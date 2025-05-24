import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Alert
} from '@mui/material';
import {
  People,
  Payment,
  RequestPage,
  AccountBalance
} from '@mui/icons-material';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    empleados: 0,
    nominasDelMes: 0,
    solicitudesPendientes: 0,
    liquidacionesDelMes: 0
  });

  useEffect(() => {
    setStats({
      empleados: 8,
      nominasDelMes: 16,
      solicitudesPendientes: 3,
      liquidacionesDelMes: 1
    });
  }, []);

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bienvenido, {user?.nombre} {user?.apellido}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {isAdmin() ? 'Panel de Administración' : 'Panel de Empleado'}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Sistema de Nómina - {new Date().toLocaleDateString('es-GT', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </Alert>

      {isAdmin() ? (
        // Dashboard para administradores
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Empleados"
              value={stats.empleados}
              icon={<People fontSize="large" />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Nóminas del Mes"
              value={stats.nominasDelMes}
              icon={<Payment fontSize="large" />}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Solicitudes Pendientes"
              value={stats.solicitudesPendientes}
              icon={<RequestPage fontSize="large" />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Liquidaciones del Mes"
              value={stats.liquidacionesDelMes}
              icon={<AccountBalance fontSize="large" />}
              color="error"
            />
          </Grid>

        </Grid>
      ) : (
        // Dashboard para empleados
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Acciones Rápidas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Ver mi nómina actual<br />
                  • Solicitar vacaciones<br />
                  • Registrar horas extra<br />
                  • Ver organigrama de la empresa
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información Personal
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {user?.email}<br />
                  <strong>Rol:</strong> {user?.rol_id === 3 ? 'Empleado' : 'Administrador'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
