export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      booking_blocked_dates: {
        Row: {
          all_day: boolean
          blocked_slots: string[]
          created_at: string
          date: string
          id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          blocked_slots?: string[]
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          blocked_slots?: string[]
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      booking_hours: {
        Row: {
          blocks: Json
          created_at: string
          day_of_week: number
          id: string
          open: boolean
          session_minutes: number
          updated_at: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          day_of_week: number
          id?: string
          open?: boolean
          session_minutes?: number
          updated_at?: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          day_of_week?: number
          id?: string
          open?: boolean
          session_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      booking_offers: {
        Row: {
          active: boolean
          applies_to_package_ids: string[]
          applies_to_service_ids: string[]
          auto_apply: boolean
          code: string | null
          created_at: string
          discount_percent: number | null
          ends_at: string | null
          flat_amount: number | null
          id: string
          name: string
          starts_at: string | null
          updated_at: string
          weekday_mask: number
        }
        Insert: {
          active?: boolean
          applies_to_package_ids?: string[]
          applies_to_service_ids?: string[]
          auto_apply?: boolean
          code?: string | null
          created_at?: string
          discount_percent?: number | null
          ends_at?: string | null
          flat_amount?: number | null
          id?: string
          name: string
          starts_at?: string | null
          updated_at?: string
          weekday_mask?: number
        }
        Update: {
          active?: boolean
          applies_to_package_ids?: string[]
          applies_to_service_ids?: string[]
          auto_apply?: boolean
          code?: string | null
          created_at?: string
          discount_percent?: number | null
          ends_at?: string | null
          flat_amount?: number | null
          id?: string
          name?: string
          starts_at?: string | null
          updated_at?: string
          weekday_mask?: number
        }
        Relationships: []
      }
      booking_packages: {
        Row: {
          active: boolean
          advance_percent: number
          badge: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          features: Json
          id: string
          max_edited_photos: number
          max_family_members: number
          max_poses: number
          max_themes: number
          name: string
          popular: boolean
          price: number
          seasonal_discount_percent: number
          service_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          advance_percent?: number
          badge?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          features?: Json
          id?: string
          max_edited_photos?: number
          max_family_members?: number
          max_poses?: number
          max_themes?: number
          name: string
          popular?: boolean
          price?: number
          seasonal_discount_percent?: number
          service_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          advance_percent?: number
          badge?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          features?: Json
          id?: string
          max_edited_photos?: number
          max_family_members?: number
          max_poses?: number
          max_themes?: number
          name?: string
          popular?: boolean
          price?: number
          seasonal_discount_percent?: number
          service_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_poses: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          name: string
          preview_url: string | null
          recommended_age: string | null
          sort_order: number
          theme_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          name: string
          preview_url?: string | null
          recommended_age?: string | null
          sort_order?: number
          theme_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          name?: string
          preview_url?: string | null
          recommended_age?: string | null
          sort_order?: number
          theme_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_poses_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "booking_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          active: boolean
          booking_instructions: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          featured: boolean
          gallery: Json
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          booking_instructions?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          booking_instructions?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      booking_slots: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          label: string
          sort_order: number
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          label: string
          sort_order?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          label?: string
          sort_order?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_themes: {
        Row: {
          active: boolean
          bg_color: string | null
          created_at: string
          gallery: Json
          id: string
          name: string
          props: string[]
          recommended_age: string | null
          service_id: string
          sort_order: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bg_color?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          name: string
          props?: string[]
          recommended_age?: string | null
          service_id: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bg_color?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          name?: string
          props?: string[]
          recommended_age?: string | null
          service_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_themes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          balance_amount: number | null
          contact_name: string | null
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          end_time: string | null
          id: string
          inquiry_id: string | null
          location: string | null
          notes: string | null
          package_name: string | null
          paid_amount: number
          phone: string | null
          service_label: string | null
          service_slug: string | null
          session_date: string
          stage: string
          start_time: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance_amount?: number | null
          contact_name?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          end_time?: string | null
          id?: string
          inquiry_id?: string | null
          location?: string | null
          notes?: string | null
          package_name?: string | null
          paid_amount?: number
          phone?: string | null
          service_label?: string | null
          service_slug?: string | null
          session_date: string
          stage?: string
          start_time?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          balance_amount?: number | null
          contact_name?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          end_time?: string | null
          id?: string
          inquiry_id?: string | null
          location?: string | null
          notes?: string | null
          package_name?: string | null
          paid_amount?: number
          phone?: string | null
          service_label?: string | null
          service_slug?: string | null
          session_date?: string
          stage?: string
          start_time?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          amount: number | null
          contact_name: string | null
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          payment_status: string | null
          phone: string | null
          priority: string
          reminder_at: string | null
          reminder_offset_minutes: number | null
          start_time: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          contact_name?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          payment_status?: string | null
          phone?: string | null
          priority?: string
          reminder_at?: string | null
          reminder_offset_minutes?: number | null
          start_time?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contact_name?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          payment_status?: string | null
          phone?: string | null
          priority?: string
          reminder_at?: string | null
          reminder_offset_minutes?: number | null
          start_time?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number
          featured: boolean
          hidden: boolean
          id: string
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          hidden?: boolean
          id?: string
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          hidden?: boolean
          id?: string
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_notes: {
        Row: {
          body: string
          color: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          pinned: boolean
          updated_at: string
        }
        Insert: {
          body: string
          color?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Update: {
          body?: string
          color?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          done_at: string | null
          due_on: string
          id: string
          updated_at: string
          what: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          done_at?: string | null
          due_on?: string
          id?: string
          updated_at?: string
          what: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          done_at?: string | null
          due_on?: string
          id?: string
          updated_at?: string
          what?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_dates: {
        Row: {
          created_at: string
          customer_id: string
          date: string
          id: string
          label: string
          recurring: boolean
        }
        Insert: {
          created_at?: string
          customer_id: string
          date: string
          id?: string
          label: string
          recurring?: boolean
        }
        Update: {
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          label?: string
          recurring?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customer_dates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          anniversary_date: string | null
          baby_dob: string | null
          baby_gender: string | null
          baby_name: string | null
          city: string | null
          created_at: string
          customer_name: string | null
          deleted_at: string | null
          email: string | null
          father_name: string | null
          favorite: boolean
          google_account_id: string | null
          google_contact_resource_name: string | null
          google_etag: string | null
          google_last_synced_at: string | null
          google_sync_status: string | null
          id: string
          last_contacted_at: string | null
          mother_name: string | null
          normalized_phone: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          service_slug: string | null
          source: string | null
          updated_at: string
          whatsapp_consent: boolean
        }
        Insert: {
          address?: string | null
          anniversary_date?: string | null
          baby_dob?: string | null
          baby_gender?: string | null
          baby_name?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          deleted_at?: string | null
          email?: string | null
          father_name?: string | null
          favorite?: boolean
          google_account_id?: string | null
          google_contact_resource_name?: string | null
          google_etag?: string | null
          google_last_synced_at?: string | null
          google_sync_status?: string | null
          id?: string
          last_contacted_at?: string | null
          mother_name?: string | null
          normalized_phone?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          service_slug?: string | null
          source?: string | null
          updated_at?: string
          whatsapp_consent?: boolean
        }
        Update: {
          address?: string | null
          anniversary_date?: string | null
          baby_dob?: string | null
          baby_gender?: string | null
          baby_name?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          deleted_at?: string | null
          email?: string | null
          father_name?: string | null
          favorite?: boolean
          google_account_id?: string | null
          google_contact_resource_name?: string | null
          google_etag?: string | null
          google_last_synced_at?: string | null
          google_sync_status?: string | null
          id?: string
          last_contacted_at?: string | null
          mother_name?: string | null
          normalized_phone?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          service_slug?: string | null
          source?: string | null
          updated_at?: string
          whatsapp_consent?: boolean
        }
        Relationships: []
      }
      google_contact_accounts: {
        Row: {
          access_token: string | null
          connected_at: string
          contacts_count: number
          google_account_id: string
          google_email: string | null
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          sync_status: string
          sync_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          contacts_count?: number
          google_account_id: string
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_status?: string
          sync_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          contacts_count?: number
          google_account_id?: string
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_status?: string
          sync_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      google_oauth_states: {
        Row: {
          created_at: string
          state: string
        }
        Insert: {
          created_at?: string
          state: string
        }
        Update: {
          created_at?: string
          state?: string
        }
        Relationships: []
      }
      image_faces: {
        Row: {
          bbox: Json
          confidence: number | null
          created_at: string
          face_embedding: Json | null
          id: string
          image_id: string
          person_label: string | null
        }
        Insert: {
          bbox: Json
          confidence?: number | null
          created_at?: string
          face_embedding?: Json | null
          id?: string
          image_id: string
          person_label?: string | null
        }
        Update: {
          bbox?: Json
          confidence?: number | null
          created_at?: string
          face_embedding?: Json | null
          id?: string
          image_id?: string
          person_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_faces_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      image_favorites: {
        Row: {
          created_at: string
          id: string
          image_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_favorites_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      image_similar_groups: {
        Row: {
          centroid: Json | null
          created_at: string
          id: string
          label: string | null
        }
        Insert: {
          centroid?: Json | null
          created_at?: string
          id?: string
          label?: string | null
        }
        Update: {
          centroid?: Json | null
          created_at?: string
          id?: string
          label?: string | null
        }
        Relationships: []
      }
      image_similar_members: {
        Row: {
          group_id: string
          image_id: string
          score: number | null
        }
        Insert: {
          group_id: string
          image_id: string
          score?: number | null
        }
        Update: {
          group_id?: string
          image_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_similar_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "image_similar_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_similar_members_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          ai_metadata: Json | null
          alt_text: string | null
          bytes: number | null
          caption: string | null
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number
          dominant_color: string | null
          embedding: Json | null
          featured: boolean
          height: number | null
          hidden: boolean
          id: string
          image_url: string
          optimized_at: string | null
          short_id: string
          storage_path: string | null
          subcategory_id: string | null
          tags: string[] | null
          theme: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          uploaded_by: string | null
          variants: Json | null
          width: number | null
        }
        Insert: {
          ai_metadata?: Json | null
          alt_text?: string | null
          bytes?: number | null
          caption?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          dominant_color?: string | null
          embedding?: Json | null
          featured?: boolean
          height?: number | null
          hidden?: boolean
          id?: string
          image_url: string
          optimized_at?: string | null
          short_id?: string
          storage_path?: string | null
          subcategory_id?: string | null
          tags?: string[] | null
          theme?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          variants?: Json | null
          width?: number | null
        }
        Update: {
          ai_metadata?: Json | null
          alt_text?: string | null
          bytes?: number | null
          caption?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          dominant_color?: string | null
          embedding?: Json | null
          featured?: boolean
          height?: number | null
          hidden?: boolean
          id?: string
          image_url?: string
          optimized_at?: string | null
          short_id?: string
          storage_path?: string | null
          subcategory_id?: string | null
          tags?: string[] | null
          theme?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          variants?: Json | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_notes: string | null
          advance_amount: number | null
          answers: Json
          booking_package_id: string | null
          booking_service_id: string | null
          category_id: string | null
          category_label: string | null
          child_name: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number
          email: string | null
          event_date: string | null
          family_name: string | null
          id: string
          message: string | null
          name: string
          offer_id: string | null
          package_id: string | null
          phone: string | null
          pose_ids: string[]
          service_type: string | null
          session_date: string | null
          session_slot: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          theme_ids: string[]
          total_price: number | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          advance_amount?: number | null
          answers?: Json
          booking_package_id?: string | null
          booking_service_id?: string | null
          category_id?: string | null
          category_label?: string | null
          child_name?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          email?: string | null
          event_date?: string | null
          family_name?: string | null
          id?: string
          message?: string | null
          name: string
          offer_id?: string | null
          package_id?: string | null
          phone?: string | null
          pose_ids?: string[]
          service_type?: string | null
          session_date?: string | null
          session_slot?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          theme_ids?: string[]
          total_price?: number | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          advance_amount?: number | null
          answers?: Json
          booking_package_id?: string | null
          booking_service_id?: string | null
          category_id?: string | null
          category_label?: string | null
          child_name?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          email?: string | null
          event_date?: string | null
          family_name?: string | null
          id?: string
          message?: string | null
          name?: string
          offer_id?: string | null
          package_id?: string | null
          phone?: string | null
          pose_ids?: string[]
          service_type?: string | null
          session_date?: string | null
          session_slot?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          theme_ids?: string[]
          total_price?: number | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_booking_package_id_fkey"
            columns: ["booking_package_id"]
            isOneToOne: false
            referencedRelation: "booking_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_booking_service_id_fkey"
            columns: ["booking_service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "booking_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      milestone_configs: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          months: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          months: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          months?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      package_features: {
        Row: {
          created_at: string
          display_order: number
          feature: string
          id: string
          package_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          feature: string
          id?: string
          package_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          feature?: string
          id?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_features_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          category_id: string | null
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          display_order: number
          duration: string | null
          featured: boolean
          id: string
          name: string
          photos_count: number | null
          price: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          featured?: boolean
          id?: string
          name: string
          photos_count?: number | null
          price?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          featured?: boolean
          id?: string
          name?: string
          photos_count?: number | null
          price?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reels: {
        Row: {
          aspect_ratio: string
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number
          featured: boolean
          id: string
          location: string | null
          package_id: string | null
          poster_path: string | null
          poster_url: string | null
          published: boolean
          short_id: string
          title: string
          updated_at: string
          video_path: string | null
          video_url: string | null
        }
        Insert: {
          aspect_ratio?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          location?: string | null
          package_id?: string | null
          poster_path?: string | null
          poster_url?: string | null
          published?: boolean
          short_id?: string
          title: string
          updated_at?: string
          video_path?: string | null
          video_url?: string | null
        }
        Update: {
          aspect_ratio?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          location?: string | null
          package_id?: string | null
          poster_path?: string | null
          poster_url?: string | null
          published?: boolean
          short_id?: string
          title?: string
          updated_at?: string
          video_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_offers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          message: string | null
          offer_type: string
          updated_at: string
          value: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          message?: string | null
          offer_type?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          message?: string | null
          offer_type?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          kind: string
          label: string
          message: string | null
          milestone_date: string
          offer_id: string | null
          remind_on: string
          sent_at: string | null
          snoozed_until: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          kind?: string
          label: string
          message?: string | null
          milestone_date: string
          offer_id?: string | null
          remind_on: string
          sent_at?: string | null
          snoozed_until?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          kind?: string
          label?: string
          message?: string | null
          milestone_date?: string
          offer_id?: string | null
          remind_on?: string
          sent_at?: string | null
          snoozed_until?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "reminder_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      site_content: {
        Row: {
          data: Json
          section_key: string
          updated_at: string
        }
        Insert: {
          data?: Json
          section_key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      slug_redirects: {
        Row: {
          category_slug: string | null
          created_at: string
          id: string
          kind: string
          new_slug: string
          old_slug: string
          target_id: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          id?: string
          kind: string
          new_slug: string
          old_slug: string
          target_id: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          id?: string
          kind?: string
          new_slug?: string
          old_slug?: string
          target_id?: string
        }
        Relationships: []
      }
      studio_notes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_completed: boolean
          moved_from_date: string | null
          note: string
          note_date: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_completed?: boolean
          moved_from_date?: string | null
          note: string
          note_date: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_completed?: boolean
          moved_from_date?: string | null
          note?: string
          note_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          archived_at: string | null
          category_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number
          hidden: boolean
          id: string
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          hidden?: boolean
          id?: string
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          hidden?: boolean
          id?: string
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author: string
          content: string
          created_at: string
          display_order: number
          featured: boolean
          id: string
          rating: number | null
          role: string | null
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gallery_object_public: { Args: { objname: string }; Returns: boolean }
      generate_photo_short_id: { Args: never; Returns: string }
      generate_upcoming_reminders: {
        Args: { lookahead_days?: number }
        Returns: number
      }
      get_taken_slots: {
        Args: { d: string }
        Returns: {
          slot: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_contact_phone: {
        Args: { default_country?: string; raw: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      inquiry_status:
        | "new"
        | "contacted"
        | "follow_up"
        | "booked"
        | "closed"
        | "confirmed"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      inquiry_status: [
        "new",
        "contacted",
        "follow_up",
        "booked",
        "closed",
        "confirmed",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
