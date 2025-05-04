# Explicación del Error: 403 Forbidden - Generative Language API Deshabilitada

El error que se muestra en el análisis indica un problema de permisos con la API de Lenguaje Generativo de Google (la tecnología detrás de Gemini).

```
Error interno durante el análisis: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent: [403 Forbidden] Generative Language API has not been used in project 758885891118 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=758885891118 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry. [...]
```

## ¿Qué significa este error?

El mensaje clave es: **"Generative Language API has not been used in project 758885891118 before or it is disabled."**

Esto significa que:

1.  **La API no está habilitada:** La API de Lenguaje Generativo de Google, necesaria para que Alumbra funcione, no está activada en el proyecto de Google Cloud asociado con la clave API que estás utilizando (en este caso, el proyecto ID `758885891118`).
2.  **Permiso denegado:** Debido a que la API está deshabilitada, Google Cloud rechaza la solicitud de Alumbra para usar el modelo Gemini, resultando en un error `403 Forbidden`.

## ¿Cómo solucionarlo?

Para resolver este problema, necesitas habilitar la API de Lenguaje Generativo en tu proyecto de Google Cloud:

1.  **Accede al enlace proporcionado:** El propio mensaje de error te da el enlace directo para habilitar la API en tu proyecto específico:
    [https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=758885891118](https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=758885891118)

    *   *Nota:* Asegúrate de haber iniciado sesión en la cuenta de Google asociada con el proyecto `758885891118`. Si tu clave API pertenece a un proyecto diferente, el ID del proyecto en el enlace será distinto.

2.  **Habilita la API:** En la página que se abre, busca un botón que diga "Habilitar" (o "Enable"). Haz clic en él.

3.  **Espera unos minutos:** Como indica el mensaje de error ("If you enabled this API recently, wait a few minutes..."), puede tomar unos minutos para que la activación de la API se propague por los sistemas de Google.

4.  **Vuelve a intentarlo:** Después de esperar unos 5 minutos, intenta realizar un análisis en Alumbra nuevamente. El error 403 debería haber desaparecido.

**Importante:**

*   Asegúrate de que la clave API (`GOOGLE_GENAI_API_KEY` en tu archivo `.env`) pertenece al proyecto de Google Cloud donde estás habilitando la API.
*   Si sigues teniendo problemas después de habilitar la API y esperar, verifica que tu cuenta de Google Cloud tenga la facturación habilitada si es necesario para el uso de la API (aunque Gemini puede tener un nivel gratuito generoso).
