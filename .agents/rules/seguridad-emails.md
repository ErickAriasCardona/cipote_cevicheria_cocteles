# Regla de Seguridad: Enlaces y Comunicaciones por Correo Electrónico

## Principio General
**NUNCA** enviar, exponer ni mostrar enlaces crudos, directos o URLs que expongan servicios internos o de infraestructura de backend (por ejemplo: `*.supabase.co/...`, tokens expuestos en texto plano, endpoints internos de autenticación o API).

## Directrices de Implementación
1. **Solo Botones de Acción Estilizados:** Todas las comunicaciones por correo (confirmación de cuenta, restablecimiento de contraseña, notificaciones, etc.) deben contener únicamente botones de acción visualmente limpios y estilizados con texto claro (ej. "Confirmar mi correo", "Restablecer contraseña").
2. **Prohibición de Fallback en Texto Plano:** Queda estrictamente prohibido incluir bloques de texto con URLs completas tipo:
   > "Si el botón no abre directamente, copia y pega el siguiente enlace: https://..."
3. **Redirección Segura en Producción:** Las URLs de redirección (`redirect_to` o `redirectTo`) deben apuntar explícitamente al frontend de la aplicación autorizada (`https://cipote-ceviche-cocteles.vercel.app`), nunca a `localhost` ni endpoints no mapeados.
