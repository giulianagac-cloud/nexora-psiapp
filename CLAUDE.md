# PsiApp — Contexto del proyecto

Producto de **Nexora Intelligence**. PWA mobile-first para psicólogas y profesionales de salud mental independientes que gestionan pacientes, sesiones y cobros desde el celular.

---

## Stack

- Next.js 15 + TypeScript + Tailwind CSS 4
- Supabase (PostgreSQL + Auth)
- next-pwa (PWA instalable en celular)
- Deploy en Vercel

---

## Paleta de colores

Usar siempre estas variables CSS. No inventar colores fuera de esta paleta.

```css
--verde:          #4A8C72   /* acción principal, confirmado */
--verde-light:    #ECF5F0   /* fondo badge ok, fondo saldo ok */
--verde-mid:      #BDDDD1   /* bordes verdes, avatar */
--fondo:          #EFECE7   /* fondo general de la app */
--surface:        #FAFAF8   /* cards, turno cards */
--surface2:       #F4F1EC   /* headers de sección, chips */
--borde:          #DED9D0   /* bordes generales */
--texto:          #201E1A   /* texto principal */
--texto2:         #736B62   /* texto secundario */
--texto3:         #B0A89F   /* texto terciario, placeholders */
--naranja:        #C45A0A   /* alerta de deuda, debe */
--naranja-light:  #FEF0E6   /* fondo badge/caja de alerta */
--naranja-borde:  #F4B896   /* borde caja de alerta */
--rojo:           #B83232   /* falta, cancelación */
--rojo-light:     #FCEAEA   /* fondo badge falta */
--indigo:         #4845D2   /* cambio de horario */
--indigo-light:   #EEEEFF   /* fondo badge cambio */
--indigo-borde:   #C4C2F0   /* borde badge cambio */
```

---

## Tipografía

| Uso | Fuente |
|-----|--------|
| Fechas, títulos de pantalla | Source Serif 4 (Google Fonts) |
| UI, body, botones, labels | DM Sans (Google Fonts) |
| Montos, horarios, códigos | DM Mono (Google Fonts) |

---

## Modelo de datos

### profesionales
```sql
create table profesionales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique not null,
  whatsapp text,
  config_recordatorios jsonb default '{"frecuencia": "semanal", "hora": "09:00"}',
  created_at timestamptz default now()
);
```

### pacientes
```sql
create table pacientes (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid references profesionales(id) on delete cascade,
  nombre text not null,
  whatsapp text,
  fecha_inicio date,
  dias_horario jsonb,
  modalidad_pago text check (modalidad_pago in ('por_sesion', 'mensual')),
  politica_ausencia text check (politica_ausencia in ('cobra_siempre', 'no_cobra_si_avisa', 'por_caso')),
  observaciones text,
  activo boolean default true,
  created_at timestamptz default now()
);
```

### precios
Historial de aumentos. El precio vigente para una sesión es el registro con `vigente_desde` más reciente que sea <= a la fecha de esa sesión.
```sql
create table precios (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  monto decimal(10,2) not null,
  vigente_desde date not null,
  created_at timestamptz default now()
);
```

### sesiones
```sql
create table sesiones (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  fecha date not null,
  hora time not null,
  estado text check (estado in (
    'realizada',
    'falta_con_aviso',
    'falta_sin_aviso',
    'cancelada_profesional',
    'vacaciones'
  )),
  genera_cobro boolean default true,
  monto decimal(10,2),   -- precio aplicado al momento de la sesión
  nota text,
  created_at timestamptz default now()
);
```

### pagos
```sql
create table pagos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  sesion_id uuid references sesiones(id) on delete set null,
  fecha_pago date not null,
  monto decimal(10,2) not null,
  forma_pago text check (forma_pago in ('efectivo', 'transferencia')),
  created_at timestamptz default now()
);
```

---

## Estructura de carpetas

```
src/
  app/
    (auth)/
      login/page.tsx
    (app)/
      layout.tsx              ← bottom nav + auth guard
      agenda/page.tsx         ← HOME: calendario del día
      pacientes/
        page.tsx              ← lista de pacientes activos
        [id]/page.tsx         ← ficha del paciente (3 tabs)
        [id]/registrar/page.tsx ← flujo de registro de sesión
      resumen/page.tsx        ← reportes semanal y mensual
      ajustes/page.tsx
  components/
    agenda/
      TurnoCard.tsx
      MiniSemana.tsx
      CambioHorarioAlert.tsx
      StatChip.tsx
    paciente/
      FichaPagos.tsx
      FichaAgenda.tsx
      FichaInfo.tsx
      HistorialSesionRow.tsx
      SaldoHero.tsx
      PrecioVigente.tsx
    registro/
      PreguntaAsistio.tsx
      PreguntaAbono.tsx
      PreguntaCobraSesion.tsx
      CierreCircuito.tsx
    shared/
      BottomNav.tsx
      Badge.tsx
      Button.tsx
      Tabs.tsx
  lib/
    supabase.ts
    utils.ts
    precios.ts              ← lógica de precio vigente por fecha
  types/
    index.ts
```

---

## Reglas de diseño — respetar siempre

### Separación de responsabilidades
- **Agenda (home):** muestra SOLO horarios, asistencia y cambios de horario. NUNCA montos ni estado de pago.
- **Ficha del paciente → tab Pagos:** todo lo económico va acá. Saldo, historial, precios, aumentos.

### Mobile-first
- Ancho máximo útil: 390px
- Bottom nav fija con 4 tabs: Agenda / Pacientes / Resumen / Ajustes
- Todos los toques tienen área mínima de 44px

### Badges de estado
| Estado | Color |
|--------|-------|
| Asistió / al día | `--verde` sobre `--verde-light` |
| Debe / alerta de pago | `--naranja` sobre `--naranja-light` |
| Sin registrar | `--texto3` sobre `--surface2` |
| Faltó | `--rojo` sobre `--rojo-light` |
| Cambio de horario | `--indigo` sobre `--indigo-light` |

### Tipografía aplicada
- Fecha en el header de agenda → Source Serif 4, 18-20px, bold
- Nombre de paciente en turno card → DM Sans, 13-14px, semibold
- Horario del turno → DM Mono, 10-11px
- Montos → DM Mono, bold, color según estado
- Botones → DM Sans, bold

---

## Flujo de registro de sesión

Al tocar un turno en la agenda se abre el flujo de registro. Es un árbol de decisión:

```
¿Asistió?
├── SÍ
│   └── ¿Abonó?
│       ├── SÍ → seleccionar efectivo/transferencia → circuito cerrado ✓
│       └── NO → registrar sesión adeudada con fecha y monto → circuito cerrado ⏳
└── NO
    ├── ¿Avisó con anticipación? (SÍ / NO — queda en historial)
    └── ¿Cobrás la sesión?
        ├── SÍ → registrar deuda con fecha y monto → circuito cerrado ⚠
        └── NO → circuito cerrado sin cargo ✓
```

Cada rama termina siempre en un estado cerrado. Al terminar vuelve a la agenda.

---

## Lógica de precio vigente

Para calcular el monto de una sesión:

```typescript
// Obtener el precio vigente para un paciente en una fecha dada
async function getPrecioVigente(pacienteId: string, fecha: Date): Promise<number> {
  const { data } = await supabase
    .from('precios')
    .select('monto')
    .eq('paciente_id', pacienteId)
    .lte('vigente_desde', fecha.toISOString().split('T')[0])
    .order('vigente_desde', { ascending: false })
    .limit(1)
    .single();
  return data?.monto ?? 0;
}
```

Al registrar un aumento de precio, las sesiones anteriores a `vigente_desde` mantienen su precio original (ya almacenado en `sesiones.monto`).

---

## Lógica de saldo pendiente

```typescript
// Saldo pendiente de un paciente
// = suma de sesiones que generan cobro y no tienen pago asociado
async function getSaldoPendiente(pacienteId: string): Promise<number> {
  const { data: sesiones } = await supabase
    .from('sesiones')
    .select('id, monto')
    .eq('paciente_id', pacienteId)
    .eq('genera_cobro', true);

  const { data: pagos } = await supabase
    .from('pagos')
    .select('sesion_id, monto')
    .eq('paciente_id', pacienteId);

  const pagadoPorSesion = new Map(pagos?.map(p => [p.sesion_id, p.monto]) ?? []);
  
  return sesiones?.reduce((acc, s) => {
    const pagado = pagadoPorSesion.get(s.id) ?? 0;
    return acc + (s.monto - pagado);
  }, 0) ?? 0;
}
```

---

## Cancelaciones por período (vacaciones)

Al registrar un período de ausencia de la profesional:
- Se crean registros de sesión con `estado = 'vacaciones'` y `genera_cobro = false` para todos los pacientes activos en ese rango de fechas.
- En el historial se muestran diferenciados con ícono 🏖️.

---

## Cambios de horario

Al registrar un cambio de horario en el calendario:
- La app pregunta: ¿Es solo para hoy o cambia el horario fijo?
- **Temporal:** se guarda una nota en la sesión del día. El campo `dias_horario` del paciente no cambia.
- **Permanente:** se actualiza `dias_horario` en la tabla `pacientes`.

---

## Reportes

### Semanal
- Sesiones realizadas / ausencias / cancelaciones propias
- Monto facturado vs. cobrado en la semana
- Nuevas deudas generadas

### Mensual
- Total facturado / cobrado / pendiente
- Detalle por paciente
- Desglose efectivo vs. transferencia
- Botón "Compartir" → genera texto plano formateado para WhatsApp

---

## Variables de entorno necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Convenciones de código

- Componentes en PascalCase
- Funciones utilitarias en camelCase
- Tipos e interfaces en `src/types/index.ts`
- Queries a Supabase siempre en server components o route handlers, nunca directo en client components
- Usar `@/` como alias de `src/`
- Sin `any` — tipar todo con los tipos generados de Supabase

---

## Contexto de producto

Desarrollado por Nexora Intelligence (nexoraintelligence.co).
Usuarias beta iniciales: 2 psicólogas independientes (acceso gratuito).
Objetivo post-validación: SaaS mensual para profesionales de salud.
Repo: github.com/giulianagac-cloud/nexora-psiapp
