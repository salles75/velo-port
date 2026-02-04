import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '@core/services/project.service';
import { Project, CreateProjectDto, ProjectStatus } from '@core/models/project.model';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-title">
            <h1>Projetos</h1>
            <p class="subtitle">Gerencie seus projetos e boards</p>
          </div>

          <button class="btn btn-primary" (click)="openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Novo Projeto
          </button>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ projectCount() }}</div>
            <div class="stat-label">Total de Projetos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ activeCount() }}</div>
            <div class="stat-label">Ativos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ completedCount() }}</div>
            <div class="stat-label">Concluídos</div>
          </div>
        </div>
      </header>

      <!-- Filtros e Busca -->
      <div class="toolbar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar projetos..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch($event)"
          />
        </div>

        <div class="filter-tabs">
          <button
            class="filter-tab"
            [class.active]="activeFilter() === 'all'"
            (click)="setFilter('all')"
          >
            Todos
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter() === 'active'"
            (click)="setFilter('active')"
          >
            Ativos
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter() === 'archived'"
            (click)="setFilter('archived')"
          >
            Arquivados
          </button>
        </div>
      </div>

      <!-- Grid de Projetos -->
      <div class="projects-grid">
        @if (loading()) {
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="project-card skeleton-card">
              <div class="skeleton skeleton-header"></div>
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-text short"></div>
            </div>
          }
        } @else if (filteredProjects().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
            <h3>Nenhum projeto encontrado</h3>
            <p>Crie seu primeiro projeto para começar</p>
            <button class="btn btn-primary" (click)="openCreateModal()">
              Criar Projeto
            </button>
          </div>
        } @else {
          @for (project of filteredProjects(); track project.id; let i = $index) {
            <article
              class="project-card"
              [style.--accent-color]="project.color"
              [style.animation-delay.ms]="i * 50"
              (click)="openProject(project)"
            >
              <div class="card-accent"></div>

              <header class="card-header">
                <div class="card-icon" [style.background]="project.color + '20'" [style.color]="project.color">
                  @switch (project.icon) {
                    @case ('rocket') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
                        <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                      </svg>
                    }
                    @case ('code') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="16 18 22 12 16 6"/>
                        <polyline points="8 6 2 12 8 18"/>
                      </svg>
                    }
                    @case ('star') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    }
                    @default {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                      </svg>
                    }
                  }
                </div>

                <div class="card-actions">
                  <span class="status-badge" [class]="project.status">
                    {{ getStatusLabel(project.status) }}
                  </span>
                </div>
              </header>

              <div class="card-body">
                <h3 class="card-title">{{ project.name }}</h3>
                @if (project.description) {
                  <p class="card-description">{{ project.description }}</p>
                }
              </div>

              <footer class="card-footer">
                <div class="card-meta">
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {{ formatDate(project.createdAt) }}
                  </span>
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18"/>
                      <path d="M9 21V9"/>
                    </svg>
                    {{ project.boards?.length || 0 }} boards
                  </span>
                </div>
              </footer>
            </article>
          }
        }
      </div>
    </div>

    <!-- Modal de Criar Projeto -->
    @if (showCreateModal()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h2>Novo Projeto</h2>
            <button class="modal-close" (click)="closeCreateModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </header>

          <form [formGroup]="projectForm" (ngSubmit)="createProject()">
            <div class="modal-body">
              <div class="form-group">
                <label for="name">Nome do Projeto *</label>
                <input
                  type="text"
                  id="name"
                  formControlName="name"
                  placeholder="Ex: Sprint Q1 2026"
                  [class.error]="projectForm.get('name')?.invalid && projectForm.get('name')?.touched"
                />
                @if (projectForm.get('name')?.invalid && projectForm.get('name')?.touched) {
                  <span class="error-message">
                    @if (projectForm.get('name')?.errors?.['required']) {
                      Nome é obrigatório
                    } @else if (projectForm.get('name')?.errors?.['minlength']) {
                      Nome deve ter no mínimo 2 caracteres
                    }
                  </span>
                }
              </div>

              <div class="form-group">
                <label for="description">Descrição</label>
                <textarea
                  id="description"
                  formControlName="description"
                  placeholder="Descreva o objetivo do projeto..."
                  rows="3"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Cor</label>
                  <div class="color-picker">
                    @for (color of availableColors; track color) {
                      <button
                        type="button"
                        class="color-option"
                        [style.background-color]="color"
                        [class.selected]="projectForm.get('color')?.value === color"
                        (click)="selectColor(color)"
                      >
                        @if (projectForm.get('color')?.value === color) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        }
                      </button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label>Ícone</label>
                  <div class="icon-picker">
                    @for (icon of availableIcons; track icon.value) {
                      <button
                        type="button"
                        class="icon-option"
                        [class.selected]="projectForm.get('icon')?.value === icon.value"
                        (click)="selectIcon(icon.value)"
                        [title]="icon.label"
                      >
                        <span [innerHTML]="icon.svg"></span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <footer class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="projectForm.invalid || creating()"
              >
                @if (creating()) {
                  <span class="spinner"></span>
                  Criando...
                } @else {
                  Criar Projeto
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

    .page-header {
      margin-bottom: var(--spacing-2xl);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }

    .header-title {
      h1 {
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--spacing-xs);
      }

      .subtitle {
        font-size: var(--font-size-md);
        color: var(--color-text-tertiary);
      }
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
        box-shadow: var(--shadow-md);
      }
    }

    .btn-secondary {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);

      &:hover:not(:disabled) {
        background: var(--color-bg-hover);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
    }

    .stat-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);

      .stat-value {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin-bottom: var(--spacing-xs);
      }

      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--color-text-tertiary);
      }
    }

    .toolbar {
      display: flex;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      max-width: 400px;
      position: relative;

      svg {
        position: absolute;
        left: var(--spacing-md);
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        color: var(--color-text-tertiary);
      }

      input {
        width: 100%;
        padding: var(--spacing-md) var(--spacing-lg);
        padding-left: 44px;
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
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

    .filter-tabs {
      display: flex;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 4px;
    }

    .filter-tab {
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);

      &:hover {
        color: var(--color-text-primary);
      }

      &.active {
        background: var(--color-accent);
        color: white;
      }
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-lg);
    }

    .project-card {
      --accent-color: var(--color-accent);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
      animation: fadeInUp 0.4s ease backwards;

      &:hover {
        border-color: var(--color-border-hover);
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);

        .card-accent {
          height: 4px;
        }
      }
    }

    .card-accent {
      height: 3px;
      background: var(--accent-color);
      transition: height var(--transition-fast);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--spacing-lg);
      padding-bottom: 0;
    }

    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 22px;
        height: 22px;
      }
    }

    .status-badge {
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.03em;

      &.active {
        background: var(--color-success-light);
        color: var(--color-success);
      }

      &.archived {
        background: var(--color-bg-hover);
        color: var(--color-text-tertiary);
      }

      &.completed {
        background: var(--color-info-light);
        color: var(--color-info);
      }
    }

    .card-body {
      padding: var(--spacing-lg);
    }

    .card-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-primary);
    }

    .card-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-tertiary);
      line-height: var(--line-height-relaxed);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      padding: var(--spacing-md) var(--spacing-lg);
      border-top: 1px solid var(--color-border);
    }

    .card-meta {
      display: flex;
      gap: var(--spacing-lg);
    }

    .meta-item {
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

    .skeleton-card {
      padding: var(--spacing-lg);
      cursor: default;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-bg-tertiary) 0%,
        var(--color-bg-elevated) 50%,
        var(--color-bg-tertiary) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-md);
    }

    .skeleton-header {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      margin-bottom: var(--spacing-lg);
    }

    .skeleton-text {
      height: 20px;
      margin-bottom: var(--spacing-md);

      &.short {
        width: 60%;
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--spacing-4xl) var(--spacing-2xl);
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto var(--spacing-xl);
      color: var(--color-text-tertiary);

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .empty-state h3 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--spacing-sm);
    }

    .empty-state p {
      color: var(--color-text-tertiary);
      margin-bottom: var(--spacing-xl);
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
      max-width: 500px;
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

          &:focus {
            box-shadow: 0 0 0 3px var(--color-danger-light);
          }
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
      width: 32px;
      height: 32px;
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
        box-shadow: var(--shadow-md);
      }

      svg {
        width: 16px;
        height: 16px;
        color: white;
      }
    }

    .icon-picker {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .icon-option {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-tertiary);

      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      &.selected {
        background: var(--color-accent-light);
        border-color: var(--color-accent);
        color: var(--color-accent);
      }

      :deep(svg) {
        width: 18px;
        height: 18px;
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
export class ProjectsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  // Signals
  loading = this.projectService.loading;
  projects = this.projectService.projects;
  showCreateModal = signal(false);
  creating = signal(false);
  activeFilter = signal<'all' | 'active' | 'archived'>('all');
  searchQuery = '';

  // Computed
  projectCount = computed(() => this.projects().length);
  activeCount = computed(() =>
    this.projects().filter((p) => p.status === ProjectStatus.ACTIVE).length
  );
  completedCount = computed(() =>
    this.projects().filter((p) => p.status === ProjectStatus.COMPLETED).length
  );

  filteredProjects = computed(() => {
    let result = this.projects();

    // Filtro por status
    const filter = this.activeFilter();
    if (filter === 'active') {
      result = result.filter((p) => p.status === ProjectStatus.ACTIVE);
    } else if (filter === 'archived') {
      result = result.filter((p) => p.status === ProjectStatus.ARCHIVED);
    }

    // Filtro por busca
    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    return result;
  });

  // Form
  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [''],
    color: ['#FF6B4A'],
    icon: ['folder'],
  });

  // Opções
  availableColors = [
    '#FF6B4A',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#6366F1',
    '#14B8A6',
  ];

  availableIcons = [
    { value: 'folder', label: 'Pasta', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' },
    { value: 'rocket', label: 'Foguete', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg>' },
    { value: 'code', label: 'Código', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
    { value: 'star', label: 'Estrela', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  ];

  ngOnInit(): void {
    this.projectService.loadProjects().subscribe();
  }

  openProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.projectForm.reset({
      color: '#FF6B4A',
      icon: 'folder',
    });
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  selectColor(color: string): void {
    this.projectForm.patchValue({ color });
  }

  selectIcon(icon: string): void {
    this.projectForm.patchValue({ icon });
  }

  createProject(): void {
    if (this.projectForm.invalid) return;

    this.creating.set(true);

    const dto: CreateProjectDto = this.projectForm.value;

    this.projectService.createProject(dto).subscribe({
      next: (project) => {
        this.creating.set(false);
        this.closeCreateModal();
        this.router.navigate(['/projects', project.id]);
      },
      error: () => {
        this.creating.set(false);
      },
    });
  }

  setFilter(filter: 'all' | 'active' | 'archived'): void {
    this.activeFilter.set(filter);
  }

  onSearch(query: string): void {
    this.searchQuery = query;
  }

  getStatusLabel(status: ProjectStatus): string {
    const labels: Record<ProjectStatus, string> = {
      [ProjectStatus.ACTIVE]: 'Ativo',
      [ProjectStatus.ARCHIVED]: 'Arquivado',
      [ProjectStatus.COMPLETED]: 'Concluído',
    };
    return labels[status];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }
}
