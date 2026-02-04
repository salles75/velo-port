import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects-list/projects-list.component').then(
        (m) => m.ProjectsListComponent
      ),
  },
  {
    path: 'projects/:projectId',
    loadComponent: () =>
      import('./features/projects/project-detail/project-detail.component').then(
        (m) => m.ProjectDetailComponent
      ),
  },
  {
    path: 'board/:boardId',
    loadComponent: () =>
      import('./features/board/board.component').then((m) => m.BoardComponent),
  },
  {
    path: '**',
    redirectTo: 'projects',
  },
];
