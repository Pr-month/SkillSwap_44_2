import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { City } from './entities/city.entity';
import { FindOptionsWhere, Like, QueryFailedError, Repository } from 'typeorm';
import { CitySearchQuery } from './dto/city-search.query';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async create(createCityDto: CreateCityDto): Promise<City> {
    const city = this.cityRepository.create({
      name: createCityDto.name,
      lat: createCityDto.lat,
      lon: createCityDto.lon,
      district: createCityDto.district,
      population: createCityDto.population,
      subject: createCityDto.subject,
    });

    try {
      return await this.cityRepository.save(city);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const driverError = e.driverError as unknown as { code?: string };
        if (driverError.code === '23505') {
          throw new ConflictException('City with this name already exists');
        }
      }
      throw e;
    }
  }

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
      where: Object.keys(where).length ? where : undefined,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<City | null> {
    return this.cityRepository.findOne({ where: { id } });
  }

  async update(id: string, updateCityDto: UpdateCityDto): Promise<City> {
    const city = await this.findOne(id);
    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }

    if (updateCityDto.name !== undefined) city.name = updateCityDto.name;
    if (updateCityDto.lat !== undefined) city.lat = updateCityDto.lat;
    if (updateCityDto.lon !== undefined) city.lon = updateCityDto.lon;
    if (updateCityDto.district !== undefined)
      city.district = updateCityDto.district;
    if (updateCityDto.population !== undefined)
      city.population = updateCityDto.population;
    if (updateCityDto.subject !== undefined)
      city.subject = updateCityDto.subject;

    try {
      return await this.cityRepository.save(city);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const driverError = e.driverError as unknown as { code?: string };
        if (driverError.code === '23505') {
          throw new ConflictException(
            'City name conflict or unique constraint violation',
          );
        }
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    const city = await this.findOne(id);
    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }

    try {
      await this.cityRepository.remove(city);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const driverError = e.driverError as unknown as { code?: string };
        if (driverError.code === '23503') {
          throw new ConflictException(
            `Cannot delete city with id ${id}: it has related records`,
          );
        }
      }
      throw e;
    }
  }
}
