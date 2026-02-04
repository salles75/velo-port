import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  Matches,
} from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({
    description: 'Nome da coluna',
    example: 'Em Progresso',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1, { message: 'Nome deve ter no mínimo 1 caractere' })
  @MaxLength(50, { message: 'Nome deve ter no máximo 50 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Cor da coluna em hexadecimal',
    example: '#F59E0B',
    default: '#6B7280',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Cor deve estar no formato hexadecimal (#RRGGBB)',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Posição da coluna',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    description: 'Limite de tarefas na coluna (WIP limit)',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  taskLimit?: number;

  @ApiProperty({
    description: 'ID do board',
    example: 'uuid-do-board',
  })
  @IsUUID('4', { message: 'ID do board deve ser um UUID válido' })
  boardId: string;
}
