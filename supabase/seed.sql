-- =========================================================
-- Yupana · Datos iniciales (R1, ADR-002)
-- Recintos reales de Quito (muestra) y organizaciones ficticias para la demo.
-- La cantidad de JRV es reducida a propósito, para las pruebas.
-- =========================================================

-- Recintos reales del norte de Quito.
-- Fuente: Distributivo de Recintos Electorales del CNE (actualizado al 08-08-2022).
insert into recintos (parroquia, nombre, cantidad_jrv, latitud, longitud) values
  ('Cotocollao', 'U.E. Mena del Hierro',         36, -0.113145, -78.497279),
  ('El Condado', 'E.E.B. Manuela Abad',          20, -0.085255, -78.509283),
  ('Ponceano',   'Saint Patrick School',          6, -0.104291, -78.487550),
  ('Carcelén',   'Escuela Emilio Salgari',        6, -0.077676, -78.461551),
  ('Cochapamba', 'Colegio Mayor Galo Molina',     7, -0.120156, -78.510650);

-- Organizaciones políticas (ficticias)
insert into organizaciones (nombre, siglas, orden) values
  ('Movimiento Chaquiñán', 'MCH', 1),
  ('Frente Ilaló',          'FIL', 2),
  ('Alianza Pasochoa',      'APA', 3),
  ('Unidad Atacazo',        'UAT', 4),
  ('Renovación Rucu',       'RRU', 5);

-- Candidaturas a alcaldía y prefectura (ficticias)
insert into candidatos (organizacion_id, nombre, dignidad)
select o.id, c.nombre, c.dignidad::dignidad
from (values
  ('MCH', 'Lucía Andrango',   'alcalde'), ('MCH', 'Mateo Quishpe',  'prefecto'),
  ('FIL', 'Daniel Guamán',    'alcalde'), ('FIL', 'Paula Simbaña',  'prefecto'),
  ('APA', 'Sofía Tipán',      'alcalde'), ('APA', 'Andrés Chicaiza','prefecto'),
  ('UAT', 'Gabriel Lema',     'alcalde'), ('UAT', 'Valeria Cando',  'prefecto'),
  ('RRU', 'Camila Pilataxi',  'alcalde'), ('RRU', 'Javier Tituaña', 'prefecto')
) as c(siglas, nombre, dignidad)
join organizaciones o on o.siglas = c.siglas;