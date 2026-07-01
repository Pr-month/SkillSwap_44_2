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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  // Ссылка на родительскую категорию (self-referencing)
  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Category | null;

  @Column({ nullable: true })
  parentId?: string;

  // Дочерние категории
  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @ManyToMany(() => User, (user) => user.wantToLearn)
  usersWhoWantToLearn: User[];
}
