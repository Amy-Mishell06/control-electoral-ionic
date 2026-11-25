# Yupana · Control Electoral

> *Yupana* (kichwa): ábaco andino para contar. **Cada voto, bien contado.**

Aplicación móvil para el **control electoral de actas** en Quito (Pichincha). Los veedores registran el acta de cada junta receptora del voto (JRV) con sus votos, una foto verificada y la ubicación GPS. El coordinador de recinto supervisa y corrige sus mesas, y el coordinador provincial ve los resultados consolidados en tiempo real.

- **Autora:** Amy Mishell Díaz Rosero · Grupo 4 · ESFOT – Escuela Politécnica Nacional
- **Asignatura:** Desarrollo de Aplicaciones Móviles · Examen "Control Electoral"
- **APK:** [Descargar Yupana v1.0](https://github.com/Amy-Mishell06/control-electoral-ionic/releases/tag/v1.0)
- **Decisiones de arquitectura:** [`docs/adr/`](docs/adr/) · [Video de la reunión de ADR](https://drive.google.com/file/d/1ESBqAzXWtMMwGvHHc2mBKXlyWA7PVQjI/view)
- **Uso de IA:** [`docs/ia/registro-ia.md`](docs/ia/registro-ia.md) · **Identidad visual:** [`docs/design/identidad.md`](docs/design/identidad.md)

---

## 1. Funcionalidades por rol

| Rol | Qué puede hacer |
|---|---|
| **Coordinador provincial** | Crear recintos (se generan sus JRV automáticamente), crear el coordinador de cada recinto, ver el **dashboard**: resultados consolidados por dignidad con porcentajes, avance de actas por recinto y ubicación GPS de cada acta, con alerta si se tomó a más de 300 m del recinto. |
| **Coordinador de recinto** | Crear veedores, asignar o reasignar veedores a mesas, ver el estado de cada acta y **corregir actas**, incluido el cambio de foto. |
| **Veedor** | Ver sus mesas y registrar el acta en 4 pasos (votos → foto → ubicación → resumen). Corregir los votos de sus actas. |
| **Todos** | Inicio de sesión con **cédula**, activación de cuenta en el primer acceso con código por correo, y recuperación de contraseña. |

### Reglas que valida la app (y otra vez la base de datos)
- Cédula ecuatoriana válida (algoritmo módulo 10).
- Votos enteros y no negativos, y suma de votos + nulos + blancos = total de sufragantes.
- La foto del acta debe ser **nítida** (varianza del Laplaciano ≥ 800).
- Solo la cámara: no se permite subir fotos de la galería.
- Un acta por mesa y dignidad. Los reintentos no duplican (`uuid_cliente`).
- Las correcciones guardan historial y usan **control de versión**: si dos personas corrigen a la vez, la segunda recibe un aviso.
- Bloqueo de 15 minutos tras 5 intentos fallidos de inicio de sesión.

---

## 2. Tecnologías

| Capa | Tecnología | Versión |
|---|---|---|
| App | Angular (componentes standalone, Signals, Reactive Forms) | 22.2 |
| UI | Ionic | 9 |
| Nativo | Capacitor + `@capacitor/camera` + `@capacitor/geolocation` + Android | 8 |
| Backend | Supabase (PostgreSQL con RLS, Auth, Storage, Edge Functions en Deno) · `@supabase/supabase-js` | 2.119 |
| Correo | Brevo (SMTP para Supabase Auth + API para el correo de bienvenida) | — |
| Pruebas | Vitest (`ng test`) | 5.1 |

---

## 3. Arquitectura

Clean Architecture ligera (ADR-004). La regla es que **el dominio no conoce a Supabase ni a Capacitor**: solo define puertos (clases abstractas) que la infraestructura implementa, y la conexión entre ambos se hace en `main.ts`.

```
src/app/
├── core/
│   ├── domain/            # Reglas puras y contratos
│   │   ├── models/        # Rol, Acta, Recinto, Junta, Resultados…
│   │   ├── rules/         # cédula, totales del acta, clave, nitidez, resultados (+ tests)
│   │   └── ports/         # AuthPort, ActasPort, CamaraPort, GpsPort, DashboardPort…
│   ├── application/       # Servicios con Signals y casos de uso (+ tests)
│   └── infrastructure/
│       ├── supabase/      # Repositorios (SDK supabase-js, RPC, Storage, Edge Functions)
│       ├── capacitor/     # Cámara y GPS
│       └── canvas/        # Cálculo de nitidez (Laplaciano)
└── presentation/          # Páginas por rol + shared (guards, validadores, avisos, mascota)
    ├── auth/  provincial/  recinto/  veedor/  shared/
supabase/
├── migrations/            # Tablas, RLS, funciones/triggers, bucket de fotos
├── functions/             # login-cedula, crear-usuario
├── seed.sql               # Recintos reales del CNE en Quito y organizaciones ficticias
└── usuario-inicial.example.sql
docs/
├── adr/                   # 14 decisiones de arquitectura
├── ia/registro-ia.md      # Registro de uso de IA
└── design/identidad.md    # Identidad visual Yupana
```

### Decisiones de arquitectura (ADR)

| ADR | Decisión |
|---|---|
| 001 | Ionic + Angular + Capacitor |
| 002 | Supabase como backend (PostgreSQL + RLS) |
| 003 | Cámara y GPS con plugins de Capacitor |
| 004 | Clean Architecture ligera |
| 005 | Estado con Signals |
| 006 | Reactive Forms con validadores de dominio |
| 007 | Guards funcionales por sesión y rol |
| 008 | Mensajes con componentes de Ionic |
| 009 | SDK supabase-js + Edge Functions |
| 010 | Estrategia de pruebas |
| 011 | Correos con Brevo |
| 012 | Nitidez con varianza del Laplaciano |
| 013 | Animaciones e identidad visual |
| 014 | Persistencia local y reintentos sin duplicados |

---

## 4. Modelo de datos

| Tabla | Para qué sirve |
|---|---|
| `recintos` | Recintos electorales (provincia, cantón, parroquia, nombre, número de JRV, coordenadas) |
| `perfiles` | Usuario de la app: cédula, nombres, rol, recinto, correo, si debe cambiar la clave |
| `juntas` | JRV de cada recinto (se crean con un trigger al crear el recinto) |
| `asignaciones` | Qué veedor tiene cada junta |
| `organizaciones` / `candidatos` | Organizaciones políticas (ficticias) y su candidato por dignidad |
| `actas` | Acta por junta y dignidad: totales, foto, nitidez, GPS, estado, versión, `uuid_cliente` |
| `votos_acta` | Votos de cada organización en un acta |
| `actas_historial` | Versión anterior de cada acta corregida (trigger) |
| `intentos_login` | Control de intentos fallidos para el bloqueo |

**Vistas:** `v_estado_juntas`, `v_resultados_recinto`, `v_resultados_consolidados`, `v_avance_recintos` (todas con `security_invoker`, así respetan la RLS).
**Funciones:** `registrar_acta`, `corregir_acta`, `asignar_veedor`, `activar_cuenta`, `validar_votos`.

### Seguridad
- **RLS en todas las tablas:** cada rol solo ve lo suyo. Por ejemplo, el veedor solo ve sus mesas asignadas.
- Las escrituras sensibles pasan por funciones `security definer`, que vuelven a validar permisos, totales y versión.
- El bucket `actas` es **privado**: las fotos se ven con enlaces firmados de 5 minutos.
- La `service_role` key solo existe en las Edge Functions. **Nunca está en la app.**
- Los mensajes de inicio de sesión son genéricos, para no revelar si una cédula existe.

---

## 5. Instalación y configuración

### Requisitos
Node.js 20+, npm, Ionic CLI (opcional), una cuenta de Supabase y, para la APK, Android Studio.

### 5.1 App
```bash
git clone https://github.com/Amy-Mishell06/control-electoral-ionic.git
cd control-electoral-ionic
npm install
```
Copia los archivos de ejemplo de entorno y pon los datos de **tu** proyecto Supabase:
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```
```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseKey: 'TU_PUBLISHABLE_KEY', // clave pública, nunca la service_role
};
```
> `environment.ts` y `environment.prod.ts` están en `.gitignore`.

### 5.2 Base de datos (Supabase → SQL Editor, en este orden)
1. `supabase/migrations/20261124120000_tablas.sql`
2. `supabase/migrations/20261124130000_rls.sql`
3. `supabase/migrations/20261124140000_funciones_actas.sql`
4. `supabase/migrations/20261124150000_fotos.sql`
5. `supabase/seed.sql`: 5 recintos reales del CNE en Quito (75 JRV) y 5 organizaciones ficticias.
6. Crea en **Authentication → Users** el usuario provincial y ejecuta `supabase/usuario-inicial.example.sql` con su UID.

> Desactiva la traducción automática del navegador en el panel de Supabase, porque puede alterar el SQL.

### 5.3 Edge Functions
```bash
supabase functions deploy login-cedula --no-verify-jwt
supabase functions deploy crear-usuario --no-verify-jwt
supabase secrets set BREVO_API_KEY=xxxx BREVO_REMITENTE=correo@verificado.com
```
`--no-verify-jwt` se usa porque el proyecto firma las sesiones con las claves nuevas (ES256). `crear-usuario` valida el token y el rol por su cuenta.

### 5.4 Correo (Brevo)
- **Authentication → SMTP:** `smtp-relay.brevo.com`, puerto 587, con la clave SMTP de Brevo.
- **Plantillas "Magic Link" y "Reset Password":** deben mostrar `{{ .Token }}` (código de 6 dígitos).

### 5.5 Ejecutar
```bash
npx ionic serve          # o: npx ng serve
```

---

## 6. Generar la APK
```bash
npx ng build
npx cap sync android
npx cap open android      # Build > Build App Bundle(s) / APK(s) > Build APK(s)
```
La APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Permisos declarados: cámara y ubicación (fina y aproximada).

---

## 7. Pruebas

### Automáticas
```bash
npx ng test --no-watch
```
| Archivo | Qué prueba |
|---|---|
| `cedula.rule.spec.ts` | Cédulas válidas, inválidas, provincia y longitud |
| `acta.rule.spec.ts` | Suma de votos, diferencia y negativos |
| `clave.rule.spec.ts` | Reglas de la contraseña nueva |
| `nitidez.rule.spec.ts` | Umbral de nitidez |
| `resultados.rule.spec.ts` | Porcentajes, totales por dignidad, avance y distancia GPS |
| `crear-usuario.use-case.spec.ts` | Validación antes de crear un usuario |
| `registrar-acta.use-case.spec.ts` | Registro del acta y borrado de la foto si falla |
| `corregir-acta.use-case.spec.ts` | Versión esperada, totales y borrado de la foto nueva si falla |
| `recuperar-clave.use-case.spec.ts` | Correo, código de 6 dígitos y confirmación de la clave |
| `app.component.spec.ts` | Arranque de la app |

**Resultado:** 10 archivos de prueba, **27 pruebas aprobadas**.

### Manuales
| Prueba | Resultado esperado | Estado |
|---|---|---|
| Iniciar sesión con cédula inválida | Mensaje de cédula no válida | ✔ |
| 5 intentos fallidos | Bloqueo de 15 minutos | ✔ |
| Primer acceso | Pide código por correo y una clave nueva | ✔ |
| Recuperar contraseña | Llega el código y se cambia la clave | ✔ |
| Registrar acta con suma incorrecta | No deja continuar y muestra la diferencia | ✔ |
| Escribir un número negativo | No se puede escribir | ✔ |
| Tomar foto | Abre solo la cámara (sin galería) | ✔ |
| Foto movida | "La foto está borrosa" | ✔ |
| Obtener ubicación | Coordenadas con su precisión | ✔ |
| Corregir un acta | Estado "Corregida", nueva versión e historial | ✔ |
| Dashboard provincial | Resultados, avance y ubicaciones | ✔ |

### Calibración de nitidez (ADR-012)
| Foto | Varianza del Laplaciano |
|---|---|
| Acta nítida | 3524 |
| Acta parcialmente borrosa | 460 |
| **Umbral elegido** | **800** |

---

## 8. Credenciales de demostración (no sensibles)

Cédulas **ficticias** válidas solo para pruebas.

| Rol | Cédula | Contraseña |
|---|---|---|
| Coordinador provincial | `1700000019` | `Elecciones2026` |
| Coordinadora de recinto (Carla) | `1700000027` | `Integrante2026` |
| Veedor (Luis Eduardo) | `1700000043` | `Veedor2026` |

Los usuarios nuevos reciben la contraseña inicial `Ecuador2026` y deben cambiarla en su primer acceso.

---

## 9. Uso de inteligencia artificial

Usé un asistente de IA (Claude) como apoyo para explicar conceptos, revisar errores y proponer código, que revisé, probé y adapté. Las ilustraciones de la mascota las generé con Gemini; la IA ayudó a quitarles el fondo y a separarlas en capas para animarlas. El detalle de cada tarea está en [`docs/ia/registro-ia.md`](docs/ia/registro-ia.md).

---

## 10. Limitaciones conocidas
- **R10 (extra) implementado en parte:** el ADR-014 del grupo plantea una cola sin conexión. En esta app se implementó la parte del servidor (el `uuid_cliente` evita actas duplicadas al reintentar, y la columna `version` detecta conflictos en las correcciones), pero no la cola local con sincronización automática.
- Los correos de Brevo pueden llegar a **spam**, porque el remitente es una cuenta de Gmail sin dominio propio (avisos de DKIM y DMARC).
- Solo cubre la provincia de Pichincha (Quito) con 5 recintos de ejemplo.
- El GPS en computadora es poco preciso; las pruebas reales se hicieron en el celular.
- Las organizaciones políticas y los candidatos son **ficticios**.