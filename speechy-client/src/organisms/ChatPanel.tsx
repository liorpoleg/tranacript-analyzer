import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, TextField, CircularProgress, IconButton, Paper, Chip,
} from '@mui/material';
import { PaperPlaneTilt, Robot, User, FilmSlate } from '@phosphor-icons/react';
import { useChat } from '../api/chat';
import { buildRoute } from '../constants/routes';
import type { ChatMessage } from '../types';

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480 }}>
      {contextLabel && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Context: {contextLabel}
          </Typography>
        </Box>
      )}

      {/* Message list */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pr: 0.5,
          mb: 2,
        }}
      >
        {messages.length === 0 && !chat.isLoading && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              py: 6,
              color: 'text.disabled',
            }}
          >
            <Robot size={36} weight="light" />
            <Typography variant="body2" textAlign="center">
              {noContext
                ? 'Select at least one episode to start chatting.'
                : 'Ask anything about the selected episodes.'}
            </Typography>
          </Box>
        )}

        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 1.25,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}
          >
            <Box
              sx={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: msg.role === 'user' ? 'primary.main' : '#f1f5f9',
                color: msg.role === 'user' ? '#fff' : 'text.secondary',
              }}
            >
              {msg.role === 'user' ? <User size={15} weight="fill" /> : <Robot size={15} weight="fill" />}
            </Box>

            <Box sx={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Paper
                elevation={0}
                sx={{
                  px: 1.75,
                  py: 1.25,
                  bgcolor: msg.role === 'user' ? 'primary.main' : '#f1f5f9',
                  color: msg.role === 'user' ? '#fff' : 'text.primary',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </Paper>

              {msg.role === 'assistant' && msg.episodes && msg.episodes.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 0.25 }}>
                  {msg.episodes.map((ep) => (
                    <Chip
                      key={ep.id}
                      component={Link}
                      to={buildRoute.episode(ep.id)}
                      icon={<FilmSlate size={12} weight="fill" />}
                      label={`${ep.episode_number} · ${ep.title}`}
                      size="small"
                      clickable
                      sx={{
                        fontSize: '0.7rem',
                        height: 22,
                        bgcolor: '#e3f2fd',
                        color: 'primary.dark',
                        '& .MuiChip-icon': { color: 'primary.main', ml: '6px' },
                        '&:hover': { bgcolor: '#bbdefb' },
                        textDecoration: 'none',
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}

        {chat.isLoading && (
          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: '#f1f5f9', color: 'text.secondary',
              }}
            >
              <Robot size={15} weight="fill" />
            </Box>
            <Paper
              elevation={0}
              sx={{
                px: 1.75, py: 1.5,
                bgcolor: '#f1f5f9',
                borderRadius: '4px 16px 16px 16px',
                display: 'flex', alignItems: 'center', gap: 1,
              }}
            >
              <CircularProgress size={14} thickness={5} />
              <Typography variant="body2" color="text.secondary">Thinking…</Typography>
            </Paper>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
        />
        <IconButton
          onClick={send}
          disabled={!input.trim() || noContext || chat.isLoading}
          sx={{
            bgcolor: 'primary.main', color: '#fff', borderRadius: 2.5,
            width: 40, height: 40, flexShrink: 0,
            '&:hover': { bgcolor: 'primary.dark' },
            '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
          }}
        >
          <PaperPlaneTilt size={18} weight="fill" />
        </IconButton>
      </Box>
    </Box>
  );
}
