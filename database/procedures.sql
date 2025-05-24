-- Procedimientos almacenados para el sistema de nóminas

DELIMITER //

-- Función para calcular días de vacaciones pendientes según ley guatemalteca
CREATE FUNCTION CalcularDiasVacacionesPendientes(p_empleado_id INT) 
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE dias_acumulados INT;
    DECLARE dias_tomados INT;
    DECLARE dias_pendientes INT;
    DECLARE fecha_contratacion DATE;
    DECLARE años_servicio DECIMAL(5,2);
    DECLARE meses_servicio INT;
    
    -- Obtener fecha de contratación
    SELECT fecha_contratacion INTO fecha_contratacion
    FROM empleados
    WHERE id = p_empleado_id;
    
    -- Calcular años y meses de servicio
    SET años_servicio = TIMESTAMPDIFF(YEAR, fecha_contratacion, CURDATE());
    SET meses_servicio = TIMESTAMPDIFF(MONTH, fecha_contratacion, CURDATE());
    
    -- En Guatemala: 15 días hábiles por año completo
    SET dias_acumulados = FLOOR(años_servicio) * 15;
    
    -- Sumar días proporcionales por fracción de año
    SET dias_acumulados = dias_acumulados + FLOOR((meses_servicio % 12) * (15 / 12));
    
    -- Obtener días ya tomados
    SELECT COALESCE(SUM(dias_habiles), 0) INTO dias_tomados
    FROM vacaciones
    WHERE empleado_id = p_empleado_id;
    
    -- Calcular días pendientes
    SET dias_pendientes = dias_acumulados - dias_tomados;
    
    -- Si es negativo, devolver 0
    IF dias_pendientes < 0 THEN
        SET dias_pendientes = 0;
    END IF;
    
    RETURN dias_pendientes;
END //

-- Función para calcular el valor monetario de los días de vacaciones según normativa guatemalteca
CREATE FUNCTION CalcularValorVacaciones(p_empleado_id INT, p_dias_vacaciones INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE salario_mensual DECIMAL(10,2);
    DECLARE valor_dia_vacacion DECIMAL(10,2);
    DECLARE valor_total DECIMAL(10,2);
    
    -- Obtener salario mensual
    SELECT salario_base INTO salario_mensual
    FROM empleados
    WHERE id = p_empleado_id;
    
    -- Valor por día de vacaciones (según ley guatemalteca: salario mensual / 25)
    SET valor_dia_vacacion = salario_mensual / 25;
    
    -- Calcular valor total de las vacaciones
    SET valor_total = valor_dia_vacacion * p_dias_vacaciones;
    
    RETURN valor_total;
END //

-- Procedimiento para calcular nómina quincenal
CREATE PROCEDURE CalcularNominaQuincenal(IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE emp_id INT;
    DECLARE emp_salario DECIMAL(10,2);
    DECLARE emp_tipo_nomina VARCHAR(20);
    
    -- Cursor para empleados con nómina quincenal que estén activos
    DECLARE cur CURSOR FOR 
        SELECT id, salario_base, tipo_nomina 
        FROM empleados 
        WHERE activo = TRUE AND tipo_nomina = 'quincenal';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Obtener si es la última quincena del mes
    SET @es_ultima_quincena = (DAY(LAST_DAY(p_fecha_fin)) - DAY(p_fecha_fin) < 15);
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO emp_id, emp_salario, emp_tipo_nomina;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calcular montos
        SET @salario_quincenal = emp_salario;
        SET @bono_incentivo = 250.00; -- Valor fijo por quincena (500 mensual / 2)
        SET @igss = @salario_quincenal * 0.0483; -- 4.83% de IGSS
        SET @isr = 0;
        
        -- Solo calcular ISR en la última quincena del mes
        IF @es_ultima_quincena THEN
            -- Llamar a función que calcule ISR (implementada más abajo)
            SET @isr = CalcularISRMensual(emp_id) / 2;
        END IF;
        
        -- Verificar horas extra aprobadas para el período
        SELECT COALESCE(SUM(horas * (@salario_quincenal/30/8) * 1.5), 0) INTO @horas_extra 
        FROM solicitudes 
        WHERE empleado_id = emp_id 
        AND tipo = 'horas_extra' 
        AND estado = 'aprobada'
        AND fecha_inicio BETWEEN p_fecha_inicio AND p_fecha_fin;
        
        -- Calcular totales
        SET @total_bruto = @salario_quincenal + @bono_incentivo + @horas_extra;
        SET @total_deducciones = @igss + @isr;
        SET @total_neto = @total_bruto - @total_deducciones;
        
        -- Insertar nómina calculada
        INSERT INTO nominas (
            empleado_id, fecha_inicio, fecha_fin, tipo,
            salario_base, bono_incentivo, horas_extra, igss, isr,
            total_bruto, total_deducciones, total_neto
        ) VALUES (
            emp_id, p_fecha_inicio, p_fecha_fin, 'quincenal',
            @salario_quincenal, @bono_incentivo, @horas_extra, @igss, @isr,
            @total_bruto, @total_deducciones, @total_neto
        );
    END LOOP;
    
    CLOSE cur;
END //

-- Procedimiento para calcular nómina semanal
CREATE PROCEDURE CalcularNominaSemanal(IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE emp_id INT;
    DECLARE emp_salario DECIMAL(10,2);
    
    -- Cursor para empleados con nómina semanal que estén activos
    DECLARE cur CURSOR FOR 
        SELECT id, salario_base 
        FROM empleados 
        WHERE activo = TRUE AND tipo_nomina = 'semanal';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Determinar si es última semana del mes
    SET @es_ultima_semana = (MONTH(p_fecha_fin) != MONTH(DATE_ADD(p_fecha_fin, INTERVAL 7 DAY)));
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO emp_id, emp_salario;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calcular montos
        SET @salario_semanal = emp_salario / 4.3; -- Aproximación de salario semanal
        SET @bono_incentivo = 125.00; -- Valor fijo por semana (500 mensual / 4)
        SET @igss = @salario_semanal * 0.0483; -- 4.83% de IGSS
        SET @isr = 0;
        
        -- Solo calcular ISR en la última semana del mes
        IF @es_ultima_semana THEN
            SET @isr = CalcularISRMensual(emp_id) / 4.3;
        END IF;
        
        -- Verificar horas extra aprobadas para el período
        SELECT COALESCE(SUM(horas * (@salario_semanal/7/8) * 1.5), 0) INTO @horas_extra 
        FROM solicitudes 
        WHERE empleado_id = emp_id 
        AND tipo = 'horas_extra' 
        AND estado = 'aprobada'
        AND fecha_inicio BETWEEN p_fecha_inicio AND p_fecha_fin;
        
        -- Calcular totales
        SET @total_bruto = @salario_semanal + @bono_incentivo + @horas_extra;
        SET @total_deducciones = @igss + @isr;
        SET @total_neto = @total_bruto - @total_deducciones;
        
        -- Insertar nómina calculada
        INSERT INTO nominas (
            empleado_id, fecha_inicio, fecha_fin, tipo,
            salario_base, bono_incentivo, horas_extra, igss, isr,
            total_bruto, total_deducciones, total_neto
        ) VALUES (
            emp_id, p_fecha_inicio, p_fecha_fin, 'semanal',
            @salario_semanal, @bono_incentivo, @horas_extra, @igss, @isr,
            @total_bruto, @total_deducciones, @total_neto
        );
    END LOOP;
    
    CLOSE cur;
END //

-- Procedimiento para calcular nómina mensual
CREATE PROCEDURE CalcularNominaMensual(IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE emp_id INT;
    DECLARE emp_salario DECIMAL(10,2);
    
    -- Cursor para empleados con nómina mensual que estén activos
    DECLARE cur CURSOR FOR 
        SELECT id, salario_base 
        FROM empleados 
        WHERE activo = TRUE AND tipo_nomina = 'mensual';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO emp_id, emp_salario;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calcular montos
        SET @salario_mensual = emp_salario;
        SET @bono_incentivo = 500.00; -- Bono mensual completo
        SET @igss = @salario_mensual * 0.0483; -- 4.83% de IGSS
        SET @isr = CalcularISRMensual(emp_id);
        
        -- Verificar horas extra aprobadas para el período
        SELECT COALESCE(SUM(horas * (@salario_mensual/30/8) * 1.5), 0) INTO @horas_extra 
        FROM solicitudes 
        WHERE empleado_id = emp_id 
        AND tipo = 'horas_extra' 
        AND estado = 'aprobada'
        AND fecha_inicio BETWEEN p_fecha_inicio AND p_fecha_fin;
        
        -- Calcular aguinaldo y bono 14 si corresponde
        SET @aguinaldo = 0;
        SET @bono14 = 0;
        
        -- Si el mes incluye diciembre, calcular aguinaldo
        IF (MONTH(p_fecha_fin) = 12) THEN
            SET @aguinaldo = @salario_mensual;
        END IF;
        
        -- Si el mes incluye julio, calcular bono 14
        IF (MONTH(p_fecha_fin) = 7) THEN
            SET @bono14 = @salario_mensual;
        END IF;
        
        -- Calcular totales
        SET @total_bruto = @salario_mensual + @bono_incentivo + @horas_extra + @aguinaldo + @bono14;
        SET @total_deducciones = @igss + @isr;
        SET @total_neto = @total_bruto - @total_deducciones;
        
        -- Insertar nómina calculada
        INSERT INTO nominas (
            empleado_id, fecha_inicio, fecha_fin, tipo,
            salario_base, bono_incentivo, horas_extra, igss, isr,
            aguinaldo, bono14,
            total_bruto, total_deducciones, total_neto
        ) VALUES (
            emp_id, p_fecha_inicio, p_fecha_fin, 'mensual',
            @salario_mensual, @bono_incentivo, @horas_extra, @igss, @isr,
            @aguinaldo, @bono14,
            @total_bruto, @total_deducciones, @total_neto
        );
    END LOOP;
    
    CLOSE cur;
END //

-- Función para calcular ISR mensual (simplificado para Guatemala)
CREATE FUNCTION CalcularISRMensual(p_empleado_id INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE salario_anual DECIMAL(10,2);
    DECLARE salario_mensual DECIMAL(10,2);
    DECLARE isr_anual DECIMAL(10,2);
    DECLARE isr_mensual DECIMAL(10,2);
    
    -- Obtener salario mensual del empleado
    SELECT salario_base INTO salario_mensual 
    FROM empleados 
    WHERE id = p_empleado_id;
    
    -- Salario anual es el salario mensual por 12
    SET salario_anual = salario_mensual * 12;
    
    -- Cálculo simplificado del ISR en Guatemala
    -- Estos valores deben ajustarse según la legislación guatemalteca actual
    IF salario_anual <= 300000 THEN
        SET isr_anual = 0;
    ELSEIF salario_anual <= 600000 THEN
        SET isr_anual = (salario_anual - 300000) * 0.05;
    ELSE
        SET isr_anual = 15000 + (salario_anual - 600000) * 0.07;
    END IF;
    
    -- ISR mensual
    SET isr_mensual = isr_anual / 12;
    
    RETURN isr_mensual;
END //

-- Procedimiento para calcular liquidación de un empleado
CREATE PROCEDURE CalcularLiquidacion(
    IN p_empleado_id INT, 
    IN p_fecha_fin DATE, 
    IN p_motivo VARCHAR(20),
    IN p_procesado_por INT
)
BEGIN
    DECLARE v_fecha_inicio DATE;
    DECLARE v_años_servicio DECIMAL(5,2);
    DECLARE v_meses_servicio INT;
    DECLARE v_salario_promedio DECIMAL(10,2);
    DECLARE v_indemnizacion DECIMAL(10,2);
    DECLARE v_aguinaldo_prop DECIMAL(10,2);
    DECLARE v_bono14_prop DECIMAL(10,2);
    DECLARE v_dias_vacaciones_pend INT;
    DECLARE v_vacaciones_pend DECIMAL(10,2);
    DECLARE v_total_liquidacion DECIMAL(10,2);
    
    -- Obtener información del empleado
    SELECT fecha_contratacion, salario_base INTO v_fecha_inicio, v_salario_promedio
    FROM empleados 
    WHERE id = p_empleado_id;
    
    -- Calcular años y meses de servicio
    SET v_años_servicio = TIMESTAMPDIFF(MONTH, v_fecha_inicio, p_fecha_fin) / 12;
    SET v_meses_servicio = TIMESTAMPDIFF(MONTH, v_fecha_inicio, p_fecha_fin);
    
    -- Calcular indemnización (solo si es despido injustificado)
    IF p_motivo = 'despido' THEN
        SET v_indemnizacion = v_salario_promedio * v_años_servicio;
    ELSE 
        SET v_indemnizacion = 0;
    END IF;
    
    -- Calcular aguinaldo proporcional (1 dic al 30 nov)
    -- Calcular proporción según el período laborado en el año actual de aguinaldo
    SET v_aguinaldo_prop = v_salario_promedio * 
        (DATEDIFF(p_fecha_fin, 
         GREATEST(v_fecha_inicio, DATE_FORMAT(p_fecha_fin, '%Y-12-01') - INTERVAL 1 YEAR)) / 365);
    
    -- Calcular bono 14 proporcional (1 jul al 30 jun)
    -- Calcular proporción según el período laborado en el año actual de bono 14
    SET v_bono14_prop = v_salario_promedio *
        (DATEDIFF(p_fecha_fin, 
         GREATEST(v_fecha_inicio, DATE_FORMAT(p_fecha_fin, '%Y-07-01') - INTERVAL 1 YEAR)) / 365);
    
    -- Calcular días de vacaciones pendientes
    SET v_dias_vacaciones_pend = CalcularDiasVacacionesPendientes(p_empleado_id);
    
    -- Calcular valor monetario de vacaciones pendientes (según ley guatemalteca)
    SET v_vacaciones_pend = CalcularValorVacaciones(p_empleado_id, v_dias_vacaciones_pend);
    
    -- Calcular total de liquidación
    SET v_total_liquidacion = v_indemnizacion + v_aguinaldo_prop + v_bono14_prop + v_vacaciones_pend;
    
    -- Insertar liquidación
    INSERT INTO liquidaciones (
        empleado_id, fecha_inicio, fecha_fin, motivo,
        años_servicio, indemnizacion, aguinaldo_proporcional,
        bono14_proporcional, vacaciones_pendientes, total_liquidacion,
        procesado_por
    ) VALUES (
        p_empleado_id, v_fecha_inicio, p_fecha_fin, p_motivo,
        v_años_servicio, v_indemnizacion, v_aguinaldo_prop,
        v_bono14_prop, v_vacaciones_pend, v_total_liquidacion,
        p_procesado_por
    );
    
    -- Actualizar estado del empleado a inactivo
    UPDATE empleados SET activo = FALSE 
    WHERE id = p_empleado_id;
END //

-- Procedimiento para aprobar solicitud de vacaciones
CREATE PROCEDURE AprobarSolicitudVacaciones(
    IN p_solicitud_id INT,
    IN p_aprobado_por INT
)
BEGIN
    DECLARE v_empleado_id INT;
    DECLARE v_fecha_inicio DATE;
    DECLARE v_fecha_fin DATE;
    DECLARE v_dias_habiles INT;
    DECLARE v_dias_naturales INT;
    DECLARE v_valor_pagado DECIMAL(10,2);
    
    -- Obtener datos de la solicitud
    SELECT empleado_id, fecha_inicio, fecha_fin
    INTO v_empleado_id, v_fecha_inicio, v_fecha_fin
    FROM solicitudes
    WHERE id = p_solicitud_id AND tipo = 'vacaciones';
    
    -- Calcular días naturales
    SET v_dias_naturales = DATEDIFF(v_fecha_fin, v_fecha_inicio) + 1;
    
    -- Calcular días hábiles (excluyendo fines de semana - simplificado)
    SET v_dias_habiles = v_dias_naturales - 
        (FLOOR(v_dias_naturales / 7) * 2 + 
         (CASE WHEN DAYOFWEEK(v_fecha_inicio) = 1 THEN 1 ELSE 0 END) +
         (CASE WHEN DAYOFWEEK(v_fecha_fin) = 7 THEN 1 ELSE 0 END));
    
    -- Calcular valor a pagar por las vacaciones
    SET v_valor_pagado = CalcularValorVacaciones(v_empleado_id, v_dias_habiles);
    
    -- Actualizar estado de la solicitud
    UPDATE solicitudes
    SET estado = 'aprobada', aprobado_por = p_aprobado_por
    WHERE id = p_solicitud_id;
    
    -- Registrar período de vacaciones
    INSERT INTO vacaciones (
        empleado_id, fecha_inicio, fecha_fin, 
        dias_habiles, dias_naturales, valor_pagado,
        anio_correspondiente, solicitud_id
    ) VALUES (
        v_empleado_id, v_fecha_inicio, v_fecha_fin,
        v_dias_habiles, v_dias_naturales, v_valor_pagado,
        YEAR(CURDATE()), p_solicitud_id
    );
END //

-- Procedimiento para aprobar solicitud de horas extra
CREATE PROCEDURE AprobarSolicitudHorasExtra(
    IN p_solicitud_id INT,
    IN p_aprobado_por INT
)
BEGIN
    -- Actualizar estado de la solicitud
    UPDATE solicitudes
    SET estado = 'aprobada', aprobado_por = p_aprobado_por
    WHERE id = p_solicitud_id AND tipo = 'horas_extra';
END //

-- Procedimiento para consultar estado de vacaciones
CREATE PROCEDURE ConsultarEstadoVacaciones(IN p_empleado_id INT)
BEGIN
    DECLARE v_dias_disponibles INT;
    DECLARE v_dias_tomados INT;
    DECLARE v_dias_pendientes INT;
    DECLARE v_fecha_contratacion DATE;
    DECLARE v_anios_servicio DECIMAL(5,2);
    
    -- Obtener información del empleado
    SELECT fecha_contratacion INTO v_fecha_contratacion
    FROM empleados
    WHERE id = p_empleado_id;
    
    -- Calcular años de servicio
    SET v_anios_servicio = TIMESTAMPDIFF(YEAR, v_fecha_contratacion, CURDATE());
    
    -- Días disponibles según ley (15 días hábiles por año)
    SET v_dias_disponibles = FLOOR(v_anios_servicio) * 15;
    
    -- Días ya tomados
    SELECT COALESCE(SUM(dias_habiles), 0) INTO v_dias_tomados
    FROM vacaciones
    WHERE empleado_id = p_empleado_id;
    
    -- Días pendientes
    SET v_dias_pendientes = v_dias_disponibles - v_dias_tomados;
    
    -- Mostrar resultados
    SELECT 
        v_fecha_contratacion AS fecha_contratacion,
        v_anios_servicio AS anios_servicio,
        v_dias_disponibles AS dias_disponibles,
        v_dias_tomados AS dias_tomados,
        v_dias_pendientes AS dias_pendientes;
END //

DELIMITER ;