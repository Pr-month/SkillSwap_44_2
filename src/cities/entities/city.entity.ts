import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  lat?: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  lon?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district?: string;

  @Column({ type: 'int', nullable: true })
  population?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject?: string;
}
