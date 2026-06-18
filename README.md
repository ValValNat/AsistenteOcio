# Asistente de Ocio y Cultura

Aplicación móvil desarrollada en React Native que permite conversar con un asistente virtual especializado en actividades culturales y de ocio. El asistente entiende lenguaje natural, mantiene conversaciones con contexto y permite interactuar tanto por texto como por voz.

---

# 1. Descripción del proyecto

## Objetivo

El objetivo de la aplicación es ofrecer un asistente conversacional al que el usuario pueda preguntar por planes de ocio y cultura (conciertos, teatro, cine, exposiciones, museos, etc.). El usuario puede escribir o hablar, y el asistente responde de forma coherente, además de leer la respuesta en voz alta.

El "cerebro" del asistente está construido con Dialogflow ES, que se encarga de entender lo que dice el usuario y de mantener el hilo de la conversación. La aplicación móvil es la interfaz que conecta con ese cerebro y añade el reconocimiento y la síntesis de voz.

## Funcionalidades principales

* Chat con un asistente virtual entrenado en Dialogflow ES.
* Envío y recepción de mensajes en lenguaje natural.
* Historial de la conversación con diferenciación visual entre los mensajes del usuario y los del asistente.
* Reconocimiento de voz: el usuario puede hablar por el micrófono y su voz se convierte en texto.
* Síntesis de voz: el asistente lee en voz alta sus respuestas.
* Conversaciones de varios pasos en las que el asistente pregunta los datos que le faltan y recuerda lo dicho anteriormente.
* Gestión de errores de conexión, respuestas vacías, fallos de reconocimiento de voz y fallos de reproducción de audio.

---

# 2. Tecnologías utilizadas

* **React Native 0.85.3** como framework para la aplicación móvil.
* **Dialogflow ES** como motor de comprensión del lenguaje natural y gestión del diálogo.

## Librerías empleadas

* **jsrsasign**: genera el token de autenticación necesario para comunicarse con la API de Dialogflow desde la aplicación.
* **react-native-tts**: síntesis de voz (lectura en alto de las respuestas).
* **expo-speech-recognition**: reconocimiento de voz, basado en el motor nativo de Android (*SpeechRecognizer*). Es un módulo compatible con la arquitectura nueva de React Native.
* **react-native-safe-area-context**: ajuste de la interfaz a las zonas seguras de la pantalla.
* **patch-package**: aplica pequeños parches a dependencias que lo necesitan.

## Control de versiones

* **Git**
* **GitHub**

---

# 3. Estructura del proyecto

```text
AsistenteOcio/
├── App.js
├── index.js
├── src/
│   ├── components/
│   │   └── MessageBubble.js
│   ├── config/
│   │   └── dialogflowConfig.js
│   ├── services/
│   │   └── dialogflowService.js
│   └── screens/
│       └── ChatScreen.js
├── patches/
└── android/
```

## Componentes principales

### dialogflowService.js

Obtiene un token de acceso a partir de la cuenta de servicio (firmando un JWT con **jsrsasign**) y envía el texto del usuario al método **detectIntent** de Dialogflow, devolviendo la respuesta del asistente.

### ChatScreen.js

Gestiona el estado de la conversación, dibuja el historial con **FlatList**, controla el campo de texto y el botón de envío, e integra el reconocimiento de voz (**expo-speech-recognition**) y la síntesis de voz (**react-native-tts**).

### MessageBubble.js

Pinta cada mensaje a un lado u otro y con un color distinto según sea del usuario o del asistente.

---

# 4. Instalación y ejecución

## Requisitos previos

* Node.js 22 o superior.
* Entorno de desarrollo de React Native para Android configurado (JDK, Android SDK y adb).
* Un dispositivo Android físico con la depuración USB activada o un emulador.

## Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd AsistenteOcio
```

## Instalar las dependencias

```bash
npm install
```

## Configurar las credenciales de Dialogflow

El archivo `src/config/dialogflowConfig.js` **no se incluye en el repositorio por seguridad**.

Debe crearse manualmente con el contenido de la cuenta de servicio de Google:

```javascript
export const SERVICE_ACCOUNT = {
  // Contenido del archivo JSON de la cuenta de servicio
};
```

## Ejecutar la aplicación

```bash
npx react-native run-android
```

---

# 5. Agente conversacional

El agente está creado en **Dialogflow ES**, con idioma español y especializado en ocio y cultura.

## Intents

El agente incluye nueve intents:

1. Default Welcome Intent
2. Default Fallback Intent
3. RecomendarPlan
4. Despedida
5. Agradecimiento
6. ConsultarHorario
7. BuscarActividad
8. ReservarEntradas
9. ConsultarPrecio

Cada intent cuenta con un mínimo de quince frases de entrenamiento.

## Entidades

### @tipo_actividad

* concierto
* teatro
* cine
* exposición
* museo
* festival
* danza
* monólogo

### @ciudad

* Sevilla
* Madrid
* Granada
* Málaga
* Córdoba
* Barcelona
* Valencia
* Cádiz

### @momento_dia

* mañana
* tarde
* noche
* fin de semana

## Contextos y flujos de varios pasos

### Buscar actividad

Si el usuario no indica el tipo o la ciudad, el asistente los pregunta antes de responder.

### Reservar entradas

El asistente pregunta para qué actividad y para cuántas personas.

### Consultar precio

Mediante el contexto `actividad-encontrada`, el asistente recuerda la actividad y la ciudad de la búsqueda anterior, permitiendo preguntas como:

> ¿Cuánto cuesta?

sin repetir los datos.

## Ejemplos de entrenamiento

* "Recomiéndame un plan para esta tarde."
* "Busca un concierto en Sevilla."
* "Quiero reservar dos entradas para el teatro."
* "¿A qué hora abren los museos?"
* "¿Cuánto cuesta?"

---

# 6. Manual de usuario

El funcionamiento detallado de la aplicación, acompañado de capturas de pantalla, se encuentra en:

```text
manual_de_usuario.pdf
```

---

# 7. Incidencias y soluciones

## Cuota de proyectos en Dialogflow

Al crear el agente apareció un error de cuota de proyectos.

**Solución:** utilizar una cuenta personal de Google en lugar de una cuenta restringida.

## Errores de Gradle con jcenter

La primera librería de voz utilizada (`@react-native-voice/voice`) y `react-native-tts` dependían de **jcenter**, repositorio ya retirado.

**Solución:** sustituirlo por **mavenCentral** y conservar el cambio mediante **patch-package**.

## Módulo de voz nulo

Aparecía:

```javascript
NativeModules.Voice = null
```

porque `@react-native-voice/voice` no era compatible con la arquitectura nueva de React Native.

**Solución:** abandonar dicha librería.

## Cambio a expo-speech-recognition

Se sustituyó la librería anterior por **expo-speech-recognition**, compatible con TurboModules y con la nueva arquitectura.

## Ajuste de versión de React Native

Los módulos de Expo requerían React Native 0.85 mientras que el proyecto estaba inicialmente en una versión superior.

**Solución:** alinear el proyecto a **React Native 0.85.3**.

## Restricciones de instalación en Xiaomi

El dispositivo bloqueaba la instalación por USB.

**Solución:** activar:

* Instalar vía USB.
* Depuración USB (ajustes de seguridad).

dentro de las opciones de desarrollador.

---

# Autor

Proyecto académico desarrollado como práctica de integración de tecnologías de procesamiento del lenguaje natural, interfaces móviles y reconocimiento de voz utilizando React Native y Dialogflow ES por Natividad V. V. 
