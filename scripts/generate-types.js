const fs = require('fs');

const schema = fs.readFileSync('schema.txt', 'utf8');

function pgTypeToTs(pgType) {
  pgType = pgType.toLowerCase().trim();
  if (pgType.startsWith('uuid') || pgType.startsWith('text') || pgType.startsWith('char') || pgType.startsWith('varchar')) return 'string';
  if (pgType.startsWith('int') || pgType.startsWith('smallint') || pgType.startsWith('bigint') || pgType.startsWith('numeric') || pgType.startsWith('double') || pgType.startsWith('real')) return 'number';
  if (pgType.startsWith('bool')) return 'boolean';
  if (pgType.startsWith('json') || pgType.startsWith('jsonb')) return 'Json';
  if (pgType.startsWith('timestamptz') || pgType.startsWith('timestamp') || pgType.startsWith('date')) return 'string';
  if (pgType.includes('user_role')) return "'user' | 'admin'";
  if (pgType.includes('order_status')) return "'pending' | 'in_progress' | 'delivered' | 'cancelled'";
  if (pgType.includes('payment_status')) return "'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded' | 'voided'";
  if (pgType.includes('lead_status')) return "'unread' | 'read' | 'responded'";
  if (pgType.includes('policy_type')) return "'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation'";
  if (pgType.includes('discount_type')) return "'percent' | 'fixed'";
  if (pgType.includes('return_status')) return "'requested' | 'approved' | 'rejected' | 'completed'";
  if (pgType.endsWith('[]')) return 'string[]';
  return 'any';
}

const tableRegex = /create table public\.(\w+)\s*\(([\s\S]*?)\n\);/g;
let m;
const tables = {};

while ((m = tableRegex.exec(schema)) !== null) {
  const tableName = m[1];
  const body = m[2];
  const cols = [];
  const lines = body.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('--') || line.startsWith('constraint') || line.startsWith('primary key') || line.startsWith('unique') || line.startsWith('check')) continue;
    const colMatch = line.match(/^(\w+)\s+([a-zA-Z0-9_\.\[\]]+)/);
    if (colMatch) {
      const colName = colMatch[1];
      const colType = colMatch[2];
      const isNullable = !line.includes('not null') && !line.includes('primary key');
      cols.push({ name: colName, type: pgTypeToTs(colType), nullable: isNullable });
    }
  }
  tables[tableName] = cols;
}

console.log('Tables parsed count:', Object.keys(tables).length);

// Generate Database type
let out = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'admin';
export type OrderStatus = 'pending' | 'in_progress' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded' | 'voided';
export type LeadStatus = 'unread' | 'read' | 'responded';
export type PolicyType = 'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation';
export type DiscountType = 'percent' | 'fixed';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'completed';

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: any[]
      }
`;

for (const [tName, cols] of Object.entries(tables)) {
  out += `      ${tName}: {\n`;
  out += `        Row: {\n`;
  out += `          [key: string]: any\n`;
  for (const c of cols) {
    out += `          ${c.name}: ${c.type}${c.nullable ? ' | null' : ''}\n`;
  }
  out += `        }\n`;
  out += `        Insert: {\n`;
  out += `          [key: string]: any\n`;
  for (const c of cols) {
    out += `          ${c.name}?: ${c.type}${c.nullable ? ' | null' : ''}\n`;
  }
  out += `        }\n`;
  out += `        Update: {\n`;
  out += `          [key: string]: any\n`;
  for (const c of cols) {
    out += `          ${c.name}?: ${c.type}${c.nullable ? ' | null' : ''}\n`;
  }
  out += `        }\n`;
  out += `        Relationships: any[]\n`;
  out += `      }\n`;
}

// Add compatibility tables for product_reviews if not in schema.txt, so legacy components don't hard crash
if (!tables['product_reviews']) {
  out += `      product_reviews: {
        Row: {
          [key: string]: any
          id: string
          product_id: string
          user_id: string
          order_item_id: string | null
          rating: number
          review_text: string | null
          images: string[]
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          product_id?: string
          user_id?: string
          order_item_id?: string | null
          rating?: number
          review_text?: string | null
          images?: string[]
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          product_id?: string
          user_id?: string
          order_item_id?: string | null
          rating?: number
          review_text?: string | null
          images?: string[]
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }\n`;
}

out += `    }
    Views: {
      v_products_admin: {
        Row: {
          [key: string]: any
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string
          subcategory_id: string | null
          sku: string
          batch_no: string
          hsn_code: string | null
          price: number
          stock: number
          low_stock_threshold: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          category_name: string
          subcategory_name: string | null
          is_low_stock: boolean
          primary_image: string | null
        }
        Relationships: any[]
      }
      v_low_stock_products: {
        Row: {
          [key: string]: any
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string
          subcategory_id: string | null
          sku: string
          batch_no: string
          hsn_code: string | null
          price: number
          stock: number
          low_stock_threshold: number
          is_active: boolean
          category_name: string
          subcategory_name: string | null
          is_low_stock: boolean
          primary_image: string | null
        }
        Relationships: any[]
      }
      v_storefront_categories: {
        Row: {
          [key: string]: any
          id: string
          parent_id: string | null
          name: string
          slug: string
          description: string | null
          thumbnail_url: string | null
          sort_order: number
        }
        Relationships: any[]
      }
      v_storefront_products: {
        Row: {
          [key: string]: any
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string
          subcategory_id: string | null
          sku: string
          price: number
          sale_price: number
          discount_percent: number
          stock: number
          in_stock: boolean
          created_at: string
          images: Array<{ url: string; is_primary: boolean }>
        }
        Relationships: any[]
      }
      v_orders_needing_refund: {
        Row: {
          [key: string]: any
          id: string
          order_number: string
          user_id: string | null
          status: OrderStatus
          payment_status: PaymentStatus
          total: number
        }
        Relationships: any[]
      }
      v_payment_events_failed: {
        Row: {
          [key: string]: any
          id: string
          provider: string
          event_id: string
          event_type: string
          status: string
          error: string | null
        }
        Relationships: any[]
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_active_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      active_discount_percent: {
        Args: { p_product_id: string }
        Returns: number
      }
      admin_set_user_role: {
        Args: { p_user_id: string; p_role: UserRole }
        Returns: Record<string, any>
      }
      admin_set_user_active: {
        Args: { p_user_id: string; p_active: boolean }
        Returns: Record<string, any>
      }
      admin_list_users: {
        Args: { p_search?: string | null; p_role?: UserRole | null; p_page?: number; p_page_size?: number }
        Returns: { total: number; page: number; page_size: number; rows: any[] }
      }
      reorder_categories: {
        Args: { p_items: Array<{ id: string; parent_id?: string | null; sort_order: number }> }
        Returns: void
      }
      admin_save_product: {
        Args: { p: Record<string, any> }
        Returns: Record<string, any>
      }
      admin_delete_product: {
        Args: { p_id: string }
        Returns: Record<string, any>
      }
      admin_adjust_stock: {
        Args: { p_product_id: string; p_delta: number; p_reason?: string | null }
        Returns: Record<string, any>
      }
      admin_list_products: {
        Args: {
          p_search?: string | null
          p_status?: string | null
          p_category_id?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: { total: number; page: number; page_size: number; rows: any[] }
      }
      admin_get_product: {
        Args: { p_id: string }
        Returns: Record<string, any>
      }
      admin_save_campaign: {
        Args: { p: Record<string, any> }
        Returns: Record<string, any>
      }
      admin_save_policy: {
        Args: {
          p_policy_type: PolicyType
          p_title: string
          p_content: string
          p_content_format?: string
        }
        Returns: Record<string, any>
      }
      admin_list_leads: {
        Args: {
          p_search?: string | null
          p_status?: LeadStatus | null
          p_from?: string | null
          p_to?: string | null
          p_type?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: { total: number; page: number; page_size: number; rows: any[] }
      }
      admin_update_lead: {
        Args: { p_id: string; p_status: LeadStatus }
        Returns: Record<string, any>
      }
      submit_lead: {
        Args: {
          p_type: string
          p_name?: string | null
          p_email?: string | null
          p_phone?: string | null
          p_subject?: string | null
          p_message?: string | null
        }
        Returns: Record<string, any>
      }
      place_order: {
        Args: {
          p_items: Array<{ product_id: string; quantity: number }>
          p_shipping: Record<string, any>
          p_payment_method?: string
          p_coupon_code?: string | null
          p_notes?: string | null
          p_idempotency_key?: string | null
        }
        Returns: Record<string, any>
      }
      begin_online_payment: {
        Args: { p_order_id: string }
        Returns: Record<string, any>
      }
      attach_razorpay_order: {
        Args: { p_order_id: string; p_rzp_order_id: string; p_amount_minor: number }
        Returns: Record<string, any>
      }
      apply_payment_event: {
        Args: {
          p_provider: string
          p_event_id: string
          p_event_type: string
          p_provider_order_id?: string | null
          p_provider_payment_id?: string | null
          p_amount_minor?: number | null
          p_currency?: string | null
          p_raw?: Record<string, any> | null
          p_method?: string | null
          p_error_code?: string | null
          p_error_description?: string | null
          p_parent_payment_id?: string | null
          p_order_id?: string | null
        }
        Returns: Record<string, any>
      }
      admin_list_orders: {
        Args: {
          p_search?: string | null
          p_status?: OrderStatus | null
          p_unread_only?: boolean
          p_from?: string | null
          p_to?: string | null
          p_payment_method?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: { total: number; page: number; page_size: number; rows: any[] }
      }
      admin_get_order: {
        Args: { p_id: string }
        Returns: Record<string, any>
      }
      admin_update_order: {
        Args: {
          p_order_id: string
          p_action: 'mark_read' | 'set_in_progress' | 'set_delivered' | 'cancel'
          p_reason?: string | null
        }
        Returns: Record<string, any>
      }
      request_return: {
        Args: {
          p_order_id: string
          p_items: Array<{ order_item_id: string; quantity: number }>
          p_reason: string
        }
        Returns: Record<string, any>
      }
      admin_review_return: {
        Args: { p_id: string; p_approve: boolean; p_note?: string | null }
        Returns: Record<string, any>
      }
      admin_complete_return: {
        Args: {
          p_id: string
          p_restock?: boolean
          p_refund_amount?: number | null
          p_note?: string | null
        }
        Returns: Record<string, any>
      }
      admin_analytics: {
        Args: { p_from?: string | null; p_to?: string | null }
        Returns: Record<string, any>
      }
      admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, any>
      }
      admin_unread_orders: {
        Args: { p_page?: number; p_page_size?: number }
        Returns: { total: number; page: number; page_size: number; offset: number; rows: any[] }
      }
      admin_order_stats: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, any>
      }
      admin_lead_stats: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, any>
      }
      issue_invoice: {
        Args: { p_order_id: string }
        Returns: Record<string, any>
      }
      get_my_invoice: {
        Args: { p_order_id: string }
        Returns: Record<string, any>
      }
      admin_list_invoices: {
        Args: { p_search?: string | null; p_page?: number; p_page_size?: number }
        Returns: { total: number; page: number; page_size: number; rows: any[] }
      }
    }
  }
}
`;

fs.writeFileSync('lib/database.types.ts', out, 'utf8');
console.log('Successfully updated lib/database.types.ts');
