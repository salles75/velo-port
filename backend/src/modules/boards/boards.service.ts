import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { BoardColumn } from '../columns/entities/column.entity';
import { CreateBoardDto, UpdateBoardDto } from './dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
  ) {}

  async create(createBoardDto: CreateBoardDto): Promise<Board> {
    const board = this.boardRepository.create(createBoardDto);
    const savedBoard = await this.boardRepository.save(board);

    // Criar colunas padrão para novo board
    const defaultColumns = [
      { name: 'Backlog', color: '#6B7280', position: 0 },
      { name: 'A Fazer', color: '#3B82F6', position: 1 },
      { name: 'Em Progresso', color: '#F59E0B', position: 2 },
      { name: 'Em Revisão', color: '#8B5CF6', position: 3 },
      { name: 'Concluído', color: '#10B981', position: 4 },
    ];

    const columns = defaultColumns.map((col) =>
      this.columnRepository.create({
        ...col,
        boardId: savedBoard.id,
      }),
    );

    await this.columnRepository.save(columns);

    return this.findOne(savedBoard.id);
  }

  async findAll(): Promise<Board[]> {
    return this.boardRepository.find({
      relations: ['columns', 'columns.tasks'],
      order: {
        createdAt: 'DESC',
        columns: {
          position: 'ASC',
        },
      },
    });
  }

  async findByProject(projectId: string): Promise<Board[]> {
    return this.boardRepository.find({
      where: { projectId },
      relations: ['columns', 'columns.tasks'],
      order: {
        createdAt: 'DESC',
        columns: {
          position: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['columns', 'columns.tasks', 'project'],
      order: {
        columns: {
          position: 'ASC',
          tasks: {
            position: 'ASC',
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board com ID "${id}" não encontrado`);
    }

    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const board = await this.findOne(id);
    Object.assign(board, updateBoardDto);
    await this.boardRepository.save(board);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const board = await this.findOne(id);
    await this.boardRepository.remove(board);
  }
}
