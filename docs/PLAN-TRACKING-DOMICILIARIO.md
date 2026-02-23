# Plan: Tracking del domiciliario en tiempo real

## Objetivo

Mostrar al negocio la ubicación del domiciliario en un mapa cuando tiene un pedido activo (ACCEPTED o PICKED_UP), similar a Rappi/Uber Eats.

## Visualización para múltiples pedidos

| Escenario | Solución |
|-----------|----------|
| 1 pedido activo | Minimapa en la tarjeta del pedido |
| 2+ pedidos activos | Un minimapa por pedido (cada tarjeta tiene su mapa) |
| Expandir | Click en "Ver mapa" abre modal con mapa grande |

**Por qué minimapa por pedido:**
- Cada pedido tiene su propio domiciliario y ruta (recogida → entrega)
- El negocio identifica rápido: "Pedido #ABC → Carlos, mapa 1" / "Pedido #DEF → Pedro, mapa 2"
- Evita un mapa único con muchos marcadores superpuestos

## Arquitectura

```
[Domiciliario]                    [Negocio]
     |                                 |
     | POST /api/orders/:id/location   |
     | { lat, lng } cada 20s           |
     v                                 |
[Order.lastDriverLocation]            |
     ^                                 |
     |                                 | GET /api/orders (incluye lastDriverLocation)
     |                                 v
     |                          [Minimapa por pedido]
     |                          Actualiza cada 20s
```

## Fases de implementación

### Fase 1: Backend
- Añadir `lastDriverLocation: { lat, lng, updatedAt }` al modelo Order
- API `POST /api/orders/[id]/location` (solo el domi asignado puede enviar)
- Incluir `lastDriverLocation` en GET /api/orders para el negocio

### Fase 2: Driver - Envío de ubicación
- En la página de pedidos del domi, cuando hay pedidos ACCEPTED o PICKED_UP
- `navigator.geolocation.watchPosition` o `getCurrentPosition` cada 20s
- Enviar a POST /api/orders/[id]/location
- Solo cuando la app está en primer plano (limitación PWA)

### Fase 3: Business - Minimapa
- Instalar Leaflet (gratis, sin API key)
- Componente `OrderTrackingMap`: minimapa 280x160px con marcadores
  - Recogida (naranja)
  - Entrega (verde)
  - Domiciliario (azul, solo si hay lastDriverLocation)
- En cada tarjeta de pedido activo (En curso)
- Botón "Ver mapa" → modal con mapa más grande
- Polling cada 20s para refrescar ubicación

### Fase 4 (opcional): Mejoras
- WebSocket para actualizaciones en tiempo real sin polling
- Animación suave del marcador del domi
- Mostrar ETA estimado
