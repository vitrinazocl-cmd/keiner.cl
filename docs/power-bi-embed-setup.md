# Activacion de Power BI Embebido

El sitio ya esta preparado para mostrar dashboards Power BI en Inicio, Servicios y Casos.

## Variables necesarias

```env
POWER_BI_EMBED_URL=https://app.powerbi.com/reportEmbed?reportId=...&autoAuth=true&ctid=...
POWER_BI_EMBED_TITLE=Dashboard Power BI KEINER
```

## Como obtener la URL

1. Abre tu reporte en Power BI Service.
2. Usa `Archivo` o `Compartir` segun tu modalidad de publicacion.
3. Obtiene una URL de embed HTTPS valida.
4. Pega la URL en `POWER_BI_EMBED_URL`.
5. Reinicia la aplicacion.

## Donde se mostrara

Cuando `POWER_BI_EMBED_URL` este configurada, el sitio renderiza el embed en:

- `index.html`
- `servicios.html`
- `casos.html`

## Recomendaciones

- Usa solo URLs HTTPS.
- Si el tablero es privado, valida permisos de visualizacion antes de publicarlo.
- Para una version publica, evita incluir datos sensibles o identificables.
- Mantén un dashboard resumido para web publica y otro detallado para clientes premium.

## KPIs sugeridos

- OTIF
- Fill Rate
- Lead Time
- Inventario disponible
- Continuidad de abastecimiento
- Proyectos activos
- Cuentas atendidas
- Cumplimiento SLA

## Como funciona tecnicamente

- `GET /api/public-config` expone la configuracion publica del embed.
- `script.js` consulta ese endpoint y monta un `iframe` solo si la URL existe.
- Si no existe la variable, el sitio deja un placeholder visual en su lugar.
