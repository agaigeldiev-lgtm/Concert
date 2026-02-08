
export type UserRole = 'admin' | 'concerts' | 'parking' | 'it_tickets' | 'it_admin' | 'it_inventory' | 'info' | 'buh' | 'security';

export interface User {
  id: string;
  login: string; // ФИО пользователя
  username: string; // Отображаемое имя
  roles: UserRole[];
  password?: string;
  department?: string;
  birthday?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CabinetMetadata {
  cabinet: string;
  department: string;
  problems: string;
  lastAuditDate: string | null;
  isAudited: boolean;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
}

export interface BirthdayRecord {
  id: string;
  name: string;
  date: string; // Формат "YYYY-MM-DD"
  position: string;
}

export type TicketStatus = 'new' | 'in-progress' | 'done' | 'rejected';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketType = 'equipment' | 'events' | 'computers' | 'recording' | 'procurement' | 'printout';

export interface TicketInternalNote {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface HelpdeskTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  department: string;
  cabinet: string;
  
  // Assignment fields
  assignedToId?: string;
  assignedToName?: string;
  
  // IT Specific
  internalNotes?: TicketInternalNote[];
  resolutionText?: string;

  // Specific fields
  equipmentAction?: 'repair' | 'refill';
  equipmentModel?: string;
  eventVenue?: string;
  eventDate?: string;
  eventSound?: boolean;
  eventLight?: boolean;
  eventScreen?: boolean;
  eventMicCount?: string;
  recordingDate?: string;
  recordingCount?: string;
  procurementItem?: string;
  procurementJustification?: string;
  
  // Printout fields
  printType?: 'bw' | 'color';
  printPages?: string;

  createdAt: string;
  updatedAt: string;
}

export type EquipmentStatus = 'working' | 'broken' | 'repair' | 'write-off';
export type EquipmentType = 'pc' | 'monitor' | 'laptop' | 'printer' | 'ups' | 'network' | 'other';

export interface InventoryHistoryEntry {
  id: string;
  date: string;
  userId: string;
  username: string;
  type: 'auto' | 'manual';
  message: string;
}

export interface InventoryItem {
  id: string;
  type: EquipmentType;
  model: string;
  invNumber: string;
  serialNumber: string;
  ipAddress?: string;
  macAddress?: string;
  status: EquipmentStatus;
  department: string;
  cabinet: string;
  responsibleName: string; 
  parentId?: string; 
  notes: string;
  warrantyUntil?: string;
  history: InventoryHistoryEntry[];
  updatedAt: string;
  invNumberIssue?: boolean;
  // Access credentials
  accessUsername?: string;
  accessPassword?: string;
}

export interface GuestGuide {
  id: string;
  title: string;
  venue: string;
  welcomeText?: string;
  dressingRooms?: string; // Разделенные запятой
  venueTechSpecs?: string; // Технические данные зала
  yandexMapsUrl?: string;
  wifiSsid: string;
  wifiPass: string;
  entrancePhotoUrl: string;
  stagePlanUrl: string;
  techContactName: string;
  techContactPhone: string;
  securityContactName: string;
  securityContactPhone: string;
  cateringInfo: string;
  loadingInfo: string;
  showParkingReminder: boolean;
  showRiderReminder: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface InfoArticle {
  id: string;
  title: string;
  content: string;
  category: 'instruction' | 'regulation' | 'contact' | 'note';
  authorId: string;
  authorName: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  roles: string[];
  phone?: string;
  cabinet?: string;
  department?: string;
}

export interface PhoneRecord {
  id: string;
  label: string;
  number: string;
  cabinet: string;
  department: string;
  notes: string;
}

export interface Reminder {
  id: string;
  title: string;
  deadline: string;
  category: 'timesheet' | 'criteria' | 'report' | 'other';
  isCompleted: boolean;
  notes: string;
  createdAt: string;
}

export interface StaffAssignment {
  [roleName: string]: string;
}

export interface NotificationSettings {
  enabled: boolean;
  botToken: string;
  chatId: string;
}

export type VehicleCategory = 'staff' | 'guest' | 'service' | 'emergency';

export interface Vehicle {
  id: string;
  ownerName: string;
  department: string;
  model: string;
  plateNumber: string;
  phone: string;
  category: VehicleCategory;
  validUntil?: string; // Для временных пропусков
  notes: string;
  isCallEntry?: boolean;
  isExpectedToday?: boolean;
  updatedAt: string;
}

export interface EquipmentCatalogItem {
  id: string;
  name: string;
  price: number;
}

export interface TicketAssignmentRule {
  id: string;
  type: TicketType;
  assigneeId: string;
  assigneeName: string;
}

export interface StaffDirectory {
  employees: Employee[];
  phoneRecords: PhoneRecord[];
  venues: string[];
  roles: string[];
  departments: string[];
  cabinets: string[];
  equipmentCatalog: EquipmentCatalogItem[];
  quickLinks?: QuickLink[];
  birthdays?: BirthdayRecord[];
  ticketRules?: TicketAssignmentRule[];
}

export interface RentedEquipment {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ConcertEvent {
  id: string;
  title: string;
  date: string;
  arrivalTime: string;
  soundcheckTime: string;
  doorsTime: string;
  startTime: string;
  staff: StaffAssignment;
  notes: string;
  rider: string;
  venue: string;
  isPaid: boolean;
  isCancelled?: boolean;
  rentedEquipment?: RentedEquipment[];
}

export type MainSection = 'dashboard' | 'concerts' | 'admin' | 'it' | 'info' | 'watchman';
export type ViewMode = 'calendar' | 'list' | 'stats' | 'report' | 'guides-manager' | 'parking' | 'helpdesk' | 'inventory' | 'knowledge-base' | 'reminders-list';
