// src/pages/Organigrama.js (reemplaza todo el contenido)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmpleadoService from '../services/empleado.service';
import AreaService from '../services/area.service';
import BuscadorOrganigrama from '../components/organigrama/BuscadorOrganigrama';
import ArbolOrganigrama from '../components/organigrama/ArbolOrganigrama';
import FormularioArea from '../components/organigrama/FormularioArea';
import {
  Box,
  Typography,
  Fab,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add,
  Business,
  People,
  Visibility
} from '@mui/icons-material';

const Organigrama = () => {
  const { isSuperAdmin } = useAuth();
  const [areas, setAreas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  
  // Estados para formularios
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [selectedAreaToEdit, setSelectedAreaToEdit] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    totalAreas: 0,
    areasConEmpleados: 0,
    empleadosSinArea: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (areas.length > 0 && empleados.length > 0) {
      calculateStats();
    }
  }, [areas, empleados]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [organigramaData] = await Promise.all([
        EmpleadoService.getOrganigrama()
      ]);
      
      setAreas(organigramaData.areas || []);
      setEmpleados(organigramaData.empleados || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalEmpleados = empleados.length;
    const totalAreas = areas.length;
    const areasConEmpleados = areas.filter(area => 
      empleados.some(emp => emp.area_id === area.id)
    ).length;
    const empleadosSinArea = empleados.filter(emp => !emp.area_id).length;

    setStats({
      totalEmpleados,
      totalAreas,
      areasConEmpleados,
      empleadosSinArea
    });
  };

  const handleCreateArea = () => {
    setSelectedAreaToEdit(null);
    setAreaDialogOpen(true);
  };

  const handleEditArea = (area) => {
    setSelectedAreaToEdit(area);
    setAreaDialogOpen(true);
  };

  const handleDeleteArea = (area) => {
    setAreaToDelete(area);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;

    try {
      await AreaService.delete(areaToDelete.id);
      await loadData(); // Recargar datos
      setDeleteDialogOpen(false);
      setAreaToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAreaFormSuccess = () => {
    loadData(); // Recargar datos después de crear/editar
  };

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Organigrama de la Empresa
        </Typography>
        {isSuperAdmin() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateArea}
          >
            Nueva Área
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas generales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Empleados"
            value={stats.totalEmpleados}
            icon={<People fontSize="large" />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Áreas"
            value={stats.totalAreas}
            icon={<Business fontSize="large" />}
            color="secondary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Áreas Activas"
            value={stats.areasConEmpleados}
            icon={<Visibility fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sin Área Asignada"
            value={stats.empleadosSinArea}
            icon={<People fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Buscador y filtros */}
      <BuscadorOrganigrama
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedArea={selectedArea}
        onAreaChange={setSelectedArea}
        areas={areas}
        stats={stats}
      />

      {/* Advertencia para empleados sin área */}
      {stats.empleadosSinArea > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Hay {stats.empleadosSinArea} empleado(s) sin área asignada. 
          {isSuperAdmin() && ' Considera asignarlos a un área apropiada.'}
        </Alert>
      )}

      {/* Árbol del organigrama */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <ArbolOrganigrama
          areas={areas}
          empleados={empleados}
          searchTerm={searchTerm}
          selectedArea={selectedArea}
          onEditArea={handleEditArea}
          onDeleteArea={handleDeleteArea}
        />
      </Paper>

      {/* FAB para crear área (solo superadmin) */}
      {isSuperAdmin() && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateArea}
        >
          <Add />
        </Fab>
      )}

      {/* Dialog para crear/editar área */}
      <FormularioArea
        open={areaDialogOpen}
        onClose={() => setAreaDialogOpen(false)}
        onSuccess={handleAreaFormSuccess}
        area={selectedAreaToEdit}
        areas={areas}
      />

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Eliminar Área
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar esta área?
          </Alert>
          {areaToDelete && (
            <Typography variant="body2">
              <strong>Área:</strong> {areaToDelete.nombre}<br />
              {areaToDelete.descripcion && (
                <>
                  <strong>Descripción:</strong> {areaToDelete.descripcion}
                </>
              )}
            </Typography>
          )}
          <Alert severity="info" sx={{ mt: 2 }}>
            Solo se pueden eliminar áreas vacías (sin empleados ni sub-áreas).
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar Área
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Organigrama;
