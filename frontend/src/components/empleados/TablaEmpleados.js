import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Typography,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Edit,
  Lock,
  PersonOff,
  History,
  Person
} from '@mui/icons-material';
import dayjs from 'dayjs';

const TablaEmpleados = ({ 
  empleados, 
  loading, 
  onViewDetail, 
  onEdit, 
  onChangePassword, 
  onDeactivate,
  onViewHistory 
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('nombre');
  const [order, setOrder] = useState('asc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, empleado) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmpleado(empleado);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmpleado(null);
  };

  const getRolChip = (rolId) => {
    const config = {
      1: { color: 'error', label: 'Superadmin' },
      2: { color: 'warning', label: 'Admin' },
      3: { color: 'primary', label: 'Empleado' }
    };
    const { color, label } = config[rolId] || config[3];
    return <Chip label={label} color={color} size="small" />;
  };

  const getEstadoChip = (activo) => {
    return (
      <Chip
        label={activo ? 'Activo' : 'Inactivo'}
        color={activo ? 'success' : 'default'}
        size="small"
        variant={activo ? 'filled' : 'outlined'}
      />
    );
  };

  const generateInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  // Ordenar empleados
  const sortedEmpleados = [...empleados].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    if (orderBy === 'nombre') {
      aValue = `${a.nombre} ${a.apellido}`;
      bValue = `${b.nombre} ${b.apellido}`;
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Paginar empleados
  const paginatedEmpleados = sortedEmpleados.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell sortDirection={orderBy === 'email' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>Área</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell sortDirection={orderBy === 'salario_base' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'salario_base'}
                  direction={orderBy === 'salario_base' ? order : 'asc'}
                  onClick={() => handleSort('salario_base')}
                >
                  Salario
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'fecha_contratacion' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'fecha_contratacion'}
                  direction={orderBy === 'fecha_contratacion' ? order : 'asc'}
                  onClick={() => handleSort('fecha_contratacion')}
                >
                  Contratación
                </TableSortLabel>
              </TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEmpleados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No se encontraron empleados con los filtros aplicados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmpleados.map((empleado) => (
                <TableRow key={empleado.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {generateInitials(empleado.nombre, empleado.apellido)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {empleado.nombre} {empleado.apellido}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          #{empleado.numero_empleado || empleado.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {empleado.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {empleado.area_nombre || 'Sin asignar'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getRolChip(empleado.rol_id)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(empleado.salario_base)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {empleado.tipo_nomina}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(empleado.fecha_contratacion)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getEstadoChip(empleado.activo)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, empleado)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={sortedEmpleados.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          onViewDetail(selectedEmpleado);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          onEdit(selectedEmpleado);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          onChangePassword(selectedEmpleado);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Lock fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cambiar contraseña</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          onViewHistory(selectedEmpleado);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText>Historial salarial</ListItemText>
        </MenuItem>

        {selectedEmpleado?.activo && (
          <MenuItem 
            onClick={() => {
              onDeactivate(selectedEmpleado);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <PersonOff fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Desactivar empleado</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};

export default TablaEmpleados;