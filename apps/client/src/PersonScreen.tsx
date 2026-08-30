import type { ReactNode } from 'react';
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { Gallery, HeroPhoto, PersonCopy } from './personChrome';
import { PhotoStory } from './PhotoStory';
import type { Profile } from './profile';
import { OpenSafetySheet } from './SafetySheet';
import { safetyOnOwnProfile } from './safety';
import { color } from './theme';
import { ActionRow, Fixed } from './ui/deck';

export { ChatPerson } from './personChrome';

type PersonProps = {
  profile: Profile;
  onBack?: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onBlocked?: () => void;
  onUnmatched?: () => void;
  matchId?: string;
  footer?: ReactNode;
};

export function PersonScreen(props: PersonProps) {
  const [story, setStory] = useState<number | null>(null);
  if (story !== null) {
    return (
      <PhotoStory
        profile={props.profile}
        index={story}
        onIndex={setStory}
        onClose={() => setStory(null)}
        onMessage={props.onMessage}
      />
    );
  }
  return <PersonSheet {...props} onOpenStory={setStory} />;
}

function PersonSheet({
  profile,
  onBack,
  onLike,
  onPass,
  onMessage,
  onEdit,
  onBlocked,
  onUnmatched,
  matchId,
  footer,
  onOpenStory,
}: PersonProps & { onOpenStory: (index: number) => void }) {
  const { sessionToken } = useApp();
  const [openBio, setOpenBio] = useState(false);
  const [safety, setSafety] = useState(false);
  return (
    <Fixed footer={footer}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroPhoto
          profile={profile}
          onBack={onBack}
          onMore={safetyOnOwnProfile(Boolean(onEdit)) ? () => setSafety(true) : undefined}
          onOpen={() => onOpenStory(0)}
        />
        <View style={styles.card}>
          {onLike && onPass ? (
            <View style={styles.float}>
              <ActionRow onPass={onPass} onLike={onLike} />
            </View>
          ) : null}
          <PersonCopy
            profile={profile}
            openBio={openBio}
            onToggleBio={() => setOpenBio((value) => !value)}
            onMessage={onMessage}
            onEdit={onEdit}
          />
          <Gallery photos={profile.photos} name={profile.firstName} onOpen={onOpenStory} />
        </View>
      </ScrollView>
      <OpenSafetySheet
        open={safety}
        name={profile.firstName}
        profileId={profile.profileId}
        matchId={matchId}
        token={sessionToken}
        onClose={() => setSafety(false)}
        onBlocked={() => {
          setSafety(false);
          onBlocked?.();
        }}
        onUnmatched={() => {
          setSafety(false);
          onUnmatched?.();
        }}
      />
    </Fixed>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 28 },
  card: {
    backgroundColor: color.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -36,
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  float: { marginTop: -62, marginBottom: 8 },
});
