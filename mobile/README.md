# AntiGolpe AI — móvil (MVP en desarrollo)

App Expo/React Native independiente de la web del repositorio. Motor heurístico local: **no es IA**, no abre enlaces ni calcula probabilidades. Los resultados no garantizan seguridad; puede haber falsos positivos y negativos.

## Ejecutar

Requiere Node.js y npm. En `mobile/`: `npm ci`, `npm start`, o `npm run web`. La cámara y las opciones de compartir/impresión dependen de la plataforma, los permisos y el entorno. Para validar Android/iOS se requiere un dispositivo o emulador compatible con Expo SDK 58; no se ha validado en ellos. `npm test` ejecuta Jest; `npx tsc --noEmit` verifica tipos.

## Funciones y límites actuales

- Análisis local en español, portugués e inglés; reglas editables en `src/engine.ts` (adaptadas del motor web). No hace consultas de reputación ni visita dominios. Puede producir errores o no reconocer estafas.
- QR con Expo Camera: interpreta URL/texto y algunos campos de Pix BR Code; el CRC no identifica al destinatario. No paga ni abre enlaces. Es un analizador básico, no validación financiera.
- Capturas: selección o cámara y OCR local nativo mediante ML Kit en Android (y Vision en iOS), con revisión editable y alternativa manual. Se rechazan imágenes de tamaño desconocido, mayores de 10 MB o 24 megapíxeles. El reconocimiento requiere un nuevo build nativo y aún no fue validado en dispositivos; Expo Go y web usan alternativa manual.
- Historial desactivado por defecto; solo fecha, tipo, nivel y cantidad de señales. Preferencias y datos se pueden borrar en Ajustes. El texto de análisis queda en memoria durante la sesión, no en el historial ni en parámetros de navegación. El portapapeles, los informes compartidos, los PDF temporales y las copias hechas por otras aplicaciones están fuera del control de la app y no se borran automáticamente.
- Exportar/compartir dependen de APIs del dispositivo; la app muestra un aviso si fallan. No se han probado en hardware.
- No hay IA remota, cuentas obligatorias, cobros reales, rastreadores publicitarios ni recepción de contenido desde otras apps. Las compras de prueba se describen abajo; las funciones Premium futuras aún no existen.

## Builds y publicación

`eas.json` prepara perfiles APK interno y AAB de producción: `npx eas-cli build --platform android --profile preview` o `--profile production`. EAS puede requerir una cuenta gratuita, proyecto vinculado y servicios externos; no se ha ejecutado ningún build. Para compilación local son necesarios Android SDK/Gradle o macOS/Xcode para iOS. `com.antigolpe.ai` está configurado pero su disponibilidad y firma deben verificarse. Publicar en tiendas puede requerir cuentas de desarrollador y tasas, no incluidas en el presupuesto. iOS no ha sido compilado ni firmado.

Ver `ARCHITECTURE.md` y `PRIVACY.md` antes de distribuir. La política necesita revisión legal y una URL pública para tiendas. No usar como asesoramiento de seguridad definitivo.

## RevenueCat — integración de prueba, no lista para producción

La pantalla **Ajustes → AntiGolpe Pro** consulta la offering `default` y los paquetes `$rc_monthly`, `$rc_annual` y `$rc_lifetime` del proyecto existente `projad03807a`. Usa precios devueltos por RevenueCat y evalúa únicamente el entitlement activo `antigolpe_pro`. Las operaciones de compra y restauración usan el **Test Store**, no productos reales. El SDK se inicializa solo al solicitar planes; RevenueCat genera un usuario anónimo. El análisis básico y consejos siguen gratuitos; no existen aún funciones avanzadas Premium. No se crearon productos ni proyectos.

Se requiere un **development build nativo**, no Expo Go ni web. El perfil EAS `development` configura la clave pública de Test Store y `developmentClient: true`: `npx eas-cli build --platform android --profile development` o `--platform ios --profile development`; después `npx expo start --dev-client`. Esto puede requerir una cuenta EAS, proyecto EAS vinculado, herramientas/firmas y acceso a los servidores RevenueCat. Para desarrollo local, establecer `ANTIGOLPE_RC_TEST=1` y `ANTIGOLPE_RC_TEST_KEY` con la clave pública de Test Store antes de generar el development build y levantar Metro. No usar claves secretas.

El SDK no se inicializa en web, Expo Go ni builds sin `__DEV__`; `app.config.js` rechaza una clave de prueba activada en perfiles EAS distintos de `development`. No usar variables de prueba al crear ningún build distribuible, ni publicar Test Store. Antes de lanzar una versión real habría que implementar y revisar configuración de claves públicas de producción por plataforma y controles de publicación; no están implementados aquí.

**Validación manual pendiente:** instalar el development build en Android/iOS, confirmar que se cargan los tres paquetes con sus precios reales de Test Store, comprar cada uno, comprobar el entitlement, cancelar y provocar error, reiniciar y restaurar con la identidad adecuada. Las pruebas Jest usan mocks y no prueban ni contactan RevenueCat. No se ha compilado ni ejecutado un development build aquí, ni verificado compras o restauración reales en Test Store.

**Privacidad:** al solicitar Premium, RevenueCat recibe un identificador anónimo y datos de compra; se requiere Internet. No se le envían los mensajes analizados. Borrar los datos locales desde Ajustes elimina el historial y preferencias de AntiGolpe, pero no garantiza borrar la identidad almacenada por el SDK o registros del proveedor; la eliminación del lado de RevenueCat requiere un proceso específico y revisión de privacidad antes de distribuir.

### Paywall y catálogo existente

El botón «Abrir paywall de prueba» solicita la offering `default` existente y llama `RevenueCatUI.presentPaywall` con esa offering. Tras cerrarlo vuelve a leer `CustomerInfo`; ni el resultado de la interfaz ni un precio conceden acceso por sí solos. Si no existe la offering o falla el paywall se informa del error. El paywall debe configurarse y localizarse en el dashboard existente; no se ha accedido al dashboard ni comprobado que esté configurado. La app ofrece también botones de compra y restauración propios.

En el dashboard del proyecto `projad03807a` / app `app3785e743f7`, comprobar —sin duplicar— que la offering `default` contiene los paquetes `$rc_monthly`, `$rc_annual`, `$rc_lifetime`, asociados a los productos de prueba correspondientes, y que cada producto concede el entitlement `antigolpe_pro`. Los identificadores de paquetes **no son necesariamente los ID de producto** de la tienda; `monthly`, `yearly` y `lifetime` deben verificarse en el proyecto existente. Los precios propuestos no se incorporan al código: se muestran los precios devueltos por el SDK.

Al recibir CustomerInfo o volver la app al primer plano se actualiza el estado según el entitlement activo reportado por el SDK; no se infiere la vigencia a partir de una compra anterior. Como RevenueCat puede usar caché, el estado sin conexión no garantiza una comprobación en tiempo real. La restauración de usuarios anónimos y el cambio de dispositivo dependen de las reglas de restauración y de la tienda; deben probarse con las identidades de test correspondientes.

**Customer Center:** no está activado; la documentación consultada indica que requiere planes Pro o Enterprise de RevenueCat, incompatible con el presupuesto inicial de US$ 0 salvo que el proyecto ya disponga de acceso. La restauración básica está disponible en la pantalla propia sin asumir ese servicio. Consultar [Customer Center](https://www.revenuecat.com/docs/tools/customer-center) antes de habilitarlo.

La preconfiguración nativa Android usa `singleTop` para evitar que un cambio de aplicación durante la compra la cancele. Se verificó el manifiesto generado por `expo prebuild` y el autolinking de los módulos en Android/iOS; esto **no** es una compilación ni una prueba de compra en un dispositivo. Ver también la [instalación React Native de RevenueCat](https://www.revenuecat.com/docs/getting-started/installation/reactnative).

### Auditoría de dependencias (24 de noviembre de 2026)

`npm audit` informó 22 vulnerabilidades moderadas, sin altas ni críticas. Con `npm audit --omit=dev` aparecen 3 moderadas: `expo` → `@expo/fingerprint` → `minimatch`, asociadas a [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Esto describe la resolución npm, no demuestra que el problema sea explotable desde la app. La solución automática sugerida para Expo supone cambiar de versión mayor; no se aplicó a ciegas porque podría romper la compatibilidad del SDK. Revisar versiones compatibles y volver a auditar antes de publicar.
