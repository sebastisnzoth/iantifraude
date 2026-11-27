# Android: preparación de distribución — no listo para publicar

## Estado verificable (2026-11-24)

- CI ejecuta `npm ci` y pruebas de web y móvil, TypeScript y exportación del bundle JS de Android. No compila un APK ni prueba hardware.
- Se generó proyecto Android con `EXPO_OFFLINE=1 npx expo prebuild --platform android --no-install`; Expo detecta el módulo nativo OCR. No prueba que compile ni que reconozca imágenes.
- `CI=1 npx -y eas-cli@latest build --platform android --profile development --non-interactive` falló: `An Expo user account is required to proceed` / `Either log in with eas login or set the EXPO_TOKEN environment variable ...`. No se generó APK. Este entorno no tiene Java, Android SDK ni adb y no hay dispositivo Android disponible. No compartir credenciales o tokens en el chat.
- Falta verificar en dispositivo: OCR local y manual, cámara y denegación, QR/Pix (sin abrir enlaces ni pagar), exportación PDF y compartido, avión/offline, modos claro/oscuro, accesibilidad, y flujos Test Store (planes, compra, cancelación, restauración, expiración y entitlement). Las pruebas Jest del SDK usan mocks: no son compras reales ni validación de RevenueCat.
- `npm audit`: 22 moderadas, cero altas/críticas; `--omit=dev`: 3 moderadas. Cadena Expo → @expo/fingerprint → minimatch, aviso GHSA-g3hv-75wg-m249. Las versiones instaladas 9.0.9/10.2.6 están dentro del rango afectado de dicho aviso; la sugerencia automática de npm incluye cambios de versión mayor de Expo/Jest. No se aplicaron actualizaciones forzadas ni se afirma corrección. Antes de distribución, evaluar versiones y actualizar solo con compatibilidad validada en builds y dispositivos.

## Permisos y privacidad

En el manifiesto generado aparecen CAMERA, INTERNET, READ/WRITE_EXTERNAL_STORAGE limitados a API 32, SYSTEM_ALERT_WINDOW y VIBRATE; RECORD_AUDIO figura marcado para eliminación. El manifiesto final fusionado puede añadir permisos de dependencias (por ejemplo, facturación); inspeccionarlo tras compilar `app/build/outputs/logs/manifest-merger-*-report.txt` y APK/AAB con herramientas Android. SYSTEM_ALERT_WINDOW puede estar asociado a desarrollo; confirmar que no esté en release. Evaluar permisos de almacenamiento legacy y uso del selector de fotos antes de quitarlos: no se ha probado en API antiguas. Android backup está deshabilitado en configuración; validar su impacto en restauración de identidad anónima/compras.

OCR en Android usa ML Kit local y modelo latino incluido. Solo acepta `file://` / `content://`, dimensiones positivas y tamaño conocido hasta 10 MB y 24 megapíxeles; el texto puede corregirse antes del análisis. Si tamaño o módulo no están disponibles, usar entrada manual. No se envían imágenes por el código de la app. Pruebas reales de extracción y offline siguen pendientes.

## Checklist Google Play

1. Revisar nombre, icono, capturas, ficha, categoría y disponibilidad de `com.antigolpe.ai`; no se ha reservado ni comprobado.
2. Revisar legalmente `PRIVACY.md`, identificar responsable/contacto, publicar URL HTTPS de privacidad y completar Data Safety según el build final y todas sus dependencias, incluido RevenueCat. Verificar borrado y retención, incluyendo SDK y documentos compartidos.
3. Confirmar acceso y permisos mínimos del APK/AAB final; probar en Android de distintas versiones, TalkBack, tamaño de fuente, offline y cámara rechazada. No solicitar acceso general a mensajes o contactos.
4. Verificar todos los flujos antifraude, resultados y limitaciones, errores, QR, captura y PDF, incluyendo amenazas y falsos negativos. No prometer protección absoluta.
5. Completar pruebas reales de RevenueCat Test Store con los tres paquetes y entitlement. Revisar el dashboard existente sin crear proyectos o productos duplicados. La app actual **no implementa claves de producción ni cobros reales**.
6. Configurar una cuenta de desarrollador, políticas, contenido y distribución apropiada; la tienda puede requerir tasas y verificación externa. AAB firmado, firma administrada, número de versión y lanzamiento interno deben prepararse y verificarse por el responsable.
7. Nunca publicar un build con Test Store. La configuración limita la clave de test al perfil `development` y bloquea inicialización sin `__DEV__`, pero se debe inspeccionar el artefacto y la configuración de release antes de subirlo.

## Comandos para reproducir cuando haya acceso

```sh
cd mobile
npm ci
npm test
npx tsc --noEmit
npx eas-cli login
npx eas-cli build --platform android --profile development
```

Instalar el APK generado, iniciar Metro con `ANTIGOLPE_RC_TEST=1` y la variable `ANTIGOLPE_RC_TEST_KEY` pública del perfil de desarrollo, y ejecutar la lista anterior. Requiere acceso a Expo/EAS, al proyecto RevenueCat existente y un dispositivo o emulador compatible. El resultado de build y cada prueba deben registrarse con versión, dispositivo y evidencia; no declarar éxito anticipadamente.
