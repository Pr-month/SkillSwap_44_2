import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

	@Index()
	@Column({ type: 'varchar', length: 200 })
	name!: string;
}
