import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Board } from '../../boards/entities/board.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('board_columns')
export class BoardColumn extends BaseEntity {
  @Column({ length: 50 })
  name: string;

  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @Column({ default: 0 })
  position: number;

  @Column({ name: 'task_limit', nullable: true })
  taskLimit: number;

  @Column({ name: 'board_id' })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.columns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @OneToMany(() => Task, (task) => task.column, {
    cascade: true,
    eager: true,
  })
  tasks: Task[];
}
