
export enum StaffRole {
  ADMIN = 'Администратор',
  SECURITY = 'Отв. за безопасность',
  SOUND = 'Звукорежиссер',
  LIGHT = 'Художник по свету',
  VIDEO = 'Видеоинженер',
  ELECTRIC = 'Электрик',
  DUTY = 'Дежурный'
}

export interface Employee {
  id: string;
  name: string;
  roles: StaffRole[];
}

export interface StaffAssignment {
  [StaffRole.ADMIN]: string;
  [StaffRole.SECURITY]: string;
  [StaffRole.SOUND]: string;
  [StaffRole.LIGHT]: string;
  [StaffRole.VIDEO]: string;
  [StaffRole.ELECTRIC]: string;
  [StaffRole.DUTY]: string;
}

export interface StaffDirectory {
  employees: Employee[];
  venues: string[];
}

export interface ConcertEvent {
  id: string;
  title: string;
  date: string; // ISO string
  arrivalTime: string; // HH:mm
  soundcheckTime: string; // HH:mm
  doorsTime: string; // HH:mm
  startTime: string; // HH:mm
  staff: StaffAssignment;
  notes: string;
  rider: string;
  venue: string;
  isPaid: boolean;
}

export type ViewMode = 'calendar' | 'list';
