//-----------------------IMPORTS--------------------------
//3 hooks:
//useState guarda datos que cambian
//useRef guarda referencias sin volver a renderizar
//useEffect ejecuta código cuando ocurre algo
import React, { useState, useRef, useEffect } from 'react';

//componentes visuales
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  PermissionsAndroid, Alert,
} from 'react-native';
//textToSpeech permite que lea el texto en voz alta
import Tts from 'react-native-tts';               // VOZ hablar el bot

//cada mensaje es un componente de MessageBubble
import MessageBubble from '../components/MessageBubble';

//nos conecta con DialogFlow
import { enviarMensaje } from '../services/dialogflowService';

//reconicimiento de voz
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';



//----------------------------------------------------------------------------------
export default function ChatScreen() {

  //-------------------------MENSAJES-----------------
  //Guarda todos los mensajes del chat-> inicialmente hay uno
  const [mensajes, setMensajes] = useState([
    { id: '1', texto: '¡Hola! Soy tu asistente de ocio y cultura. ¿Qué te apetece hacer?', esUsuario: false },
  ]);

  //lo que el usuario escribe
  const [textoInput, setTextoInput] = useState('');
  //si el bot está respondiendo
  const [cargando, setCargando] = useState(false);
  //si el micrófono está escuchando
  const [escuchando, setEscuchando] = useState(false); //VOZ, ¿está el micro activo?

  //lista de mensajes, permite hacer scrollToEnd()
  const listaRef = useRef(null);
  //crea una sesión única
  const sessionId = useRef('sesion-' + Date.now()).current;

  //scroll automático -> cada vez que cambia "mensajes" se mueve al final
  useEffect(() => {
    listaRef.current?.scrollToEnd({ animated: true });
  }, [mensajes]);


//---------------------------------VOCES----------------------
  //Configuro el idioma de la voz (boca) una sola vez
  useEffect(() => {
    Tts.setDefaultLanguage('es-ES');
  }, []);

  //eventos del micrófono
  //VOZ: oyentes del micrófono (van sueltos, NO dentro del useEffect)
  useSpeechRecognitionEvent('start', () => setEscuchando(true)); //al empezar a escuchar, setEscuchando es true
  useSpeechRecognitionEvent('end', () => setEscuchando(false));

  //cuando reconoce texto
  useSpeechRecognitionEvent('result', (event) => {
    //lo que dice el usuario-> extrae el texto
    const textoReconocido = event.results?.[0]?.transcript;
    setEscuchando(false);
    if (textoReconocido) {
      enviarTexto(textoReconocido); // reutilizo la función existente para el boton Enviar
    }
  });

  //si falla el reconocimiento de voz
  useSpeechRecognitionEvent('error', () => {
    setEscuchando(false);
    Alert.alert('Error de voz', 'No te he entendido bien. Inténtalo de nuevo.');
  });

  //VOZ-> pedir permiso y empezar a escuchar
  //activar el micrófono al pulsar el emoji de micrófono
  const empezarAEscuchar = async () => {
    try {
      //pedir permiso
      const permiso = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Sin permiso', 'Necesito permiso de micrófono para poder escucharte.');
        return;
      }

      //empieza a escuchar en español
      ExpoSpeechRecognitionModule.start({
        lang: 'es-ES',
        interimResults: false, // solo el resultado final, no muestra resultados parciales
        continuous: false,     // se para solo al terminar de hablar
      });
    } catch (e) {
      setEscuchando(false);
      Alert.alert('Error', 'No he podido activar el micrófono.');
    }
  };


//se usa tanto para teclado como para voz
  const enviarTexto = async (textoEntrante) => {
    // Si viene de la voz usamos textoEntrante, si no, textoInput
    const texto = (textoEntrante || textoInput).trim();
    //si enviamos un mensaje vacío
    if (texto === '') return;

    //creamos el mensaje del usuario
    //ej: texto: "Hola", esUsuario: true
    const msgUsuario = { id: Date.now().toString(), texto, esUsuario: true };
    //añadimos el mensaje al chat-> prev es como un .add en java al 
    //añadir elementos a una colección, pero aqui creamos una colección nueva en lugar
    //de editar la existente
    setMensajes((prev) => [...prev, msgUsuario]);
    setTextoInput(''); //limpiamos la caja donde escribe el usuario
    setCargando(true); //mostramos carga

    try {
      //consultamos dialogflow, envio Hola y recibo una respuesta
      const respuesta = await enviarMensaje(texto, sessionId);
      //creamos el mensaje del bot
      const msgBot = { id: Date.now() + 'b', texto: respuesta, esUsuario: false };

      //añadimos el mensaje al chat
      setMensajes((prev) => [...prev, msgBot]);


      // VOZ-> el bot lee la respuesta en alto
      try {
        //por si acaso paramos cualquier voz anterior del bot
        Tts.stop();
        //lee la respuesta
        Tts.speak(respuesta);
      } catch (e) {
        // Si falla el audio, no rompemos la app, simplemente no suena
      }
    } catch (error) {
      const msgError = {
        id: Date.now() + 'e',
        texto: 'No he podido conectar con el asistente. Revisa tu conexión a internet e inténtalo de nuevo.',
        esUsuario: false,
      };
      setMensajes((prev) => [...prev, msgError]);
    } finally {
      //siempre se ejecuta el finally
      setCargando(false);
    }
  };


  //View style-> interfaz visual
  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.cabecera}>
        <Text style={styles.tituloCabecera}>Asistente de Ocio y Cultura</Text>
      </View>

      <FlatList
        ref={listaRef}
        data={mensajes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble texto={item.texto} esUsuario={item.esUsuario} />
        )}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {cargando && (
        <View style={styles.escribiendo}>
          <ActivityIndicator size="small" color="#4A148C" />
          <Text style={styles.escribiendoTexto}>El asistente está escribiendo...</Text>
        </View>
      )}

      <View style={styles.barraInferior}>
        {/* 🎤 VOZ: botón de micrófono */}
        <TouchableOpacity
          style={[styles.botonMic, escuchando && styles.botonMicActivo]}
          onPress={empezarAEscuchar}
        >
          <Text style={styles.micTexto}>{escuchando ? '🔴' : '🎤'}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={textoInput}
          onChangeText={setTextoInput}
          placeholder="Escribe o pulsa el micro..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.boton} onPress={() => enviarTexto()}>
          <Text style={styles.botonTexto}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  cabecera: { backgroundColor: '#4A148C', padding: 16 },
  tituloCabecera: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  escribiendo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  escribiendoTexto: { marginLeft: 8, color: '#666', fontStyle: 'italic' },
  barraInferior: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#ddd', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 16, fontSize: 15 },
  boton: { backgroundColor: '#4A148C', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center', marginLeft: 8 },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
  botonMic: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  botonMicActivo: { backgroundColor: '#FFCDD2' }, // rojo claro cuando escucha
  micTexto: { fontSize: 20 },
});