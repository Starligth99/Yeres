# Infinity Operations

Panel logístico de demostración construido con HTML, CSS y JavaScript. No
requiere Django, servidor de aplicaciones ni base de datos.

## Datos guardados

Las operaciones, clientes, inventario, alertas, revisiones aduaneras, riesgos y
checklists se guardan en `localStorage` del navegador. Los cambios permanecen
en ese navegador y en ese dominio, pero no se sincronizan con otros dispositivos
ni con otros usuarios. Borrar los datos del sitio en el navegador también los
elimina. El acceso de demostración no es autenticación real y no protege la
información.

## Publicar

Publica la carpeta raíz como un sitio estático. El archivo de entrada es
`index.html`; no se necesita comando de instalación, compilación ni inicio.

Los mapas y las fuentes tipográficas usan servicios externos y requieren
conexión a internet. La ubicación del dispositivo solo se consulta cuando se
pulsa el botón correspondiente; funciona en `localhost` o en sitios servidos
mediante HTTPS.
