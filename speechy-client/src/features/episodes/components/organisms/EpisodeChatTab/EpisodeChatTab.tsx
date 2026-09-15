import { Card, CardContent } from '@mui/material';
import ChatPanel from '@/features/chat/components/organisms/ChatPanel/ChatPanel';
import type { Episode } from '@/core/types';
import styles from './EpisodeChatTab.module.css';

interface ChatTabProps {
  episode: Episode;
  onTabChange: (tab: string) => void;
}

export default function ChatTab({ episode }: ChatTabProps): JSX.Element {
  return (
    <Card>
      <CardContent className={styles.cardContent}>
        <ChatPanel
          episodeIds={[episode.id]}
          contextLabel={`${episode.episode_number} · ${episode.title}`}
        />
      </CardContent>
    </Card>
  );
}
