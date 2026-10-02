import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import { UploadSimple } from '@phosphor-icons/react';
import styles from './UploadArea.module.css';

interface UploadAreaProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export default function UploadArea({ onDrop, accept, label = 'Drop file here', hint, disabled }: UploadAreaProps): JSX.Element {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled,
  });

  const fileName = acceptedFiles[0]?.name;

  return (
    <Box
      {...getRootProps()}
      className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''} ${disabled ? styles.dropzoneDisabled : ''}`.trim()}
    >
      <input {...getInputProps()} />
      <UploadSimple size={36} color="#2F6277" />
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
