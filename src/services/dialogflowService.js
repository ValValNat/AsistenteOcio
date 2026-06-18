//envía los mensajes del user al bot

//librería que genera JWT firmados
import { KJUR } from 'jsrsasign';
//objeto con las credenciales de google
import { SERVICE_ACCOUNT } from '../config/dialogflowConfig';

//guardamos el id del proyecto
const PROJECT_ID = SERVICE_ACCOUNT.project_id;

// Guardamos el permiso (token) para no pedirlo en cada mensaje
//son variables globales
let tokenGuardado = null;
let tokenCaduca = 0;

//PASO 1 -> Conseguir el "permiso" (token) de Google
async function obtenerToken() {
  // Si hay token guardado y todavía no ha caducado, lo obtenemos 
  if (tokenGuardado && Date.now() < tokenCaduca) {
    return tokenGuardado;
  }

  //nos da milisegundos desde 1 enero de 1970
  //dividimos entre 1000 porque JWT usa segundos
  //Math.floor hace que no nos de decimales
  const ahora = Math.floor(Date.now() / 1000);

  // Creamos un "pase firmado" (JWT) usando la clave privada
  //es como un mapa
  const cabecera = { alg: 'RS256', typ: 'JWT' };
  //mi cuenta de servicio
  const datos = {
    iss: SERVICE_ACCOUNT.client_email,
    //scope son lso permisos solicitados
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    //a quién va dirigido
    aud: 'https://oauth2.googleapis.com/token',
    //creado ahora  
    iat: ahora,
    //caduca en una hora
    exp: ahora + 3600,
  };

  //.stringify convierte un objeto en texto JSON
  const jwt = KJUR.jws.JWS.sign(
    'RS256',
    JSON.stringify(cabecera),
    JSON.stringify(datos),
    SERVICE_ACCOUNT.private_key
  );

  // Cambiamos ese pase por un token de acceso real
  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  
  const json = await respuesta.json();

  if (!json.access_token) {
    throw new Error('No se pudo obtener el permiso de Google');
  }

  tokenGuardado = json.access_token;
  tokenCaduca = Date.now() + 50 * 60 * 1000; // válido unos 50 minutos
  return tokenGuardado;
}

// PASO 2-> Enviar el mensaje del usuario al bot 
export async function enviarMensaje(texto, sessionId) {
  const token = await obtenerToken();

  const url = `https://dialogflow.googleapis.com/v2/projects/${PROJECT_ID}/agent/sessions/${sessionId}:detectIntent`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queryInput: {
        text: { text: texto, languageCode: 'es' },
      },
    }),
  });

  const json = await respuesta.json();

  // La respuesta del bot 
  const textoRespuesta = json?.queryResult?.fulfillmentText;

  // Gestión de "respuesta vacía" 
  if (!textoRespuesta) {
    return 'No he entendido bien tu mensaje. ¿Puedes decirlo de otra forma?';
  }

  return textoRespuesta;
}