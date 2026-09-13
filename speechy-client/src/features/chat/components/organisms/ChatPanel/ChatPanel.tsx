import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, TextField, CircularProgress, IconButton, Paper, Chip,
} from '@mui/material';
import { PaperPlaneTilt, Robot, User, FilmSlate } from '@phosphor-icons/react';
import { useChat } from '@/features/chat/services/chat';
import { buildRoute } from '@/core/constants/routes';
import type { ChatMessage } from '@/core/types';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
  episodeIds: string[];
  contextLabel?: string;
}

export default function ChatPanel({ episodeIds, contextLabel }: ChatPanelProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = useChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat.isLoading]);

  const send = () => {
    const text = input.trim();
    if (!text || chat.isLoading || episodeIds.length === 0) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');

    chat.mutate(
      { episodeIds, messages: newMessages },
      {
        onSuccess: ({ reply, episodes }) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: reply, episodes }]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
          ]);
        },
      },
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const noContext = episodeIds.length === 0;

  return (
    <Box className={styles.root}>
      {contextLabel && (
        <Box className={styles.contextLabel}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" className={styles.contextLabelText}>
            Context: {contextLabel}
          </Typography>
        </Box>
      )}

      <Box className={styles.messageList}>
        {messages.length === 0 && !chat.isLoading && (
          <Box className={styles.emptyState}>
            <Robot size={36} weight="light" />
            <Typography variant="body2" textAlign="center">
              {noContext
                ? 'Select at least one episode to start chatting.'
                : 'Ask anything about the selected episodes.'}
            </Typography>
          </Box>
        )}

        {messages.map((msg, i) => (
          <Box key={i} className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : ''}`.trim()}>
            <Box className={`${styles.avatar} ${msg.role === 'user' ? styles.avatarUser : ''}`.trim()}>
              {msg.role === 'user' ? <User size={15} weight="fill" /> : <Robot size={15} weight="fill" />}
            </Box>

            <Box className={styles.messageBody}>
              <Paper elevation={0} className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : ''}`.trim()}>
                {msg.content}
              </Paper>

              {msg.role === 'assistant' && msg.episodes && msg.episodes.length > 0 && (
                <Box className={styles.sourceChips}>
                  {msg.episodes.map((ep) => (
                    <Chip
                      key={ep.id}
                      component={Link}
                      to={buildRoute.episode(ep.id)}
                      icon={<FilmSlate size={12} weight="fill" />}
                      label={`${ep.episode_number} · ${ep.title}`}
                      size="small"
                      clickable
                      className={styles.sourceChip}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}

        {chat.isLoading && (
          <Box className={styles.loadingRow}>
            <Box className={styles.avatar}>
              <Robot size={15} weight="fill" />
            </Box>
            <Paper elevation={0} className={styles.loadingBubble}>
              <CircularProgress size={14} thickness={5} />
              <Typography variant="body2" color="text.secondary">Thinking…</Typography>
            </Paper>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      <Box className={styles.inputRow}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder={noContext ? 'Select episodes first…' : 'Ask about the transcript…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={noContext || chat.isLoading}
          className={styles.textField}
        />
        <IconButton
          onClick={send}
          disabled={!input.trim() || noContext || chat.isLoading}
          className={styles.sendButton}
        >
          <PaperPlaneTilt size={18} weight="fill" />
        </IconButton>
      </Box>
    </Box>
  );
}
