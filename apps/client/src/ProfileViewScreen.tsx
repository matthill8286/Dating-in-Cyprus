import { ScrollView, StyleSheet, Text } from 'react-native';
import { useApp } from './context/AppContext';
import { profileViewText } from './profile';

export function ProfileViewScreen() {
  const { profile } = useApp();
  if (!profile) return null;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Profile</Text>
      <Text>{profileViewText(profile)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 8 },
});
