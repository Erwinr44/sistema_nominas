-- Estructura de la base de datos para sistema de nóminas
-- Definición de tablas principales

-- Tabla de roles de usuario
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de áreas/departamentos para el organigrama
CREATE TABLE areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    area_padre_id INT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_padre_id) REFERENCES areas(id) ON DELETE SET NULL
);

-- Tabla de empleados
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_empleado VARCHAR(20) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    dpi VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    fecha_contratacion DATE NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL,
    tipo_nomina ENUM('semanal', 'quincenal', 'mensual') NOT NULL,
    area_id INT,
    rol_id INT NOT NULL,
    jefe_directo_id INT NULL,
    activo BOOLEAN DEFAULT true,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id),
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (jefe_directo_id) REFERENCES empleados(id) ON DELETE SET NULL
);

-- Tabla para historial de salarios
CREATE TABLE historial_salarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    salario_anterior DECIMAL(10,2) NOT NULL,
    salario_nuevo DECIMAL(10,2) NOT NULL,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    registrado_por INT,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (registrado_por) REFERENCES empleados(id)
);

-- Tabla para nóminas procesadas
CREATE TABLE nominas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tipo ENUM('semanal', 'quincenal', 'mensual') NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL,
    bono_incentivo DECIMAL(10,2) DEFAULT 0,
    horas_extra DECIMAL(10,2) DEFAULT 0,
    igss DECIMAL(10,2) DEFAULT 0,
    isr DECIMAL(10,2) DEFAULT 0,
    otras_deducciones DECIMAL(10,2) DEFAULT 0,
    vacaciones DECIMAL(10,2) DEFAULT 0,
    aguinaldo DECIMAL(10,2) DEFAULT 0,
    bono14 DECIMAL(10,2) DEFAULT 0,
    total_bruto DECIMAL(10,2) NOT NULL,
    total_deducciones DECIMAL(10,2) NOT NULL,
    total_neto DECIMAL(10,2) NOT NULL,
    estado ENUM('procesada', 'pagada') NOT NULL DEFAULT 'procesada',
    fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- Tabla para solicitudes de vacaciones y horas extra
CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    tipo ENUM('vacaciones', 'horas_extra') NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    horas DECIMAL(5,2),
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    aprobado_por INT,
    comentario TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (aprobado_por) REFERENCES empleados(id)
);

-- Tabla para periodos de vacaciones tomadas
CREATE TABLE vacaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_habiles INT NOT NULL,
    dias_naturales INT NOT NULL,
    valor_pagado DECIMAL(10,2) NOT NULL,
    anio_correspondiente INT NOT NULL,
    solicitud_id INT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id)
);

-- Tabla para liquidaciones
CREATE TABLE liquidaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    motivo ENUM('renuncia', 'despido', 'despido_justificado') NOT NULL,
    años_servicio DECIMAL(5,2) NOT NULL,
    indemnizacion DECIMAL(10,2) NOT NULL,
    aguinaldo_proporcional DECIMAL(10,2) NOT NULL,
    bono14_proporcional DECIMAL(10,2) NOT NULL,
    vacaciones_pendientes DECIMAL(10,2) NOT NULL,
    otros_pagos DECIMAL(10,2) DEFAULT 0,
    total_liquidacion DECIMAL(10,2) NOT NULL,
    procesado_por INT NOT NULL,
    estado ENUM('procesada', 'pagada') DEFAULT 'procesada',
    fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (procesado_por) REFERENCES empleados(id)
);