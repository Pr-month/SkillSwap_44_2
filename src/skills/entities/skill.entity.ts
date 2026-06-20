import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @ManyToOne(() => User, (user) => user.skills)
  owner: User;

  //TODO: заменить на связь @ManyToOne(() => Category), когда появится Category entity
  @Column({ nullable: true })
  categoryId: string;
}
