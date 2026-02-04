import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto';
import { Task } from './entities/task.entity';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova tarefa' })
  @ApiResponse({ status: 201, description: 'Tarefa criada com sucesso', type: Task })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou limite de tarefas atingido' })
  create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as tarefas' })
  @ApiQuery({ name: 'columnId', required: false, description: 'Filtrar por coluna' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar tarefas' })
  @ApiResponse({ status: 200, description: 'Lista de tarefas', type: [Task] })
  findAll(
    @Query('columnId') columnId?: string,
    @Query('search') search?: string,
  ): Promise<Task[]> {
    if (search) {
      return this.tasksService.search(search);
    }
    if (columnId) {
      return this.tasksService.findByColumn(columnId);
    }
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tarefa por ID' })
  @ApiParam({ name: 'id', description: 'UUID da tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa encontrada', type: Task })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  @ApiParam({ name: 'id', description: 'UUID da tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa atualizada', type: Task })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Mover tarefa para outra coluna/posição (Drag & Drop)' })
  @ApiParam({ name: 'id', description: 'UUID da tarefa' })
  @ApiResponse({ status: 200, description: 'Tarefa movida com sucesso', type: Task })
  @ApiResponse({ status: 400, description: 'Movimento inválido ou limite de tarefas atingido' })
  @ApiResponse({ status: 404, description: 'Tarefa ou coluna não encontrada' })
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moveTaskDto: MoveTaskDto,
  ): Promise<Task> {
    return this.tasksService.move(id, moveTaskDto);
  }

  @Post('reorder/:columnId')
  @ApiOperation({ summary: 'Reordenar tarefas de uma coluna' })
  @ApiParam({ name: 'columnId', description: 'UUID da coluna' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        taskIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array ordenado de IDs das tarefas',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tarefas reordenadas', type: [Task] })
  reorder(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body('taskIds') taskIds: string[],
  ): Promise<Task[]> {
    return this.tasksService.reorder(columnId, taskIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover tarefa' })
  @ApiParam({ name: 'id', description: 'UUID da tarefa' })
  @ApiResponse({ status: 204, description: 'Tarefa removida' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
