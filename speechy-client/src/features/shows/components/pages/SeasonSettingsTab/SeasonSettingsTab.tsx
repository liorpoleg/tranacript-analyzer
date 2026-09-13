import { useParams } from 'react-router-dom';
import { useSeasonKnowledge } from '@/features/knowledge/services/knowledge';
import { useSeasonQuestions } from '@/features/knowledge/services/questions';
import KnowledgePanel from '@/features/knowledge/components/organisms/KnowledgePanel/KnowledgePanel';
import QuestionsPanel from '@/features/knowledge/components/organisms/QuestionsPanel/QuestionsPanel';
import TwoColumnLayout from '@/core/components/templates/TwoColumnLayout/TwoColumnLayout';

export default function SettingsTab(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: knowledge = [], isLoading: kLoading } = useSeasonKnowledge(id);
  const { data: questions = [], isLoading: qLoading } = useSeasonQuestions(id);

  return (
    <TwoColumnLayout
      left={<QuestionsPanel questions={questions} seasonId={id} isLoading={qLoading} />}
      right={<KnowledgePanel files={knowledge} seasonId={id} isLoading={kLoading} />}
    />
  );
}
