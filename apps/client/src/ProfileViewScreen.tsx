import { TabBar, type TabGo } from './ui/tabs';
import { PersonScreen } from './PersonScreen';
import { useApp } from './context/AppContext';

export function ProfileViewScreen({
  onEdit,
  go,
}: {
  onEdit: () => void;
  go?: TabGo;
}) {
  const { profile } = useApp();
  if (!profile) return null;
  return (
    <PersonScreen
      profile={profile}
      onEdit={onEdit}
      footer={go ? <TabBar active="profile" go={go} /> : null}
    />
  );
}
