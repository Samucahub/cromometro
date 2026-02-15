import { DocumentsList } from '@/components/DocumentsList';

// Exemplo de uso em página de projeto
export default function ProjectDetailsPage() {
  const projectId = "uuid-do-projeto"; // obtido dos params
  
  return (
    <div>
      {/* ... resto da página do projeto ... */}
      
      {/* Seção de Documentos */}
      <div className="mt-8">
        <DocumentsList projectId={projectId} />
      </div>
    </div>
  );
}

// Exemplo de uso em página de tarefa
export function TaskDetailsPage() {
  const taskId = "uuid-da-tarefa"; // obtido dos params
  
  return (
    <div>
      {/* ... resto da página da tarefa ... */}
      
      {/* Seção de Documentos */}
      <div className="mt-8">
        <DocumentsList taskId={taskId} />
      </div>
    </div>
  );
}

// Exemplo de uso sem botão de criar (apenas visualização)
export function ReadOnlyDocumentsView() {
  return (
    <DocumentsList 
      projectId="uuid-do-projeto" 
      showCreateButton={false} 
    />
  );
}
