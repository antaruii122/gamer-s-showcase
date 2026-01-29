# Gaming Catalog Pro - Guía de Usuario y Documentación Técnica

Bienvenido a Gaming Catalog Pro. Esta documentación cubre el uso de la interfaz administrativa y una guía técnica para la solución de problemas.

## 📋 Tabla de Contenidos
1. [Guía de Usuario](#guía-de-usuario)
   - [Iniciar Sesión](#iniciar-sesión)
   - [Subir Catálogo](#subir-catálogo)
   - [Editar Catálogo](#editar-catálogo)
   - [Eliminar Catálogo](#eliminar-catálogo)
   - [Vista Pública](#vista-pública)
   - [Solución de Problemas (Usuario)](#solución-de-problemas-usuario)
2. [Guía de Desarrollo y Troubleshooting](#guía-de-desarrollo-y-troubleshooting)

---

# Guía de Usuario

## Iniciar Sesión
Para acceder al panel de administración:
1. Diríjase a `[URL]/admin/login`
2. **Correo**: `rcgiroz@gmail.com`
3. **Contraseña**: `Pepe1234$`

![Pantalla de Login](public/screenshots/login_placeholder.png)

## Subir Catálogo
1. En el Panel Principal, haga clic en el botón **"Subir Nuevo"**.
2. **Seleccionar Categoría**: Elija una categoría existente (ej. Gabinetes, Teclados) o cree una nueva.
3. **Cargar Archivo**: Arrastre su archivo Excel (`.xlsx`) a la zona de carga o haga clic para buscarlo.
4. **Validación Automática**: El sistema intentará detectar las columnas automáticamente.
5. **Mapeo Manual**: Si la detección falla, utilice la herramienta de mapeo para asignar columnas (Modelo, Precio, etc.) manualmente.
6. **Imágenes**: Si el Excel no contiene imágenes incrustadas, use el botón **"Agregar Imagen"** para subirlas manualmente desde su dispositivo.
7. Haga clic en **"Confirmar y Guardar"** para finalizar.

![Pantalla de Subida](public/screenshots/upload_placeholder.png)

## Editar Catálogo
Modifique productos existentes sin necesidad de volver a subir todo el archivo:
1. En la sección "Mis Catálogos" del Dashboard, haga clic en el botón **"Editar"** (ícono de lápiz) del catálogo deseado.
2. Podrá modificar:
   - **Precios FOB**: Comprobación automática de formato.
   - **Modelos**: Edición de texto directo.
   - **Imágenes**: Reemplazar o eliminar imágenes por producto.
   - **Especificaciones**: Agregar o quitar detalles técnicos.
3. Haga clic en **"Guardar Cambios"** para aplicar las modificaciones.

![Pantalla de Edición](public/screenshots/edit_placeholder.png)

## Eliminar Catálogo
1. En la tarjeta del catálogo en "Mis Catálogos", haga clic en el ícono de **Basura**.
2. Confirme la acción en el modal emergente. **Nota**: Esta acción no se puede deshacer.

## Vista Pública
La cara visible para sus clientes:
- Acceso a través de la URL principal `[URL]`.
- Navegación fluida por categorías (Teclados, Mouses, etc.).
- Visualización de productos en un carrusel 3D interactivo.
- Buscador con filtro en tiempo real por modelo o características.

![Vista Pública](public/screenshots/public_view_placeholder.png)

## Solución de Problemas (Usuario)
- **Error "Almacenamiento lleno"**: El navegador tiene un límite (usualmente 5-10MB). Elimine catálogos antiguos desde el panel de administración para liberar espacio.
- **Imágenes no aparecen**: Si la extracción del Excel falló, use la opción "Editar" o "Subir Nuevo" -> "Agregar Imagen" para subirlas manualmente.
- **Columnas mal detectadas**: Asegúrese de que su Excel tenga encabezados claros en la primera fila. Si persiste, use el Mapeo Manual en la pantalla de subida.

---

# Guía de Desarrollo y Troubleshooting

Esta sección detalla problemas técnicos comunes y sus soluciones para desarrolladores.

### Problema 1: Fallo al analizar Excel (Excel parsing fails)
**Síntomas**: Error inmediato al cargar un archivo `.xlsx`.
**Solución**:
- Verifique el formato del archivo (debe ser .xlsx, .xls, o .csv).
- Verifique la instalación de SheetJS: `npm list xlsx`.
- Pruebe con un Excel simplificado (2 columnas, 5 filas) para descartar corrupción del archivo.
- Revise la consola del navegador (F12) para ver el mensaje de error exacto.

### Problema 2: Imágenes no extraídas del Excel
**Síntomas**: Los productos cargan pero sin imágenes.
**Solución**:
- La versión Community de SheetJS tiene soporte limitado para extracción de imágenes.
- **Workaround**: Use la función de carga manual de imágenes implementada en la UI.
- Verifique que las imágenes estén *incrustadas* en el Excel y no sean enlaces/fórmulas.
- Use formatos estándar (JPG, PNG).

### Problema 3: Carrusel sin efecto 3D
**Síntomas**: Los productos aparecen planos o no rotan.
**Solución**:
- Verifique que Swiper.js esté instalado.
- Asegúrese de importar `EffectCoverflow`: `import { EffectCoverflow } from 'swiper/modules'`.
- Confirme que el módulo se pasa al componente Swiper: `modules={[EffectCoverflow]}`.
- Pruebe en Chrome (mejor soporte WebGL).

### Problema 4: Cuota de LocalStorage excedida (QuotaExceededError)
**Síntomas**: Error al guardar, alerta de "No hay suficiente espacio".
**Solución**:
- Verifique el uso actual: `console.log(JSON.stringify(localStorage).length)`.
- Elimine catálogos viejos.
- La utilidad de compresión de imágenes ya reduce las imágenes a <500KB, pero considere reducir más si persiste.
- **Fase Futura**: Migrar a IndexedDB o Supabase para almacenamiento ilimitado.

### Problema 5: Rendimiento bajo por Partículas
**Síntomas**: Animaciones lentas (lag), bajos FPS.
**Solución**:
- Reducir conteo de partículas: 30 en escritorio, 15 en móvil.
- Deshabilitar en dispositivos lentos (`navigator.hardwareConcurrency < 4`).
- El componente `ParticleBackground.tsx` ya incluye lógica para degradar a un gradiente estático si falla la inicialización.

### Problema 6: Carrusel móvil no desliza (Swipe)
**Síntomas**: Gestos táctiles ignorados en móviles.
**Solución**:
- Verificar `touchStartPreventDefault: false` en config de Swiper.
- Asegurar que ningún contenedor padre tenga `touch-action: none`.
- Probar en dispositivo real, no solo en emulación DevTools.

## Contacto de Soporte
Para asistencia técnica adicional, contacte al equipo de desarrollo en: `dev@esgaming.com` (o su correo real).
