import { useParams } from 'react-router-dom';
import { useShowKnowledge } from '@/features/knowledge/services/knowledge';
import { useShowQuestions } from '@/features/knowledge/services/questions';
import KnowledgePanel from '@/features/knowledge/components/organisms/KnowledgePanel/KnowledgePanel';
import QuestionsPanel from '@/features/knowledge/components/organisms/QuestionsPanel/QuestionsPanel';
import TwoColumnLayout from '@/core/components/templates/TwoColumnLayout/TwoColumnLayout';

export default function SettingsTab(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: knowledge = [], isLoading: kLoading } = useShowKnowledge(id);
  const { data: questions = [], isLoading: qLoading } = useShowQuestions(id);

  return (
    <TwoColumnLayout
      left={<QuestionsPanel questions={questions} showId={id} isLoading={qLoading} />}
      right={<KnowledgePanel files={knowledge} showId={id} isLoading={kLoading} />}
    />
  );
}
