import { Injectable } from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { City } from './entities/city.entity';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { CitySearchQuery } from './dto/city-search.query';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  // create(createCityDto: CreateCityDto) {
  //   return 'This action adds a new city';
  // }

  async findAll(query?: CitySearchQuery): Promise<City[]> {
    const where: FindOptionsWhere<City> = {};

    if (query?.name) {
      where.name = Like(`%${query.name}%`);
    }
    if (query?.district) {
      where.district = Like(`%${query.district}%`);
    }
    if (query?.subject) {
      where.subject = Like(`%${query.subject}%`);
    }

    return this.cityRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<City | null> {
    return this.cityRepository.findOne({ where: { id } });
  }

  // update(id: number, updateCityDto: UpdateCityDto) {
  //   return `This action updates a #${id} city`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} city`;
  // }
}
