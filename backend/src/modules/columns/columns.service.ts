import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn } from './entities/column.entity';
import { CreateColumnDto, UpdateColumnDto } from './dto';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
  ) {}

  async create(createColumnDto: CreateColumnDto): Promise<BoardColumn> {
    // Se não foi definida posição, colocar no final
    if (createColumnDto.position === undefined) {
      const lastColumn = await this.columnRepository.findOne({
        where: { boardId: createColumnDto.boardId },
        order: { position: 'DESC' },
      });
      createColumnDto.position = lastColumn ? lastColumn.position + 1 : 0;
    }

    const column = this.columnRepository.create(createColumnDto);
    return this.columnRepository.save(column);
  }

  async findAll(): Promise<BoardColumn[]> {
    return this.columnRepository.find({
      relations: ['tasks'],
      order: { position: 'ASC' },
    });
  }

  async findByBoard(boardId: string): Promise<BoardColumn[]> {
    return this.columnRepository.find({
      where: { boardId },
      relations: ['tasks'],
      order: {
        position: 'ASC',
        tasks: {
          position: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<BoardColumn> {
    const column = await this.columnRepository.findOne({
      where: { id },
      relations: ['tasks', 'board'],
    });

    if (!column) {
      throw new NotFoundException(`Coluna com ID "${id}" não encontrada`);
    }

    return column;
  }

  async update(id: string, updateColumnDto: UpdateColumnDto): Promise<BoardColumn> {
    const column = await this.findOne(id);
    Object.assign(column, updateColumnDto);
    return this.columnRepository.save(column);
  }

  async remove(id: string): Promise<void> {
    const column = await this.findOne(id);
    await this.columnRepository.remove(column);
  }

  async reorder(boardId: string, columnIds: string[]): Promise<BoardColumn[]> {
    const columns = await this.findByBoard(boardId);

    if (columns.length !== columnIds.length) {
      throw new BadRequestException('Número de colunas não corresponde');
    }

    // Verificar se todos os IDs pertencem ao board
    const columnIdSet = new Set(columns.map((c) => c.id));
    const allIdsValid = columnIds.every((id) => columnIdSet.has(id));

    if (!allIdsValid) {
      throw new BadRequestException('IDs de colunas inválidos');
    }

    // Atualizar posições
    const updatePromises = columnIds.map((columnId, index) =>
      this.columnRepository.update(columnId, { position: index }),
    );

    await Promise.all(updatePromises);

    return this.findByBoard(boardId);
  }
}
