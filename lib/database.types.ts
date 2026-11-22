export type Json =
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
      app_schema_version: {
        Row: {
          [key: string]: any
          version: string
          applied_at: string
        }
        Insert: {
          [key: string]: any
          version?: string
          applied_at?: string
        }
        Update: {
          [key: string]: any
          version?: string
          applied_at?: string
        }
        Relationships: any[]
      }
      rate_limits: {
        Row: {
          [key: string]: any
          key: string
          window_start: string
          hits: number
        }
        Insert: {
          [key: string]: any
          key?: string
          window_start?: string
          hits?: number
        }
        Update: {
          [key: string]: any
          key?: string
          window_start?: string
          hits?: number
        }
        Relationships: any[]
      }
      profiles: {
        Row: {
          [key: string]: any
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      store_settings: {
        Row: {
          [key: string]: any
          id: boolean
          store_name: string
          currency: string
          timezone: string
          tax_rate_percent: number
          prices_include_tax: boolean
          shipping_flat_fee: number
          free_shipping_threshold: number | null
          low_stock_default: number
          payment_window_minutes: number
          return_window_days: number
          max_open_orders: number
          cod_auto_cancel_hours: number | null
          coupons_stack_with_campaigns: boolean
          cod_invoice_on: string
          seller_legal_name: string | null
          seller_gstin: string | null
          seller_address: string | null
          seller_state: string | null
          seller_email: string | null
          seller_phone: string | null
          invoice_prefix: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: boolean
          store_name?: string
          currency?: string
          timezone?: string
          tax_rate_percent?: number
          prices_include_tax?: boolean
          shipping_flat_fee?: number
          free_shipping_threshold?: number | null
          low_stock_default?: number
          payment_window_minutes?: number
          return_window_days?: number
          max_open_orders?: number
          cod_auto_cancel_hours?: number | null
          coupons_stack_with_campaigns?: boolean
          cod_invoice_on?: string
          seller_legal_name?: string | null
          seller_gstin?: string | null
          seller_address?: string | null
          seller_state?: string | null
          seller_email?: string | null
          seller_phone?: string | null
          invoice_prefix?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: boolean
          store_name?: string
          currency?: string
          timezone?: string
          tax_rate_percent?: number
          prices_include_tax?: boolean
          shipping_flat_fee?: number
          free_shipping_threshold?: number | null
          low_stock_default?: number
          payment_window_minutes?: number
          return_window_days?: number
          max_open_orders?: number
          cod_auto_cancel_hours?: number | null
          coupons_stack_with_campaigns?: boolean
          cod_invoice_on?: string
          seller_legal_name?: string | null
          seller_gstin?: string | null
          seller_address?: string | null
          seller_state?: string | null
          seller_email?: string | null
          seller_phone?: string | null
          invoice_prefix?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      storage_cleanup_queue: {
        Row: {
          [key: string]: any
          id: number
          bucket: string
          path: string
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: number
          bucket?: string
          path?: string
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: number
          bucket?: string
          path?: string
          created_at?: string
        }
        Relationships: any[]
      }
      categories: {
        Row: {
          [key: string]: any
          id: string
          parent_id: string | null
          name: string
          slug: string
          description: string | null
          thumbnail_url: string | null
          thumbnail_path: string | null
          sort_order: number
          is_active: boolean
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          parent_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          thumbnail_url?: string | null
          thumbnail_path?: string | null
          sort_order?: number
          is_active?: boolean
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          parent_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          thumbnail_url?: string | null
          thumbnail_path?: string | null
          sort_order?: number
          is_active?: boolean
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      products: {
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
        }
        Insert: {
          [key: string]: any
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category_id?: string
          subcategory_id?: string | null
          sku?: string
          batch_no?: string
          hsn_code?: string | null
          price?: number
          stock?: number
          low_stock_threshold?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category_id?: string
          subcategory_id?: string | null
          sku?: string
          batch_no?: string
          hsn_code?: string | null
          price?: number
          stock?: number
          low_stock_threshold?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      product_images: {
        Row: {
          [key: string]: any
          id: string
          product_id: string
          url: string
          storage_path: string | null
          sort_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          product_id?: string
          url?: string
          storage_path?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          product_id?: string
          url?: string
          storage_path?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: any[]
      }
      inventory_movements: {
        Row: {
          [key: string]: any
          id: number
          product_id: string
          delta: number
          stock_after: number
          reason: string
          actor_id: string | null
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: number
          product_id?: string
          delta?: number
          stock_after?: number
          reason?: string
          actor_id?: string | null
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: number
          product_id?: string
          delta?: number
          stock_after?: number
          reason?: string
          actor_id?: string | null
          created_at?: string
        }
        Relationships: any[]
      }
      coupons: {
        Row: {
          [key: string]: any
          id: string
          code: string
          description: string | null
          discount_type: 'percent' | 'fixed'
          discount_value: number
          min_order_amount: number
          max_discount: number | null
          usage_limit: number | null
          used_count: number
          per_user_limit: number
          starts_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          code?: string
          description?: string | null
          discount_type?: 'percent' | 'fixed'
          discount_value?: number
          min_order_amount?: number
          max_discount?: number | null
          usage_limit?: number | null
          used_count?: number
          per_user_limit?: number
          starts_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          code?: string
          description?: string | null
          discount_type?: 'percent' | 'fixed'
          discount_value?: number
          min_order_amount?: number
          max_discount?: number | null
          usage_limit?: number | null
          used_count?: number
          per_user_limit?: number
          starts_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      festive_campaigns: {
        Row: {
          [key: string]: any
          id: string
          name: string
          banner_image_url: string
          banner_path: string | null
          discount_percent: number
          coupon_id: string | null
          display_order: number
          starts_at: string | null
          ends_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          name?: string
          banner_image_url?: string
          banner_path?: string | null
          discount_percent?: number
          coupon_id?: string | null
          display_order?: number
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          name?: string
          banner_image_url?: string
          banner_path?: string | null
          discount_percent?: number
          coupon_id?: string | null
          display_order?: number
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      festive_campaign_products: {
        Row: {
          [key: string]: any
          campaign_id: string
          product_id: string
        }
        Insert: {
          [key: string]: any
          campaign_id?: string
          product_id?: string
        }
        Update: {
          [key: string]: any
          campaign_id?: string
          product_id?: string
        }
        Relationships: any[]
      }
      hero_banners: {
        Row: {
          [key: string]: any
          id: string
          image_url: string
          image_path: string | null
          title: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          image_url?: string
          image_path?: string | null
          title?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          image_url?: string
          image_path?: string | null
          title?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      announcements: {
        Row: {
          [key: string]: any
          id: string
          text: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          text?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          text?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      site_policies: {
        Row: {
          [key: string]: any
          policy_type: 'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation'
          title: string
          content: string
          content_format: string
          version: number
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          [key: string]: any
          policy_type?: 'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation'
          title?: string
          content?: string
          content_format?: string
          version?: number
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          [key: string]: any
          policy_type?: 'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation'
          title?: string
          content?: string
          content_format?: string
          version?: number
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: any[]
      }
      site_policy_versions: {
        Row: {
          [key: string]: any
          id: number
          policy_type: 'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation'
          version: number
          content: string
          content_format: string
          edited_by: string | null
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: number
          policy_type?: 'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation'
          version?: number
          content?: string
          content_format?: string
          edited_by?: string | null
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: number
          policy_type?: 'terms_of_service' | 'privacy_policy' | 'shipping_delivery' | 'return_refund' | 'cancellation'
          version?: number
          content?: string
          content_format?: string
          edited_by?: string | null
          created_at?: string
        }
        Relationships: any[]
      }
      leads: {
        Row: {
          [key: string]: any
          id: string
          name: string
          email: string
          phone: string | null
          message: string | null
          status: 'unread' | 'read' | 'responded'
          ip_hash: string | null
          user_agent: string | null
          received_at: string
          responded_at: string | null
          responded_by: string | null
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          name?: string
          email?: string
          phone?: string | null
          message?: string | null
          status?: 'unread' | 'read' | 'responded'
          ip_hash?: string | null
          user_agent?: string | null
          received_at?: string
          responded_at?: string | null
          responded_by?: string | null
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          name?: string
          email?: string
          phone?: string | null
          message?: string | null
          status?: 'unread' | 'read' | 'responded'
          ip_hash?: string | null
          user_agent?: string | null
          received_at?: string
          responded_at?: string | null
          responded_by?: string | null
          updated_at?: string
        }
        Relationships: any[]
      }
      addresses: {
        Row: {
          [key: string]: any
          id: string
          user_id: string
          label: string | null
          full_name: string
          phone: string
          line1: string
          line2: string | null
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          user_id?: string
          label?: string | null
          full_name?: string
          phone?: string
          line1?: string
          line2?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          user_id?: string
          label?: string | null
          full_name?: string
          phone?: string
          line1?: string
          line2?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      cart_items: {
        Row: {
          [key: string]: any
          user_id: string
          product_id: string
          quantity: number
          added_at: string
        }
        Insert: {
          [key: string]: any
          user_id?: string
          product_id?: string
          quantity?: number
          added_at?: string
        }
        Update: {
          [key: string]: any
          user_id?: string
          product_id?: string
          quantity?: number
          added_at?: string
        }
        Relationships: any[]
      }
      wishlist_items: {
        Row: {
          [key: string]: any
          user_id: string
          product_id: string
          added_at: string
        }
        Insert: {
          [key: string]: any
          user_id?: string
          product_id?: string
          added_at?: string
        }
        Update: {
          [key: string]: any
          user_id?: string
          product_id?: string
          added_at?: string
        }
        Relationships: any[]
      }
      orders: {
        Row: {
          [key: string]: any
          id: string
          order_number: string
          order_name: string
          user_id: string | null
          idempotency_key: string | null
          customer_name: string
          customer_email: string
          customer_phone: string | null
          shipping_address: Json
          subtotal: number
          discount_total: number
          coupon_discount: number
          shipping_fee: number
          tax_total: number
          tax_rate_percent: number
          prices_include_tax: boolean
          total: number
          coupon_id: string | null
          coupon_code: string | null
          is_read: boolean
          read_at: string | null
          read_by: string | null
          status: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
          confirmed_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          payment_method: string
          payment_status: 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded' | 'voided'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          order_number?: string
          order_name?: string
          user_id?: string | null
          idempotency_key?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          shipping_address?: Json
          subtotal?: number
          discount_total?: number
          coupon_discount?: number
          shipping_fee?: number
          tax_total?: number
          tax_rate_percent?: number
          prices_include_tax?: boolean
          total?: number
          coupon_id?: string | null
          coupon_code?: string | null
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          status?: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
          confirmed_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          payment_method?: string
          payment_status?: 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded' | 'voided'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          order_number?: string
          order_name?: string
          user_id?: string | null
          idempotency_key?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          shipping_address?: Json
          subtotal?: number
          discount_total?: number
          coupon_discount?: number
          shipping_fee?: number
          tax_total?: number
          tax_rate_percent?: number
          prices_include_tax?: boolean
          total?: number
          coupon_id?: string | null
          coupon_code?: string | null
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          status?: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
          confirmed_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          payment_method?: string
          payment_status?: 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded' | 'voided'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      order_items: {
        Row: {
          [key: string]: any
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          sku: string
          hsn_code: string | null
          image_url: string | null
          unit_price: number
          list_price: number
          quantity: number
          line_total: number
        }
        Insert: {
          [key: string]: any
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          sku?: string
          hsn_code?: string | null
          image_url?: string | null
          unit_price?: number
          list_price?: number
          quantity?: number
          line_total?: number
        }
        Update: {
          [key: string]: any
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          sku?: string
          hsn_code?: string | null
          image_url?: string | null
          unit_price?: number
          list_price?: number
          quantity?: number
          line_total?: number
        }
        Relationships: any[]
      }
      order_status_history: {
        Row: {
          [key: string]: any
          id: number
          order_id: string
          status: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
          is_read: boolean
          note: string | null
          changed_by: string | null
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: number
          order_id?: string
          status?: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
          is_read?: boolean
          note?: string | null
          changed_by?: string | null
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: number
          order_id?: string
          status?: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
          is_read?: boolean
          note?: string | null
          changed_by?: string | null
          created_at?: string
        }
        Relationships: any[]
      }
      payments: {
        Row: {
          [key: string]: any
          id: string
          order_id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          kind: string
          amount: number
          currency: string
          status: string
          method: string | null
          captured_at: string | null
          error_code: string | null
          error_description: string | null
          reason: string | null
          raw: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          order_id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          kind?: string
          amount?: number
          currency?: string
          status?: string
          method?: string | null
          captured_at?: string | null
          error_code?: string | null
          error_description?: string | null
          reason?: string | null
          raw?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          order_id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          kind?: string
          amount?: number
          currency?: string
          status?: string
          method?: string | null
          captured_at?: string | null
          error_code?: string | null
          error_description?: string | null
          reason?: string | null
          raw?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      payment_webhook_events: {
        Row: {
          [key: string]: any
          id: string
          provider: string
          event_id: string
          event_type: string
          payload: Json | null
          status: string
          error: string | null
          attempts: number
          received_at: string
          processed_at: string | null
        }
        Insert: {
          [key: string]: any
          id?: string
          provider?: string
          event_id?: string
          event_type?: string
          payload?: Json | null
          status?: string
          error?: string | null
          attempts?: number
          received_at?: string
          processed_at?: string | null
        }
        Update: {
          [key: string]: any
          id?: string
          provider?: string
          event_id?: string
          event_type?: string
          payload?: Json | null
          status?: string
          error?: string | null
          attempts?: number
          received_at?: string
          processed_at?: string | null
        }
        Relationships: any[]
      }
      coupon_redemptions: {
        Row: {
          [key: string]: any
          id: string
          coupon_id: string
          user_id: string | null
          order_id: string
          amount: number
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          coupon_id?: string
          user_id?: string | null
          order_id?: string
          amount?: number
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          coupon_id?: string
          user_id?: string | null
          order_id?: string
          amount?: number
          created_at?: string
        }
        Relationships: any[]
      }
      return_requests: {
        Row: {
          [key: string]: any
          id: string
          order_id: string
          user_id: string | null
          reason: string
          status: 'requested' | 'approved' | 'rejected' | 'completed'
          admin_note: string | null
          restocked: boolean
          refund_amount: number
          reviewed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          order_id?: string
          user_id?: string | null
          reason?: string
          status?: 'requested' | 'approved' | 'rejected' | 'completed'
          admin_note?: string | null
          restocked?: boolean
          refund_amount?: number
          reviewed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          order_id?: string
          user_id?: string | null
          reason?: string
          status?: 'requested' | 'approved' | 'rejected' | 'completed'
          admin_note?: string | null
          restocked?: boolean
          refund_amount?: number
          reviewed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      return_request_items: {
        Row: {
          [key: string]: any
          return_id: string
          order_item_id: string
          quantity: number
        }
        Insert: {
          [key: string]: any
          return_id?: string
          order_item_id?: string
          quantity?: number
        }
        Update: {
          [key: string]: any
          return_id?: string
          order_item_id?: string
          quantity?: number
        }
        Relationships: any[]
      }
      invoice_counters: {
        Row: {
          [key: string]: any
          fy: string
          last_no: number
        }
        Insert: {
          [key: string]: any
          fy?: string
          last_no?: number
        }
        Update: {
          [key: string]: any
          fy?: string
          last_no?: number
        }
        Relationships: any[]
      }
      invoices: {
        Row: {
          [key: string]: any
          id: string
          order_id: string
          invoice_number: string
          status: string
          issued_at: string
          cancelled_at: string | null
          seller: Json
          buyer: Json
          place_of_supply: string | null
          currency: string
          subtotal: number
          discount_total: number
          shipping_fee: number
          taxable_value: number
          tax_total: number
          tax_rate_percent: number
          prices_include_tax: boolean
          tax_breakdown: Json
          total: number
          payment_method: string
          payment_status: string
          amount_paid: number
          paid_at: string | null
          payment_provider: string | null
          provider_order_id: string | null
          provider_payment_id: string | null
          payment_instrument: string | null
          pdf_path: string | null
          emailed_at: string | null
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: string
          order_id?: string
          invoice_number?: string
          status?: string
          issued_at?: string
          cancelled_at?: string | null
          seller?: Json
          buyer?: Json
          place_of_supply?: string | null
          currency?: string
          subtotal?: number
          discount_total?: number
          shipping_fee?: number
          taxable_value?: number
          tax_total?: number
          tax_rate_percent?: number
          prices_include_tax?: boolean
          tax_breakdown?: Json
          total?: number
          payment_method?: string
          payment_status?: string
          amount_paid?: number
          paid_at?: string | null
          payment_provider?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          payment_instrument?: string | null
          pdf_path?: string | null
          emailed_at?: string | null
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: string
          order_id?: string
          invoice_number?: string
          status?: string
          issued_at?: string
          cancelled_at?: string | null
          seller?: Json
          buyer?: Json
          place_of_supply?: string | null
          currency?: string
          subtotal?: number
          discount_total?: number
          shipping_fee?: number
          taxable_value?: number
          tax_total?: number
          tax_rate_percent?: number
          prices_include_tax?: boolean
          tax_breakdown?: Json
          total?: number
          payment_method?: string
          payment_status?: string
          amount_paid?: number
          paid_at?: string | null
          payment_provider?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          payment_instrument?: string | null
          pdf_path?: string | null
          emailed_at?: string | null
          created_at?: string
        }
        Relationships: any[]
      }
      invoice_items: {
        Row: {
          [key: string]: any
          id: string
          invoice_id: string
          line_no: number
          product_name: string
          sku: string
          hsn_code: string | null
          quantity: number
          list_price: number
          unit_price: number
          line_total: number
        }
        Insert: {
          [key: string]: any
          id?: string
          invoice_id?: string
          line_no?: number
          product_name?: string
          sku?: string
          hsn_code?: string | null
          quantity?: number
          list_price?: number
          unit_price?: number
          line_total?: number
        }
        Update: {
          [key: string]: any
          id?: string
          invoice_id?: string
          line_no?: number
          product_name?: string
          sku?: string
          hsn_code?: string | null
          quantity?: number
          list_price?: number
          unit_price?: number
          line_total?: number
        }
        Relationships: any[]
      }
      notification_outbox: {
        Row: {
          [key: string]: any
          id: number
          kind: string
          order_id: string | null
          invoice_id: string | null
          recipient: string
          status: string
          attempts: number
          last_error: string | null
          next_attempt_at: string
          created_at: string
          sent_at: string | null
        }
        Insert: {
          [key: string]: any
          id?: number
          kind?: string
          order_id?: string | null
          invoice_id?: string | null
          recipient?: string
          status?: string
          attempts?: number
          last_error?: string | null
          next_attempt_at?: string
          created_at?: string
          sent_at?: string | null
        }
        Update: {
          [key: string]: any
          id?: number
          kind?: string
          order_id?: string | null
          invoice_id?: string | null
          recipient?: string
          status?: string
          attempts?: number
          last_error?: string | null
          next_attempt_at?: string
          created_at?: string
          sent_at?: string | null
        }
        Relationships: any[]
      }
      page_views: {
        Row: {
          [key: string]: any
          id: number
          visitor_key: string
          session_id: string
          path: string
          referrer: string | null
          user_agent: string | null
          consented: boolean
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: number
          visitor_key?: string
          session_id?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
          consented?: boolean
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: number
          visitor_key?: string
          session_id?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
          consented?: boolean
          created_at?: string
        }
        Relationships: any[]
      }
      site_visitors: {
        Row: {
          [key: string]: any
          visitor_key: string
          consented: boolean
          first_seen: string
          last_seen: string
          page_views: number
        }
        Insert: {
          [key: string]: any
          visitor_key?: string
          consented?: boolean
          first_seen?: string
          last_seen?: string
          page_views?: number
        }
        Update: {
          [key: string]: any
          visitor_key?: string
          consented?: boolean
          first_seen?: string
          last_seen?: string
          page_views?: number
        }
        Relationships: any[]
      }
      site_sessions: {
        Row: {
          [key: string]: any
          session_id: string
          visitor_key: string
          started_at: string
          last_seen: string
          page_views: number
        }
        Insert: {
          [key: string]: any
          session_id?: string
          visitor_key?: string
          started_at?: string
          last_seen?: string
          page_views?: number
        }
        Update: {
          [key: string]: any
          session_id?: string
          visitor_key?: string
          started_at?: string
          last_seen?: string
          page_views?: number
        }
        Relationships: any[]
      }
      site_visitor_days: {
        Row: {
          [key: string]: any
          day: string
          visitor_key: string
        }
        Insert: {
          [key: string]: any
          day?: string
          visitor_key?: string
        }
        Update: {
          [key: string]: any
          day?: string
          visitor_key?: string
        }
        Relationships: any[]
      }
      analytics_daily: {
        Row: {
          [key: string]: any
          day: string
          page_views: number
          sessions: number
        }
        Insert: {
          [key: string]: any
          day?: string
          page_views?: number
          sessions?: number
        }
        Update: {
          [key: string]: any
          day?: string
          page_views?: number
          sessions?: number
        }
        Relationships: any[]
      }
      audit_logs: {
        Row: {
          [key: string]: any
          id: number
          actor_id: string | null
          table_name: string
          record_id: string | null
          action: string
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          [key: string]: any
          id?: number
          actor_id?: string | null
          table_name?: string
          record_id?: string | null
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          [key: string]: any
          id?: number
          actor_id?: string | null
          table_name?: string
          record_id?: string | null
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Relationships: any[]
      }
      product_reviews: {
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
      }
    }
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
