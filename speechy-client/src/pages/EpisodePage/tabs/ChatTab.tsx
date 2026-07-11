import { Card, CardContent } from '@mui/material';
import ChatPanel from '../../../organisms/ChatPanel';
import type { Episode } from '../../../types';

interface ChatTabProps {
  episode: Episode;
  onTabChange: (tab: string) => void;
}

export default function ChatTab({ episode }: ChatTabProps): JSX.Element {
  return (
    <Card>
      <CardContent sx={{ p: 3, height: 600, display: 'flex', flexDirection: 'column' }}>
        <ChatPanel
          episodeIds={[episode.id]}
          contextLabel={`${episode.episode_number} · ${episode.title}`}
        />
      </CardContent>
    </Card>
  );
}
