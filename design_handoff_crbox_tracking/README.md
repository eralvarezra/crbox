# Handoff: CRBox — Tracking público

## Overview

Experiencia de **rastreo público** para CRBox, una app web que permite a clientes en Costa Rica seguir paquetes enviados desde la bodega de la empresa en Estados Unidos. El flujo es deliberadamente simple: el cliente ingresa un número de tracking en la landing → la app le muestra el estado actual del paquete en un timeline progresivo. Si el tracking no existe, puede registrarlo y queda en una pantalla intermedia de revisión hasta que un agente lo aprueba.

Cubre **4 pantallas**:
1. Landing / búsqueda
2. Resultado — paquete encontrado (timeline de 5 estados)
3. Resultado — paquete no encontrado (empty state con CTA a registrar)
4. Solicitud en revisión (pantalla intermedia post-registro)

---

## About the Design Files

Los archivos en este bundle son **referencias de diseño creadas en HTML/JSX** — prototipos que muestran la apariencia y el comportamiento deseado, **no código de producción para copiar directamente**.

La tarea es **recrear estos diseños en el entorno del codebase existente** (React + tu sistema de componentes, Vue, Svelte, lo que sea) siguiendo los patrones y librerías ya establecidos. Si no hay codebase aún, elegir el framework más apropiado para el proyecto (recomendado: **Next.js + Tailwind CSS** por encajar con el estilo Vercel/Linear del diseño).

El JSX usa estilos inline para facilitar la lectura del diseño, no como recomendación arquitectónica. En el codebase real, conviene migrarlo a **Tailwind**, **CSS Modules**, **vanilla-extract**, o el método del proyecto.

---

## Fidelity

**High-fidelity (hifi).** Los mockups tienen colores, tipografías, espaciados y estados finales. El developer debe recrearlos pixel-perfect usando las librerías del codebase. Las micro-interacciones (animaciones de pulso, transiciones) están documentadas más abajo.

---

## Screens / Views

### 1. Búsqueda (`/track` o `/`)

**Purpose**: punto de entrada público. El cliente pega su número de tracking y presiona Enter o el botón "Rastrear".

**Layout**:
- TopBar fija arriba (64px alto, borde inferior `1px #EDEDED`)
- Contenido centrado vertical y horizontalmente en el resto del viewport
- Ancho máximo de la columna de contenido: **560px**
- Fondo blanco con un grid pattern sutil + radial glow indigo desde arriba

**Componentes**:

- **TopBar** (común a todas las pantallas):
  - Logo a la izquierda + nav a la derecha: `Ayuda` · `Cómo funciona` · botón `Ingresar`
  - Logo: cuadrado 26×26px, radio 7px, fondo `#0A0A0A`, con un borde interno indigo (`1.5px #4F46E5`) y una línea vertical indigo central — representa una caja vista de frente. Texto "CRBox" 16px, weight 600, letter-spacing -0.02em.
  - Backdrop blur 8px, fondo `rgba(255,255,255,.85)`

- **Eyebrow badge**:
  - Pill 5px·12px padding, border `1px #E5E5E5`, fondo blanco, shadow `0 1px 2px rgba(0,0,0,.04)`
  - Texto: pill verde con dot pulsante "EN VIVO" + "Rastreo público · USA → Costa Rica"
  - Pill interno: fondo `rgba(16,185,129,.1)`, color `#047857`, fuente 11px / 600

- **Headline** (h1):
  - "Rastrea tu paquete<br>desde USA."
  - Font: Geist 600, size **48px**, line-height 1.05, letter-spacing -0.035em, color `#0A0A0A`
  - Margin top: 28px

- **Subhead**:
  - "Ingresá tu número de tracking para ver el estado de tu paquete en tiempo real."
  - 16px / 400, color `#737373`, max-width 420px, line-height 1.55

- **Search input + button** (row con gap 10px, margin-top 40px):
  - Input wrapper: alto **52px**, padding horizontal 16px, fondo blanco, border `1px #E5E5E5`, radio **12px**, shadow `0 1px 2px rgba(0,0,0,.04), 0 4px 12px -8px rgba(0,0,0,.08)`
  - Dentro: icono lupa (Lucide `search`, 18px, color `#A3A3A3`), luego `<input>` con `font-family: 'JetBrains Mono', monospace`, size 14.5px, weight 500, color `#0A0A0A`. Placeholder: `Ej: 1Z999AA10123456784`
  - Cuando hay texto, mostrar botón ✕ que limpia el input
  - Botón "Rastrear": alto 52px, padding horizontal 24px, radio 12px, fondo `#4F46E5`, texto blanco 14.5px / 600, icono flecha `arrow-right` a la derecha, shadow `0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.55)`

- **Hint** (margin-top 18px):
  - Tecla `↵` en kbd: fondo `#F5F5F5`, border `1px #E5E5E5`, radio 5px, fuente mono 11px
  - Texto "Presioná Enter o usá tu código CRB-XXXXX" (12.5px `#737373`)

- **Trust strip** (margin-top 56px, padding-top 24px, border-top `1px #EDEDED`):
  - 3 stats centradas, gap 32px:
    - `28,400+` → "paquetes entregados"
    - `3–5 días` → "Miami → SJO"
    - `98.7%` → "puntualidad"
  - Número: 18px / 600 / -0.02em / `#0A0A0A`. Label: 12px / `#737373`

**Estados**:
- Input vacío + click en Rastrear → focus al input + shake horizontal (4 keyframes, 280ms)
- Input con valor → POST a `/api/track?code=...` → si encuentra navegar a Pantalla 2; si no, navegar a Pantalla 3

---

### 2. Paquete encontrado (`/track/:code`)

**Purpose**: protagonista del producto. El **timeline vertical** es el elemento dominante. El resto del UI lo apoya.

**Layout**:
- TopBar (la derecha cambia: muestra "Rastreo público" en texto gris + botón "Ingresar")
- Contenedor max-width **880px**, centrado, padding 32px arriba / 56px abajo
- Stack vertical: link "Nueva búsqueda" → Summary card → Timeline card → Acciones secundarias

**Componentes**:

- **Link "Nueva búsqueda"**:
  - Icono `arrow-left` 14px + texto 13px `#525252`, margin-bottom 24px

- **Summary card** (radio 16px, border `1px #EDEDED`, padding 24px·28px, fondo blanco):
  - Layout: flex row, gap 24px, wrap, space-between
  - **Izquierda**:
    - Label uppercase 11.5px / 600 / letter-spacing 0.12em / `#737373`: "Tracking"
    - Código en mono 20px / 600 (`1Z 999 AA1 0123 4567 84`)
    - Meta row (13px / `#525252`): nombre del cliente en bold negro · descripción del paquete · peso. Separadores `·` color `#D4D4D4`
  - **Derecha** (column align-end gap 10px):
    - Status badge: fondo `rgba(79,70,229,.08)`, color `#4F46E5`, 12px / 600, con dot `#4F46E5` 6px + halo ping animado. Texto: "EN TRÁNSITO"
    - Carrier chip: pill mono "UPS" sobre `#F5F5F5` / border `1px #E5E5E5` + texto "In Transit · 1Z999AA…84"
    - ETA: "Llega **Mar, 28 May**"

- **Timeline card** (radio 16px, border `1px #EDEDED`, padding 40px·44px, fondo blanco, margin-top 28px):

  - **Header** (flex row space-between, margin-bottom 36px):
    - Izquierda: label "Progreso" + h2 "Paso 2 de 5 · En tránsito a Costa Rica" (24px / 600 / -0.02em)
    - Derecha: ETA chip mono "ETA · 7 días" sobre `#F5F5F5`, padding 6·10px, radio 7px

  - **Progress bar** (alto 4px, fondo `#F0F0F0`, radio 999, margin-bottom 40px):
    - Width al 32% (2/5 completados + transición a activo)
    - Background: `linear-gradient(90deg, #10B981 0%, #10B981 70%, #4F46E5 100%)`

  - **Timeline list** (`<ol>` con 5 items):
    - Cada item: `grid-template-columns: 44px 1fr auto`, gap 20px, padding-bottom 28px
    - **Línea vertical** (entre nodos): posición absoluta, left 21px, top 36px → bottom 0, width 2px, radio 999
      - Si completado: `#10B981`
      - Si activo: `linear-gradient(180deg, #4F46E5, #E5E5E5)` (se desvanece hacia abajo)
      - Si pendiente: `#E5E5E5`
    - **Nodo** (círculo 44×44):
      - Completado: fondo `#10B981`, ícono check blanco (Lucide `check`, 18px, stroke 3)
      - Activo: fondo `#4F46E5`, círculo blanco interno de 10px, shadow `0 0 0 6px rgba(79,70,229,.12), 0 4px 12px -4px rgba(79,70,229,.4)`
      - Pendiente: fondo blanco, border `1.5px #E5E5E5`, número (1, 2, 3…) en mono 13px / 600 / `#A3A3A3`
    - **Contenido** (columna del medio):
      - Título: 16px / 600 / -0.01em. Color `#0A0A0A` si done/active, `#A3A3A3` si pendiente.
      - Si activo: pill "EN CURSO" al lado del título (10.5px / 600 / `#4F46E5`, fondo `rgba(79,70,229,.1)`, padding 2·7px, radio 5)
      - Subtítulo: 13px, color `#525252` (o `#A3A3A3` si pending), margin-top 3px
      - Detalle (solo done/active): 13px / `#737373` / line-height 1.5 / max-width 480px / margin-top 8px
    - **Fecha** (columna derecha): mono 12px, `#737373` (o `#D4D4D4` si pending), padding-top 14px, white-space nowrap

  - **5 pasos** (estado actual = índice 1):
    | # | Título | Subtítulo | Detalle | Fecha |
    |---|---|---|---|---|
    | 1 ✓ | Recibido en bodega USA | Miami, FL · 8421 NW 56th St | Paquete escaneado al ingreso. Foto tomada y peso verificado en 4.2 lb. | Lun, 19 May · 14:32 |
    | 2 ● | En tránsito | Vuelo CRB-0228 · Miami → SJO | Tu paquete está volando con destino al Aeropuerto Internacional Juan Santamaría. | Mié, 21 May · 22:10 |
    | 3 | En aduana CR | Aduana Santamaría | Trámite aduanal. Te notificaremos el monto de impuestos cuando esté liquidado. | — |
    | 4 | Listo para retirar | Sucursal a confirmar | Disponible para retiro en sucursal o entrega a domicilio según tu preferencia. | — |
    | 5 | Entregado | (vacío) | Confirmación con firma o foto al recibir. | — |

- **Acciones secundarias** (row gap 10px, margin-top 20px):
  - "Avisarme por WhatsApp" — botón ghost (border `1px #E5E5E5`, fondo blanco, 13.5px / 500, icono message-circle 14px)
  - "Compartir" — botón ghost (icono share)
  - "¿Algo está mal?" — botón ghost alineado a la derecha (margin-left auto), texto `#525252`

**Animaciones**:
- Dot del badge "EN TRÁNSITO": halo expandiéndose (`@keyframes ping`: scale .7→2.2, opacity .9→0, duración 2s, loop)

---

### 3. No encontrado (`/track/:code` con 404)

**Purpose**: empty state honesto. Le dice al usuario qué pasó y le ofrece la salida natural: **registrar** el paquete.

**Layout**:
- TopBar
- Contenido centrado vertical, ancho columna **520px**
- Fondo con el mismo grid pattern de la pantalla 1

**Componentes**:

- **Ilustración SVG** (160×140px, margin-bottom 24px):
  - Caja isométrica 3D (3 caras) en grises (`#F5F5F5`, `#EDEDED`, `#FAFAFA`) con stroke `1.5px #D4D4D4`
  - Sobre la caja, círculo blanco 28px con borde `1.5px #4F46E5` y un `?` indigo dentro (Geist 16px / 700)
  - Pequeñas líneas de "búsqueda" dispersas (`#D4D4D4` dashed)
  - **Si el codebase tiene una librería de ilustraciones**, sustituir por una equivalente

- **Heading**: "No encontramos ese paquete" — 32px / 600 / -0.03em

- **Body**: "El tracking `1Z999AA10123456784` aún no está en nuestro sistema. Puede que el vendedor todavía no lo haya despachado, o que debas registrarlo." — 15px / `#737373` / max-width 400px
  - El código va dentro de `<code>` con fondo `#F5F5F5`, padding 2·7px, radio 5, mono 13px

- **Actions** (margin-top 32px, gap 10px):
  - **Primario**: "Registrar mi paquete" — alto 44px, padding 0·20px, radio 10px, fondo `#4F46E5`, texto blanco 14px / 600, icono `+` a la izquierda, shadow indigo. Va a `/register-package`.
  - **Secundario**: "Intentar de nuevo" — alto 44px, fondo blanco, border `1px #E5E5E5`, texto `#0A0A0A` 14px / 500. Vuelve a la búsqueda con el código pre-llenado.

- **Helper card** (margin-top 40px, full width, padding 16·20, fondo `#FAFAFA`, border `1px #EDEDED`, radio 12):
  - Icono info en cuadrado verde claro 28×28 (fondo `rgba(16,185,129,.12)`, color `#047857`)
  - Texto: **"¿Es la primera vez que enviás con CRBox?"** + descripción "Cuando registrás tu paquete, un agente lo verifica y queda disponible para rastreo en menos de 24h."

---

### 4. Solicitud en revisión (`/request/:id`)

**Purpose**: pantalla que ve el usuario después de registrar un paquete y mientras un agente lo aprueba. Comunica que **algo está pasando** y que ellos no deben hacer nada más.

**Layout**:
- TopBar
- Contenido centrado vertical, columna **540px**

**Componentes**:

- **Reloj animado** (88×88px, margin-bottom 24px):
  - 3 capas concéntricas:
    - Capa exterior: círculo 88px, fondo `rgba(79,70,229,.1)`, animación `pulseBg` (scale 1→1.1, opacity .6→.3) 2.4s loop
    - Capa media: círculo 68px, fondo `rgba(79,70,229,.18)`, misma animación con delay 0.3s
    - Capa central: círculo 48px, fondo `#4F46E5`, ícono `clock` Lucide blanco 24px, shadow `0 8px 20px -6px rgba(79,70,229,.5)`

- **Status pill**: "EN REVISIÓN" (margin-bottom 18px) — fondo `rgba(79,70,229,.08)`, color `#4F46E5`, dot `#4F46E5` 6px, 11.5px / 600 / letter-spacing 0.04em

- **Heading**: "Tu solicitud está en revisión" — 30px / 600 / -0.025em / line-height 1.15

- **Body**: "Un agente está verificando tu paquete en bodega. Cuando esté aprobado, podrás rastrearlo desde acá." — 15px / `#737373` / max-width 420px

- **Reference card** (margin-top 28px, full width, padding 16·20, radio 12, border `1px #EDEDED`, fondo blanco):
  - Flex row space-between, text-align left
  - Izquierda: label "Solicitud" + folio mono `CRB-REQ-29481` (14px / 600)
  - Derecha (align-end): label "Respuesta en" + valor "~ 24–48 h"

- **Mini timeline card** (margin-top 16px, padding 20·22, radio 12, border `1px #EDEDED`, fondo `#FAFAFA`):
  - Label "Próximos pasos" (uppercase 11.5px / 600 / `#737373`, margin-bottom 14px)
  - 3 items, mismo patrón de timeline que la pantalla 2 pero más compacto:
    - Nodo 24×24px, ícono check 12px stroke 3.5 si done, dot blanco 7px si active
    - Línea vertical 2px entre nodos
  - Items:
    1. ✓ "Solicitud recibida" — "Hoy · 09:14"
    2. ● "Verificación en bodega Miami" — "En curso" + chip "AHORA" a la derecha (11px / 600 / `#4F46E5` sobre `rgba(79,70,229,.1)`)
    3. ○ "Tracking activado" — "Te avisamos por correo y WhatsApp"

- **Footer actions** (margin-top 24px, gap 10px):
  - "Volver al inicio" — ghost (fondo blanco, border `1px #E5E5E5`, 13.5px / 500, alto 42px)
  - "Avisarme por WhatsApp" — botón dark (fondo `#0A0A0A`, texto blanco, icono message-circle 14px)

---

## Interactions & Behavior

### Flujo principal

```
[Búsqueda]
   │  user pega tracking + Enter
   ▼
  fetch /api/track/:code
   ├─ 200 OK + estado real    → [Paquete encontrado]
   ├─ 200 OK + estado pending → [Solicitud en revisión]
   └─ 404                     → [No encontrado]
                                   │
                                   │  click "Registrar mi paquete"
                                   ▼
                              [Form de registro]
                                   │  submit
                                   ▼
                              [Solicitud en revisión]
```

### Validación del input

- Aceptar trackings UPS (`1Z` + 16 chars alfanuméricos), USPS, DHL, FedEx y el formato interno `CRB-XXXXX`
- Normalizar: trim, uppercase, remover espacios
- Si formato inválido: shake del input (`translateX -6px → 6px → 0`, 280ms)

### Animaciones

| Elemento | Animación | Detalles |
|---|---|---|
| Dot "EN TRÁNSITO" | Ping halo | `@keyframes ping { 0% { transform: scale(.7); opacity: .9 } 80%,100% { transform: scale(2.2); opacity: 0 } }` · 2s linear infinite |
| Reloj pantalla 4 | Pulse de las capas | `@keyframes pulseBg { 0%,100% { transform: scale(1); opacity: .6 } 50% { transform: scale(1.1); opacity: .3 } }` · 2.4s ease-in-out infinite, capa media con delay 0.3s |
| Input + click sin valor | Shake | 4 keyframes horizontal, 280ms |
| Hover en botones primarios | Ninguno explícito | Usar el pattern del codebase (`hover:bg-indigo-600` con Tailwind) |

### Responsividad

El diseño está optimizado para desktop pero pensado mobile-first:

- **Mobile (< 640px)**:
  - TopBar: ocultar nav central, dejar solo logo y CTA "Ingresar"
  - Search row: stack vertical (input arriba, botón full-width abajo)
  - Summary card: stack vertical (info arriba, status pill abajo) — quitar el space-between
  - Timeline: mantener el layout vertical (es naturalmente responsive); achicar fechas a la línea siguiente debajo del subtítulo
  - Cards: padding 20·24 en vez de 40·44

---

## State Management

Estado necesario:

```ts
// /track/:code
type TrackResult =
  | { status: 'loading' }
  | { status: 'not-found'; code: string }
  | { status: 'pending'; requestId: string; submittedAt: Date }
  | { status: 'found';
      code: string;
      carrier: 'UPS' | 'USPS' | 'FEDEX' | 'DHL' | 'INTERNAL';
      carrierStatus: string;        // ej. "In Transit"
      customer: { name: string };
      description: string;
      weightLb: number;
      currentStepIndex: 0 | 1 | 2 | 3 | 4;
      eta?: Date;
      steps: Array<{
        key: 'received' | 'transit' | 'customs' | 'ready' | 'delivered';
        completedAt?: Date;
        location?: string;
        detail?: string;
      }>;
    };
```

### Data fetching

- `GET /api/track/:code` → `TrackResult`
- `POST /api/packages/register` → crea solicitud y retorna `requestId`
- `GET /api/packages/request/:id` → estado de la solicitud (polling cada 30s en la pantalla 4)

---

## Design Tokens

### Colors

```css
/* Neutrals */
--bg-base:        #FFFFFF;
--bg-muted:       #FAFAFA;
--bg-sunken:      #F5F5F5;
--border-subtle:  #EDEDED;
--border-default: #E5E5E5;
--border-strong:  #D4D4D4;

--text-default:   #0A0A0A;
--text-muted:     #525252;
--text-subtle:    #737373;
--text-disabled:  #A3A3A3;

/* Primary (indigo) — usar con moderación */
--indigo-600:     #4F46E5;   /* CTAs, activo en timeline, links destacados */
--indigo-50:      rgba(79, 70, 229, 0.08);  /* badge bg "EN TRÁNSITO" */
--indigo-100:     rgba(79, 70, 229, 0.10);  /* hover/active soft */
--indigo-shadow:  0 4px 14px -4px rgba(79, 70, 229, 0.55);
--indigo-glow:    0 0 0 6px rgba(79, 70, 229, 0.12);

/* Success (emerald) — confirmaciones */
--emerald-500:    #10B981;
--emerald-700:    #047857;
--emerald-50:     rgba(16, 185, 129, 0.10);
--emerald-100:    rgba(16, 185, 129, 0.12);
```

### Spacing scale

`4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64` px

### Typography

- **Sans**: `'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif`
- **Mono**: `'JetBrains Mono', ui-monospace, monospace`

| Token | Size | Weight | LH | LS | Uso |
|---|---|---|---|---|---|
| display-xl | 48 | 600 | 1.05 | -0.035em | H1 pantalla 1 |
| display-lg | 32 | 600 | 1.1 | -0.03em | H1 pantalla 3 |
| display-md | 30 | 600 | 1.15 | -0.025em | H1 pantalla 4 |
| h2 | 24 | 600 | 1.2 | -0.02em | Título timeline card |
| h3 | 20 | 600 | 1.2 | 0.01em | Código tracking (mono) |
| body-lg | 16 | 400 | 1.55 | — | Subhead, párrafos largos |
| body | 15 | 400 | 1.55 | — | Texto general |
| body-sm | 14 | 500 | 1.4 | — | Botones, items meta |
| caption | 13 | 400/500 | 1.5 | — | Detalles del timeline |
| meta | 12 | 400 | 1.4 | — | Trust strip labels |
| eyebrow | 11.5 | 600 | 1 | 0.12em | Labels uppercase |
| micro | 11 | 600 | 1 | 0.04em | Pills, chips |

### Border radius

`5px` (chips/kbd), `7px` (logo, pills medianos), `8px` (botones nav), `10px` (botones CTA), `12px` (inputs, cards pequeñas), `16px` (cards grandes), `999px` (pills, progress bar)

### Shadows

```css
--shadow-card:    0 1px 2px rgba(0,0,0,.04);
--shadow-input:   0 1px 2px rgba(0,0,0,.04), 0 4px 12px -8px rgba(0,0,0,.08);
--shadow-cta:     0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.55);
--shadow-active:  0 0 0 6px rgba(79,70,229,.12), 0 4px 12px -4px rgba(79,70,229,.4);
```

---

## Assets

- **Fuentes** (Google Fonts):
  - Geist (400, 500, 600, 700)
  - JetBrains Mono (400, 500, 600)

- **Iconos**: Lucide (`lucide-react` recomendado). Iconos usados: `search`, `arrow-right`, `arrow-left`, `check`, `clock`, `plus`, `message-circle`, `share-2`, `info`.

- **Logo CRBox**: SVG componible — un cuadrado oscuro con borde indigo interno y línea vertical central. Reproducirlo como componente `<Logo />`. Marca de empresa, no usar tal cual si hay un brand kit existente.

- **Ilustración "no encontrado"**: SVG inline en el JSX. Sustituir por la ilustración del sistema de diseño si existe; de lo contrario, mantener este placeholder.

---

## Files

- `CRBox Tracking Screens.html` — Punto de entrada que monta el canvas y las 4 pantallas
- `design-canvas.jsx` — Componente helper para layout side-by-side (solo para revisión; **no** copiar al producto)
- `screens.jsx` — Implementación de las 4 pantallas. **Esta es la referencia principal** para recrear el UI en el codebase real

Para revisar el diseño en el navegador, abrir `CRBox Tracking Screens.html`. Cada artboard se puede abrir a pantalla completa (botón en la esquina superior derecha) para verlo a tamaño real.
