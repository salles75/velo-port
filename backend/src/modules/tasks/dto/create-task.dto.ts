import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { TaskPriority, TaskType } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Implementar autenticação JWT',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2, { message: 'Título deve ter no mínimo 2 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da tarefa',
    example: 'Implementar sistema de autenticação usando JWT com refresh tokens',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Prioridade da tarefa',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Prioridade inválida' })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Tipo da tarefa',
    enum: TaskType,
    default: TaskType.TASK,
  })
  @IsOptional()
  @IsEnum(TaskType, { message: 'Tipo de tarefa inválido' })
  type?: TaskType;

  @ApiPropertyOptional({
    description: 'Posição da tarefa na coluna',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    description: 'Story points (estimativa de esforço)',
    example: 5,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  storyPoints?: number;

  @ApiPropertyOptional({
    description: 'Data de entrega',
    example: '2026-03-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de entrega inválida' })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Tags da tarefa',
    example: ['frontend', 'urgente'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Responsável pela tarefa',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignee?: string;

  @ApiProperty({
    description: 'ID da coluna',
    example: 'uuid-da-coluna',
  })
  @IsUUID('4', { message: 'ID da coluna deve ser um UUID válido' })
  columnId: string;
}
