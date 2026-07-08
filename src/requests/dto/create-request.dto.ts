import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({
    example: '9b7c1d2e-3f4a-4b5c-8d9e-123456789abc',
    description: 'UUID навыка, который отправитель предлагает в обмен',
  })
  @IsUUID()
  @IsNotEmpty()
  offeredSkillId: string;

  @ApiProperty({
    example: '2f1e3d4c-5b6a-7890-abcd-123456789abc',
    description: 'UUID навыка, который отправитель хочет получить',
  })
  @IsUUID()
  @IsNotEmpty()
  requestedSkillId: string;
}
