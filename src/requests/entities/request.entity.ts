import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { RequestStatus } from '../enums/requests.enums';

@Entity('requests')
export class Request {
  @ApiProperty({ example: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '2026-07-03T09:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  sender: User;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  receiver: User;

  @ApiProperty({ enum: RequestStatus, example: RequestStatus.PENDING })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @ApiProperty({ type: () => Skill })
  @ManyToOne(() => Skill)
  offeredSkill: Skill;

  @ApiProperty({ type: () => Skill })
  @ManyToOne(() => Skill)
  requestedSkill: Skill;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isRead: boolean;
}
