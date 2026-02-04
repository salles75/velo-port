import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProjectService } from '@core/services/project.service';
import { Project } from '@core/models/project.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <!-- Logo e toggle -->
      <div class="sidebar-header">
        <div class="logo" (click)="navigateHome()">
          <div class="logo-mark">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8L16 4L26 8L16 12L6 8Z" fill="currentColor" opacity="0.4"/>
              <path d="M6 8V20L16 24V12L6 8Z" fill="currentColor" opacity="0.7"/>
              <path d="M16 12V24L26 20V8L16 12Z" fill="currentColor"/>
            </svg>
          </div>
          @if (!collapsed()) {
            <span class="logo-text">Velo</span>
          }
        </div>

        <button class="toggle-btn" (click)="toggleSidebar()" [attr.aria-label]="collapsed() ? 'Expandir menu' : 'Colapsar menu'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            @if (collapsed()) {
              <path d="M9 18l6-6-6-6"/>
            } @else {
              <path d="M15 18l-6-6 6-6"/>
            }
          </svg>
        </button>
      </div>

      <!-- Navegação principal -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          @if (!collapsed()) {
            <span class="nav-section-title">Menu</span>
          }

          <a routerLink="/projects" routerLinkActive="active" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            @if (!collapsed()) {
              <span class="nav-label">Projetos</span>
            }
          </a>
        </div>

        <!-- Projetos recentes -->
        @if (!collapsed() && recentProjects().length > 0) {
          <div class="nav-section">
            <span class="nav-section-title">Recentes</span>

            @for (project of recentProjects(); track project.id) {
              <a [routerLink]="['/projects', project.id]" routerLinkActive="active" class="nav-item project-item">
                <div class="project-color" [style.background-color]="project.color"></div>
                <span class="nav-label truncate">{{ project.name }}</span>
              </a>
            }
          </div>
        }
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        @if (!collapsed()) {
          <div class="version-info">
            <span class="version">v1.0.0</span>
            <span class="author">by Guilherme Salles</span>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      min-width: 260px;
      height: 100vh;
      background: var(--color-bg-secondary);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-normal), min-width var(--transition-normal);
      position: relative;
      z-index: var(--z-sticky);

      &.collapsed {
        width: 72px;
        min-width: 72px;
      }
    }

    .sidebar-header {
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      cursor: pointer;
      transition: opacity var(--transition-fast);

      &:hover {
        opacity: 0.8;
      }
    }

    .logo-mark {
      width: 36px;
      height: 36px;
      color: var(--color-accent);
      flex-shrink: 0;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .logo-text {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--color-text-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .toggle-btn {
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
        color: var(--color-text-primary);
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--spacing-lg);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .nav-section-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
      padding: var(--spacing-sm) var(--spacing-md);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);
      text-decoration: none;

      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }

      &.active {
        background: var(--color-accent-light);
        color: var(--color-accent);

        .nav-icon {
          color: var(--color-accent);
        }
      }
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .nav-label {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
    }

    .project-item {
      .project-color {
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
        flex-shrink: 0;
      }
    }

    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar-footer {
      padding: var(--spacing-lg);
      border-top: 1px solid var(--color-border);
    }

    .version-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    .version {
      font-family: var(--font-family-mono);
    }

    .author {
      opacity: 0.7;
    }

    /* Estados collapsed */
    .collapsed {
      .sidebar-header {
        justify-content: center;
        padding: var(--spacing-lg) var(--spacing-md);
      }

      .toggle-btn {
        position: absolute;
        right: -14px;
        top: 24px;
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        width: 28px;
        height: 28px;
      }

      .sidebar-nav {
        padding: var(--spacing-md);
      }

      .nav-item {
        justify-content: center;
        padding: var(--spacing-md);
      }

      .sidebar-footer {
        display: none;
      }
    }
  `],
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  collapsed = signal(false);
  recentProjects = signal<Project[]>([]);

  ngOnInit(): void {
    this.projectService.loadProjects().subscribe((projects) => {
      this.recentProjects.set(projects.slice(0, 5));
    });
  }

  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }

  navigateHome(): void {
    this.router.navigate(['/projects']);
  }
}
