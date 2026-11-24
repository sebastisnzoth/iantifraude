# Arquitectura y trabajo pendiente

Expo Router (`app/`) gestiona onboarding, pestañas y pantallas. `src/engine.ts` contiene reglas y pesos; `src/qr.ts` clasifica contenido sin abrirlo; `src/storage.ts` limita el historial a metadatos; `src/session.ts` mantiene texto en memoria; `src/report.ts` prepara informes; `src/ai/provider.ts` expone un contrato y usa únicamente el proveedor heurístico. `src/i18n.ts` contiene textos, `AppContext` preferencias y tema. Nada de esto modifica la web.

## OCR pendiente

La pantalla ofrece transcripción manual y no realiza OCR automático. Para habilitarlo hay que evaluar una biblioteca OCR local compatible con SDK 58 y sus licencias, instalarla y configurar plugins/permisos; generar un development build con código nativo, probar imágenes grandes, lenguas, privacidad y errores en Android/iOS. Expo Go o web no pueden considerarse compatibles sin prueba. No enviar imágenes a proveedores remotos sin consentimiento explícito.

## Compartir hacia la app pendiente

No se implementan share intents/extensions. Android requiere ACTION_SEND con MIME text/plain y validación de entrada; iOS requiere una Share Extension y mecanismo seguro de transferencia a la app, con configuración nativa y pruebas en dispositivos. No pedir acceso general a mensajes, contactos ni conversaciones. No afirmar soporte hasta probarlo.

## Seguridad y publicación

El código QR Pix es TLV parcial; la comprobación CRC usa bytes UTF-8, pero debe validarse con más ejemplos reales, caracteres multibyte y pagos dinámicos antes de uso crítico. Identificadores visuales y datos de QR no verifican identidad. Los permisos deben revisarse en el manifiesto generado. Probar accesibilidad, traducciones, rendimiento, modo oscuro, almacenamiento, exportación y cámara en hardware; revisar políticas y límites con asesoramiento legal. Evitar guardar entradas privadas en logs, navegación, análisis o telemetría. La futura IA remota solo con proveedor real, consentimiento y credenciales en backend; no se provee ningún backend.
