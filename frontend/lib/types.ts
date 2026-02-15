export type User = {
  id: string;
  name: string;
  email: string;
};

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
};

export type TimeEntry = {
  id: string;
  startTime: string;
  endTime: string;
  task: Task;
};

export type ReportSummary = {
  weekHours: number;
  todayHours: number;
};

export type Document = {
  id: string;
  title: string;
  content: string;
  slug?: string;
  projectId?: string;
  taskId?: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  project?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
    projectId?: string | null;
    project?: {
      isCollaborative: boolean;
    } | null;
  };
  isPublic: boolean;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateDocumentDto = {
  title: string;
  content: string;
  slug?: string;
  projectId?: string;
  taskId?: string;
  isPublic?: boolean;
  isPinned?: boolean;
  tags?: string[];
};

export type UpdateDocumentDto = Partial<CreateDocumentDto>;
