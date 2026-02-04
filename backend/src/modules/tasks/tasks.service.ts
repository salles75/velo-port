import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task } from './entities/task.entity';
import { BoardColumn } from '../columns/entities/column.entity';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Verificar se a coluna existe
    const column = await this.columnRepository.findOne({
      where: { id: createTaskDto.columnId },
      relations: ['tasks'],
    });

    if (!column) {
      throw new NotFoundException(`Coluna com ID "${createTaskDto.columnId}" não encontrada`);
    }

    // Verificar limite de tarefas (WIP limit)
    if (column.taskLimit && column.tasks.length >= column.taskLimit) {
      throw new BadRequestException(
        `Coluna "${column.name}" atingiu o limite de ${column.taskLimit} tarefas`,
      );
    }

    // Se não foi definida posição, colocar no final
    if (createTaskDto.position === undefined) {
      const lastTask = await this.taskRepository.findOne({
        where: { columnId: createTaskDto.columnId },
        order: { position: 'DESC' },
      });
      createTaskDto.position = lastTask ? lastTask.position + 1 : 0;
    }

    const task = this.taskRepository.create(createTaskDto);
    return this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ['column'],
      order: { position: 'ASC' },
    });
  }

  async findByColumn(columnId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { columnId },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['column', 'column.board'],
    });

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${id}" não encontrada`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    // Se está mudando de coluna, verificar WIP limit
    if (updateTaskDto.columnId && updateTaskDto.columnId !== task.columnId) {
      const targetColumn = await this.columnRepository.findOne({
        where: { id: updateTaskDto.columnId },
        relations: ['tasks'],
      });

      if (!targetColumn) {
        throw new NotFoundException(`Coluna com ID "${updateTaskDto.columnId}" não encontrada`);
      }

      if (targetColumn.taskLimit && targetColumn.tasks.length >= targetColumn.taskLimit) {
        throw new BadRequestException(
          `Coluna "${targetColumn.name}" atingiu o limite de ${targetColumn.taskLimit} tarefas`,
        );
      }
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async move(id: string, moveTaskDto: MoveTaskDto): Promise<Task> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await this.findOne(id);
      const sourceColumnId = task.columnId;
      const targetColumnId = moveTaskDto.targetColumnId;
      const newPosition = moveTaskDto.newPosition;

      // Verificar se a coluna de destino existe
      const targetColumn = await this.columnRepository.findOne({
        where: { id: targetColumnId },
        relations: ['tasks'],
      });

      if (!targetColumn) {
        throw new NotFoundException(`Coluna com ID "${targetColumnId}" não encontrada`);
      }

      // Verificar WIP limit (apenas se for uma coluna diferente)
      if (
        sourceColumnId !== targetColumnId &&
        targetColumn.taskLimit &&
        targetColumn.tasks.length >= targetColumn.taskLimit
      ) {
        throw new BadRequestException(
          `Coluna "${targetColumn.name}" atingiu o limite de ${targetColumn.taskLimit} tarefas`,
        );
      }

      const oldPosition = task.position;

      if (sourceColumnId === targetColumnId) {
        // Movendo dentro da mesma coluna
        if (newPosition > oldPosition) {
          // Movendo para baixo
          await queryRunner.manager
            .createQueryBuilder()
            .update(Task)
            .set({ position: () => 'position - 1' })
            .where('columnId = :columnId', { columnId: sourceColumnId })
            .andWhere('position > :oldPosition', { oldPosition })
            .andWhere('position <= :newPosition', { newPosition })
            .execute();
        } else if (newPosition < oldPosition) {
          // Movendo para cima
          await queryRunner.manager
            .createQueryBuilder()
            .update(Task)
            .set({ position: () => 'position + 1' })
            .where('columnId = :columnId', { columnId: sourceColumnId })
            .andWhere('position >= :newPosition', { newPosition })
            .andWhere('position < :oldPosition', { oldPosition })
            .execute();
        }
      } else {
        // Movendo para outra coluna
        // Decrementar posições na coluna de origem
        await queryRunner.manager
          .createQueryBuilder()
          .update(Task)
          .set({ position: () => 'position - 1' })
          .where('columnId = :columnId', { columnId: sourceColumnId })
          .andWhere('position > :oldPosition', { oldPosition })
          .execute();

        // Incrementar posições na coluna de destino
        await queryRunner.manager
          .createQueryBuilder()
          .update(Task)
          .set({ position: () => 'position + 1' })
          .where('columnId = :columnId', { columnId: targetColumnId })
          .andWhere('position >= :newPosition', { newPosition })
          .execute();

        // Atualizar a coluna da tarefa
        task.columnId = targetColumnId;
      }

      // Atualizar a posição da tarefa
      task.position = newPosition;
      await queryRunner.manager.save(task);

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reorder(columnId: string, taskIds: string[]): Promise<Task[]> {
    const tasks = await this.findByColumn(columnId);

    if (tasks.length !== taskIds.length) {
      throw new BadRequestException('Número de tarefas não corresponde');
    }

    // Verificar se todos os IDs pertencem à coluna
    const taskIdSet = new Set(tasks.map((t) => t.id));
    const allIdsValid = taskIds.every((id) => taskIdSet.has(id));

    if (!allIdsValid) {
      throw new BadRequestException('IDs de tarefas inválidos');
    }

    // Atualizar posições
    const updatePromises = taskIds.map((taskId, index) =>
      this.taskRepository.update(taskId, { position: index }),
    );

    await Promise.all(updatePromises);

    return this.findByColumn(columnId);
  }

  async search(query: string): Promise<Task[]> {
    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.column', 'column')
      .where('task.title LIKE :query', { query: `%${query}%` })
      .orWhere('task.description LIKE :query', { query: `%${query}%` })
      .orWhere('task.assignee LIKE :query', { query: `%${query}%` })
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }
}
