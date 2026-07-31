import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Уникальный идентификатор города',
  })
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  @ApiProperty({ description: 'Название города' })
  name!: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  @ApiProperty({
    description: 'Широта в десятичных градусах',
    required: false,
  })
  lat?: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  @ApiProperty({
    description: 'Долгота в десятичных градусах',
    required: false,
  })
  lon?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({
    description: 'Район/округ города',
    required: false,
  })
  district?: string;

  @Column({ type: 'int', nullable: true })
  @ApiProperty({
    description: 'Численность населения',
    required: false,
  })
  population?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({
    description: 'Субъект РФ',
    required: false,
  })
  subject?: string;
}
