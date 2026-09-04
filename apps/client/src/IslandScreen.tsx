import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from './context/AppContext';
import { IslandMap } from './IslandMap';
import { IslandBack } from './hostChrome';
import type { PeopleStackParamList } from './navigation/types';
import { shouldLoadMore } from './page';
import { usePool } from './queries/feeds';
import { Fixed } from './ui/deck';

export function IslandScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PeopleStackParamList>>();
  const { sessionToken } = useApp();
  const pool = usePool(sessionToken);

  return (
    <Fixed>
      <IslandMap
        people={pool.people}
        city="all"
        loading={pool.loading}
        onOpen={(profile) => navigation.navigate('Person', { profile })}
        onBrowseIndex={(index) => {
          if (shouldLoadMore(index, pool.people.length, pool.hasMore)) pool.loadMore();
        }}
      />
      <IslandBack onBack={() => navigation.goBack()} />
    </Fixed>
  );
}
