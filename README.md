# Alumbra

Esta es una aplicación Next.js que analiza conversaciones en busca de señales de abuso emocional o manipulación utilizando IA (Gemini a través de Genkit).

## Ejecutar la Aplicación Localmente

Para ejecutar la aplicación en tu máquina local, sigue estos pasos:

1.  **Instalar dependencias:**
    Si aún no lo has hecho, instala las dependencias del proyecto usando npm (o yarn/pnpm):
    ```bash
    npm install
    # o
    # yarn install
    # o
    # pnpm install
    ```

2.  **Configurar Variables de Entorno:**
    *   Crea un archivo llamado `.env` en la raíz del proyecto si no existe.
    *   Abre el archivo `.env` y añade tus claves API:
        ```dotenv
        GOOGLE_GENAI_API_KEY=TU_CLAVE_API_DE_GOOGLE_GENAI_AQUI

        # --- Configuración de SendGrid (para correos de emergencia) ---
        # 1. Crea una cuenta en SendGrid (https://sendgrid.com/)
        # 2. Genera una Clave API. Asegúrate de darle permisos para enviar correos ('Mail Send').
        # 3. Verifica un dominio o una dirección de correo electrónico para usar como remitente ('From').
        SENDGRID_API_KEY=TU_CLAVE_API_DE_SENDGRID_AQUI
        SENDGRID_FROM_EMAIL=tu_correo_verificado@ejemplo.com
        ```
        **Importante:** Reemplaza `TU_CLAVE_API_DE_GOOGLE_GENAI_AQUI`, `TU_CLAVE_API_DE_SENDGRID_AQUI` y `tu_correo_verificado@ejemplo.com` con tus valores reales. **Nunca compartas tus claves API públicamente.**

3.  **Ejecutar el servidor de desarrollo:**
    Inicia el servidor de desarrollo de Next.js usando el siguiente comando:
    ```bash
    npm run dev
    # o
    # yarn dev
    # o
    # pnpm dev
    ```
    Este comando usualmente inicia el servidor en `http://localhost:9002` (como se especifica en el script `package.json`).

4.  **Abrir la aplicación:**
    Abre tu navegador web y navega a `http://localhost:9002`.

La aplicación utiliza Next.js, que renderiza páginas dinámicamente. No hay un archivo HTML estático para abrir directamente; necesitas ejecutar el servidor de desarrollo para ver la aplicación.

## Funcionalidad de Correo de Emergencia

La aplicación puede enviar un correo electrónico a un contacto de emergencia si detecta un riesgo inminente (ej. ideación suicida, amenazas directas) durante el análisis de la conversación.

*   **Configuración:** Esta funcionalidad requiere una clave API de SendGrid y una dirección de correo electrónico de remitente verificada, configuradas en el archivo `.env` como se describió anteriormente.
*   **Uso:** El usuario tiene la opción de proporcionar un correo electrónico de emergencia al completar el cuestionario inicial.
*   **Activación:** Si la IA marca `riesgo_inminente` como `true` en el análisis Y el usuario proporcionó un correo de emergencia, la aplicación intentará enviar una notificación a ese correo utilizando SendGrid.
*   **Contenido del Correo:** El correo incluye el nombre del usuario, un resumen del riesgo detectado y detalles clave del análisis.
*   **Limitaciones:** El envío depende de la configuración correcta de SendGrid y de que el servicio esté operativo. No se garantiza la entrega. Esta función es una alerta y no reemplaza la búsqueda de ayuda profesional o de emergencia inmediata.
