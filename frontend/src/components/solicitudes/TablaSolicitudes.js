// src/components/solicitudes/TablaSolicitudes.js
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  Delete,
  EventAvailable,
  Schedule,
  Comment
} from '@mui/icons-material';
import dayjs from 'dayjs';

const TablaSolicitudes = ({ solicitudes, onDelete, loading }) => {
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [solicitudToDelete, setSolicitudToDelete] = useState(null);

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const getEstadoChip = (estado) => {
    const config = {
      pendiente: { color: 'warning', label: 'Pendiente' },
      aprobada: { color: 'success', label: 'Aprobada' },
      rechazada: { color: 'error', label: 'Rechazada' }
    };
    
    const { color, label } = config[estado] || config.pendiente;
    return <Chip label={label} color={color} size="small" />;
  };

  const getTipoChip = (tipo) => {
    const config = {
      vacaciones: { color: 'primary', label: 'Vacaciones', icon: <EventAvailable /> },
      horas_extra: { color: 'secondary', label: 'Horas Extra', icon: <Schedule /> }
    };
    
    const { color, label, icon } = config[tipo] || config.vacaciones;
    return <Chip label={label} color={color} size="small" icon={icon} variant="outlined" />;
  };

  const handleViewDetail = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setDetailDialogOpen(true);
  };

  const handleDeleteClick = (solicitud) => {
    setSolicitudToDelete(solicitud);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (solicitudToDelete) {
      onDelete(solicitudToDelete.id);
      setDeleteDialogOpen(false);
      setSolicitudToDelete(null);
    }
  };

  const calculateDays = (fechaInicio, fechaFin) => {
    const inicio = dayjs(fechaInicio);
    const fin = dayjs(fechaFin);
    return fin.diff(inicio, 'day') + 1;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha(s)</TableCell>
              <TableCell>Detalles</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Solicitud</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No has creado ninguna solicitud aún
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              solicitudes.map((solicitud) => (
                <TableRow key={solicitud.id} hover>
                  <TableCell>
                    {getTipoChip(solicitud.tipo)}
                  </TableCell>
                  <TableCell>
                    {solicitud.tipo === 'vacaciones' ? (
                      <>
                        <Typography variant="body2">
                          {formatDate(solicitud.fecha_inicio)} - {formatDate(solicitud.fecha_fin)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ({calculateDays(solicitud.fecha_inicio, solicitud.fecha_fin)} días)
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2">
                        {formatDate(solicitud.fecha_inicio)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {solicitud.tipo === 'horas_extra' ? (
                      <Typography variant="body2">
                        {solicitud.horas} horas
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Vacaciones
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getEstadoChip(solicitud.estado)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(solicitud.creado_en)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewDetail(solicitud)}
                      title="Ver detalles"
                    >
                      <Visibility />
                    </IconButton>
                    {solicitud.estado === 'pendiente' && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(solicitud)}
                        title="Cancelar solicitud"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Detalles */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Detalle de Solicitud
        </DialogTitle>
        <DialogContent>
          {selectedSolicitud && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" gap={1} mb={2}>
                    {getTipoChip(selectedSolicitud.tipo)}
                    {getEstadoChip(selectedSolicitud.estado)}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Inicio
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedSolicitud.fecha_inicio)}
                  </Typography>
                </Grid>

                {selectedSolicitud.tipo === 'vacaciones' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fecha de Fin
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedSolicitud.fecha_fin)}
                    </Typography>
                  </Grid>
                )}

                {selectedSolicitud.tipo === 'horas_extra' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Cantidad de Horas
                    </Typography>
                    <Typography variant="body1">
                      {selectedSolicitud.horas} horas
                    </Typography>
                  </Grid>
                )}

                {selectedSolicitud.tipo === 'vacaciones' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total de Días
                    </Typography>
                    <Typography variant="body1">
                      {calculateDays(selectedSolicitud.fecha_inicio, selectedSolicitud.fecha_fin)} días naturales
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Solicitud
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedSolicitud.creado_en)}
                  </Typography>
                </Grid>

                {selectedSolicitud.comentario && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Comentario
                    </Typography>
                    <Typography variant="body1">
                      {selectedSolicitud.comentario}
                    </Typography>
                  </Grid>
                )}

                {selectedSolicitud.estado !== 'pendiente' && selectedSolicitud.aprobador_nombre && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {selectedSolicitud.estado === 'aprobada' ? 'Aprobada por' : 'Rechazada por'}
                    </Typography>
                    <Typography variant="body1">
                      {selectedSolicitud.aprobador_nombre} {selectedSolicitud.aprobador_apellido}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Cancelar Solicitud
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas cancelar esta solicitud?
          </Alert>
          {solicitudToDelete && (
            <Typography variant="body2">
              <strong>Tipo:</strong> {solicitudToDelete.tipo === 'vacaciones' ? 'Vacaciones' : 'Horas Extra'}<br />
              <strong>Fecha:</strong> {formatDate(solicitudToDelete.fecha_inicio)}
              {solicitudToDelete.tipo === 'vacaciones' && ` - ${formatDate(solicitudToDelete.fecha_fin)}`}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            No, Mantener
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Sí, Cancelar Solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TablaSolicitudes;