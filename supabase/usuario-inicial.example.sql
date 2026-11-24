-- =========================================================
-- Yupana · Cómo crear el primer usuario (coordinador provincial)
-- No hay autorregistro (R2): el provincial se crea a mano una sola vez
-- y él crea a los demás usuarios desde la app.
--
-- Pasos:
-- 1. Supabase → Authentication → Users → Add user → Create new user
--    Email: un correo real (para recibir los códigos OTP)
--    Password: Ecuador2026
--    Marcar "Auto Confirm User"
-- 2. Copiar el UID del usuario creado.
-- 3. Reemplazar los valores de abajo y ejecutar en el SQL Editor.
-- =========================================================

insert into perfiles (id, cedula, nombres, apellidos, telefono, correo, rol)
values (
  'UID-DEL-USUARIO-CREADO',   -- el UID copiado en el paso 2
  '1700000019',               -- cédula de demostración (válida, ficticia)
  'Nombre',
  'Apellido',
  '0990000001',               -- teléfono de demostración
  'correo@ejemplo.com',       -- el MISMO correo del paso 1
  'provincial'
);