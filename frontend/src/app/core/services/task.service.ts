import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, Subject, BehaviorSubject, catchError, of } from 'rxjs';
import { Task, CreateTaskDto, MoveTaskDto } from '../models/project.model';
import { BoardService } from './board.service';

export interface TaskMovedEvent {
  taskId: string;
  sourceColumnId: string;
  targetColumnId: string;
  newPosition: number;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly boardService = inject(BoardService);

  // Subject para notificar movimentações de tarefas
  private readonly taskMoved$ = new Subject<TaskMovedEvent>();

  // Estado de loading por tarefa (para UI feedback)
  private readonly taskLoadingStates = new BehaviorSubject<Map<string, boolean>>(
    new Map()
  );

  readonly onTaskMoved = this.taskMoved$.asObservable();
  readonly loadingStates = this.taskLoadingStates.asObservable();

  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>('/tasks', dto).pipe(
      tap((task) => {
        this.updateBoardWithNewTask(task);
      })
    );
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`/tasks/${id}`);
  }

  updateTask(id: string, dto: Partial<CreateTaskDto>): Observable<Task> {
    this.setTaskLoading(id, true);

    return this.http.patch<Task>(`/tasks/${id}`, dto).pipe(
      tap((updated) => {
        this.updateBoardWithUpdatedTask(updated);
        this.setTaskLoading(id, false);
      }),
      catchError((error) => {
        this.setTaskLoading(id, false);
        throw error;
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    this.setTaskLoading(id, true);

    return this.http.delete<void>(`/tasks/${id}`).pipe(
      tap(() => {
        this.removeTaskFromBoard(id);
        this.setTaskLoading(id, false);
      }),
      catchError((error) => {
        this.setTaskLoading(id, false);
        throw error;
      })
    );
  }

  /**
   * Move uma tarefa para outra coluna/posição
   * Implementa otimistic update para UX fluída no drag & drop
   */
  moveTask(
    taskId: string,
    sourceColumnId: string,
    dto: MoveTaskDto
  ): Observable<Task> {
    // Otimistic update - atualiza UI imediatamente
    this.performOptimisticMove(taskId, sourceColumnId, dto);

    return this.http.post<Task>(`/tasks/${taskId}/move`, dto).pipe(
      tap((task) => {
        // Emitir evento de movimentação
        this.taskMoved$.next({
          taskId,
          sourceColumnId,
          targetColumnId: dto.targetColumnId,
          newPosition: dto.newPosition,
        });
      }),
      catchError((error) => {
        // Reverter otimistic update em caso de erro
        this.revertOptimisticMove(taskId, dto.targetColumnId, sourceColumnId);
        throw error;
      })
    );
  }

  /**
   * Reordena tarefas dentro de uma coluna
   */
  reorderTasks(columnId: string, taskIds: string[]): Observable<Task[]> {
    return this.http
      .post<Task[]>(`/tasks/reorder/${columnId}`, { taskIds })
      .pipe(
        tap((tasks) => {
          this.updateColumnTasks(columnId, tasks);
        })
      );
  }

  /**
   * Busca tarefas
   */
  searchTasks(query: string): Observable<Task[]> {
    return this.http.get<Task[]>(`/tasks?search=${encodeURIComponent(query)}`);
  }

  // ========================================
  // Métodos privados para gerenciar estado
  // ========================================

  private performOptimisticMove(
    taskId: string,
    sourceColumnId: string,
    dto: MoveTaskDto
  ): void {
    const board = this.boardService.currentBoard();
    if (!board?.columns) return;

    const sourceColumn = board.columns.find((c) => c.id === sourceColumnId);
    const targetColumn = board.columns.find((c) => c.id === dto.targetColumnId);

    if (!sourceColumn?.tasks || !targetColumn) return;

    // Encontrar a tarefa
    const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const task = { ...sourceColumn.tasks[taskIndex] };

    // Criar novas arrays para imutabilidade
    const updatedColumns = board.columns.map((col) => {
      if (col.id === sourceColumnId) {
        // Remover da coluna de origem
        return {
          ...col,
          tasks: col.tasks?.filter((t) => t.id !== taskId) ?? [],
        };
      }

      if (col.id === dto.targetColumnId) {
        // Adicionar na coluna de destino
        const tasks = [...(col.tasks ?? [])];
        task.columnId = dto.targetColumnId;
        task.position = dto.newPosition;
        tasks.splice(dto.newPosition, 0, task);

        // Recalcular posições
        return {
          ...col,
          tasks: tasks.map((t, idx) => ({ ...t, position: idx })),
        };
      }

      return col;
    });

    // Atualizar o board localmente
    this.boardService.updateBoardLocal({
      ...board,
      columns: updatedColumns,
    });
  }

  private revertOptimisticMove(
    taskId: string,
    currentColumnId: string,
    originalColumnId: string
  ): void {
    // Recarregar o board para reverter ao estado correto
    const board = this.boardService.currentBoard();
    if (board) {
      this.boardService.loadBoard(board.id).subscribe();
    }
  }

  private updateBoardWithNewTask(task: Task): void {
    const board = this.boardService.currentBoard();
    if (!board?.columns) return;

    const updatedColumns = board.columns.map((col) => {
      if (col.id === task.columnId) {
        return {
          ...col,
          tasks: [...(col.tasks ?? []), task].sort(
            (a, b) => a.position - b.position
          ),
        };
      }
      return col;
    });

    this.boardService.updateBoardLocal({
      ...board,
      columns: updatedColumns,
    });
  }

  private updateBoardWithUpdatedTask(task: Task): void {
    const board = this.boardService.currentBoard();
    if (!board?.columns) return;

    const updatedColumns = board.columns.map((col) => {
      if (col.tasks?.some((t) => t.id === task.id)) {
        return {
          ...col,
          tasks: col.tasks.map((t) => (t.id === task.id ? task : t)),
        };
      }
      return col;
    });

    this.boardService.updateBoardLocal({
      ...board,
      columns: updatedColumns,
    });
  }

  private removeTaskFromBoard(taskId: string): void {
    const board = this.boardService.currentBoard();
    if (!board?.columns) return;

    const updatedColumns = board.columns.map((col) => ({
      ...col,
      tasks: col.tasks?.filter((t) => t.id !== taskId) ?? [],
    }));

    this.boardService.updateBoardLocal({
      ...board,
      columns: updatedColumns,
    });
  }

  private updateColumnTasks(columnId: string, tasks: Task[]): void {
    const board = this.boardService.currentBoard();
    if (!board?.columns) return;

    const updatedColumns = board.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: tasks.sort((a, b) => a.position - b.position),
        };
      }
      return col;
    });

    this.boardService.updateBoardLocal({
      ...board,
      columns: updatedColumns,
    });
  }

  private setTaskLoading(taskId: string, loading: boolean): void {
    const current = this.taskLoadingStates.value;
    const updated = new Map(current);

    if (loading) {
      updated.set(taskId, true);
    } else {
      updated.delete(taskId);
    }

    this.taskLoadingStates.next(updated);
  }

  isTaskLoading(taskId: string): boolean {
    return this.taskLoadingStates.value.get(taskId) ?? false;
  }
}
