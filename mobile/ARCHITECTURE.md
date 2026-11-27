# Arquitectura y trabajo pendiente

Expo Router (`app/`) gestiona onboarding, pestañas y pantallas. `src/engine.ts` contiene reglas y pesos; `src/qr.ts` clasifica contenido sin abrirlo; `src/storage.ts` limita el historial a metadatos; `src/session.ts` mantiene texto en memoria; `src/report.ts` prepara informes; `src/ai/provider.ts` expone un contrato y usa únicamente el proveedor heurístico. `src/i18n.ts` contiene textos, `AppContext` preferencias y tema. Nada de esto modifica la web.

## OCR nativo por validar

`expo-mlkit-ocr` integra reconocimiento local ML Kit para Android (modelo latino incluido) y Vision en iOS. `src/ocr.ts` acepta solo archivos locales de tamaño conocido hasta 10 MB y 24 megapíxeles, sanitiza el texto y no invoca servicios remotos. Hay alternativa manual si el módulo no está disponible. El autolinking Android se comprobó, pero falta compilar y probar en dispositivos Android/iOS, incluyendo permisos, tamaños, idiomas y funcionamiento sin conexión. Expo Go y web no soportan el módulo nativo.

## Compartir hacia la app pendiente

No se implementan share intents/extensions. Android requiere ACTION_SEND con MIME text/plain y validación de entrada; iOS requiere una Share Extension y mecanismo seguro de transferencia a la app, con configuración nativa y pruebas en dispositivos. No pedir acceso general a mensajes, contactos ni conversaciones. No afirmar soporte hasta probarlo.

## Seguridad y publicación

El código QR Pix es TLV parcial; la comprobación CRC usa bytes UTF-8, pero debe validarse con más ejemplos reales, caracteres multibyte y pagos dinámicos antes de uso crítico. Identificadores visuales y datos de QR no verifican identidad. Los permisos deben revisarse en el manifiesto generado. Probar accesibilidad, traducciones, rendimiento, modo oscuro, almacenamiento, exportación y cámara en hardware; revisar políticas y límites con asesoramiento legal. Evitar guardar entradas privadas en logs, navegación, análisis o telemetría. La futura IA remota solo con proveedor real, consentimiento y credenciales en backend; no se provee ningún backend.
