-- Script para generar datos históricos (8 años) para el sistema de nómina

DELIMITER //

CREATE PROCEDURE GenerarDatosHistoricos()
BEGIN
    DECLARE fecha_inicio DATE;
    DECLARE fecha_fin DATE;
    DECLARE fecha_actual DATE;
    DECLARE contador INT;
    
    -- Definir fecha de inicio (8 años atrás)
    SET fecha_inicio = DATE_SUB(CURDATE(), INTERVAL 8 YEAR);
    SET fecha_fin = DATE_SUB(CURDATE(), INTERVAL 1 MONTH);
    SET fecha_actual = fecha_inicio;
    
    -- Procesar nóminas mensuales históricas
    WHILE fecha_actual <= fecha_fin DO
        -- Calcular fecha de fin de mes
        SET @ultimo_dia = LAST_DAY(fecha_actual);
        
        -- Generar nómina mensual
        CALL CalcularNominaMensual(DATE_FORMAT(fecha_actual, '%Y-%m-01'), @ultimo_dia);
        
        -- Avanzar al siguiente mes
        SET fecha_actual = DATE_ADD(fecha_actual, INTERVAL 1 MONTH);
    END WHILE;
    
    -- Reiniciar fecha para quincenas
    SET fecha_actual = fecha_inicio;
    
    -- Procesar nóminas quincenales históricas
    WHILE fecha_actual <= fecha_fin DO
        -- Primera quincena
        CALL CalcularNominaQuincenal(
            DATE_FORMAT(fecha_actual, '%Y-%m-01'),
            DATE_FORMAT(fecha_actual, '%Y-%m-15')
        );
        
        -- Segunda quincena
        CALL CalcularNominaQuincenal(
            DATE_FORMAT(fecha_actual, '%Y-%m-16'),
            LAST_DAY(fecha_actual)
        );
        
        -- Avanzar al siguiente mes
        SET fecha_actual = DATE_ADD(fecha_actual, INTERVAL 1 MONTH);
    END WHILE;
    
    -- Reiniciar fecha para semanas
    SET fecha_actual = fecha_inicio;
    
    -- Procesar nóminas semanales históricas (simplificado, solo 4 semanas por mes)
    WHILE fecha_actual <= fecha_fin DO
        SET contador = 0;
        
        WHILE contador < 4 DO
            -- Calcular inicio y fin de semana
            SET @inicio_semana = DATE_ADD(DATE_FORMAT(fecha_actual, '%Y-%m-01'), INTERVAL contador * 7 DAY);
            SET @fin_semana = DATE_ADD(@inicio_semana, INTERVAL 6 DAY);
            
            -- Si fin de semana excede el mes, ajustar
            IF MONTH(@fin_semana) > MONTH(@inicio_semana) THEN
                SET @fin_semana = LAST_DAY(@inicio_semana);
            END IF;
            
            -- Generar nómina semanal
            CALL CalcularNominaSemanal(@inicio_semana, @fin_semana);
            
            SET contador = contador + 1;
        END WHILE;
        
        -- Avanzar al siguiente mes
        SET fecha_actual = DATE_ADD(fecha_actual, INTERVAL 1 MONTH);
    END WHILE;
    
    -- Actualizar todas las nóminas históricas como pagadas
    UPDATE nominas SET estado = 'pagada' WHERE fecha_procesamiento < CURDATE();
END //

DELIMITER ;

-- Ejecutar el procedimiento para generar datos históricos
CALL GenerarDatosHistoricos();

-- Eliminar el procedimiento después de usarlo (opcional)
DROP PROCEDURE GenerarDatosHistoricos;