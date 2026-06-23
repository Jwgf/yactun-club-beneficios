# Programa de Fidelización YACTÚN

Sistema simple de fidelización para un único comercio.

## Objetivo

Cliente escanea un QR del negocio, se registra y obtiene una credencial con QR propio.
El vendedor escanea el QR del cliente, confirma la compra y el sistema suma puntos.
Al llegar a la meta configurada, el cliente gana un premio.

## Arquitectura inicial

- Web/PWA alojada en GitHub Pages.
- Google Apps Script como backend.
- Google Sheets como base de datos.
- Un solo comercio.
- Un solo vendedor.
- Costo mensual estimado: $0.

## Pantallas previstas

- Cliente: registro, credencial, QR, puntos, premio.
- Vendedor: escaneo de cliente, confirmación de compra, entrega de premio.
- Admin: configuración básica, clientes, movimientos y premios.

## Estado del proyecto

Estructura inicial creada.

## API Apps Script

URL activa de la API:

https://script.google.com/macros/s/AKfycbxRJzCyFnEHYzqs0JGGejlcP9mpzJvjj12SZFpRgI_IeAH163caGr4ZEO_hu3gjotocVg/exec

Pruebas:

?action=ping
?action=config
