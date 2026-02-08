
import { createClient } from '@supabase/supabase-js';
import { ConcertEvent, StaffDirectory, User, NotificationSettings, Vehicle, HelpdeskTicket, InventoryItem, InfoArticle, Reminder, GuestGuide, RentedEquipment, CabinetMetadata, Employee } from '../types';

const SUPABASE_URL = 'https://tadxmuookehcjrkhylhx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rKXbr9RcP9EtQPXWSEtvYg_cnQLxGNw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AUTH_KEY = 'concert_auth_v2';

const DEFAULT_ROLES = [
  'Администратор',
  'Отв. за без-сть',
  'Технический специалист',
  'Звукорежиссер',
  'Худ. по свету',
  'Видеоинженер',
  'Электрик',
  'Дежурный'
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'ruslan-tech-1',
    name: 'Агайгельдиев Руслан Магометович',
    phone: '89097705225',
    roles: ['Технический специалист'],
    department: 'Технический отдел'
  }
];

export const storage = {
  checkConnection: async (): Promise<{online: boolean, schemaOk: boolean, error?: string}> => {
    try {
      const { error } = await supabase.from('events').select('arrivalTime').limit(1);
      if (error) return { online: false, schemaOk: false, error: error.message };
      return { online: true, schemaOk: true };
    } catch (err: any) {
      return { online: false, schemaOk: false, error: err.message };
    }
  },

  getEvents: async (): Promise<ConcertEvent[]> => {
    try {
      const { data, error } = await supabase.from('events').select('id, title, date, arrivalTime, soundcheckTime, doorsTime, startTime, staff, notes, rider, venue, isPaid').order('date', { ascending: true });
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  },

  addEvent: async (event: ConcertEvent) => {
    const { rentedEquipment, isCancelled, ...cleanEvent } = event;
    const { error } = await supabase.from('events').insert([cleanEvent]);
    if (error) throw error;
  },

  updateEvent: async (event: ConcertEvent) => {
    const { rentedEquipment, isCancelled, ...cleanEvent } = event;
    const { error } = await supabase.from('events').update(cleanEvent).eq('id', event.id);
    if (error) throw error;
  },

  deleteEvent: async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getCancelledEventsRegistry: async (): Promise<Record<string, boolean>> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'event_status_v1');
      if (error || !data || data.length === 0) return {};
      return data[0].content as Record<string, boolean>;
    } catch (e) {
      return {};
    }
  },

  saveCancelledEventsRegistry: async (registry: Record<string, boolean>) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'event_status_v1', content: registry }, { onConflict: 'type' });
    if (error) throw error;
  },

  getRentalsRegistry: async (): Promise<Record<string, RentedEquipment[]>> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'rentals_registry_v1');
      if (error || !data || data.length === 0) return {};
      return data[0].content as Record<string, RentedEquipment[]>;
    } catch (e) {
      return {};
    }
  },

  saveRentalsRegistry: async (registry: Record<string, RentedEquipment[]>) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'rentals_registry_v1', content: registry }, { onConflict: 'type' });
    if (error) throw error;
  },

  getStaffDirectory: async (): Promise<StaffDirectory> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'directory');
      let content: StaffDirectory;
      
      if (error || !data || data.length === 0) {
        content = { employees: INITIAL_EMPLOYEES, venues: [], roles: DEFAULT_ROLES, departments: [], cabinets: [], phoneRecords: [], equipmentCatalog: [], birthdays: [] };
      } else {
        content = data[0].content as StaffDirectory;
      }

      // Гарантируем наличие Руслана в списке сотрудников
      if (!content.employees.find(e => e.phone === '89097705225' || e.name.includes('Агайгельдиев'))) {
        content.employees.push(INITIAL_EMPLOYEES[0]);
      }
      
      // Гарантируем наличие роли Технический специалист
      if (!content.roles.includes('Технический специалист')) {
        content.roles.splice(2, 0, 'Технический специалист');
      }

      if (!content.departments) content.departments = [];
      if (!content.cabinets) content.cabinets = [];
      if (!content.phoneRecords) content.phoneRecords = [];
      if (!content.equipmentCatalog) content.equipmentCatalog = [];
      if (!content.birthdays) content.birthdays = [];
      
      return content;
    } catch (e) {
      return { employees: INITIAL_EMPLOYEES, venues: [], roles: DEFAULT_ROLES, departments: [], cabinets: [], phoneRecords: [], equipmentCatalog: [], birthdays: [] };
    }
  },

  saveStaffDirectory: async (dir: StaffDirectory) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'directory', content: dir }, { onConflict: 'type' });
    if (error) throw error;
  },

  getCabinetMetadata: async (): Promise<Record<string, CabinetMetadata>> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'cabinet_metadata_v1');
      if (error || !data || data.length === 0) return {};
      return data[0].content as Record<string, CabinetMetadata>;
    } catch (e) {
      return {};
    }
  },

  saveCabinetMetadata: async (metadata: Record<string, CabinetMetadata>) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'cabinet_metadata_v1', content: metadata }, { onConflict: 'type' });
    if (error) throw error;
  },

  getGuestGuides: async (): Promise<GuestGuide[]> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'guest_guides_v1');
      if (error || !data || data.length === 0) return [];
      return data[0].content as GuestGuide[];
    } catch (e) {
      return [];
    }
  },

  saveGuestGuides: async (guides: GuestGuide[]) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'guest_guides_v1', content: guides }, { onConflict: 'type' });
    if (error) throw error;
  },

  getReminders: async (): Promise<Reminder[]> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'reminders_v1');
      if (error || !data || data.length === 0) return [];
      return data[0].content as Reminder[];
    } catch (e) {
      return [];
    }
  },

  saveReminders: async (reminders: Reminder[]) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'reminders_v1', content: reminders }, { onConflict: 'type' });
    if (error) throw error;
  },

  getParkingList: async (): Promise<Vehicle[]> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'parking_list');
      if (error || !data || data.length === 0) return [];
      return data[0].content as Vehicle[];
    } catch (e) {
      return [];
    }
  },

  saveParkingList: async (list: Vehicle[]) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'parking_list', content: list }, { onConflict: 'type' });
    if (error) throw error;
  },

  getHelpdeskTickets: async (): Promise<HelpdeskTicket[]> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'helpdesk_tickets');
      if (error || !data || data.length === 0) return [];
      return data[0].content as HelpdeskTicket[];
    } catch (e) {
      return [];
    }
  },

  saveHelpdeskTickets: async (tickets: HelpdeskTicket[]) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'helpdesk_tickets', content: tickets }, { onConflict: 'type' });
    if (error) throw error;
  },

  getInventoryItems: async (): Promise<InventoryItem[]> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'inventory_v1');
      if (error || !data || data.length === 0) return [];
      return data[0].content as InventoryItem[];
    } catch (e) {
      return [];
    }
  },

  saveInventoryItems: async (items: InventoryItem[]) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'inventory_v1', content: items }, { onConflict: 'type' });
    if (error) throw error;
  },

  getInfoArticles: async (): Promise<InfoArticle[]> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'knowledge_base_v1');
      if (error || !data || data.length === 0) return [];
      return data[0].content as InfoArticle[];
    } catch (e) {
      return [];
    }
  },

  saveInfoArticles: async (articles: InfoArticle[]) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'knowledge_base_v1', content: articles }, { onConflict: 'type' });
    if (error) throw error;
  },

  getNotificationSettings: async (): Promise<NotificationSettings> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'notification_config');
      if (error || !data || data.length === 0) return { enabled: false, botToken: '', chatId: '' };
      return data[0].content;
    } catch (e) {
      return { enabled: false, botToken: '', chatId: '' };
    }
  },

  saveNotificationSettings: async (settings: NotificationSettings) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'notification_config', content: settings }, { onConflict: 'type' });
    if (error) throw error;
  },

  getUserRegistry: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('app_settings').select('content').eq('type', 'users_registry_v2');
      if (error || !data || data.length === 0) {
        return [{ id: '1', login: 'admin', username: 'Администратор', password: 'admin1234', roles: ['admin'], isActive: true, createdAt: new Date().toISOString() }];
      }
      // Гарантируем, что у каждого пользователя есть массив ролей
      const users = (data[0].content as User[]).map(u => ({
        ...u,
        roles: Array.isArray(u.roles) ? u.roles : []
      }));
      return users;
    } catch (e) {
      return [{ id: '1', login: 'admin', username: 'Администратор', password: 'admin1234', roles: ['admin'], isActive: true, createdAt: new Date().toISOString() }];
    }
  },

  saveUserRegistry: async (users: User[]) => {
    const { error } = await supabase.from('app_settings').upsert({ type: 'users_registry_v2', content: users }, { onConflict: 'type' });
    if (error) throw error;
  },

  getAuth: (): User | null => {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      if (!data) return null;
      const user = JSON.parse(data);
      if (user && !Array.isArray(user.roles)) user.roles = [];
      return user;
    } catch (e) {
      return null;
    }
  },

  saveAuth: (user: User | null) => {
    if (user) {
      const sanitized = { ...user };
      delete sanitized.password;
      if (!Array.isArray(sanitized.roles)) sanitized.roles = [];
      localStorage.setItem(AUTH_KEY, JSON.stringify(sanitized));
    }
    else localStorage.removeItem(AUTH_KEY);
  }
};
