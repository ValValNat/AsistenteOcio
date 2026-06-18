import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

//componente reutilizable llamado MessageBubble para mostrar mensajes del chat
//  Recibe el texto y un indicador que determina si el mensaje pertenece al usuario o al bot
//  Según ese valor, aplica estilos condicionales para cambiar la posición de la burbuja 
// (izquierda o derecha), el color de fondo y el color del texto
export default function MessageBubble({ texto, esUsuario }) {
  return (
    <View style={[styles.fila, esUsuario ? styles.derecha : styles.izquierda]}>
      <View style={[styles.burbuja, esUsuario ? styles.burbujaUsuario : styles.burbujaBot]}>
        <Text style={esUsuario ? styles.textoUsuario : styles.textoBot}>{texto}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { marginVertical: 4, marginHorizontal: 10, flexDirection: 'row' },
  derecha: { justifyContent: 'flex-end' },     // mensajes del usuario a la derecha
  izquierda: { justifyContent: 'flex-start' }, // mensajes del bot a la izquierda
  burbuja: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  burbujaUsuario: { backgroundColor: '#4A148C', borderBottomRightRadius: 2 },
  burbujaBot: { backgroundColor: '#E0E0E0', borderBottomLeftRadius: 2 },
  textoUsuario: { color: '#fff', fontSize: 15 },
  textoBot: { color: '#000', fontSize: 15 },
});