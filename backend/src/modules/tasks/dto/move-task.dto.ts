import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min } from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({
    description: 'ID da coluna de destino',
    example: 'uuid-da-coluna-destino',
  })
  @IsUUID('4', { message: 'ID da coluna deve ser um UUID válido' })
  targetColumnId: string;

  @ApiProperty({
    description: 'Nova posição da tarefa na coluna de destino',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  newPosition: number;
}
