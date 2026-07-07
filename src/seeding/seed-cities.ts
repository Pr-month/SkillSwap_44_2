import { DataSource } from 'typeorm';
import { City } from '../cities/entities/city.entity';
import { seedCities } from './data/cities.data';
import * as dotenv from 'dotenv';
import { dbConfig } from '../config/db.config';

dotenv.config();

async function seedCitiesFn() {
  const dataSource = new DataSource({
    ...dbConfig(),
    entities: [City],
  });

  await dataSource.initialize();

  const cityRepo = dataSource.getRepository(City);

  // При необходимости, очистка таблицы перед сидингом
  // await cityRepo.clear();

  for (const cityData of seedCities) {
    const existing = await cityRepo.findOne({
      where: { name: cityData.name },
    });

    if (existing) {
      console.log(`  ↻ ${cityData.name} — уже существует, пропускаю`);
      continue;
    }

    const city = cityRepo.create(cityData);
    await cityRepo.save(city);
    console.log(`  ✓ ${cityData.name}`);
  }

  const total = await cityRepo.count();
  console.log(`\nСидинг завершён. Всего городов: ${total}`);

  await dataSource.destroy();
}

seedCitiesFn().catch((err) => {
  console.error('Ошибка при сидинге городов:', err);
  process.exit(1);
});
