import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import { UploadSimple } from '@phosphor-icons/react';

interface UploadAreaProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  label?: string;
  hint?: string;
}

export default function UploadArea({ onDrop, accept, label = 'Drop file here', hint }: UploadAreaProps): JSX.Element {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  const fileName = acceptedFiles[0]?.name;

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 3,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive ? 'primary.50' : 'background.default',
        transition: 'border-color 0.15s, background 0.15s',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <input {...getInputProps()} />
      <UploadSimple size={36} color="#2196f3" />
      <Typography fontWeight={700} mt={1}>
        {fileName ?? label}
      </Typography>
      {hint && !fileName && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  );
}
