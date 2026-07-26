# AniSuba — actualización funcional de mockups 09, 15, 18, 22, 24 y 28

Versión: 1.0  
Estado: aprobado para diseño e implementación progresiva  
Alcance: modo demo primero; lógica real después, sin mezclar datos ficticios con datos persistidos.

## Principios del alcance

- AniSuba es una plataforma de seguimiento, descubrimiento y analítica personal; no reproduce anime.
- La sección **Dónde ver** solo puede enlazar proveedores oficiales y debe respetar el país o región del usuario.
- La importación de MyAnimeList es un flujo personal y unidireccional hacia AniSuba. No es lo mismo que la importación administrativa del catálogo.
- Mientras siga activo el modo demo, ningún contador, importación o sincronización de estas pantallas debe escribirse en Supabase.
- Cada estado interactivo debe conservar el lenguaje visual aprobado: respuesta visible al hover y foco, color semántico, movimiento moderado y compatibilidad con `prefers-reduced-motion`.

## Mockup 09 — Configuración

### Cambios visibles

- Incorporar **País o región** dentro de Cuenta.
- Explicar que la región controla qué plataformas oficiales se muestran en **Dónde ver**.
- Convertir MyAnimeList en el punto de entrada a la importación de biblioteca.
- Mostrar con claridad cuándo una integración o importación es solo una demostración local.

### Criterios de aceptación

- El usuario puede seleccionar una región sin afectar todavía datos persistidos.
- MyAnimeList ofrece la acción **Importar biblioteca**.
- La previsualización informa títulos detectados, coincidencias y registros listos para importar.
- La interfaz no afirma que OAuth o la importación real ya estén activos.
- El diálogo es accesible mediante nombre, rol y cierre explícito.

## Mockup 15 — Detalle de anime

### Nueva sección: Dónde ver

- Mostrar proveedores oficiales disponibles para la región configurada.
- Cada proveedor debe indicar nombre, tipo de acceso (`suscripción`, `gratis con anuncios`, `alquiler` o `compra`) y acción **Ver en [proveedor]**.
- El enlace abre una web externa; AniSuba no aloja ni reproduce el contenido.
- Mostrar fecha de última verificación y una nota breve sobre disponibilidad regional.
- Incluir estados de carga, sin disponibilidad y enlace desactualizado.
- No mostrar ni recomendar sitios no oficiales.

### Datos requeridos

- Identificador del anime.
- Código de región ISO 3166-1 alpha-2.
- Proveedor, URL oficial, modalidad, logo y estado de verificación.
- Identificadores externos de catálogo para conciliar datos entre fuentes.

## Mockup 18 — Crear o editar reseña

### Protección contra spoilers

- Añadir la opción **Esta reseña contiene spoilers**.
- La previsualización debe mostrar cómo quedará oculto el contenido sensible.
- Al publicar, conservar el indicador de spoiler junto con la reseña.
- Una reseña marcada debe aparecer colapsada para otros usuarios hasta que estos decidan revelarla.
- Mantener estados de borrador, publicación, moderación y error.

## Mockup 22 — Importación administrativa de catálogo

### Alcance

- Importar o enriquecer fichas de anime desde APIs de catálogo autorizadas.
- Conservar IDs externos de MyAnimeList, AniList y otras fuentes aprobadas.
- Detectar duplicados antes de crear nuevas obras o entradas.
- Permitir previsualizar cambios de metadatos antes de aplicarlos.
- Enriquecer el mapeo necesario para consultar disponibilidad oficial por región.

### Separación obligatoria

- Este flujo administra el catálogo global.
- No importa la biblioteca personal de un usuario.
- No debe acceder a tokens personales de MyAnimeList.

## Mockup 24 — Editar anime

### Gestión de disponibilidad

- Añadir un bloque **Plataformas oficiales**.
- Permitir agregar proveedor, regiones, modalidad, URL externa, vigencia y fecha de verificación.
- Validar que la URL utilice HTTPS y pertenezca al dominio oficial configurado para el proveedor.
- Permitir desactivar una disponibilidad sin borrar su historial.
- Registrar quién hizo el cambio y cuándo.

## Mockup 28 — Estados vacíos y errores

Debe incluir estados reutilizables para:

- Anime sin proveedor oficial en la región elegida.
- Región todavía no compatible.
- Enlace de proveedor vencido o temporalmente no disponible.
- Error al consultar disponibilidad.
- Cuenta externa no conectada.
- Token externo vencido o revocado.
- Importación parcial.
- Límite de solicitudes alcanzado.
- Conflictos que requieren revisión manual.

Cada estado debe contener título, explicación útil, acción siguiente y una variante accesible que no dependa solo del color.

## Mockups adicionales para la importación personal

### Mockup 29 — Conectar MyAnimeList

- Explicar permisos y alcance antes de iniciar OAuth.
- Mostrar que la importación es unidireccional.
- Permitir cancelar sin modificar datos.

### Mockup 30 — Previsualizar y resolver conflictos

- Resumir registros nuevos, coincidentes y conflictivos.
- Permitir elegir por conflicto si se conserva AniSuba, MyAnimeList o la actividad más reciente.
- Mostrar cambios de estado, progreso, puntuación y episodios antes de confirmar.

### Mockup 31 — Resultado de importación

- Informar importados, actualizados, omitidos y fallidos.
- Permitir descargar o revisar el detalle de errores.
- Registrar fecha, fuente y estado del proceso.

## Contrato de datos previsto

La nomenclatura final se validará contra el esquema antes de crear migraciones:

- `user_preferences`: `user_id`, `region_code`, idioma y zona horaria.
- `external_accounts`: propietario, proveedor, identificador externo y estado de conexión.
- `external_account_secrets`: tokens cifrados o referencias secretas, nunca expuestos al cliente.
- `anime_external_ids`: conciliación de IDs por fuente.
- `watch_providers`: catálogo verificado de proveedores oficiales.
- `anime_availability`: anime, proveedor, región, modalidad, URL, vigencia y verificación.
- `import_jobs`: propietario, fuente, estado, totales y marcas de tiempo.
- `import_job_items`: resultado y decisión de cada registro importado.

## Seguridad y arquitectura

- Los tokens de terceros se procesarán únicamente en servidor o Edge Function.
- La clave `service_role` nunca se utilizará en el navegador.
- Las tablas personales tendrán RLS por propietario.
- Las operaciones administrativas requerirán rol explícito.
- La UI leerá secretos solo como estado (`conectado`, `vencido`, `revocado`), nunca como valor.
- Los datos demo vivirán en frontend y se retirarán mediante una bandera de entorno, sin borrar ni alterar los datos reales.

## Orden de implementación recomendado

1. Finalizar el Mockup 15 con **Dónde ver** y sus estados.
2. Añadir protección de spoilers al Mockup 18.
3. Diseñar Mockups 29–31 para la importación personal.
4. Construir Mockups 22 y 24 con el contrato administrativo.
5. Consolidar todos los estados en el Mockup 28.
6. Auditar visualmente los mockups 15–31.
7. Crear migraciones, políticas RLS y funciones de servidor.
8. Conectar progresivamente la lógica real manteniendo el modo demo hasta la validación final.
