import { PersonScreen } from './PersonScreen';
import { useApp } from './context/AppContext';

export function ProfileViewScreen({ onEdit }: { onEdit: () => void }) {
  const { profile } = useApp();
  if (!profile) return null;
  return <PersonScreen profile={profile} onEdit={onEdit} />;
}
