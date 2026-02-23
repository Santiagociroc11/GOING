# Lógica de negocio - Going

## Flujo de dinero

### Prepago (PREPAID)

| Momento | Negocio | Domiciliario | Going |
|---------|---------|--------------|-------|
| Crear pedido | Paga `price` (domicilio) | - | - |
| Entregado | - | Recibe 70% de `price` | Recibe 30% de `price` |
| Cancelado | Recibe 100% de vuelta | - | - |

### Contraentrega (COD)

| Momento | Negocio | Domiciliario | Cliente | Going |
|---------|---------|--------------|---------|-------|
| Crear pedido | Paga `price` (domicilio) | - | - | - |
| Entregado | - | Recibe 70% de `price` + cobra `productValue` en efectivo al cliente | Paga `productValue` al domiciliario | Recibe 30% de `price` |
| Negocio confirma recaudo | Recibe `productValue` del domiciliario (offline) | - | - | - |
| Cancelado | Recibe 100% de vuelta | - | - | - |

**Nota:** El `productValue` (valor del producto) circula fuera de la app: Cliente → Domiciliario (efectivo) → Negocio (offline). La plataforma solo maneja el `price` (valor del domicilio).

---

## Comisión Going

- **30%** del valor del domicilio (`price`).
- El domiciliario recibe **70%**.
- El negocio paga el 100% al crear el pedido; Going retiene el 30% al acreditar al domiciliario.

---

## Casos especiales

1. **COD + negocio no confirma recaudo:** El domiciliario ya tiene su 70% acreditado. El `productValue` se entrega offline; la confirmación es solo un registro de confianza.
2. **Cancelación con domiciliario asignado:** El negocio recupera todo. El domiciliario no recibe nada (no entregó).
3. **Comisión configurable:** Se guarda en `PlatformSettings.commissionRate` (default 0.3).
