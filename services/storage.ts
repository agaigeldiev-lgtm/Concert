
import { ConcertEvent, StaffDirectory, StaffRole, Employee } from '../types';

const EVENTS_KEY = 'concert_events_v1';
const STAFF_KEY = 'concert_staff_v3'; 

const initialEmployees: Employee[] = [
  { id: '1', name: 'Иванов Иван', roles: [StaffRole.ADMIN] },
  { id: '2', name: 'Петров Петр', roles: [StaffRole.ADMIN, StaffRole.SOUND] },
  { id: '3', name: 'Борисов Борис', roles: [StaffRole.SECURITY] },
  { id: '4', name: 'Громов Григорий', roles: [StaffRole.SECURITY] },
  { id: '5', name: 'Алексеев Алексей', roles: [StaffRole.SOUND, StaffRole.ELECTRIC] },
  { id: '6', name: 'Дмитриев Дмитрий', roles: [StaffRole.SOUND, StaffRole.VIDEO] },
  { id: '7', name: 'Светлов Сергей', roles: [StaffRole.LIGHT, StaffRole.VIDEO] },
  { id: '8', name: 'Лучев Леонид', roles: [StaffRole.LIGHT] },
  { id: '9', name: 'Экранный Эдуард', roles: [StaffRole.VIDEO] },
  { id: '10', name: 'Камеров Кирилл', roles: [StaffRole.VIDEO] },
  { id: '11', name: 'Вольтов Владимир', roles: [StaffRole.ELECTRIC] },
  { id: '12', name: 'Токов Тимофей', roles: [StaffRole.ELECTRIC, StaffRole.SOUND] },
];

const initialVenues = [
  'Stadium Live',
  'Клуб Космос',
  'ДК Железнодорожников',
  'Главclub',
  'Adrenaline Stadium'
];

const seedEvents: ConcertEvent[] = [
  {
    id: 'seed-1',
    title: 'Рок-фестиваль "Прорыв"',
    date: new Date().toISOString().split('T')[0],
    arrivalTime: '10:00',
    soundcheckTime: '12:00',
    doorsTime: '18:00',
    startTime: '19:00',
    venue: 'Stadium Live',
    notes: 'Проверить коммутацию бэклайна',
    rider: 'Технический райдер: 4 монитора, 2 гитарных комбо, 1 басовый стек.',
    isPaid: true,
    staff: {
      [StaffRole.ADMIN]: 'Иванов Иван',
      [StaffRole.SECURITY]: 'Борисов Борис',
      [StaffRole.SOUND]: 'Алексеев Алексей',
      [StaffRole.LIGHT]: 'Светлов Сергей',
      [StaffRole.VIDEO]: 'Экранный Эдуард',
      [StaffRole.ELECTRIC]: 'Вольтов Владимир',
      [StaffRole.DUTY]: 'Алексеев Алексей'
    }
  },
  {
    id: 'seed-2',
    title: 'Благотворительный концерт "Свет"',
    date: new Date().toISOString().split('T')[0],
    arrivalTime: '14:00',
    soundcheckTime: '15:30',
    doorsTime: '17:30',
    startTime: '18:00',
    venue: 'Клуб Космос',
    notes: 'Вход свободный для всех желающих',
    rider: 'Стандартный клубный комплект звука и света.',
    isPaid: false,
    staff: {
      [StaffRole.ADMIN]: 'Петров Петр',
      [StaffRole.SECURITY]: 'Громов Григорий',
      [StaffRole.SOUND]: 'Дмитриев Дмитрий',
      [StaffRole.LIGHT]: 'Лучев Леонид',
      [StaffRole.VIDEO]: 'Камеров Кирилл',
      [StaffRole.ELECTRIC]: 'Токов Тимофей',
      [StaffRole.DUTY]: 'Токов Тимофей'
    }
  },
  {
    id: 'seed-3',
    title: 'Открытая репетиция ансамбля',
    date: new Date().toISOString().split('T')[0],
    arrivalTime: '09:00',
    soundcheckTime: '10:00',
    doorsTime: '11:30',
    startTime: '12:00',
    venue: 'ДК Железнодорожников',
    notes: 'Бесплатный вход для студентов консерватории',
    rider: 'Требуется только общее освещение и 2 микрофона для ведущего.',
    isPaid: false,
    staff: {
      [StaffRole.ADMIN]: 'Иванов Иван',
      [StaffRole.SECURITY]: 'Борисов Борис',
      [StaffRole.SOUND]: 'Алексеев Алексей',
      [StaffRole.LIGHT]: 'Светлов Сергей',
      [StaffRole.VIDEO]: '',
      [StaffRole.ELECTRIC]: 'Вольтов Владимир',
      [StaffRole.DUTY]: 'Вольтов Владимир'
    }
  }
];

export const storage = {
  getEvents: (): ConcertEvent[] => {
    const data = localStorage.getItem(EVENTS_KEY);
    if (!data) {
      storage.saveEvents(seedEvents);
      return seedEvents;
    }
    return JSON.parse(data);
  },
  saveEvents: (events: ConcertEvent[]) => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  },
  addEvent: (event: ConcertEvent) => {
    const events = storage.getEvents();
    events.push(event);
    storage.saveEvents(events);
  },
  updateEvent: (event: ConcertEvent) => {
    const events = storage.getEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index !== -1) {
      events[index] = event;
      storage.saveEvents(events);
    }
  },
  deleteEvent: (id: string) => {
    const events = storage.getEvents();
    const filtered = events.filter(e => e.id !== id);
    storage.saveEvents(filtered);
  },
  getStaffDirectory: (): StaffDirectory => {
    const data = localStorage.getItem(STAFF_KEY);
    if (!data) {
      const dir = { employees: initialEmployees, venues: initialVenues };
      storage.saveStaffDirectory(dir);
      return dir;
    }
    return JSON.parse(data);
  },
  saveStaffDirectory: (dir: StaffDirectory) => {
    localStorage.setItem(STAFF_KEY, JSON.stringify(dir));
  }
};
