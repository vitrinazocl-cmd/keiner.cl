# Integracion de Leads con Power Automate, Outlook y SharePoint

Este proyecto ya puede enviar cada lead del formulario a un webhook HTTP opcional ademas del correo SMTP.

## Variables necesarias

Configura estas variables en tu `.env`:

```env
LEAD_WEBHOOK_URL=https://prod-00.westus.logic.azure.com:443/workflows/...
LEAD_WEBHOOK_TOKEN=tu_token_opcional
LEAD_WEBHOOK_TOKEN_HEADER=x-keiner-token
```

Si no usas token, deja `LEAD_WEBHOOK_TOKEN=` vacio.

## Payload que enviara KEINER

```json
{
  "submissionId": "uuid",
  "source": "keiner-web-corporativo",
  "receivedAt": "2026-08-13T12:00:00.000Z",
  "lead": {
    "nombre": "Juan Perez",
    "empresa": "Empresa Demo",
    "correo": "juan@empresa.cl",
    "mensaje": "Texto enriquecido del formulario",
    "necesidad": "representacion",
    "perfil": "cliente",
    "horizonte": "corto",
    "integracion": "outlook"
  }
}
```

## Flujo recomendado en Power Automate

1. Crea un flujo cloud automatizado.
2. Usa el trigger `When an HTTP request is received`.
3. Pega este esquema JSON:

```json
{
  "type": "object",
  "properties": {
    "submissionId": { "type": "string" },
    "source": { "type": "string" },
    "receivedAt": { "type": "string" },
    "lead": {
      "type": "object",
      "properties": {
        "nombre": { "type": "string" },
        "empresa": { "type": "string" },
        "correo": { "type": "string" },
        "mensaje": { "type": "string" },
        "necesidad": { "type": "string" },
        "perfil": { "type": "string" },
        "horizonte": { "type": "string" },
        "integracion": { "type": "string" }
      }
    }
  },
  "required": ["submissionId", "source", "receivedAt", "lead"]
}
```

4. Copia la URL generada y asignala a `LEAD_WEBHOOK_URL`.
5. Agrega una accion `Condition` si quieres validar token:
   - Compara el header `x-keiner-token` con el valor esperado.
6. Agrega accion `Create item` para SharePoint:
   - Site Address: tu sitio
   - List Name: `LeadsKeiner`
   - Titulo: `submissionId`
   - Nombre: `lead.nombre`
   - Empresa: `lead.empresa`
   - Correo: `lead.correo`
   - Necesidad: `lead.necesidad`
   - Perfil: `lead.perfil`
   - Horizonte: `lead.horizonte`
   - Integracion: `lead.integracion`
   - Mensaje: `lead.mensaje`
   - RecibidoEn: `receivedAt`
7. Agrega accion `Send an email (V2)` de Outlook:
   - To: equipo comercial
   - Subject: `Nuevo lead KEINER - @{triggerBody()?['lead']?['empresa']}`
   - Body: resumen del lead
8. Finaliza con accion `Response`:

```json
{
  "ok": true
}
```

Usa status code `200`.

## Lista sugerida en SharePoint

Crea una lista `LeadsKeiner` con estas columnas:

- `Title` texto unico
- `Nombre` texto
- `Empresa` texto
- `Correo` texto
- `Necesidad` opcion o texto
- `Perfil` opcion o texto
- `Horizonte` opcion o texto
- `Integracion` opcion o texto
- `Mensaje` multiples lineas
- `RecibidoEn` fecha y hora
- `Fuente` texto

## Comportamiento del backend

- Si `LEAD_WEBHOOK_URL` no existe, el sitio sigue funcionando con SMTP.
- Si el webhook responde distinto de `2xx`, la API devolvera error `delivery_failed`.
- Recomendacion: primero prueba en desarrollo con una URL de prueba y luego pasa a produccion.
