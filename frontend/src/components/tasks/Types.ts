export type ColumnTypeId = 'backlog' | 'todo' | 'in_progress' | 'code_review' | 'done' | 'custom';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Column {
  id: string;
  name: string;
  columnTypeId: ColumnTypeId;
  color: string;
  order: number;
}

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  initials: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface TaskComment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  priority: TaskPriority;
  order: number;
  dueDate?: string;
  completedAt?: string;
  comments?: TaskComment[];
  checklist?: ChecklistItem[];
  assignees: Assignee[];
  labels: Label[];
  createdBy: Assignee;
  sprint: string;
  createdAt: string;
}
