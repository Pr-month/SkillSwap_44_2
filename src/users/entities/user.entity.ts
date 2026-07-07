import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { Category } from '../../categories/entities/category.entity';

@Entity('users')
export class User {
  @ApiProperty({ example: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Иван Иванов' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ example: 'ivan@example.com' })
  @Column({ unique: true, length: 255 })
  email: string;

  @ApiProperty({ example: 'Password123' })
  @Column({ length: 255 })
  @Exclude()
  password: string;

  @ApiPropertyOptional({
    example: 'Frontend-разработчик, хочу учить английский',
  })
  @Column({ type: 'text', nullable: true })
  about?: string;

  @ApiProperty({ example: '1999-01-01' })
  @Column({ type: 'date' })
  birthdate: Date;

  @ApiProperty({ example: 'Ханты-Мансийск' })
  @Column({ length: 100 })
  city: string;

  @ApiProperty({ enum: UserGender, example: UserGender.MALE })
  @Column({
    type: 'enum',
    enum: UserGender,
  })
  gender: UserGender;

  @ApiPropertyOptional({ example: '/uploads/avatar.png' })
  @Column({ length: 1000, nullable: true })
  avatar?: string;

  @ApiProperty({ type: () => [Skill] })
  @OneToMany(() => Skill, (skill) => skill.owner)
  skills: Skill[];

  @ApiProperty({ type: () => [Category] })
  @ManyToMany(() => Category)
  @JoinTable()
  wantToLearn: Category[];

  @ApiProperty({ type: () => [Skill] })
  @ManyToMany(() => Skill)
  @JoinTable()
  favoriteSkills: Skill[];

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiPropertyOptional({ example: 'refresh-token-value', nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  @Exclude()
  refreshToken?: string | null;
}
