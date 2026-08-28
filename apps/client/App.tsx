import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from './src/api/client';
import { AppProvider, useApp } from './src/context/AppContext';
import { JoinScreen } from './src/JoinScreen';
import { loadHealth } from './src/health';

function HealthScreen() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    void loadHealth(() => api.GET('/health')).then(setStatus);
  }, []);

  return (
    <View style={styles.container}>
      <Text>cyprus-dating</Text>
      <Text>API health: {status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

function Root() {
  const { sessionToken } = useApp();
  if (!sessionToken) return <JoinScreen />;
  return <HealthScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
