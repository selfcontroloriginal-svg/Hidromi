export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          id: string
          name: string
          account_number: string
          balance: number
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          account_number: string
          balance?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          account_number?: string
          balance?: number
          created_at?: string | null
        }
      }
      company_info: {
        Row: {
          id: string
          name: string
          cnpj: string
          address: string
          phone: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          cnpj: string
          address: string
          phone: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          cnpj?: string
          address?: string
          phone?: string
          created_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          scheduledDate: string | null
          created_at: string | null
          totalValue: number | null
          isPremium: boolean | null
          purchasedItem: string | null
          dueDate: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          scheduledDate?: string | null
          created_at?: string | null
          totalValue?: number | null
          isPremium?: boolean | null
          purchasedItem?: string | null
          dueDate?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          scheduledDate?: string | null
          created_at?: string | null
          totalValue?: number | null
          isPremium?: boolean | null
          purchasedItem?: string | null
          dueDate?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          stock_quantity: number
          created_at: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          stock_quantity?: number
          created_at?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          stock_quantity?: number
          created_at?: string | null
          image_url?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string
          created_at: string | null
        }
        Insert: {
          id: string
          role: string
          full_name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          role?: string
          full_name?: string
          created_at?: string | null
        }
      }
      financial_transactions: {
        Row: {
          id: string
          type: string
          category: string
          description: string
          amount: number
          date: string
          payment_method: string
          reference_id: string | null
          reference_type: string | null
          vendor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          category: string
          description: string
          amount: number
          date: string
          payment_method: string
          reference_id?: string | null
          reference_type?: string | null
          vendor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          category?: string
          description?: string
          amount?: number
          date?: string
          payment_method?: string
          reference_id?: string | null
          reference_type?: string | null
          vendor_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales_complete: {
        Row: {
          id: string
          client_id: string
          vendor_id: string
          items: Json
          subtotal: number
          discount: number
          total: number
          payment_method: string
          installments: number
          observations: string
          status: string
          sale_date: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          vendor_id: string
          items?: Json
          subtotal?: number
          discount?: number
          total: number
          payment_method?: string
          installments?: number
          observations?: string
          status?: string
          sale_date: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          vendor_id?: string
          items?: Json
          subtotal?: number
          discount?: number
          total?: number
          payment_method?: string
          installments?: number
          observations?: string
          status?: string
          sale_date?: string
          created_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          client_name: string
          client_id: string | null
          vendor_id: string | null
          scheduled_date: string
          status: string
          notes: string
          follow_up_date: string | null
          rejection_reason: string | null
          maintenance_type: string | null
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_name: string
          client_id?: string | null
          vendor_id?: string | null
          scheduled_date: string
          status?: string
          notes?: string
          follow_up_date?: string | null
          rejection_reason?: string | null
          maintenance_type?: string | null
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_name?: string
          client_id?: string | null
          vendor_id?: string | null
          scheduled_date?: string
          status?: string
          notes?: string
          follow_up_date?: string | null
          rejection_reason?: string | null
          maintenance_type?: string | null
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
      maintenances: {
        Row: {
          id: string
          client_id: string
          client_name: string
          client_phone: string | null
          product_name: string
          maintenance_type: string
          scheduled_date: string
          status: string
          notes: string
          vendor_id: string
          vendor_name: string
          completed_at: string | null
          next_maintenance_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          client_name: string
          client_phone?: string | null
          product_name: string
          maintenance_type: string
          scheduled_date: string
          status?: string
          notes?: string
          vendor_id: string
          vendor_name: string
          completed_at?: string | null
          next_maintenance_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          client_name?: string
          client_phone?: string | null
          product_name?: string
          maintenance_type?: string
          scheduled_date?: string
          status?: string
          notes?: string
          vendor_id?: string
          vendor_name?: string
          completed_at?: string | null
          next_maintenance_date?: string | null
          created_at?: string
        }
      }
      quotations: {
        Row: {
          id: string
          client_id: string
          vendor_id: string
          items: Json
          total_value: number
          status: string
          valid_until: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          vendor_id: string
          items: Json
          total_value: number
          status?: string
          valid_until: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          vendor_id?: string
          items?: Json
          total_value?: number
          status?: string
          valid_until?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sales: {
        Row: {
          id: string
          client_id: string
          product_id: string
          observations: string | null
          total_value: number
          created_at: string | null
          vendor_id: string | null
        }
        Insert: {
          id?: string
          client_id: string
          product_id: string
          observations?: string | null
          total_value: number
          created_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          product_id?: string
          observations?: string | null
          total_value?: number
          created_at?: string | null
          vendor_id?: string | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}