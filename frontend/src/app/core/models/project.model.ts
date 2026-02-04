export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: ProjectStatus;
  boards?: Board[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  project?: Project;
  columns?: BoardColumn[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardColumn {
  id: string;
  name: string;
  color: string;
  position: number;
  taskLimit?: number;
  boardId: string;
  board?: Board;
  tasks?: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskType {
  TASK = 'task',
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  EPIC = 'epic',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  type: TaskType;
  position: number;
  storyPoints?: number;
  dueDate?: Date;
  tags?: string[];
  assignee?: string;
  columnId: string;
  column?: BoardColumn;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs para criação/atualização
export interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: ProjectStatus;
}

export interface CreateBoardDto {
  name: string;
  description?: string;
  projectId: string;
}

export interface CreateColumnDto {
  name: string;
  color?: string;
  position?: number;
  taskLimit?: number;
  boardId: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  type?: TaskType;
  position?: number;
  storyPoints?: number;
  dueDate?: string;
  tags?: string[];
  assignee?: string;
  columnId: string;
}

export interface MoveTaskDto {
  targetColumnId: string;
  newPosition: number;
}

// Estatísticas
export interface ProjectStatistics {
  totalBoards: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
}
