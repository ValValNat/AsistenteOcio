// App.js
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import ChatScreen from './src/screens/ChatScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#4A148C" />
      <ChatScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
});