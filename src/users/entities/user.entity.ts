import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserGender, UserRole } from '../enums/users.enums';
import { Skill } from '../../skills/entities/skill.entity';
import { Category } from 'src/categories/entities/category.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'date' })
  birthdate: Date;

  @Column({ length: 100 })
  city: string;

  @Column({
    type: 'enum',
    enum: UserGender,
  })
  gender: UserGender;

  @Column({ length: 1000, nullable: true })
  avatar?: string;

  @OneToMany(() => Skill, (skill) => skill.owner)
  skills: Skill[];

  @ManyToMany(() => Category)
  @JoinTable()
  wantToLearn: Category[];

  @ManyToMany(() => Skill)
  @JoinTable()
  favoriteSkills: Skill[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Exclude()
  refreshToken?: string | null;
}
