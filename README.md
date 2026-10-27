# Portfolio de Facundo Garómpolo

Web y panel privado locales, con una exportación estática para **GitHub Pages** y preparados para migrar a un servidor propio. La web no usa fuentes remotas ni servicios de terceros en tiempo de ejecución. El contenido editable, los borradores y los archivos privados se guardan en esta computadora.

## Publicación en GitHub Pages

GitHub Pages sirve la carpeta `docs/` de la rama `main`. Esta carpeta contiene una copia del contenido **publicado** y únicamente los archivos visibles, con rutas relativas que funcionan bajo el nombre del repositorio. El panel, SQLite, contraseñas, sesiones, borradores y certificados ocultos no forman parte de esa exportación.

Para actualizar la web online después de editar:

1. Iniciá la web local con `npm start`, entrá al panel y usá **Publicar cambios**.
2. En otra terminal, desde esta carpeta, ejecutá:

```sh
npm run export:pages
git add docs
git commit -m "Actualizar contenido del portfolio"
git push origin main
```

3. GitHub Pages actualiza la web después de procesar el nuevo commit. Guardar o publicar en el panel local por sí solo no actualiza GitHub.

No edites `docs/` a mano: se regenera con cada exportación. `npm run export:pages` falla sin modificar la exportación anterior si falta un archivo publicado. Conserva un `CNAME` existente para un futuro dominio propio.

El repositorio contiene el código del panel para poder migrarlo, pero el panel solo funciona ejecutando el servidor Node.js. Pages publica únicamente `docs/`; los datos privados de `data/` están excluidos de Git. La web y los CV exportados son públicos.

Para configurar Pages por primera vez: **Settings → Pages → Deploy from a branch → main → /docs → Save**. Referencia: [configurar la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Usar la web

Requisito: Node.js 24 o posterior (se probó con Node.js 26). No hay dependencias que instalar.

Desde esta carpeta:

```sh
npm start
```

- Web: <http://localhost:3000>
- Panel: <http://localhost:3000/admin>
- Para detener: `Ctrl+C` en la terminal que ejecuta el servidor.
- En macOS también podés abrir `Iniciar portfolio.command`.

La primera vez que entrás al panel, elegís tu contraseña de al menos 12 caracteres. Esta configuración inicial solo está habilitada cuando el servidor escucha en la interfaz local y no está en modo producción. No hay una contraseña predeterminada. Las sesiones duran ocho horas.

## Editar y publicar

### Ver desde el celular

Con el servidor encendido (`npm start`), ejecutá `npm run preview:lan` en otra terminal. Abrí en el celular la dirección que muestra y conectá ambos dispositivos al mismo Wi-Fi. La computadora debe permanecer encendida y despierta. La dirección puede cambiar al cambiar de red. Esta vista comparte solo el contenido publicado: el panel y los borradores siguen accesibles desde `localhost` en la computadora. Para dejar de compartir, usá `Ctrl+C` en la terminal de `preview:lan`.

### Usar el panel

1. Elegí Perfil, Experiencia, Formación, Habilidades, Proyectos o Contacto y CV.
2. Editá los campos de español e inglés. El panel señala traducciones pendientes; la web muestra el texto del otro idioma si uno está vacío.
3. **Guardar borrador** guarda los cambios en disco sin modificar lo publicado. No hay guardado automático: la fecha muestra el último guardado exitoso.
4. **Previsualizar borrador** guarda los cambios y abre la web en un marco de computadora o móvil. Conserva el selector de idiomas. Los elementos ocultos tampoco aparecen en la vista previa.
5. **Publicar cambios**, seguido de **Publicar ahora**, reemplaza el contenido visible en la web local. Esto no sube la web a internet.

La foto es opcional. Los controles de centrado y acercamiento muestran el recorte. Imágenes: JPG, PNG y WebP. CV: PDF. Certificados: PDF o imagen. El máximo por archivo es 8 MB; las imágenes se optimizan en el navegador antes de subirlas (hasta 1800 píxeles).

Podés ordenar con ↑ / ↓, ocultar elementos sin borrarlos, destacar proyectos y quitar o reemplazar archivos. Eliminar requiere confirmación. Quitar un archivo de un campo conserva la copia física; cuando deja de estar asociado al contenido publicado, deja de ser accesible al público. Los certificados solo se muestran al activar su publicación.

Los proyectos no aparecen en la web hasta que exista al menos uno visible. El contenido inicial no incluye proyectos inventados. Las fechas laborales están vacías porque no figuran en el CV.

**El PDF del CV es un archivo independiente:** cambiar los textos del sitio no reescribe el PDF. Cuando actualices tu CV, reemplazá el PDF correspondiente en Contacto y CV.

## Datos iniciales y referencias

- Fuente: `CV_Facundo_Garompolo_EN_B1.pdf` proporcionado por Facundo.
- La formación inicial conserva el 40% de materias aprobadas del PDF; es editable en Formación.
- El PDF español es una traducción del documento recibido, con los mismos datos y sin nuevas fechas ni logros. El inglés es el archivo original.
- Las fotografías de ambientación provienen de las dos imágenes proporcionadas por el usuario. La interfaz visible dentro de cada dispositivo se dibuja con HTML y CSS, por encima de la imagen.
- El idioma se recuerda en este navegador. Es la única preferencia guardada en `localStorage`; el contenido del panel se almacena en SQLite.

## Copias de seguridad y recuperación

**No borres `data/`.** Contiene:

- `portfolio.sqlite`: cuenta, sesiones, borrador, publicación y metadatos de archivos.
- `uploads/`: fotos, certificados y CV.
- SQLite puede crear `portfolio.sqlite-wal` y `portfolio.sqlite-shm` mientras funciona.

Para una copia sencilla y consistente, detené el servidor con `Ctrl+C`, copiá la carpeta completa del proyecto (incluyendo `data/` y `.env`, si existe) y volvé a iniciarlo. Guardá las copias fuera del sitio público. Para restaurar, detené el servidor y recuperá la carpeta `data/` de la copia elegida.

Si olvidaste la contraseña, ejecutá en esta carpeta:

```sh
npm run reset-password
```

Te pedirá una nueva contraseña sin mostrarla. Conserva el contenido y cierra las sesiones anteriores.

`data/`, `.env` y `output/` se excluyen de Git. Al migrar, hay que copiarlos por separado; **clonar solamente el repositorio no recupera las ediciones ni los archivos**.

## Llevarlo a tu servidor cuando tengas dominio

1. Instalá Node.js 24 o posterior en tu servidor.
2. Copiá el proyecto y la carpeta `data/` después de detener el servidor local. Creá tu cuenta local antes de copiarlo, o usá `npm run reset-password` en el servidor.
3. Copiá `.env.example` como `.env` y ajustá:

```dotenv
HOST=127.0.0.1
PORT=3000
PUBLIC_ORIGIN=https://tu-dominio.com
NODE_ENV=production
DATA_DIR=/ruta/persistente/portfolio-data
```

Si usás `DATA_DIR`, mové allí el contenido completo de `data/`. La cuenta que ejecuta Node necesita permisos de lectura y escritura sobre esa carpeta.

4. Configurá un proxy inverso (por ejemplo, Caddy o Nginx) con HTTPS que reenvíe a `127.0.0.1:3000` y preserve el encabezado `Host`. Ejemplo de Caddyfile:

```caddy
tu-dominio.com {
    reverse_proxy 127.0.0.1:3000
}
```

5. Ejecutá `npm start` mediante un gestor de procesos o servicio del sistema, en el directorio del proyecto. Mantené un solo proceso de aplicación por carpeta de datos. El DNS del dominio debe apuntar al servidor.

El servidor requiere HTTPS en producción y usa cookies seguras. El puerto de Node debe permanecer accesible solo al proxy local. Los archivos de `data/` nunca deben exponerse como carpeta estática. El dominio y la infraestructura que elijas serán los únicos servicios a contratar; esta implementación no está vinculada a un proveedor.

## Desarrollo y comprobaciones

```sh
npm run dev
npm run check
npm test
```

`npm run dev` reinicia el servidor al cambiar sus archivos. Los cambios de HTML, CSS y JS se ven al recargar la página. No hay paso de compilación.

Las pruebas levantan un servidor temporal en `localhost:4317` con una carpeta aislada y cubren acceso anónimo, origen/host, autenticación, CSRF, formato de archivos, borradores, conflictos entre pestañas, publicación, visibilidad, persistencia al reiniciar, revocación de acceso a archivos y límite de intentos. No modifican tus datos.

La revisión visual pudo observar la escena de escritorio y la versión de teléfono. La herramienta de navegador bloqueó después una interacción por su política de seguridad: quedó pendiente completar la comprobación manual del panel y de los tamaños de 320/390 px y orientación horizontal, incluida la última corrección de alineación del teléfono.

Checklist breve de revisión manual: abrir cada sección, ES/EN conservando sección, minimizar/recuperar/ampliar/cerrar, navegar con Tab, subir una foto y ajustar recorte, guardar borrador, revisar ambas vistas previas, publicar, descargar ambos CV y activar un certificado. Con reducción de movimiento habilitada en el sistema, la lámpara y el LED quedan estáticos.
