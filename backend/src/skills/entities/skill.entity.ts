import { Category } from '../../categories/entities/category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('skills')
export class Skill {
  @ApiProperty({ example: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Игра на гитаре' })
  @Column({ length: 100 })
  title: string;

  @ApiProperty({ example: 'Научу базовым аккордам и простым песням' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: ['/uploads/guitar-1.png'], type: [String] })
  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.skills)
  owner: User;

  @ManyToOne(() => Category, { nullable: true })
  category: Category;
}
