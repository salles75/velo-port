import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { switchMap, Subject, takeUntil } from 'rxjs';
import { BoardService } from '@core/services/board.service';
import { TaskService } from '@core/services/task.service';
import {
  Board,
  BoardColumn,
  Task,
  TaskPriority,
  TaskType,
  CreateTaskDto,
} from '@core/models/project.model';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { TaskModalComponent } from './components/task-modal/task-modal.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    TaskCardComponent,
    TaskModalComponent,
  ],
  template: `
    <div class="board-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Carregando board...</p>
        </div>
      } @else if (board()) {
        <!-- Header do Board -->
        <header class="board-header">
          <div class="header-left">
            <button class="back-btn" (click)="goBack()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            <div class="board-info">
              <h1>{{ board()?.name }}</h1>
              @if (board()?.project) {
                <span class="project-badge" [style.background]="board()?.project?.color + '20'" [style.color]="board()?.project?.color">
                  {{ board()?.project?.name }}
                </span>
              }
            </div>
          </div>

          <div class="header-right">
            <!-- Stats em tempo real usando Signals -->
            <div class="board-stats">
              <div class="stat">
                <span class="stat-value">{{ totalTasks() }}</span>
                <span class="stat-label">Tarefas</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ completedTasks() }}</span>
                <span class="stat-label">Concluídas</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ progressPercent() }}%</span>
                <span class="stat-label">Progresso</span>
              </div>
            </div>

            <div class="header-actions">
              <div class="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  [(ngModel)]="searchQuery"
                />
              </div>

              <button class="btn btn-primary" (click)="openCreateTaskModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Nova Tarefa
              </button>
            </div>
          </div>
        </header>

        <!-- Progress bar -->
        <div class="progress-bar-container">
          <div class="progress-bar" [style.width.%]="progressPercent()"></div>
        </div>

        <!-- Kanban Board -->
        <div class="board-container" cdkDropListGroup>
          <div class="columns-wrapper">
            @for (column of columns(); track column.id) {
              <div class="column" [class.over-limit]="isOverLimit(column)">
                <!-- Column Header -->
                <div class="column-header">
                  <div class="column-title-row">
                    <div class="column-color" [style.background-color]="column.color"></div>
                    <h3 class="column-title">{{ column.name }}</h3>
                    <span class="column-count" [class.warning]="isOverLimit(column)">
                      {{ column.tasks?.length || 0 }}
                      @if (column.taskLimit) {
                        / {{ column.taskLimit }}
                      }
                    </span>
                  </div>

                  <button class="column-add-btn" (click)="openCreateTaskModal(column.id)" title="Adicionar tarefa">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                </div>

                <!-- Drop List para Drag & Drop -->
                <div
                  cdkDropList
                  [cdkDropListData]="column"
                  [id]="column.id"
                  class="task-list"
                  (cdkDropListDropped)="onTaskDrop($event)"
                  [cdkDropListConnectedTo]="getConnectedLists()"
                >
                  @for (task of getFilteredTasks(column); track task.id) {
                    <app-task-card
                      cdkDrag
                      [cdkDragData]="task"
                      [task]="task"
                      (click)="openTaskModal(task)"
                      (onDelete)="deleteTask($event)"
                    />
                  } @empty {
                    @if (!searchQuery) {
                      <div class="empty-column">
                        <p>Arraste tarefas para cá</p>
                      </div>
                    }
                  }
                </div>
              </div>
            }

            <!-- Add Column Button -->
            <div class="add-column">
              <button class="add-column-btn" (click)="openAddColumnModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Adicionar Coluna</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Modal de Criar/Editar Tarefa -->
    @if (showTaskModal()) {
      <app-task-modal
        [task]="selectedTask()"
        [columns]="columns()"
        [defaultColumnId]="defaultColumnId()"
        (onSave)="saveTask($event)"
        (onClose)="closeTaskModal()"
      />
    }

    <!-- Modal de Adicionar Coluna -->
    @if (showAddColumnModal()) {
      <div class="modal-backdrop" (click)="closeAddColumnModal()">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h2>Nova Coluna</h2>
            <button class="modal-close" (click)="closeAddColumnModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </header>

          <form [formGroup]="columnForm" (ngSubmit)="createColumn()">
            <div class="modal-body">
              <div class="form-group">
                <label for="columnName">Nome da Coluna *</label>
                <input
                  type="text"
                  id="columnName"
                  formControlName="name"
                  placeholder="Ex: Em Teste"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Cor</label>
                  <div class="color-picker">
                    @for (color of columnColors; track color) {
                      <button
                        type="button"
                        class="color-option"
                        [style.background-color]="color"
                        [class.selected]="columnForm.get('color')?.value === color"
                        (click)="selectColumnColor(color)"
                      >
                        @if (columnForm.get('color')?.value === color) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        }
                      </button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label for="taskLimit">Limite de Tarefas (WIP)</label>
                  <input
                    type="number"
                    id="taskLimit"
                    formControlName="taskLimit"
                    placeholder="Sem limite"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <footer class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeAddColumnModal()">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="columnForm.invalid">
                Criar Coluna
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .board-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--color-bg-primary);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: var(--spacing-lg);
      color: var(--color-text-tertiary);
    }

    .spinner-large {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Header */
    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .back-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-lg);
      color: var(--color-text-tertiary);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .board-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);

      h1 {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
      }
    }

    .project-badge {
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
    }

    .board-stats {
      display: flex;
      gap: var(--spacing-xl);
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .stat-value {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
    }

    .search-box {
      position: relative;

      svg {
        position: absolute;
        left: var(--spacing-md);
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        color: var(--color-text-tertiary);
      }

      input {
        width: 200px;
        padding: var(--spacing-sm) var(--spacing-md);
        padding-left: 40px;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
        transition: all var(--transition-fast);

        &::placeholder {
          color: var(--color-text-tertiary);
        }

        &:focus {
          outline: none;
          border-color: var(--color-accent);
          width: 260px;
        }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: all var(--transition-fast);
      cursor: pointer;
      border: none;

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .btn-primary {
      background: var(--color-accent);
      color: white;

      &:hover:not(:disabled) {
        background: var(--color-accent-hover);
      }
    }

    .btn-secondary {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);

      &:hover:not(:disabled) {
        background: var(--color-bg-hover);
      }
    }

    /* Progress Bar */
    .progress-bar-container {
      height: 3px;
      background: var(--color-bg-tertiary);
      flex-shrink: 0;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--color-accent), var(--color-success));
      transition: width var(--transition-normal);
    }

    /* Board Container */
    .board-container {
      flex: 1;
      overflow-x: auto;
      overflow-y: hidden;
      padding: var(--spacing-xl);
    }

    .columns-wrapper {
      display: flex;
      gap: var(--spacing-lg);
      height: 100%;
      min-width: max-content;
    }

    /* Column */
    .column {
      width: 320px;
      min-width: 320px;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 180px);

      &.over-limit {
        border-color: var(--color-warning);
        background: rgba(251, 191, 36, 0.03);
      }
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .column-title-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .column-color {
      width: 12px;
      height: 12px;
      border-radius: var(--radius-full);
    }

    .column-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .column-count {
      background: var(--color-bg-tertiary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-tertiary);

      &.warning {
        background: var(--color-warning-light);
        color: var(--color-warning);
      }
    }

    .column-add-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      color: var(--color-text-tertiary);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-accent);
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }

    /* Task List (Drop Zone) */
    .task-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      min-height: 100px;

      &.cdk-drop-list-dragging {
        background: var(--color-accent-light);
      }
    }

    .empty-column {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl) var(--spacing-lg);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    /* Add Column */
    .add-column {
      width: 280px;
      min-width: 280px;
      display: flex;
      align-items: flex-start;
      padding-top: var(--spacing-md);
    }

    .add-column-btn {
      width: 100%;
      padding: var(--spacing-lg);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-text-tertiary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--color-accent);
        color: var(--color-accent);
        background: var(--color-accent-light);
      }

      svg {
        width: 24px;
        height: 24px;
      }
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal-backdrop);
      animation: fadeIn 0.2s ease;
    }

    .modal {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 480px;
      animation: scaleIn 0.2s ease;

      &.modal-sm {
        max-width: 400px;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--color-border);

      h2 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
      }
    }

    .modal-close {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      color: var(--color-text-tertiary);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      svg {
        width: 18px;
        height: 18px;
      }
    }

    .modal-body {
      padding: var(--spacing-xl);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-xl);
      border-top: 1px solid var(--color-border);
    }

    .form-group {
      margin-bottom: var(--spacing-lg);

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      input {
        width: 100%;
        padding: var(--spacing-md);
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        transition: all var(--transition-fast);

        &::placeholder {
          color: var(--color-text-tertiary);
        }

        &:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-light);
        }
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    .color-picker {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .color-option {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      border: 2px solid transparent;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: scale(1.1);
      }

      &.selected {
        border-color: white;
        box-shadow: var(--shadow-sm);
      }

      svg {
        width: 14px;
        height: 14px;
        color: white;
      }
    }

    /* Drag & Drop styles */
    :host ::ng-deep {
      .cdk-drag-preview {
        box-shadow: var(--shadow-xl);
        border-radius: var(--radius-lg);
        opacity: 0.95;
        transform: rotate(3deg);
      }

      .cdk-drag-placeholder {
        opacity: 0.3;
      }

      .cdk-drag-animating {
        transition: transform 200ms ease;
      }
    }
  `],
})
export class BoardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boardService = inject(BoardService);
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Signals from service
  board = this.boardService.currentBoard;
  loading = this.boardService.loading;

  // Local signals
  showTaskModal = signal(false);
  showAddColumnModal = signal(false);
  selectedTask = signal<Task | null>(null);
  defaultColumnId = signal<string | null>(null);
  searchQuery = '';

  // Computed signals para estatísticas em tempo real
  columns = computed(() => this.board()?.columns ?? []);

  totalTasks = computed(() =>
    this.columns().reduce((sum, col) => sum + (col.tasks?.length ?? 0), 0)
  );

  completedTasks = computed(() => {
    const completedColumn = this.columns().find(
      (col) => col.name.toLowerCase().includes('concluíd') || col.name.toLowerCase().includes('done')
    );
    return completedColumn?.tasks?.length ?? 0;
  });

  progressPercent = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });

  // Column Form
  columnForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    color: ['#6B7280'],
    taskLimit: [null],
  });

  columnColors = [
    '#6B7280',
    '#3B82F6',
    '#F59E0B',
    '#8B5CF6',
    '#10B981',
    '#EC4899',
    '#EF4444',
    '#14B8A6',
  ];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const boardId = params.get('boardId');
          if (!boardId) throw new Error('Board ID not found');
          return this.boardService.loadBoard(boardId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: () => {
          this.router.navigate(['/projects']);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.boardService.clearCurrentBoard();
  }

  goBack(): void {
    const projectId = this.board()?.projectId;
    if (projectId) {
      this.router.navigate(['/projects', projectId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  getConnectedLists(): string[] {
    return this.columns().map((col) => col.id);
  }

  getFilteredTasks(column: BoardColumn): Task[] {
    const tasks = column.tasks ?? [];
    if (!this.searchQuery.trim()) return tasks;

    const query = this.searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee?.toLowerCase().includes(query) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  isOverLimit(column: BoardColumn): boolean {
    if (!column.taskLimit) return false;
    return (column.tasks?.length ?? 0) >= column.taskLimit;
  }

  /**
   * Handler do evento de drop - coração do Drag & Drop
   */
  onTaskDrop(event: CdkDragDrop<BoardColumn>): void {
    const task = event.item.data as Task;
    const sourceColumn = event.previousContainer.data;
    const targetColumn = event.container.data;

    if (!task || !sourceColumn || !targetColumn) return;

    // Mesmo container - reordenar
    if (event.previousContainer === event.container) {
      const tasks = [...(targetColumn.tasks ?? [])];
      moveItemInArray(tasks, event.previousIndex, event.currentIndex);

      // Atualiza localmente primeiro (otimistic update)
      this.updateColumnTasksLocally(targetColumn.id, tasks);

      // Sync com backend
      const taskIds = tasks.map((t) => t.id);
      this.taskService.reorderTasks(targetColumn.id, taskIds).subscribe();
    } else {
      // Containers diferentes - mover tarefa
      const sourceTasks = [...(sourceColumn.tasks ?? [])];
      const targetTasks = [...(targetColumn.tasks ?? [])];

      transferArrayItem(sourceTasks, targetTasks, event.previousIndex, event.currentIndex);

      // Atualiza localmente primeiro (otimistic update)
      this.updateColumnTasksLocally(sourceColumn.id, sourceTasks);
      this.updateColumnTasksLocally(targetColumn.id, targetTasks);

      // Sync com backend
      this.taskService
        .moveTask(task.id, sourceColumn.id, {
          targetColumnId: targetColumn.id,
          newPosition: event.currentIndex,
        })
        .subscribe({
          error: () => {
            // Recarregar em caso de erro
            this.boardService.loadBoard(this.board()!.id).subscribe();
          },
        });
    }
  }

  private updateColumnTasksLocally(columnId: string, tasks: Task[]): void {
    const board = this.board();
    if (!board?.columns) return;

    const updatedColumns = board.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: tasks.map((t, idx) => ({ ...t, position: idx })),
        };
      }
      return col;
    });

    this.boardService.updateBoardLocal({
      ...board,
      columns: updatedColumns,
    });
  }

  // Task Modal
  openCreateTaskModal(columnId?: string): void {
    this.selectedTask.set(null);
    this.defaultColumnId.set(columnId ?? this.columns()[0]?.id ?? null);
    this.showTaskModal.set(true);
  }

  openTaskModal(task: Task): void {
    this.selectedTask.set(task);
    this.defaultColumnId.set(task.columnId);
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
    this.selectedTask.set(null);
  }

  saveTask(data: { task: Task | null; dto: CreateTaskDto }): void {
    if (data.task) {
      // Update
      this.taskService.updateTask(data.task.id, data.dto).subscribe({
        next: () => this.closeTaskModal(),
      });
    } else {
      // Create
      this.taskService.createTask(data.dto).subscribe({
        next: () => this.closeTaskModal(),
      });
    }
  }

  deleteTask(task: Task): void {
    if (!confirm(`Deseja realmente excluir a tarefa "${task.title}"?`)) return;

    this.taskService.deleteTask(task.id).subscribe();
  }

  // Column Modal
  openAddColumnModal(): void {
    this.showAddColumnModal.set(true);
    this.columnForm.reset({
      color: '#6B7280',
      taskLimit: null,
    });
  }

  closeAddColumnModal(): void {
    this.showAddColumnModal.set(false);
  }

  selectColumnColor(color: string): void {
    this.columnForm.patchValue({ color });
  }

  createColumn(): void {
    if (this.columnForm.invalid || !this.board()) return;

    const dto = {
      ...this.columnForm.value,
      boardId: this.board()!.id,
      position: this.columns().length,
    };

    this.boardService.createColumn(dto).subscribe({
      next: () => this.closeAddColumnModal(),
    });
  }
}
