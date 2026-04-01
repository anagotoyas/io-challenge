# IO Card Issuer — Prueba Técnica Backend

Sistema de emisión de tarjetas para el neobanco IO, implementado con arquitectura basada en eventos. Cada cliente puede solicitar y ser acreedor de una **única tarjeta**.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cliente HTTP                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ POST /api/cards/issue
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     card-issuer (REST API)                      │
│  - Valida payload (DNI, email, VISA, PEN/USD)                   │
│  - Verifica unicidad por documentNumber (constraint en DB)      │
│  - Persiste en PostgreSQL con status: pending                   │
│  - Publica CloudEvent en Kafka                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ io.card.requested.v1
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   card-processor (Consumer)                     │
│  - Consume evento de Kafka                                      │
│  - Simula servicio externo (200–500ms, ~60% éxito)              │
│  - Retry con backoff: 1s → 2s → 4s (máx 3 reintentos = 4 total)│
│  - Éxito → genera tarjeta, actualiza DB, publica card.issued    │
│  - Fallo → publica en DLQ con motivo y payload original         │
└───────────┬──────────────────────────────────┬──────────────────┘
            │ io.cards.issued.v1               │ io.card.requested.v1.dlq
            ▼                                  ▼
      [Kafka Topic]                      [Kafka DLQ]
```

### Flujo de correlación de eventos

El campo `source` del CloudEvent es el `requestId` — actúa como correlation ID compartido entre todos los eventos del mismo flujo, permitiendo trazabilidad end-to-end.

```
card-issuer                         card-processor
    │                                     │
    │─── io.card.requested.v1 ───────────▶│
    │    source: "uuid-abc"               │── intento 1: falla
    │    id: 1                            │── espera 1s
    │                                     │── intento 2: falla
    │                                     │── espera 2s
    │                                     │── intento 3: éxito
    │                                     │
    │                                     │─── io.cards.issued.v1
    │                                     │    source: "uuid-abc" (mismo)
    │                                     │    id: 1
```

---

## Estructura del proyecto

```
io-card-issuer/
├── apps/
│   ├── card-issuer/               # REST API — solicitud de tarjetas
│   │   └── src/
│   │       ├── card/
│   │       │   ├── dto/           # Validación del payload HTTP
│   │       │   ├── events/        # Construcción de CloudEvents
│   │       │   ├── responses/     # Tipado de respuestas HTTP
│   │       │   ├── card.controller.ts
│   │       │   ├── card.service.ts
│   │       │   ├── card.repository.ts
│   │       │   └── card.module.ts
│   │       ├── health/            # Health check con verificación de DB
│   │       └── main.ts
│   │
│   └── card-processor/            # Kafka Consumer — emisión de tarjetas
│       └── src/
│           ├── processor/
│           │   ├── utils/
│           │   │   ├── card-generator.ts          # Genera datos de tarjeta
│           │   │   └── external-service.simulator.ts  # Simula fallo/éxito
│           │   ├── processor.controller.ts        # @EventPattern Kafka
│           │   ├── processor.service.ts           # Retry + DLQ logic
│           │   ├── processor.repository.ts
│           │   └── processor.module.ts
│           └── main.ts
│
├── libs/
│   └── shared/                    # Código compartido entre apps
│       └── src/
│           ├── constants/         # Topics de Kafka
│           ├── types/             # CloudEvent, CardRequested, CardIssued, CardDLQ
│           ├── kafka/             # KafkaProducer reutilizable (DynamicModule)
│           ├── logger/            # LoggerModule con Pino estructurado
│           └── prisma/            # PrismaService con driver adapter
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── docker-compose.yml             # Postgres + Kafka KRaft + Kafka UI
```

---

## Requisitos previos

- Node.js >= 20
- Docker y Docker Compose

---

## Instalación y ejecución

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd io-challenge
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

El `.env` por defecto ya tiene los valores correctos para el entorno local con Docker:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/io_cards
KAFKA_BROKER=localhost:9092
ISSUER_PORT=3000
PROCESSOR_PORT=3001
NODE_ENV=development
```

### 3. Levantar infraestructura

```bash
docker compose up -d
```

Esto levanta:

- **PostgreSQL** en `localhost:5432`
- **Kafka** (con KRaft) en `localhost:9092`
- **Kafka UI** en `http://localhost:8080`
- **kafka-init**: crea automáticamente los 3 topics

> Esperar ~15 segundos para que Kafka esté listo y los topics sean creados.

### 4. Ejecutar migraciones

```bash
npx prisma migrate deploy
```

### 5. Iniciar los servicios

En dos terminales separadas:

```bash
# Terminal 1 — REST API (puerto 3000)
npm run start:dev card-issuer

# Terminal 2 — Kafka Consumer
npm run start:dev card-processor
```

---

## API Reference

### Base URL

```
http://localhost:3000/api
```

### Documentación Swagger

```
http://localhost:3000/api/docs
```

---

### `POST /api/cards/issue`

Solicita la emisión de una tarjeta para un nuevo cliente.

> **Regla de negocio:** Cada cliente (por `documentNumber`) solo puede tener una tarjeta. Solicitudes duplicadas retornan `409`.

**Request body:**

```json
{
  "customer": {
    "documentType": "DNI",
    "documentNumber": "74851236",
    "fullName": "Maria Quispe",
    "age": 28,
    "email": "maria@gmail.com"
  },
  "product": {
    "type": "VISA",
    "currency": "PEN"
  },
  "forceError": false
}
```

| Campo            | Validación                                                                   |
| ---------------- | ---------------------------------------------------------------------------- |
| `documentType`   | Solo `"DNI"`                                                                 |
| `documentNumber` | Exactamente 8 dígitos numéricos                                              |
| `fullName`       | No vacío                                                                     |
| `age`            | Entero, mínimo 18                                                            |
| `email`          | Formato email válido                                                         |
| `type`           | Solo `"VISA"`                                                                |
| `currency`       | `"PEN"` o `"USD"`                                                            |
| `forceError`     | Opcional. Fuerza fallo en el processor para pruebas. Ignorado en producción. |

**Respuesta — `202 Accepted`:**

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

| Código | Motivo                                  |
| ------ | --------------------------------------- |
| `202`  | Solicitud registrada                    |
| `400`  | Payload inválido                        |
| `409`  | El cliente ya tiene una tarjeta         |
| `500`  | Error interno (ej. Kafka no disponible) |

---

### `GET /api/cards/status/:requestId`

Consulta el estado de una solicitud de emisión.

**Parámetro:** `requestId` — UUID retornado en el `POST /issue`

**Solicitud pendiente:**

```json
{ "requestId": "uuid", "status": "pending" }
```

**Tarjeta emitida:**

```json
{
  "requestId": "uuid",
  "status": "issued",
  "card": {
    "cardNumber": "**** **** **** 4821",
    "expiresAt": "04/29"
  }
}
```

**Solicitud fallida:**

```json
{ "requestId": "uuid", "status": "failed" }
```

| Código | Motivo                           |
| ------ | -------------------------------- |
| `200`  | Estado retornado                 |
| `400`  | `requestId` no es un UUID válido |
| `404`  | Solicitud no encontrada          |

---

### `GET /api/health`

Verifica el estado del servicio y sus dependencias.

**`200 OK`:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-01T18:00:00.000Z",
  "service": "card-issuer",
  "dependencies": { "database": "ok" }
}
```

**`503 Service Unavailable`** (si la DB no responde):

```json
{
  "status": "degraded",
  "dependencies": { "database": "unavailable" }
}
```

---

## Contratos de eventos (CloudEvents)

### `io.card.requested.v1`

```json
{
  "id": 1,
  "source": "550e8400-e29b-41d4-a716-446655440000",
  "type": "io.card.requested.v1",
  "time": "2026-04-01T18:00:00.000Z",
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "customer": {
      "documentType": "DNI",
      "documentNumber": "74851236",
      "fullName": "Maria Quispe",
      "age": 28,
      "email": "maria@gmail.com"
    },
    "product": { "type": "VISA", "currency": "PEN" },
    "forceError": false
  }
}
```

### `io.cards.issued.v1`

```json
{
  "id": 1,
  "source": "550e8400-e29b-41d4-a716-446655440000",
  "type": "io.cards.issued.v1",
  "time": "2026-04-01T18:00:01.000Z",
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "customer": { "...": "datos del cliente" },
    "card": {
      "cardId": "uuid",
      "cardNumber": "4721839204719283",
      "expiresAt": "04/29",
      "cvv": "382"
    }
  }
}
```

### `io.card.requested.v1.dlq`

```json
{
  "id": 1,
  "source": "550e8400-e29b-41d4-a716-446655440000",
  "type": "io.card.requested.v1.dlq",
  "time": "2026-04-01T18:00:08.000Z",
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "error": {
      "message": "Error simulado en servicio externo",
      "attempts": 4
    },
    "originalPayload": { "...": "payload original del evento card.requested" }
  }
}
```

---

## Monitoreo

### Kafka UI

```
http://localhost:8080
```

| Topic                      | Descripción                          |
| -------------------------- | ------------------------------------ |
| `io.card.requested.v1`     | Solicitudes de emisión               |
| `io.cards.issued.v1`       | Tarjetas emitidas exitosamente       |
| `io.card.requested.v1.dlq` | Solicitudes fallidas tras 4 intentos |

### Logs estructurados

Ambos servicios emiten logs en JSON con Pino. En desarrollo se usa `pino-pretty`:

```
INFO: Solicitud de tarjeta registrada {"requestId":"uuid","documentNumber":"****1234","currency":"PEN"}
INFO: Evento recibido {"id":1,"type":"io.card.requested.v1","requestId":"uuid"}
INFO: Iniciando procesamiento {"requestId":"uuid","attempt":1,"maxAttempts":4}
WARN: Fallo en procesamiento, reintentando {"attempt":1,"remainingAttempts":2,"nextRetryMs":1000}
INFO: Tarjeta emitida exitosamente {"requestId":"uuid","cardNumber":"**** **** **** 9283"}
ERROR: Reintentos agotados, enviado a DLQ {"requestId":"uuid","totalAttempts":4}
```

Nivel configurable con `LOG_LEVEL` en `.env` (`trace`, `debug`, `info`, `warn`, `error`).

---

## Decisiones técnicas

### Unicidad de tarjeta — constraint en DB, no en aplicación

La unicidad se resuelve en la capa de base de datos (`@unique` en `documentNumber`) atrapando el error `P2002` de Prisma.

### Kafka KRaft en lugar de Zookeeper

KRaft (desde Kafka 3.x) permite que Kafka gestione su propia coordinación interna sin un proceso externo. Simplifica la infraestructura y es el estándar actual (Zookeeper deprecado desde Kafka 3.5).

### Retry in-process con backoff exponencial

El backoff se implementa en memoria dentro del consumer (1s → 2s → 4s, 4 intentos totales). Evita la necesidad de topics de retry adicionales, manteniendo la infraestructura simple sin sacrificar la confiabilidad para este caso de uso.

### Rollback ante fallo de Kafka en card-issuer

Si el `INSERT` en PostgreSQL es exitoso pero la publicación en Kafka falla, el registro se elimina y se retorna `500`. Esto garantiza consistencia: o el flujo completo se inicia, o no queda rastro huérfano en la DB.

### `forceError` bloqueado en producción

El flag `forceError` se ignora automáticamente en `NODE_ENV=production`, evitando que sea usado maliciosamente en entornos reales.

### Datos sensibles enmascarados en logs

`documentNumber` y `cardNumber` nunca se muestran completos. Solo se muestran los últimos 4 dígitos (`****1234`, `**** **** **** 1234`).

---

## Stack tecnológico

| Tecnología         | Versión | Uso                          |
| ------------------ | ------- | ---------------------------- |
| Node.js            | >= 20   | Runtime                      |
| TypeScript         | 5.x     | Lenguaje                     |
| NestJS             | 11      | Framework (monorepo)         |
| KafkaJS            | 2.x     | Productor y consumidor Kafka |
| Prisma             | 7.x     | ORM con driver adapter PG    |
| PostgreSQL         | 16      | Base de datos                |
| Kafka KRaft        | 7.8     | Broker de mensajes           |
| Pino / nestjs-pino | 4.x     | Logs estructurados JSON      |
| Helmet             | 8.x     | Cabeceras de seguridad HTTP  |
| class-validator    | 0.14    | Validación de DTOs           |
| Swagger / OpenAPI  | 11.x    | Documentación de API         |
