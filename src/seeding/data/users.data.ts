// src/seeding/data/users.data.ts
import { User } from '../../users/entities/user.entity';
import { UserGender, UserRole } from '../../users/enums/users.enums';

export const seedUsers: ({ password: string; wantToLearn: string[] } & Omit<
  Partial<User>,
  'wantToLearn'
>)[] = [
  {
    name: 'Мария Петрова',
    email: 'maria@skillswap.ru',
    password: 'MariaDev2024!',
    about:
      'Фулстек-разработчик и по совместительству кондитер-любитель. Пеку торты и капкейки, увлекаюсь сахарной флористикой. Хочу освоить мобильную разработку.',
    birthdate: new Date('1993-06-22'),
    city: 'Санкт-Петербург',
    gender: UserGender.FEMALE,
    role: UserRole.USER,
    wantToLearn: ['Мобильная разработка', 'Backend'],
  },
  {
    name: 'Алексей Иванов',
    email: 'alexey@skillswap.ru',
    password: 'AlexBackend#88',
    about:
      'Бэкенд-разработчик, в свободное время играю на гитаре и записываю каверы. Разбираюсь в звукорежиссуре и сведении.',
    birthdate: new Date('1991-11-08'),
    city: 'Новосибирск',
    gender: UserGender.MALE,
    role: UserRole.USER,
    wantToLearn: ['DevOps', 'Английский язык', 'Гитара'],
  },
  {
    name: 'Елена Соколова',
    email: 'elena@skillswap.ru',
    password: 'ElenaDesign!95',
    about:
      'UX/UI дизайнер и сертифицированный инструктор по йоге. Веду занятия по хатха-йоге и медитации. Интересуюсь вёрсткой и анимацией.',
    birthdate: new Date('1995-03-14'),
    city: 'Казань',
    gender: UserGender.FEMALE,
    role: UserRole.USER,
    wantToLearn: ['Web-дизайн', 'UX/UI', 'Motion-дизайн'],
  },
  {
    name: 'Дмитрий Козлов',
    email: 'dmitry@skillswap.ru',
    password: 'DmitryML#2024',
    about:
      'Data Scientist и фотограф-любитель. Снимаю на плёнку и цифру, занимаюсь ретушью. Могу научить работать с Lightroom и Photoshop.',
    birthdate: new Date('1988-09-27'),
    city: 'Екатеринбург',
    gender: UserGender.MALE,
    role: UserRole.USER,
    wantToLearn: ['Графический дизайн', 'Английский язык', 'Frontend'],
  },
  {
    name: 'Анна Морозова',
    email: 'anna@skillswap.ru',
    password: 'AnnaFront!96',
    about:
      'Фронтенд-разработчик, а ещё профессионально занималась бальными танцами. Могу научить основам сальсы и бачаты.',
    birthdate: new Date('1996-07-19'),
    city: 'Москва',
    gender: UserGender.FEMALE,
    role: UserRole.USER,
    wantToLearn: ['Backend', 'Web-дизайн', 'Мобильная разработка'],
  },
  {
    name: 'Сергей Новиков',
    email: 'sergey@skillswap.ru',
    password: 'SergeySwift#94',
    about:
      'iOS-разработчик, в прошлом — шеф-повар. Отлично готовлю итальянскую и французскую кухню, разбираюсь в винах.',
    birthdate: new Date('1994-12-03'),
    city: 'Ростов-на-Дону',
    gender: UserGender.MALE,
    role: UserRole.USER,
    wantToLearn: ['Мобильная разработка', 'Гитара', 'Фортепиано'],
  },
  {
    name: 'Ольга Зайцева',
    email: 'olga@skillswap.ru',
    password: 'OlgaDevOps#92',
    about:
      'DevOps-инженер и заядлая путешественница. Объездила 30+ стран, свободно говорю на английском и испанском. Помогу подтянуть разговорный язык.',
    birthdate: new Date('1992-05-30'),
    city: 'Нижний Новгород',
    gender: UserGender.FEMALE,
    role: UserRole.USER,
    wantToLearn: ['DevOps', 'Английский язык', 'Испанский язык'],
  },
  {
    name: 'Иван Титов',
    email: 'ivan@skillswap.ru',
    password: 'IvanLead#85',
    about:
      'Team Lead, а в свободное время — акварелист. Выставлялся в городских галереях. Обучаю основам скетчинга и акварельной живописи.',
    birthdate: new Date('1985-02-18'),
    city: 'Москва',
    gender: UserGender.MALE,
    role: UserRole.USER,
    wantToLearn: [
      'Управление командой',
      'Английский язык',
      'Проектное управление',
    ],
  },
  {
    name: 'Татьяна Кузнецова',
    email: 'tatyana@skillswap.ru',
    password: 'TatyanaJS#00',
    about:
      'Начинающий разработчик, но уже продвинутый рукодельник — вяжу крючком, вышиваю, делаю авторские игрушки. Могу научить вязать амигуруми.',
    birthdate: new Date('2000-08-25'),
    city: 'Челябинск',
    gender: UserGender.FEMALE,
    role: UserRole.USER,
    wantToLearn: ['Frontend', 'Backend', 'Графический дизайн'],
  },
];
