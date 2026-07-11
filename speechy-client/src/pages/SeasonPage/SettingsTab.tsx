import { useParams } from 'react-router-dom';
import { useSeasonKnowledge } from '../../api/knowledge';
import { useSeasonQuestions } from '../../api/questions';
import KnowledgePanel from '../../organisms/KnowledgePanel';
import QuestionsPanel from '../../organisms/QuestionsPanel';
import TwoColumnLayout from '../../templates/TwoColumnLayout';

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
