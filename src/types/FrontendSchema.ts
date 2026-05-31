/**
 * LITC-TS v43.0 Frontend Schema Types & Interfaces
 * Use these types to deserialize backend API responses and bind to dynamic UI builders.
 */

export interface UITheme {
  themeName: string;
  primaryColor: string;
  secondaryColor: string;
}

/**
 * Standard field types supported by the Dynamic Form Builder
 */
export type FieldType = 'TEXT' | 'SELECT' | 'DATE' | 'TEXTAREA' | string;

export interface WidgetField {
  id: number;
  name: string; // The database fieldName (e.g., 'shortDescription', 'impactLevel')
  type: FieldType; // Field type (e.g., 'TEXT', 'SELECT', 'DATE')
  order: number; // Order index for sorting elements inside the Widget
}

export type ActionType = 'WIDGET_ACTION' | 'STATE_TRANSITION';

export interface WidgetAction {
  type: ActionType;
  label: string; // The button label (e.g., 'Save Ticket Draft', 'Move to Closed')
  apiEndpoint: string; // The URL to send the payload to (e.g., '/api/v1/tickets/:id/transitions')
  orderIndex?: number;
  targetStateId?: number; // Only present if type is 'STATE_TRANSITION'
  payload?: {
    targetStateId: number;
  };
}

export interface Widget {
  id: number;
  name: string; // Widget name (e.g., 'Ticket Core Form')
  type: string; // Ticket category or area (e.g., 'TECHNICAL', 'GENERAL')
  fields: WidgetField[];
  actions: WidgetAction[];
}

export interface UIConfig {
  templateId: number;
  templateName: string;
  theme: UITheme | null;
  widgets: Widget[];
}

/**
 * API Response Envelopes
 */

export interface APIResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errorName?: string; // Present on error responses (e.g., 'ConcurrencyConflictError')
  statusCode?: number; // Present on error responses (e.g., 409)
}

export interface UIConfigResponse extends APIResponse<UIConfig> {
  status: 'success';
  data: UIConfig;
  _metadata?: {
    source: 'cache' | 'database';
    timestamp: string;
  };
}

/**
 * Request payload structure for State Transitions
 */
export interface TransitionRequest {
  targetStateId: number;
  version: number; // Crucial for Optimistic Concurrency Control (OCC)
}

/**
 * Ticket Data Representation
 */
export interface TicketData {
  id: number;
  title: string;
  description: string;
  ticketType: string;
  channel: string;
  isVip: boolean;
  urgency: string;
  impact: string;
  priority: string;
  version: number; // Current version of the ticket (for next OCC check)
  stateId: number;
  categoryId: number;
  locationId: number | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  state?: {
    id: number;
    name: string;
    label: string;
  };
}

export interface TicketTransitionResponse extends APIResponse<TicketData> {
  status: 'success';
  message: string;
  data: TicketData;
}
