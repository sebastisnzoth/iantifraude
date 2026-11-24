# AntiGolpe AI — móvil (MVP en desarrollo)

App Expo/React Native independiente de la web del repositorio. Motor heurístico local: **no es IA**, no abre enlaces ni calcula probabilidades. Los resultados no garantizan seguridad; puede haber falsos positivos y negativos.

## Ejecutar

Requiere Node.js y npm. En `mobile/`: `npm ci`, `npm start`, o `npm run web`. La cámara y las opciones de compartir/impresión dependen de la plataforma, los permisos y el entorno. Para validar Android/iOS se requiere un dispositivo o emulador compatible con Expo SDK 58; no se ha validado en ellos. `npm test` ejecuta Jest; `npx tsc --noEmit` verifica tipos.

## Funciones y límites actuales

- Análisis local en español, portugués e inglés; reglas editables en `src/engine.ts` (adaptadas del motor web). No hace consultas de reputación ni visita dominios. Puede producir errores o no reconocer estafas.
- QR con Expo Camera: interpreta URL/texto y algunos campos de Pix BR Code; el CRC no identifica al destinatario. No paga ni abre enlaces. Es un analizador básico, no validación financiera.
- Capturas: selección o cámara y **transcripción manual**; OCR automático no está implementado en ningún entorno. No se sube la imagen. El límite es 10 MB cuando la plataforma informa el tamaño; no se procesa el archivo.
- Historial desactivado por defecto; solo fecha, tipo, nivel y cantidad de señales. Preferencias y datos se pueden borrar en Ajustes. El texto de análisis queda en memoria durante la sesión, no en el historial ni en parámetros de navegación. El portapapeles, los informes compartidos, los PDF temporales y las copias hechas por otras aplicaciones están fuera del control de la app y no se borran automáticamente.
- Exportar/compartir dependen de APIs del dispositivo; la app muestra un aviso si fallan. No se han probado en hardware.
- No hay IA remota, cuentas, pagos, rastreadores publicitarios ni recepción de contenido desde otras apps. Los precios son orientativos para planes futuros sin funciones ni cobros activados.

## Builds y publicación

`eas.json` prepara perfiles APK interno y AAB de producción: `npx eas-cli build --platform android --profile preview` o `--profile production`. EAS puede requerir una cuenta gratuita, proyecto vinculado y servicios externos; no se ha ejecutado ningún build. Para compilación local son necesarios Android SDK/Gradle o macOS/Xcode para iOS. `com.antigolpe.ai` está configurado pero su disponibilidad y firma deben verificarse. Publicar en tiendas puede requerir cuentas de desarrollador y tasas, no incluidas en el presupuesto. iOS no ha sido compilado ni firmado.

Ver `ARCHITECTURE.md` y `PRIVACY.md` antes de distribuir. La política necesita revisión legal y una URL pública para tiendas. No usar como asesoramiento de seguridad definitivo.
