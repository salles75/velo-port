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
import { ColumnsService } from './columns.service';
import { CreateColumnDto, UpdateColumnDto } from './dto';
import { BoardColumn } from './entities/column.entity';

@ApiTags('columns')
@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova coluna' })
  @ApiResponse({ status: 201, description: 'Coluna criada com sucesso', type: BoardColumn })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createColumnDto: CreateColumnDto): Promise<BoardColumn> {
    return this.columnsService.create(createColumnDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as colunas' })
  @ApiQuery({ name: 'boardId', required: false, description: 'Filtrar por board' })
  @ApiResponse({ status: 200, description: 'Lista de colunas', type: [BoardColumn] })
  findAll(@Query('boardId') boardId?: string): Promise<BoardColumn[]> {
    if (boardId) {
      return this.columnsService.findByBoard(boardId);
    }
    return this.columnsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar coluna por ID' })
  @ApiParam({ name: 'id', description: 'UUID da coluna' })
  @ApiResponse({ status: 200, description: 'Coluna encontrada', type: BoardColumn })
  @ApiResponse({ status: 404, description: 'Coluna não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BoardColumn> {
    return this.columnsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar coluna' })
  @ApiParam({ name: 'id', description: 'UUID da coluna' })
  @ApiResponse({ status: 200, description: 'Coluna atualizada', type: BoardColumn })
  @ApiResponse({ status: 404, description: 'Coluna não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ): Promise<BoardColumn> {
    return this.columnsService.update(id, updateColumnDto);
  }

  @Post('reorder/:boardId')
  @ApiOperation({ summary: 'Reordenar colunas de um board' })
  @ApiParam({ name: 'boardId', description: 'UUID do board' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        columnIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array ordenado de IDs das colunas',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Colunas reordenadas', type: [BoardColumn] })
  reorder(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body('columnIds') columnIds: string[],
  ): Promise<BoardColumn[]> {
    return this.columnsService.reorder(boardId, columnIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover coluna' })
  @ApiParam({ name: 'id', description: 'UUID da coluna' })
  @ApiResponse({ status: 204, description: 'Coluna removida' })
  @ApiResponse({ status: 404, description: 'Coluna não encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.columnsService.remove(id);
  }
}
