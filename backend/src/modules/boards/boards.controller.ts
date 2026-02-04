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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { Board } from './entities/board.entity';

@ApiTags('boards')
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo board' })
  @ApiResponse({ status: 201, description: 'Board criado com sucesso', type: Board })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createBoardDto: CreateBoardDto): Promise<Board> {
    return this.boardsService.create(createBoardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os boards' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filtrar por projeto' })
  @ApiResponse({ status: 200, description: 'Lista de boards', type: [Board] })
  findAll(@Query('projectId') projectId?: string): Promise<Board[]> {
    if (projectId) {
      return this.boardsService.findByProject(projectId);
    }
    return this.boardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar board por ID' })
  @ApiParam({ name: 'id', description: 'UUID do board' })
  @ApiResponse({ status: 200, description: 'Board encontrado', type: Board })
  @ApiResponse({ status: 404, description: 'Board não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Board> {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar board' })
  @ApiParam({ name: 'id', description: 'UUID do board' })
  @ApiResponse({ status: 200, description: 'Board atualizado', type: Board })
  @ApiResponse({ status: 404, description: 'Board não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<Board> {
    return this.boardsService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover board' })
  @ApiParam({ name: 'id', description: 'UUID do board' })
  @ApiResponse({ status: 204, description: 'Board removido' })
  @ApiResponse({ status: 404, description: 'Board não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.boardsService.remove(id);
  }
}
