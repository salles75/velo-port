import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './modules/projects/projects.module';
import { BoardsModule } from './modules/boards/boards.module';
import { ColumnsModule } from './modules/columns/columns.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'velo.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Em produção, usar migrations
      logging: process.env.NODE_ENV === 'development',
    }),
    ProjectsModule,
    BoardsModule,
    ColumnsModule,
    TasksModule,
  ],
})
export class AppModule {}
