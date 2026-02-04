import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { ProjectService } from '@core/services/project.service';
import { BoardService } from '@core/services/board.service';
import { Project, Board, CreateBoardDto } from '@core/models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Carregando projeto...</p>
        </div>
      } @else if (project()) {
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/projects" (click)="navigateToProjects($event)">Projetos</a>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>{{ project()?.name }}</span>
        </nav>

        <!-- Header do Projeto -->
        <header class="project-header">
          <div class="project-info">
            <div
              class="project-icon"
              [style.background]="project()?.color + '20'"
              [style.color]="project()?.color"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
            </div>

            <div class="project-text">
              <h1>{{ project()?.name }}</h1>
              @if (project()?.description) {
                <p class="project-description">{{ project()?.description }}</p>
              }
            </div>
          </div>

          <div class="project-actions">
            <button class="btn btn-secondary" (click)="editProject()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
          </div>
        </header>

        <!-- Stats do Projeto -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-number">{{ boards().length }}</span>
            <span class="stat-label">Boards</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ totalTasks() }}</span>
            <span class="stat-label">Tarefas</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ completedTasks() }}</span>
            <span class="stat-label">Concluídas</span>
          </div>
        </div>

        <!-- Seção de Boards -->
        <section class="boards-section">
          <div class="section-header">
            <h2>Boards</h2>
            <button class="btn btn-primary" (click)="openCreateBoardModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Novo Board
            </button>
          </div>

          @if (boards().length === 0) {
            <div class="empty-boards">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <h3>Nenhum board ainda</h3>
              <p>Crie seu primeiro board para organizar as tarefas</p>
              <button class="btn btn-primary" (click)="openCreateBoardModal()">
                Criar Board
              </button>
            </div>
          } @else {
            <div class="boards-grid">
              @for (board of boards(); track board.id; let i = $index) {
                <article
                  class="board-card"
                  [style.animation-delay.ms]="i * 60"
                  (click)="openBoard(board)"
                >
                  <div class="board-header">
                    <div class="board-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18"/>
                        <path d="M9 21V9"/>
                      </svg>
                    </div>

                    <button
                      class="board-menu"
                      (click)="$event.stopPropagation(); toggleBoardMenu(board.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>

                    @if (openMenuId() === board.id) {
                      <div class="dropdown-menu" (click)="$event.stopPropagation()">
                        <button (click)="deleteBoard(board)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                          Excluir
                        </button>
                      </div>
                    }
                  </div>

                  <div class="board-body">
                    <h3 class="board-title">{{ board.name }}</h3>
                    @if (board.description) {
                      <p class="board-description">{{ board.description }}</p>
                    }
                  </div>

                  <div class="board-footer">
                    <div class="board-stats">
                      <span class="board-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="8" y1="6" x2="21" y2="6"/>
                          <line x1="8" y1="12" x2="21" y2="12"/>
                          <line x1="8" y1="18" x2="21" y2="18"/>
                          <line x1="3" y1="6" x2="3.01" y2="6"/>
                          <line x1="3" y1="12" x2="3.01" y2="12"/>
                          <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                        {{ board.columns?.length || 0 }} colunas
                      </span>
                      <span class="board-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 11l3 3L22 4"/>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                        {{ getBoardTaskCount(board) }} tarefas
                      </span>
                    </div>

                    <!-- Mini preview das colunas -->
                    <div class="column-preview">
                      @for (column of board.columns?.slice(0, 5); track column.id) {
                        <div
                          class="column-bar"
                          [style.background-color]="column.color"
                          [title]="column.name"
                        ></div>
                      }
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </section>
      }
    </div>

    <!-- Modal de Criar Board -->
    @if (showCreateBoardModal()) {
      <div class="modal-backdrop" (click)="closeCreateBoardModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h2>Novo Board</h2>
            <button class="modal-close" (click)="closeCreateBoardModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </header>

          <form [formGroup]="boardForm" (ngSubmit)="createBoard()">
            <div class="modal-body">
              <div class="form-group">
                <label for="boardName">Nome do Board *</label>
                <input
                  type="text"
                  id="boardName"
                  formControlName="name"
                  placeholder="Ex: Sprint 1"
                  [class.error]="boardForm.get('name')?.invalid && boardForm.get('name')?.touched"
                />
                @if (boardForm.get('name')?.invalid && boardForm.get('name')?.touched) {
                  <span class="error-message">Nome é obrigatório</span>
                }
              </div>

              <div class="form-group">
                <label for="boardDescription">Descrição</label>
                <textarea
                  id="boardDescription"
                  formControlName="description"
                  placeholder="Descreva o objetivo do board..."
                  rows="3"
                ></textarea>
              </div>

              <div class="info-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p>O board será criado com as colunas padrão: Backlog, A Fazer, Em Progresso, Em Revisão e Concluído.</p>
              </div>
            </div>

            <footer class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCreateBoardModal()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="boardForm.invalid || creatingBoard()"
              >
                @if (creatingBoard()) {
                  <span class="spinner"></span>
                  Criando...
                } @else {
                  Criar Board
                }
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container {
      padding: var(--spacing-2xl);
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
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

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-xl);
      font-size: var(--font-size-sm);

      a {
        color: var(--color-text-tertiary);
        text-decoration: none;
        transition: color var(--transition-fast);

        &:hover {
          color: var(--color-accent);
        }
      }

      svg {
        width: 14px;
        height: 14px;
        color: var(--color-text-muted);
      }

      span {
        color: var(--color-text-secondary);
      }
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
      gap: var(--spacing-lg);
    }

    .project-info {
      display: flex;
      gap: var(--spacing-lg);
    }

    .project-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 32px;
        height: 32px;
      }
    }

    .project-text {
      h1 {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--spacing-xs);
      }
    }

    .project-description {
      font-size: var(--font-size-base);
      color: var(--color-text-tertiary);
      max-width: 600px;
    }

    .project-actions {
      display: flex;
      gap: var(--spacing-md);
    }

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

      svg {
        width: 18px;
        height: 18px;
      }

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
        transform: translateY(-1px);
      }
    }

    .btn-secondary {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);

      &:hover:not(:disabled) {
        background: var(--color-bg-hover);
      }
    }

    .stats-row {
      display: flex;
      gap: var(--spacing-2xl);
      padding: var(--spacing-lg) 0;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--spacing-2xl);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .stat-number {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-tertiary);
    }

    .boards-section {
      margin-top: var(--spacing-xl);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);

      h2 {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
      }
    }

    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-lg);
    }

    .board-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--spacing-lg);
      cursor: pointer;
      transition: all var(--transition-normal);
      animation: fadeInUp 0.4s ease backwards;

      &:hover {
        border-color: var(--color-border-hover);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
    }

    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-md);
      position: relative;
    }

    .board-icon {
      width: 40px;
      height: 40px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-accent);

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .board-menu {
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
        width: 16px;
        height: 16px;
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xs);
      min-width: 140px;
      box-shadow: var(--shadow-lg);
      z-index: var(--z-dropdown);
      animation: fadeInDown 0.15s ease;

      button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-danger);
        transition: background var(--transition-fast);

        &:hover {
          background: var(--color-danger-light);
        }

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }

    .board-body {
      margin-bottom: var(--spacing-lg);
    }

    .board-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--spacing-xs);
    }

    .board-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-tertiary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .board-footer {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .board-stats {
      display: flex;
      gap: var(--spacing-lg);
    }

    .board-stat {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);

      svg {
        width: 14px;
        height: 14px;
      }
    }

    .column-preview {
      display: flex;
      gap: 3px;
      height: 6px;
    }

    .column-bar {
      flex: 1;
      border-radius: var(--radius-full);
      opacity: 0.7;
    }

    .empty-boards {
      text-align: center;
      padding: var(--spacing-4xl) var(--spacing-2xl);
      background: var(--color-bg-secondary);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-xl);
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto var(--spacing-lg);
      color: var(--color-text-tertiary);

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .empty-boards h3 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-sm);
    }

    .empty-boards p {
      color: var(--color-text-tertiary);
      margin-bottom: var(--spacing-xl);
    }

    /* Modal styles - same as projects list */
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
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--color-border);

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

      input, textarea {
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
        }
      }

      textarea {
        resize: vertical;
        min-height: 80px;
      }
    }

    .error-message {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--color-danger);
      margin-top: var(--spacing-xs);
    }

    .info-box {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--color-info-light);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-info);

      svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        color: inherit;
        line-height: var(--line-height-relaxed);
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
  `],
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly boardService = inject(BoardService);
  private readonly fb = inject(FormBuilder);

  // Signals
  project = signal<Project | null>(null);
  boards = signal<Board[]>([]);
  loading = signal(true);
  showCreateBoardModal = signal(false);
  creatingBoard = signal(false);
  openMenuId = signal<string | null>(null);

  // Computed
  totalTasks = computed(() =>
    this.boards().reduce(
      (sum, board) =>
        sum +
        (board.columns?.reduce(
          (colSum, col) => colSum + (col.tasks?.length || 0),
          0
        ) || 0),
      0
    )
  );

  completedTasks = computed(() =>
    this.boards().reduce(
      (sum, board) =>
        sum +
        (board.columns
          ?.filter((col) => col.name.toLowerCase().includes('concluíd'))
          .reduce((colSum, col) => colSum + (col.tasks?.length || 0), 0) || 0),
      0
    )
  );

  // Form
  boardForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const projectId = params.get('projectId');
          if (!projectId) throw new Error('Project ID not found');
          return this.projectService.getProject(projectId);
        })
      )
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.boards.set(project.boards || []);
          this.loading.set(false);
        },
        error: () => {
          this.router.navigate(['/projects']);
        },
      });

    // Fechar menu ao clicar fora
    document.addEventListener('click', () => {
      this.openMenuId.set(null);
    });
  }

  navigateToProjects(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/projects']);
  }

  openBoard(board: Board): void {
    this.router.navigate(['/board', board.id]);
  }

  editProject(): void {
    // TODO: Implementar edição
    console.log('Edit project');
  }

  toggleBoardMenu(boardId: string): void {
    this.openMenuId.set(this.openMenuId() === boardId ? null : boardId);
  }

  openCreateBoardModal(): void {
    this.showCreateBoardModal.set(true);
    this.boardForm.reset();
  }

  closeCreateBoardModal(): void {
    this.showCreateBoardModal.set(false);
  }

  createBoard(): void {
    if (this.boardForm.invalid || !this.project()) return;

    this.creatingBoard.set(true);

    const dto: CreateBoardDto = {
      ...this.boardForm.value,
      projectId: this.project()!.id,
    };

    this.boardService.createBoard(dto).subscribe({
      next: (board) => {
        this.boards.update((boards) => [board, ...boards]);
        this.creatingBoard.set(false);
        this.closeCreateBoardModal();
        this.router.navigate(['/board', board.id]);
      },
      error: () => {
        this.creatingBoard.set(false);
      },
    });
  }

  deleteBoard(board: Board): void {
    if (!confirm(`Deseja realmente excluir o board "${board.name}"?`)) return;

    this.boardService.deleteBoard(board.id).subscribe({
      next: () => {
        this.boards.update((boards) => boards.filter((b) => b.id !== board.id));
        this.openMenuId.set(null);
      },
    });
  }

  getBoardTaskCount(board: Board): number {
    return (
      board.columns?.reduce(
        (sum, col) => sum + (col.tasks?.length || 0),
        0
      ) || 0
    );
  }
}
