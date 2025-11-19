
export type FilterType = 
  | 'equals' 
  | 'not_equals' 
  | 'is_null' 
  | 'non_null' 
  | 'contains' 
  | 'and' 
  | 'or' 
  | 'not' 
  | 'field_accessor' 
  | 'any_array_value';

export interface WebhookFilter {
  type: FilterType;
  value?: string | number | boolean;
  field?: string;
  filter?: WebhookFilter;
  filters?: WebhookFilter[];
}

export interface WebhookEvent {
  action: string; 
  object_type: string;
  extra_filter?: WebhookFilter;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  status: 'active' | 'paused';
  events: WebhookEvent[];
  created_by: string;
  updated_by: string;
  date_created: string;
  date_updated: string;
  verify_ssl: boolean;
  health_status: 'healthy' | 'unhealthy';
  pause_reason: string | null;
  latest_error: string | null;
  signature_key?: string; 
}

export interface WebhookListResponse {
  has_more: boolean;
  data: WebhookSubscription[];
}

export interface CreateWebhookPayload {
  url: string;
  events: WebhookEvent[];
  verify_ssl?: boolean;
}

export interface UpdateWebhookPayload {
  url?: string;
  events?: WebhookEvent[];
  status?: 'active' | 'paused';
  verify_ssl?: boolean;
}

// Comprehensive mapping of valid Object Types to their supported Actions based on Close API docs
// Ordered according to the "List of Events" documentation section
export const EVENT_DEFINITIONS: Record<string, string[]> = {
  // Lead
  'lead': ['created', 'updated', 'deleted', 'merged'],
  
  // Contact
  'contact': ['created', 'updated', 'deleted'],
  
  // Opportunity
  'opportunity': ['created', 'updated', 'deleted'],
  
  // Tasks
  'task': ['created', 'updated', 'deleted', 'completed'],
  'task.lead': ['created', 'updated', 'deleted', 'completed'],
  
  // Email
  'activity.email': ['created', 'updated', 'deleted', 'sent'],
  
  // Email Thread
  'activity.email_thread': ['created', 'updated', 'deleted'],
  
  // Unsubscribed Email
  'unsubscribed_email': ['created', 'deleted'],
  
  // Call
  'activity.call': ['created', 'updated', 'deleted', 'answered', 'completed'],
  
  // SMS
  'activity.sms': ['created', 'updated', 'deleted', 'sent'],
  
  // WhatsApp
  'activity.whatsapp_message': ['created', 'updated', 'deleted'],
  
  // Note
  'activity.note': ['created', 'updated', 'deleted'],
  
  // Meeting
  'activity.meeting': ['created', 'updated', 'deleted', 'scheduled', 'started', 'completed', 'canceled'],
  
  // Lead Status Change
  'activity.lead_status_change': ['created', 'updated', 'deleted'],
  
  // Opportunity Status Change
  'activity.opportunity_status_change': ['created', 'updated', 'deleted'],
  
  // Task Completed
  'activity.task_completed': ['created', 'deleted'],
  
  // Import
  'import': ['created', 'updated', 'completed', 'reverting', 'reverted'],
  
  // Export
  'export.lead': ['created', 'updated', 'completed'],
  'export.opportunity': ['created', 'updated', 'completed'],
  
  // Bulk Actions
  'bulk_action.delete': ['created', 'updated', 'completed', 'paused'],
  'bulk_action.edit': ['created', 'updated', 'completed', 'paused'],
  'bulk_action.email': ['created', 'updated', 'completed', 'paused'],
  'bulk_action.sequence_subscription': ['created', 'updated', 'completed', 'paused'],
  
  // Custom Fields
  'custom_fields.lead': ['created', 'updated', 'deleted'],
  'custom_fields.contact': ['created', 'updated', 'deleted'],
  'custom_fields.opportunity': ['created', 'updated', 'deleted'],
  'custom_fields.activity': ['created', 'updated', 'deleted'],
  'custom_fields.custom_object': ['created', 'updated', 'deleted'],
  'custom_fields.shared': ['created', 'updated', 'deleted'],
  
  // Custom Activity Type
  'custom_activity_type': ['created', 'updated', 'deleted'],
  
  // Custom Activity
  'activity.custom_activity': ['created', 'updated', 'deleted'],
  
  // Custom Object Type
  'custom_object_type': ['created', 'updated', 'deleted'],
  
  // Custom Object
  'custom_object': ['created', 'updated', 'deleted'],
  
  // Status
  'status.lead': ['created', 'updated', 'deleted'],
  'status.opportunity': ['created', 'updated', 'deleted'],
  
  // Membership
  'membership': ['activated', 'deactivated'],
  
  // Group
  'group': ['created', 'updated', 'deleted'],
  
  // Saved Search
  'saved_search': ['created', 'updated'],
  
  // Phone Number
  'phone_number': ['created', 'updated', 'deleted'],
  
  // Email Template
  'email_template': ['created', 'updated', 'deleted'],
  
  // SMS Template
  'sms_template': ['created', 'updated', 'deleted'],
  
  // Sequence
  'sequence': ['created', 'updated', 'deleted'],
  
  // Sequence Subscription
  'sequence_subscription': ['created', 'updated', 'deleted'],
  
  // Comment
  'comment': ['created', 'updated', 'deleted'],
  
  // Comment Thread
  'comment_thread': ['created', 'updated', 'deleted'],
  
  // Lead Merge
  'lead_merge': ['created', 'updated', 'deleted']
};

export const AVAILABLE_OBJECT_TYPES = Object.keys(EVENT_DEFINITIONS);
export const AVAILABLE_ACTIONS = Array.from(new Set(Object.values(EVENT_DEFINITIONS).flat()));
