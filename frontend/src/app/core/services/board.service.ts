import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, switchMap, of, forkJoin } from 'rxjs';
import {
  Board,
  BoardColumn,
  CreateBoardDto,
  CreateColumnDto,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  // Estado reativo com Signals
  private readonly boardsSignal = signal<Board[]>([]);
  private readonly currentBoardSignal = signal<Board | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  // Computed signals
  readonly boards = this.boardsSignal.asReadonly();
  readonly currentBoard = this.currentBoardSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly currentBoardColumns = computed(() =>
    this.currentBoardSignal()?.columns?.sort((a, b) => a.position - b.position) ?? []
  );

  readonly columnCount = computed(() =>
    this.currentBoardSignal()?.columns?.length ?? 0
  );

  readonly totalTasks = computed(() =>
    this.currentBoardSignal()?.columns?.reduce(
      (sum, col) => sum + (col.tasks?.length ?? 0),
      0
    ) ?? 0
  );

  // BehaviorSubject para compatibilidade com RxJS
  private readonly currentBoard$ = new BehaviorSubject<Board | null>(null);

  constructor(private readonly http: HttpClient) {}

  loadBoardsByProject(projectId: string): Observable<Board[]> {
    this.loadingSignal.set(true);

    return this.http.get<Board[]>(`/boards?projectId=${projectId}`).pipe(
      tap((boards) => {
        this.boardsSignal.set(boards);
        this.loadingSignal.set(false);
      })
    );
  }

  loadBoard(id: string): Observable<Board> {
    this.loadingSignal.set(true);

    return this.http.get<Board>(`/boards/${id}`).pipe(
      tap((board) => {
        // Ordenar colunas e tarefas
        if (board.columns) {
          board.columns.sort((a, b) => a.position - b.position);
          board.columns.forEach((col) => {
            if (col.tasks) {
              col.tasks.sort((a, b) => a.position - b.position);
            }
          });
        }

        this.currentBoardSignal.set(board);
        this.currentBoard$.next(board);
        this.loadingSignal.set(false);
      })
    );
  }

  createBoard(dto: CreateBoardDto): Observable<Board> {
    return this.http.post<Board>('/boards', dto).pipe(
      tap((board) => {
        this.boardsSignal.update((boards) => [board, ...boards]);
      })
    );
  }

  updateBoard(id: string, dto: Partial<CreateBoardDto>): Observable<Board> {
    return this.http.patch<Board>(`/boards/${id}`, dto).pipe(
      tap((updated) => {
        this.boardsSignal.update((boards) =>
          boards.map((b) => (b.id === id ? updated : b))
        );

        if (this.currentBoardSignal()?.id === id) {
          this.currentBoardSignal.set(updated);
          this.currentBoard$.next(updated);
        }
      })
    );
  }

  deleteBoard(id: string): Observable<void> {
    return this.http.delete<void>(`/boards/${id}`).pipe(
      tap(() => {
        this.boardsSignal.update((boards) => boards.filter((b) => b.id !== id));

        if (this.currentBoardSignal()?.id === id) {
          this.currentBoardSignal.set(null);
          this.currentBoard$.next(null);
        }
      })
    );
  }

  // Gerenciamento de colunas
  createColumn(dto: CreateColumnDto): Observable<BoardColumn> {
    return this.http.post<BoardColumn>('/columns', dto).pipe(
      tap((column) => {
        const board = this.currentBoardSignal();
        if (board && board.id === dto.boardId) {
          const updatedColumns = [...(board.columns ?? []), column].sort(
            (a, b) => a.position - b.position
          );

          this.currentBoardSignal.set({
            ...board,
            columns: updatedColumns,
          });
          this.currentBoard$.next(this.currentBoardSignal());
        }
      })
    );
  }

  updateColumn(id: string, dto: Partial<CreateColumnDto>): Observable<BoardColumn> {
    return this.http.patch<BoardColumn>(`/columns/${id}`, dto).pipe(
      tap((updated) => {
        const board = this.currentBoardSignal();
        if (board?.columns) {
          const updatedColumns = board.columns.map((col) =>
            col.id === id ? { ...col, ...updated } : col
          );

          this.currentBoardSignal.set({
            ...board,
            columns: updatedColumns,
          });
          this.currentBoard$.next(this.currentBoardSignal());
        }
      })
    );
  }

  deleteColumn(id: string): Observable<void> {
    return this.http.delete<void>(`/columns/${id}`).pipe(
      tap(() => {
        const board = this.currentBoardSignal();
        if (board?.columns) {
          const updatedColumns = board.columns.filter((col) => col.id !== id);

          this.currentBoardSignal.set({
            ...board,
            columns: updatedColumns,
          });
          this.currentBoard$.next(this.currentBoardSignal());
        }
      })
    );
  }

  reorderColumns(boardId: string, columnIds: string[]): Observable<BoardColumn[]> {
    return this.http
      .post<BoardColumn[]>(`/columns/reorder/${boardId}`, { columnIds })
      .pipe(
        tap((columns) => {
          const board = this.currentBoardSignal();
          if (board && board.id === boardId) {
            // Manter as tarefas das colunas atuais
            const columnsWithTasks = columns.map((col) => {
              const existingCol = board.columns?.find((c) => c.id === col.id);
              return {
                ...col,
                tasks: existingCol?.tasks ?? [],
              };
            });

            this.currentBoardSignal.set({
              ...board,
              columns: columnsWithTasks.sort((a, b) => a.position - b.position),
            });
            this.currentBoard$.next(this.currentBoardSignal());
          }
        })
      );
  }

  // Stream do board atual
  getCurrentBoardStream(): Observable<Board | null> {
    return this.currentBoard$.asObservable();
  }

  // Atualizar board local (sem requisição) - útil para otimistic updates
  updateBoardLocal(board: Board): void {
    this.currentBoardSignal.set(board);
    this.currentBoard$.next(board);
  }

  clearCurrentBoard(): void {
    this.currentBoardSignal.set(null);
    this.currentBoard$.next(null);
  }
}
