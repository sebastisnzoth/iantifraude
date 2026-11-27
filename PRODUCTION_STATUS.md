# AntiGolpe AI · Estado del candidato Android

27 de noviembre de 2026 · com.antigolpe.ai · versión 1.0.0, código 2.
[Rama y revisión](https://github.com/sebastisnzoth/iantifraude/pull/5)

| Estado | Prioridad | Área y evidencia |
|---|---|---|
| HECHO Y VERIFICADO | P0 | Se reutilizaron rama, proyecto EAS y proyecto RevenueCat. Se creó la asociación Play app0ecca82918, sin duplicar la Test Store. |
| HECHO Y VERIFICADO | P1 | Entrada Android para compartir texto voluntariamente, commit 2bc163d. Dos pruebas automatizadas cubren entrada al editor y descarte de archivos. |
| HECHO Y VERIFICADO | P0 | Pruebas locales del candidato: 48 Jest móviles, 11 Node (web y servidor) y 3 recorridos Chromium en ES/PT/EN. TypeScript correcto, lint sin errores con advertencias, exportación JavaScript Android completada. |
| IMPLEMENTADO, PENDIENTE DE VALIDACIÓN | P0 | Paywall nativo localizado, planes de tienda, restauración, gestión de suscripciones, verificación firmada, control de expiración y de caché. La vía Google Play excluye Test Store y compra vitalicia. Commit c84eb90. |
| IMPLEMENTADO, PENDIENTE DE VALIDACIÓN | P1 | Reglas financieras, consulta de lista CERT Polska, informes ampliados, perfiles familiares locales, contactos de confianza, avisos regionales incluidos en la app y asistente con alternativa heurística. Pendientes cámara, OCR, QR, impresión, compartir y accesibilidad en dispositivo. |
| IMPLEMENTADO, PENDIENTE DE VALIDACIÓN | P1 | Worker opcional con firma de instalación, autorización de RevenueCat, consentimiento por mensaje, cuotas, protección contra repetición y validación de resultados. Inferencia real y configuración de proveedor pendientes. |
| HECHO Y VERIFICADO | P0 | npm audit comunicó cero hallazgos en raíz y 22 moderados en mobile, sin altos ni críticos. La auditoría de dependencias no sustituye una revisión integral del código y del binario. |
| BLOQUEADO | P0 | RevenueCat informa que la credencial de servicio Play está sin configurar. Validar catálogo y precios en Play, compra, reinstalación/restauración, cancelación, expiración y reembolso en la tienda. |
| BLOQUEADO | P0 | Play Console: versión previa 1 en prueba cerrada, panel 2/11. Faltan ficha completa, país, formularios financieros y de salud y demás tareas del panel. El revisor automático rechazó seleccionar la declaración de salud en representación del titular. Al consultar había 0 de los 12 verificadores requeridos durante 14 días consecutivos. |
| PENDIENTE | P1 | Capturas reales en Android, evidencia de rendimiento y accesibilidad, política pública actualizada para el candidato y revisión final de declaraciones de datos. |
| PENDIENTE | P1 | Antigüedad de dominios con fuentes fiables y evaluación de sostenibilidad del vitalicio. Alertas son ediciones locales fechadas. |
| PENDIENTE | P0 | APK y AAB del candidato, SHA-256, verificación de instalación y aprobación en prueba cerrada. Mantener producción sin cambios hasta completar estos controles. |

## Costos y privacidad

Presupuesto adicional autorizado US$ 0. Los servicios remotos permanecen desactivados sin configuración explícita. No se activó ningún producto comercial. El borrador de privacidad describe los datos locales, la facturación y el envío voluntario a IA. El informe final de seguridad y la validación de licencias y cuotas siguen abiertos.
