import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('categories')
export class Category {
  @ApiProperty({ example: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Музыкальные инструменты' })
  @Column({ length: 100 })
  name: string;

  @ApiPropertyOptional({ type: () => Category, nullable: true })
  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Category | null;

  @ApiPropertyOptional({ example: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc' })
  @Column({ nullable: true })
  parentId?: string;

  @ApiProperty({ type: () => [Category] })
  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @ApiProperty({ type: () => [User] })
  @ManyToMany(() => User, (user) => user.wantToLearn)
  usersWhoWantToLearn: User[];
}
