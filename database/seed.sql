-- Datos iniciales para el sistema de nómina

-- Insertar roles
INSERT INTO roles (nombre, descripcion) VALUES 
('Superadministrador', 'Control total del sistema incluyendo gestión de organigrama'),
('Administrador', 'Gestión de empleados, nóminas y aprobaciones'),
('Empleado', 'Acceso limitado a información personal');

-- Insertar áreas iniciales
INSERT INTO areas (nombre, descripcion, area_padre_id) VALUES 
('Dirección General', 'Dirección estratégica de la empresa', NULL);

-- Insertar áreas de primer nivel
INSERT INTO areas (nombre, descripcion, area_padre_id) VALUES 
('Recursos Humanos', 'Gestión del personal', 1),
('Finanzas', 'Administración financiera', 1),
('Tecnología', 'Desarrollo y soporte técnico', 1),
('Operaciones', 'Gestión de operaciones diarias', 1);

-- Insertar áreas de segundo nivel
INSERT INTO areas (nombre, descripcion, area_padre_id) VALUES 
('Reclutamiento', 'Selección de personal', 2),
('Desarrollo de Personal', 'Capacitación y carrera profesional', 2),
('Contabilidad', 'Registro contable y fiscal', 3),
('Tesorería', 'Gestión de pagos y cobranza', 3),
('Desarrollo', 'Programación de aplicaciones', 4),
('Infraestructura', 'Gestión de servidores y redes', 4),
('Producción', 'Fabricación de productos', 5),
('Logística', 'Gestión de almacenes y distribución', 5);

-- Insertar empleados iniciales (contraseñas: 123456)
INSERT INTO empleados (
    numero_empleado, nombre, apellido, email, password, 
    dpi, fecha_nacimiento, fecha_contratacion, 
    salario_base, tipo_nomina, area_id, rol_id
) VALUES 
-- Superadmin (contraseña: 123456)
('EMP001', 'Admin', 'Sistema', 'admin@empresa.com', '$2a$10$4ySX3.KvBRdaj/lxnNxtz.otY5h3RQFBCYWhM61J2r01QxQnUjsW2', 
 '1234567890101', '1980-01-01', '2015-01-01', 
 20000.00, 'mensual', 1, 1),
 
-- Administrador de RRHH (contraseña: 123456)
('EMP002', 'Gerente', 'RRHH', 'rrhh@empresa.com', '$2a$10$4ySX3.KvBRdaj/lxnNxtz.otY5h3RQFBCYWhM61J2r01QxQnUjsW2', 
 '2345678901010', '1985-05-15', '2016-03-10', 
 15000.00, 'quincenal', 2, 2),
 
-- Empleado normal (contraseña: 123456)
('EMP003', 'Usuario', 'Normal', 'usuario@empresa.com', '$2a$10$4ySX3.KvBRdaj/lxnNxtz.otY5h3RQFBCYWhM61J2r01QxQnUjsW2', 
 '3456789010101', '1990-08-20', '2018-06-15', 
 8000.00, 'quincenal', 5, 3),

-- Gerente de Finanzas (contraseña: 123456)
('EMP004', 'Director', 'Finanzas', 'finanzas@empresa.com', '$2a$10$4ySX3.KvBRdaj/lxnNxtz.otY5h3RQFBCYWhM61J2r01QxQnUjsW2', 
 '4567890101010', '1975-03-25', '2015-05-01', 
 18000.00, 'mensual', 3, 2),

-- Empleado de TI (contraseña: 123456)
('EMP005', 'Técnico', 'Sistemas', 'sistemas@empresa.com', '$2a$10$4ySX3.KvBRdaj/lxnNxtz.otY5h3RQFBCYWhM61J2r01QxQnUjsW2', 
 '5678901010101', '1992-11-10', '2019-01-15', 
 9500.00, 'quincenal', 4, 3);