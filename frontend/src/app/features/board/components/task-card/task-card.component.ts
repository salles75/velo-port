import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskPriority, TaskType } from '@core/models/project.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="task-card" [class.dragging]="isDragging">
      <!-- Task Type Badge -->
      <div class="task-top">
        <span class="task-type" [class]="task.type">
          @switch (task.type) {
            @case ('bug') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              Bug
            }
            @case ('feature') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Feature
            }
            @case ('improvement') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
              Melhoria
            }
            @case ('epic') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Epic
            }
            @default {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Tarefa
            }
          }
        </span>

        <button class="task-menu" (click)="onMenuClick($event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>

      <!-- Task Title -->
      <h4 class="task-title">{{ task.title }}</h4>

      <!-- Description preview -->
      @if (task.description) {
        <p class="task-description">{{ task.description }}</p>
      }

      <!-- Tags -->
      @if (task.tags && task.tags.length > 0) {
        <div class="task-tags">
          @for (tag of task.tags.slice(0, 3); track tag) {
            <span class="tag">{{ tag }}</span>
          }
          @if (task.tags.length > 3) {
            <span class="tag more">+{{ task.tags.length - 3 }}</span>
          }
        </div>
      }

      <!-- Footer -->
      <div class="task-footer">
        <div class="task-meta">
          <!-- Priority -->
          <span class="priority" [class]="task.priority" [title]="getPriorityLabel(task.priority)">
            @switch (task.priority) {
              @case ('urgent') {
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              }
              @case ('high') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              }
              @case ('medium') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14"/>
                </svg>
              }
              @case ('low') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              }
            }
          </span>

          <!-- Story Points -->
          @if (task.storyPoints) {
            <span class="story-points" title="Story Points">
              {{ task.storyPoints }}
            </span>
          }

          <!-- Due Date -->
          @if (task.dueDate) {
            <span class="due-date" [class.overdue]="isOverdue(task.dueDate)" [title]="formatDate(task.dueDate)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatDateShort(task.dueDate) }}
            </span>
          }
        </div>

        <!-- Assignee -->
        @if (task.assignee) {
          <div class="assignee" [title]="task.assignee">
            <span class="avatar">{{ getInitials(task.assignee) }}</span>
          </div>
        }
      </div>
    </article>
  `,
  styles: [`
    .task-card {
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-md);
      cursor: grab;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--color-border-hover);
        box-shadow: var(--shadow-md);
      }

      &:active {
        cursor: grabbing;
      }

      &.dragging {
        opacity: 0.5;
      }
    }

    .task-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }

    .task-type {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);

      svg {
        width: 12px;
        height: 12px;
      }

      &.task {
        background: var(--color-type-task);
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

    .task-menu {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      color: var(--color-text-tertiary);
      opacity: 0;
      transition: all var(--transition-fast);

      .task-card:hover & {
        opacity: 1;
      }

      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }

    .task-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      line-height: var(--line-height-normal);
      margin-bottom: var(--spacing-sm);
      word-break: break-word;
    }

    .task-description {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      line-height: var(--line-height-relaxed);
      margin-bottom: var(--spacing-sm);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: var(--spacing-sm);
    }

    .tag {
      padding: 2px 6px;
      background: var(--color-bg-hover);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);

      &.more {
        background: var(--color-bg-elevated);
        color: var(--color-text-tertiary);
      }
    }

    .task-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--color-border);
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .priority {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;

      svg {
        width: 14px;
        height: 14px;
      }

      &.low {
        color: var(--color-priority-low);
      }

      &.medium {
        color: var(--color-priority-medium);
      }

      &.high {
        color: var(--color-priority-high);
      }

      &.urgent {
        color: var(--color-priority-urgent);
      }
    }

    .story-points {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-tertiary);
    }

    .due-date {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);

      svg {
        width: 12px;
        height: 12px;
      }

      &.overdue {
        color: var(--color-danger);
      }
    }

    .assignee {
      display: flex;
      align-items: center;
    }

    .avatar {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-accent), #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: white;
      text-transform: uppercase;
    }
  `],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() onDelete = new EventEmitter<Task>();

  isDragging = false;

  onMenuClick(event: MouseEvent): void {
    event.stopPropagation();
    // Menu de contexto - simplificado para delete
    if (confirm(`Deseja excluir a tarefa "${this.task.title}"?`)) {
      this.onDelete.emit(this.task);
    }
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: 'Baixa',
      [TaskPriority.MEDIUM]: 'Média',
      [TaskPriority.HIGH]: 'Alta',
      [TaskPriority.URGENT]: 'Urgente',
    };
    return labels[priority];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2);
  }

  isOverdue(date: Date): boolean {
    return new Date(date) < new Date();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatDateShort(date: Date): string {
    const d = new Date(date);
    const today = new Date();
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff === -1) return 'Ontem';
    if (diff < -1) return `${Math.abs(diff)}d atrás`;

    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
