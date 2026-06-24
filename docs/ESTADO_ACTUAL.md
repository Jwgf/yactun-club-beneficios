# Yactun Club de Beneficios - Estado actual

## Arquitectura

Sistema de fidelización Yactun basado en:

- GitHub Pages para la web pública.
- Google Apps Script como backend.
- Google Sheets como base de datos.
- Sin Firebase.
- Cliente y vendedor funcionan como PWA instalables.

## URLs públicas

### Cliente

URL directa:

https://jwgf.github.io/yactun-club-beneficios/index.html

Instalación PWA recomendada:

https://jwgf.github.io/yactun-club-beneficios/index.html

Nombre de acceso:

Yactun

Icono:

Zorro grande

Función:

Credencial del cliente, registro, QR y estado de beneficios.

---

### Vendedor

URL instalable recomendada:

https://jwgf.github.io/yactun-club-beneficios/vendedor/index.html

Nombre de acceso:

Yactun Vendedor

Icono:

Zorro grande

Función:

Panel vendedor independiente, PIN, consulta manual, scanner QR, registrar compra, entregar premio y sonidos.

---

### Vendedor respaldo

URL de respaldo:

https://jwgf.github.io/yactun-club-beneficios/vendedor.html

Nota:

Se conserva como respaldo. La instalación recomendada para vendedor es la carpeta independiente `/vendedor/index.html`.

## Backend activo

Google Apps Script WebApp activo:

https://script.google.com/macros/s/AKfycbzcQZKm6LO37tssOm0cALB7ZEXg8ewMxH3_7Mi32VpZa-qDCEsD-z6bpNgvQICZ9hWh/exec

## Configuración importante

El PIN del vendedor NO debe quedar escrito en el código público.

El PIN se lee desde la hoja:

Config

Clave:

pinVendedor

Valor actual probado:

1234

## Estado validado

- Cliente abre bien.
- Cliente instalado como PWA OK.
- Vendedor instalado como PWA independiente OK.
- Icono zorro grande OK.
- Nombre cliente: Yactun.
- Nombre vendedor: Yactun Vendedor.
- PIN vendedor validado contra backend OK.
- Scanner QR vendedor OK.
- Consulta manual vendedor OK.
- Registro de compra OK.
- Premio pendiente al completar meta OK.
- Entrega de premio OK.
- Audio vendedor OK.
- Repositorio limpio al momento del checkpoint.

## Publicación

La rama de trabajo es:

master

La web publicada sale de:

web/

Y se publica en:

gh-pages

Comando usado para publicar:

git subtree split --prefix web
git push -f origin "<split>:gh-pages"

## Notas

Android y Chrome cachean fuerte el manifest y los iconos PWA.

Si el icono o nombre no cambia:

1. borrar acceso viejo,
2. desinstalar app si aparece en Ajustes,
3. borrar datos del sitio en Chrome,
4. cerrar Chrome,
5. volver a abrir la URL e instalar nuevamente.
