import { useParams } from 'react-router-dom';
import EpisodeChatWorkspace from '@/features/chat/components/organisms/EpisodeChatWorkspace/EpisodeChatWorkspace';
import { useSeasonEpisodes } from '@/features/episodes/services/episodes';

export default function ChatTab(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: episodes = [], isLoading } = useSeasonEpisodes(id);

  return <EpisodeChatWorkspace episodes={episodes} isLoading={isLoading} />;
}
