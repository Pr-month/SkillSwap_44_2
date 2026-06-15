import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserGender, UserRole } from '../enums/users.enums';

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

  //TODO: изменить тип при добавлении Entity для навыков, создать связь
  @Column({ array: true })
  skills: string[];

  @Column({ array: true })
  wantToLearn: string[];

  //TODO: изменить тип при добавлении Entity для навыков, создать связь
  @Column({ array: true })
  favoriteSkills: string[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ length: 500, nullable: true })
  refreshToken?: string;
}
