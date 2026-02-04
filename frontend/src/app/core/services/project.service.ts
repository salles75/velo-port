import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, map, switchMap, of } from 'rxjs';
import {
  Project,
  CreateProjectDto,
  ProjectStatistics,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  // Estado reativo com Signals
  private readonly projectsSignal = signal<Project[]>([]);
  private readonly selectedProjectSignal = signal<Project | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  // Computed signals para derivar estado
  readonly projects = this.projectsSignal.asReadonly();
  readonly selectedProject = this.selectedProjectSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly activeProjects = computed(() =>
    this.projectsSignal().filter((p) => p.status === 'active')
  );

  readonly projectCount = computed(() => this.projectsSignal().length);

  // BehaviorSubject para compatibilidade com RxJS streams
  private readonly projects$ = new BehaviorSubject<Project[]>([]);

  constructor(private readonly http: HttpClient) {}

  loadProjects(): Observable<Project[]> {
    this.loadingSignal.set(true);

    return this.http.get<Project[]>('/projects').pipe(
      tap((projects) => {
        this.projectsSignal.set(projects);
        this.projects$.next(projects);
        this.loadingSignal.set(false);
      })
    );
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`/projects/${id}`).pipe(
      tap((project) => {
        this.selectedProjectSignal.set(project);
      })
    );
  }

  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>('/projects', dto).pipe(
      tap((project) => {
        this.projectsSignal.update((projects) => [project, ...projects]);
        this.projects$.next(this.projectsSignal());
      })
    );
  }

  updateProject(id: string, dto: Partial<CreateProjectDto>): Observable<Project> {
    return this.http.patch<Project>(`/projects/${id}`, dto).pipe(
      tap((updated) => {
        this.projectsSignal.update((projects) =>
          projects.map((p) => (p.id === id ? updated : p))
        );
        this.projects$.next(this.projectsSignal());

        if (this.selectedProjectSignal()?.id === id) {
          this.selectedProjectSignal.set(updated);
        }
      })
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`/projects/${id}`).pipe(
      tap(() => {
        this.projectsSignal.update((projects) =>
          projects.filter((p) => p.id !== id)
        );
        this.projects$.next(this.projectsSignal());

        if (this.selectedProjectSignal()?.id === id) {
          this.selectedProjectSignal.set(null);
        }
      })
    );
  }

  getStatistics(id: string): Observable<ProjectStatistics> {
    return this.http.get<ProjectStatistics>(`/projects/${id}/statistics`);
  }

  // Stream de projetos para uso com async pipe
  getProjectsStream(): Observable<Project[]> {
    return this.projects$.asObservable();
  }

  // Busca projeto por ID no cache ou faz requisição
  getProjectById(id: string): Observable<Project | undefined> {
    const cached = this.projectsSignal().find((p) => p.id === id);
    if (cached) {
      return of(cached);
    }
    return this.getProject(id).pipe(map((p) => p));
  }

  clearSelection(): void {
    this.selectedProjectSignal.set(null);
  }
}
