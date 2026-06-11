import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'date' })
  birthdate: Date;

  @Column({ length: 100 })
  city: string;

  @Column({
    type: 'enum',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  gender: 'MALE' | 'FEMALE' | 'OTHER';

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
    enum: ['USER', 'ADMIN'],
    default: 'USER',
  })
  role: 'USER' | 'ADMIN';

  @Column({ length: 500, nullable: true })
  refreshToken?: string;
}
