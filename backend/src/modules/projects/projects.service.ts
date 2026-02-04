import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: ['boards'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['boards', 'boards.columns', 'boards.columns.tasks'],
    });

    if (!project) {
      throw new NotFoundException(`Projeto com ID "${id}" não encontrado`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }

  async getStatistics(id: string): Promise<{
    totalBoards: number;
    totalTasks: number;
    tasksByStatus: Record<string, number>;
  }> {
    const project = await this.findOne(id);

    let totalTasks = 0;
    const tasksByStatus: Record<string, number> = {};

    project.boards?.forEach((board) => {
      board.columns?.forEach((column) => {
        const taskCount = column.tasks?.length || 0;
        totalTasks += taskCount;
        tasksByStatus[column.name] = (tasksByStatus[column.name] || 0) + taskCount;
      });
    });

    return {
      totalBoards: project.boards?.length || 0,
      totalTasks,
      tasksByStatus,
    };
  }
}
