// src/screens/ChatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  PermissionsAndroid, Alert,
} from 'react-native';
import Tts from 'react-native-tts';               // VOZ hablar la ia
import MessageBubble from '../components/MessageBubble';
import { enviarMensaje } from '../services/dialogflowService';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

export default function ChatScreen() {
  const [mensajes, setMensajes] = useState([
    { id: '1', texto: '¡Hola! Soy tu asistente de ocio y cultura. ¿Qué te apetece hacer?', esUsuario: false },
  ]);
  const [textoInput, setTextoInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [escuchando, setEscuchando] = useState(false); //VOZ, ¿está el micro activo?

  const listaRef = useRef(null);
  const sessionId = useRef('sesion-' + Date.now()).current;

  useEffect(() => {
    listaRef.current?.scrollToEnd({ animated: true });
  }, [mensajes]);



  //Configuro el idioma de la voz (boca) una sola vez
  useEffect(() => {
    Tts.setDefaultLanguage('es-ES');
  }, []);

  //VOZ: oyentes del micrófono (van sueltos, NO dentro del useEffect)
  useSpeechRecognitionEvent('start', () => setEscuchando(true));
  useSpeechRecognitionEvent('end', () => setEscuchando(false));

  useSpeechRecognitionEvent('result', (event) => {
    const textoReconocido = event.results?.[0]?.transcript;
    setEscuchando(false);
    if (textoReconocido) {
      enviarTexto(textoReconocido); // reutilizo la función existente
    }
  });

  useSpeechRecognitionEvent('error', () => {
    setEscuchando(false);
    Alert.alert('Error de voz', 'No te he entendido bien. Inténtalo de nuevo.');
  });

  //VOZ-> pedir permiso y empezar a escuchar
  const empezarAEscuchar = async () => {
    try {
      const permiso = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Sin permiso', 'Necesito permiso de micrófono para poder escucharte.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'es-ES',
        interimResults: false, // solo el resultado final
        continuous: false,     // se para solo al terminar de hablar
      });
    } catch (e) {
      setEscuchando(false);
      Alert.alert('Error', 'No he podido activar el micrófono.');
    }
  };



  const enviarTexto = async (textoEntrante) => {
    // Si viene de la voz usamos ese texto; si no, el de la caja
    const texto = (textoEntrante || textoInput).trim();
    if (texto === '') return;

    const msgUsuario = { id: Date.now().toString(), texto, esUsuario: true };
    setMensajes((prev) => [...prev, msgUsuario]);
    setTextoInput('');
    setCargando(true);

    try {
      const respuesta = await enviarMensaje(texto, sessionId);
      const msgBot = { id: Date.now() + 'b', texto: respuesta, esUsuario: false };
      setMensajes((prev) => [...prev, msgBot]);

      // VOZ-> el bot lee la respuesta en alto
      try {
        Tts.stop();
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
      setCargando(false);
    }
  };

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