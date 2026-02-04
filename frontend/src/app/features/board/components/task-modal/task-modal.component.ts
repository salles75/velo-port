import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  Task,
  BoardColumn,
  TaskPriority,
  TaskType,
  CreateTaskDto,
} from '@core/models/project.model';

// Validador customizado para tags
function tagsValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string[];
  if (!value || value.length === 0) return null;

  // Máximo 10 tags
  if (value.length > 10) {
    return { maxTags: { max: 10, actual: value.length } };
  }

  // Cada tag máximo 20 caracteres
  const invalidTag = value.find((tag) => tag.length > 20);
  if (invalidTag) {
    return { tagTooLong: { tag: invalidTag, max: 20 } };
  }

  return null;
}

// Validador customizado para data futura
function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const date = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return { pastDate: true };
  }

  return null;
}

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h2>{{ task ? 'Editar Tarefa' : 'Nova Tarefa' }}</h2>
          <button class="modal-close" (click)="close()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </header>

        <form [formGroup]="taskForm" (ngSubmit)="submit()">
          <div class="modal-body">
            <!-- Título -->
            <div class="form-group">
              <label for="title">Título *</label>
              <input
                type="text"
                id="title"
                formControlName="title"
                placeholder="O que precisa ser feito?"
                [class.error]="hasError('title')"
              />
              @if (hasError('title')) {
                <span class="error-message">
                  @if (getError('title', 'required')) {
                    Título é obrigatório
                  } @else if (getError('title', 'minlength')) {
                    Mínimo 2 caracteres
                  } @else if (getError('title', 'maxlength')) {
                    Máximo 200 caracteres
                  }
                </span>
              }
            </div>

            <!-- Descrição -->
            <div class="form-group">
              <label for="description">Descrição</label>
              <textarea
                id="description"
                formControlName="description"
                placeholder="Descreva os detalhes da tarefa..."
                rows="3"
              ></textarea>
            </div>

            <!-- Tipo e Prioridade -->
            <div class="form-row">
              <div class="form-group">
                <label>Tipo</label>
                <div class="type-selector">
                  @for (type of taskTypes; track type.value) {
                    <button
                      type="button"
                      class="type-option"
                      [class.selected]="taskForm.get('type')?.value === type.value"
                      [class]="type.value"
                      (click)="selectType(type.value)"
                    >
                      <span [innerHTML]="type.icon"></span>
                      {{ type.label }}
                    </button>
                  }
                </div>
              </div>

              <div class="form-group">
                <label>Prioridade</label>
                <div class="priority-selector">
                  @for (priority of priorities; track priority.value) {
                    <button
                      type="button"
                      class="priority-option"
                      [class.selected]="taskForm.get('priority')?.value === priority.value"
                      [class]="priority.value"
                      (click)="selectPriority(priority.value)"
                      [title]="priority.label"
                    >
                      <span [innerHTML]="priority.icon"></span>
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Coluna e Story Points -->
            <div class="form-row">
              <div class="form-group">
                <label for="columnId">Coluna *</label>
                <select id="columnId" formControlName="columnId" [class.error]="hasError('columnId')">
                  @for (column of columns; track column.id) {
                    <option [value]="column.id">{{ column.name }}</option>
                  }
                </select>
                @if (hasError('columnId')) {
                  <span class="error-message">Selecione uma coluna</span>
                }
              </div>

              <div class="form-group">
                <label for="storyPoints">Story Points</label>
                <input
                  type="number"
                  id="storyPoints"
                  formControlName="storyPoints"
                  placeholder="Ex: 5"
                  min="1"
                  max="100"
                  [class.error]="hasError('storyPoints')"
                />
                @if (hasError('storyPoints')) {
                  <span class="error-message">
                    @if (getError('storyPoints', 'min')) {
                      Mínimo 1
                    } @else if (getError('storyPoints', 'max')) {
                      Máximo 100
                    }
                  </span>
                }
              </div>
            </div>

            <!-- Data de Entrega e Responsável -->
            <div class="form-row">
              <div class="form-group">
                <label for="dueDate">Data de Entrega</label>
                <input
                  type="date"
                  id="dueDate"
                  formControlName="dueDate"
                  [class.error]="hasError('dueDate')"
                />
                @if (hasError('dueDate')) {
                  <span class="error-message">
                    @if (getError('dueDate', 'pastDate')) {
                      Data não pode ser no passado
                    }
                  </span>
                }
              </div>

              <div class="form-group">
                <label for="assignee">Responsável</label>
                <input
                  type="text"
                  id="assignee"
                  formControlName="assignee"
                  placeholder="Nome do responsável"
                  [class.error]="hasError('assignee')"
                />
                @if (hasError('assignee')) {
                  <span class="error-message">Máximo 100 caracteres</span>
                }
              </div>
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label>Tags</label>
              <div class="tags-input">
                <div class="tags-list">
                  @for (tag of currentTags(); track tag; let i = $index) {
                    <span class="tag">
                      {{ tag }}
                      <button type="button" (click)="removeTag(i)">×</button>
                    </span>
                  }
                </div>
                <input
                  type="text"
                  placeholder="Digite e pressione Enter..."
                  [(ngModel)]="newTag"
                  [ngModelOptions]="{standalone: true}"
                  (keydown.enter)="addTag($event)"
                  [disabled]="currentTags().length >= 10"
                />
              </div>
              @if (hasError('tags')) {
                <span class="error-message">
                  @if (getError('tags', 'maxTags')) {
                    Máximo 10 tags
                  } @else if (getError('tags', 'tagTooLong')) {
                    Tag muito longa (máx 20 caracteres)
                  }
                </span>
              }
              <span class="hint">Pressione Enter para adicionar. Máximo 10 tags.</span>
            </div>
          </div>

          <footer class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="taskForm.invalid || submitting()"
            >
              @if (submitting()) {
                <span class="spinner"></span>
                Salvando...
              } @else {
                {{ task ? 'Atualizar' : 'Criar Tarefa' }}
              }
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
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
      max-width: 580px;
      max-height: 90vh;
      overflow-y: auto;
      animation: scaleIn 0.2s ease;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      background: var(--color-bg-secondary);
      z-index: 1;

      h2 {
        font-size: var(--font-size-xl);
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
      position: sticky;
      bottom: 0;
      background: var(--color-bg-secondary);
    }

    .form-group {
      margin-bottom: var(--spacing-lg);

      label {
        display: block;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      input, textarea, select {
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

        &.error {
          border-color: var(--color-danger);

          &:focus {
            box-shadow: 0 0 0 3px var(--color-danger-light);
          }
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      textarea {
        resize: vertical;
        min-height: 80px;
      }

      select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236E6E73' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
        padding-right: 40px;
      }
    }

    .error-message {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--color-danger);
      margin-top: var(--spacing-xs);
    }

    .hint {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      margin-top: var(--spacing-xs);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    /* Type Selector */
    .type-selector {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .type-option {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--radius-md);
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);

      :deep(svg) {
        width: 12px;
        height: 12px;
      }

      &:hover {
        border-color: var(--color-border-hover);
      }

      &.selected {
        border-color: currentColor;

        &.task {
          background: rgba(167, 139, 250, 0.15);
          color: var(--color-type-task);
        }

        &.bug {
          background: rgba(248, 113, 113, 0.15);
          color: var(--color-type-bug);
        }

        &.feature {
          background: rgba(52, 211, 153, 0.15);
          color: var(--color-type-feature);
        }

        &.improvement {
          background: rgba(96, 165, 250, 0.15);
          color: var(--color-type-improvement);
        }

        &.epic {
          background: rgba(244, 114, 182, 0.15);
          color: var(--color-type-epic);
        }
      }
    }

    /* Priority Selector */
    .priority-selector {
      display: flex;
      gap: var(--spacing-sm);
    }

    .priority-option {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      color: var(--color-text-tertiary);
      transition: all var(--transition-fast);

      :deep(svg) {
        width: 18px;
        height: 18px;
      }

      &:hover {
        border-color: var(--color-border-hover);
      }

      &.selected {
        border-color: currentColor;

        &.low {
          background: rgba(107, 114, 128, 0.15);
          color: var(--color-priority-low);
        }

        &.medium {
          background: rgba(96, 165, 250, 0.15);
          color: var(--color-priority-medium);
        }

        &.high {
          background: rgba(251, 191, 36, 0.15);
          color: var(--color-priority-high);
        }

        &.urgent {
          background: rgba(248, 113, 113, 0.15);
          color: var(--color-priority-urgent);
        }
      }
    }

    /* Tags Input */
    .tags-input {
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-sm);
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      min-height: 44px;
      transition: all var(--transition-fast);

      &:focus-within {
        border-color: var(--color-accent);
        box-shadow: 0 0 0 3px var(--color-accent-light);
      }

      input {
        flex: 1;
        min-width: 120px;
        padding: var(--spacing-xs);
        background: transparent;
        border: none;
        box-shadow: none !important;

        &:focus {
          outline: none;
        }
      }
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);

      button {
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        color: var(--color-text-tertiary);
        font-size: 12px;
        line-height: 1;

        &:hover {
          background: var(--color-danger-light);
          color: var(--color-danger);
        }
      }
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      transition: all var(--transition-fast);
      cursor: pointer;
      border: none;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class TaskModalComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() columns: BoardColumn[] = [];
  @Input() defaultColumnId: string | null = null;
  @Output() onSave = new EventEmitter<{ task: Task | null; dto: CreateTaskDto }>();
  @Output() onClose = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  submitting = signal(false);
  currentTags = signal<string[]>([]);
  newTag = '';

  taskForm!: FormGroup;

  taskTypes = [
    { value: TaskType.TASK, label: 'Tarefa', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
    { value: TaskType.BUG, label: 'Bug', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' },
    { value: TaskType.FEATURE, label: 'Feature', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
    { value: TaskType.IMPROVEMENT, label: 'Melhoria', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>' },
    { value: TaskType.EPIC, label: 'Epic', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  ];

  priorities = [
    { value: TaskPriority.LOW, label: 'Baixa', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>' },
    { value: TaskPriority.MEDIUM, label: 'Média', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>' },
    { value: TaskPriority.HIGH, label: 'Alta', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' },
    { value: TaskPriority.URGENT, label: 'Urgente', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>' },
  ];

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const defaultColumn = this.defaultColumnId || this.columns[0]?.id || '';

    this.taskForm = this.fb.group({
      title: [
        this.task?.title ?? '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(200)],
      ],
      description: [this.task?.description ?? ''],
      type: [this.task?.type ?? TaskType.TASK],
      priority: [this.task?.priority ?? TaskPriority.MEDIUM],
      columnId: [this.task?.columnId ?? defaultColumn, Validators.required],
      storyPoints: [
        this.task?.storyPoints ?? null,
        [Validators.min(1), Validators.max(100)],
      ],
      dueDate: [
        this.task?.dueDate ? this.formatDateForInput(this.task.dueDate) : null,
        this.task ? [] : [futureDateValidator], // Só valida data futura em nova tarefa
      ],
      assignee: [this.task?.assignee ?? '', Validators.maxLength(100)],
      tags: [this.task?.tags ?? [], tagsValidator],
    });

    this.currentTags.set(this.task?.tags ?? []);
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  selectType(type: TaskType): void {
    this.taskForm.patchValue({ type });
  }

  selectPriority(priority: TaskPriority): void {
    this.taskForm.patchValue({ priority });
  }

  addTag(event: Event): void {
    event.preventDefault();
    const tag = this.newTag.trim();

    if (!tag) return;
    if (this.currentTags().includes(tag)) return;
    if (tag.length > 20) return;
    if (this.currentTags().length >= 10) return;

    this.currentTags.update((tags) => [...tags, tag]);
    this.taskForm.patchValue({ tags: this.currentTags() });
    this.newTag = '';
  }

  removeTag(index: number): void {
    this.currentTags.update((tags) => tags.filter((_, i) => i !== index));
    this.taskForm.patchValue({ tags: this.currentTags() });
  }

  hasError(field: string): boolean {
    const control = this.taskForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getError(field: string, errorType: string): boolean {
    return !!this.taskForm.get(field)?.errors?.[errorType];
  }

  submit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const formValue = this.taskForm.value;
    const dto: CreateTaskDto = {
      ...formValue,
      tags: this.currentTags(),
      storyPoints: formValue.storyPoints || undefined,
      dueDate: formValue.dueDate || undefined,
      assignee: formValue.assignee || undefined,
    };

    this.onSave.emit({ task: this.task, dto });
  }

  close(): void {
    this.onClose.emit();
  }
}
