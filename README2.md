# Alumbra - Descripción del Proyecto y Funcionamiento de la IA

Este documento proporciona una visión general de la estructura del proyecto Alumbra y explica cómo funciona el análisis de conversaciones utilizando la IA de Gemini.

## Estructura del Proyecto

A continuación se describe la organización de los archivos y carpetas principales del proyecto:

*   **`.env`**:
    Archivo para almacenar variables de entorno, como claves de API. No debe contener información sensible directamente si se versiona, usualmente se usa para desarrollo local y se añade a `.gitignore`.

*   **`next.config.ts`**:
    Archivo de configuración de Next.js. Define cómo se construye y se ejecuta la aplicación, incluyendo configuraciones para imágenes, TypeScript, ESLint, etc.

*   **`package.json`**:
    Define los metadatos del proyecto, dependencias (librerías externas) y scripts (comandos para desarrollo, construcción, etc.). Es fundamental para la gestión del proyecto con `npm` o `yarn`.

*   **`tsconfig.json`**:
    Archivo de configuración de TypeScript. Establece las reglas y opciones que el compilador de TypeScript usará para verificar y transpilar el código.

*   **`tailwind.config.ts`**:
    Archivo de configuración para Tailwind CSS. Permite personalizar el tema (colores, fuentes, espaciado) y configurar plugins para el framework CSS.

*   **`components.json`**:
    Archivo de configuración específico de `shadcn/ui`. Define la configuración de los componentes UI, como el estilo, rutas de alias y la librería de iconos.

*   **`src/`**: Carpeta principal que contiene todo el código fuente de la aplicación.
    *   **`src/app/`**: Contiene las páginas y layouts de la aplicación utilizando el App Router de Next.js.
        *   `layout.tsx`: Layout principal que envuelve todas las páginas, define la estructura HTML base, incluye fuentes globales y proveedores de contexto (como el tema).
        *   `globals.css`: Archivo CSS global donde se definen estilos base, variables CSS (para temas claro/oscuro) y utilidades de Tailwind.
        *   `page.tsx`: Componente de la página de bienvenida (ruta `/`). Muestra la introducción a Alumbra y un botón para iniciar.
        *   `questionnaire/page.tsx` & `questionnaire/questionnaire-client.tsx`: Definen la página del cuestionario (`/questionnaire`). `page.tsx` es el contenedor del servidor y `questionnaire-client.tsx` contiene la lógica interactiva del formulario y el diálogo para recoger datos del usuario.
        *   `analyzer/page.tsx` & `analyzer/analyzer-client.tsx`: Definen la página del analizador (`/analyzer`). `page.tsx` es el contenedor y `analyzer-client.tsx` maneja la entrada de texto, la llamada a la IA, la visualización de resultados y la descarga.
    *   **`src/ai/`**: Contiene la lógica relacionada con la Inteligencia Artificial (Genkit).
        *   `ai-instance.ts`: Inicializa y configura la instancia de Genkit, especificando los plugins (Google AI) y el modelo por defecto.
        *   `dev.ts`: Archivo utilizado para el desarrollo y pruebas locales de los flujos de Genkit. Importa los flujos a registrar.
        *   `flows/analyze-conversation.ts`: Define el flujo principal de Genkit (`analyzeConversationFlow`) para analizar el texto de la conversación. Incluye la definición del prompt, los esquemas de entrada/salida (con Zod) y la función exportada `analyze` que se llama desde el frontend.
    *   **`src/components/`**: Contiene componentes reutilizables de la interfaz de usuario (UI).
        *   `ui/`: Componentes base de `shadcn/ui` (Button, Card, Input, Dialog, etc.). Estos son bloques de construcción fundamentales para la UI.
        *   `theme-provider.tsx` & `theme-toggle.tsx`: Componentes para gestionar y cambiar entre temas claro y oscuro, utilizando `next-themes`.
    *   **`src/hooks/`**: Contiene hooks personalizados de React.
        *   `use-toast.ts`: Hook para gestionar y mostrar notificaciones (toasts) en la interfaz.
        *   `use-mobile.tsx`: Hook para detectar si el usuario está en un dispositivo móvil basándose en el ancho de la pantalla.
    *   **`src/lib/`**: Contiene funciones de utilidad generales.
        *   `utils.ts`: Utilidades genéricas, como la función `cn` para combinar clases de Tailwind CSS de forma condicional.
    *   **`src/services/`**: Podría contener lógica para interactuar con APIs externas o servicios de backend (aunque en este caso, la lógica principal está en el flujo AI).
        *   `shadai.ts`: Contiene la interfaz `AnalysisResult` (compartida con el flujo AI) y una función `analyzeConversation` *simulada* (mock), que ya no es la principal pero se conserva como referencia o fallback.

## Funcionamiento del Análisis con IA (Gemini)

El análisis de conversaciones en Alumbra se realiza mediante un modelo de lenguaje grande (LLM) de Google, específicamente Gemini, a través de la herramienta Genkit.

1.  **Base del Análisis:**
    La IA está instruida para actuar como un **experto psicólogo especializado en detectar abuso emocional y manipulación** en relaciones interpersonales a través de texto. Busca patrones específicos, tácticas de manipulación y lenguaje que indiquen un riesgo potencial en la dinámica de la conversación.

2.  **Prompt del Sistema (Instrucciones Clave):**
    El archivo `src/ai/flows/analyze-conversation.ts` contiene el `analysisPrompt`. Este prompt define las instrucciones precisas que recibe Gemini:
    *   **Rol:** "Eres un experto psicólogo especializado en detectar abuso emocional y manipulación..."
    *   **Tarea Principal:** Analizar la conversación proporcionada (`{{{text}}}`).
    *   **Formato de Salida Obligatorio:** La IA *debe* devolver un objeto JSON con una estructura específica definida por `AnalyzeConversationOutputSchema`. Este JSON incluye:
        *   `nivel_riesgo`: Una estimación numérica (0-100) del riesgo.
        *   `categorias_detectadas`: Una lista de categorías específicas de abuso (ej., "gaslighting", "culpabilización", "aislamiento").
        *   `ejemplos`: Frases textuales *exactas* de la conversación que justifican las categorías detectadas.
        *   `recomendaciones`: Consejos **muy específicos, elaborados y accionables**, directamente relacionados con lo detectado, explicando *por qué* ciertas frases son problemáticas y qué hacer al respecto. Se le indica evitar consejos genéricos.

3.  **Proceso de Análisis:**
    *   **Entrada del Usuario:** El usuario pega la conversación en el área de texto de la página `/analyzer`.
    *   **Llamada al Backend:** El componente `AnalyzerClient` (`src/app/analyzer-client.tsx`) toma este texto y llama a la función `analyze` exportada desde `src/ai/flows/analyze-conversation.ts`.
    *   **Ejecución del Flujo Genkit:** La función `analyze` invoca el `analyzeConversationFlow` definido en Genkit.
    *   **Interacción con Gemini:** Genkit envía el prompt (con las instrucciones y la conversación insertada) al modelo Gemini configurado (`googleai/gemini-2.0-flash`).
    *   **Procesamiento de Gemini:** Gemini procesa la conversación basándose en las instrucciones del prompt y genera la respuesta en el formato JSON solicitado.
    *   **Recepción y Validación:** Genkit recibe la respuesta JSON. El flujo `analyzeConversationFlow` la valida (asegurándose de que cumple el esquema `AnalyzeConversationOutputSchema`).
    *   **Respuesta al Frontend:** El resultado validado (el objeto `analysisResult`) se devuelve al componente `AnalyzerClient`.
    *   **Visualización:** El frontend muestra el `nivel_riesgo`, las `categorias_detectadas`, los `ejemplos` y las `recomendaciones` de forma estructurada en tarjetas y otros componentes UI.

Este enfoque asegura que la IA no solo identifique posibles problemas, sino que también proporcione una justificación clara (ejemplos) y orientación útil y específica (recomendaciones), todo ello manteniendo una estructura de datos consistente.
```