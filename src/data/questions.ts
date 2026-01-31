import { Question } from '@/types/game';

export const numericQuestions: Question[] = [
  {
    id: 'n1',
    type: 'numeric',
    text: 'В каком году была построена Эйфелева башня?',
    correctAnswer: 1889,
    hint: 'Конец XIX века',
  },
  {
    id: 'n2',
    type: 'numeric',
    text: 'Сколько костей в теле взрослого человека?',
    correctAnswer: 206,
    hint: 'Больше 200',
  },
  {
    id: 'n3',
    type: 'numeric',
    text: 'Какова высота Эвереста в метрах?',
    correctAnswer: 8849,
    hint: 'Около 9 километров',
  },
  {
    id: 'n4',
    type: 'numeric',
    text: 'В каком году Юрий Гагарин полетел в космос?',
    correctAnswer: 1961,
    hint: 'Начало 60-х годов XX века',
  },
  {
    id: 'n5',
    type: 'numeric',
    text: 'Сколько стран в Европейском Союзе (2024)?',
    correctAnswer: 27,
    hint: 'Меньше 30',
  },
  {
    id: 'n6',
    type: 'numeric',
    text: 'Какова скорость света в км/с (примерно)?',
    correctAnswer: 300000,
    hint: 'Около 300 тысяч',
  },
  {
    id: 'n7',
    type: 'numeric',
    text: 'В каком году началась Вторая мировая война?',
    correctAnswer: 1939,
    hint: 'Конец 30-х годов XX века',
  },
  {
    id: 'n8',
    type: 'numeric',
    text: 'Сколько элементов в периодической таблице Менделеева (2024)?',
    correctAnswer: 118,
    hint: 'Больше 100',
  },
];

export const multipleChoiceQuestions: Question[] = [
  {
    id: 'm1',
    type: 'multiple_choice',
    text: 'Какая планета Солнечной системы самая большая?',
    correctAnswer: 'Юпитер',
    options: ['Сатурн', 'Юпитер', 'Нептун', 'Уран'],
  },
  {
    id: 'm2',
    type: 'multiple_choice',
    text: 'Кто написал "Войну и мир"?',
    correctAnswer: 'Лев Толстой',
    options: ['Фёдор Достоевский', 'Лев Толстой', 'Антон Чехов', 'Николай Гоголь'],
  },
  {
    id: 'm3',
    type: 'multiple_choice',
    text: 'Какой химический элемент имеет символ "Au"?',
    correctAnswer: 'Золото',
    options: ['Серебро', 'Золото', 'Медь', 'Алюминий'],
  },
  {
    id: 'm4',
    type: 'multiple_choice',
    text: 'Столица Австралии?',
    correctAnswer: 'Канберра',
    options: ['Сидней', 'Мельбурн', 'Канберра', 'Перт'],
  },
  {
    id: 'm5',
    type: 'multiple_choice',
    text: 'Какое море самое солёное?',
    correctAnswer: 'Мёртвое море',
    options: ['Красное море', 'Мёртвое море', 'Средиземное море', 'Каспийское море'],
  },
  {
    id: 'm6',
    type: 'multiple_choice',
    text: 'Кто изобрёл телефон?',
    correctAnswer: 'Александр Белл',
    options: ['Томас Эдисон', 'Никола Тесла', 'Александр Белл', 'Гульельмо Маркони'],
  },
  {
    id: 'm7',
    type: 'multiple_choice',
    text: 'Какой газ составляет большую часть атмосферы Земли?',
    correctAnswer: 'Азот',
    options: ['Кислород', 'Азот', 'Углекислый газ', 'Аргон'],
  },
  {
    id: 'm8',
    type: 'multiple_choice',
    text: 'В каком городе находится Колизей?',
    correctAnswer: 'Рим',
    options: ['Афины', 'Рим', 'Париж', 'Лондон'],
  },
  {
    id: 'm9',
    type: 'multiple_choice',
    text: 'Какая река самая длинная в мире?',
    correctAnswer: 'Нил',
    options: ['Амазонка', 'Нил', 'Янцзы', 'Миссисипи'],
  },
  {
    id: 'm10',
    type: 'multiple_choice',
    text: 'Кто написал "Ромео и Джульетту"?',
    correctAnswer: 'Уильям Шекспир',
    options: ['Уильям Шекспир', 'Оскар Уайльд', 'Чарльз Диккенс', 'Джейн Остин'],
  },
];

export function getRandomNumericQuestion(usedIds: string[]): Question | null {
  const available = numericQuestions.filter(q => !usedIds.includes(q.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getRandomMultipleChoiceQuestion(usedIds: string[]): Question | null {
  const available = multipleChoiceQuestions.filter(q => !usedIds.includes(q.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
