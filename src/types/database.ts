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
      tenants: {
        Row: {
          id: string
          business_name: string
          slug: string
          logo_url: string | null
          primary_color: string
          plan: "basico" | "pro" | "cadena"
          afip_api_key: string | null
          afip_punto_venta: number | null
          whatsapp_phone_id: string | null
          whatsapp_token: string | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["tenants"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          full_name: string
          role: "admin" | "vendedor" | "recepcionista"
          avatar_url: string | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at">
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
      }
      patients: {
        Row: {
          id: string
          tenant_id: string
          first_name: string
          last_name: string
          dni: string | null
          email: string | null
          phone: string | null
          birth_date: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["patients"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>
      }
      prescriptions: {
        Row: {
          id: string
          tenant_id: string
          patient_id: string
          issued_by: string | null
          issued_date: string
          od_sphere: number | null
          od_cylinder: number | null
          od_axis: number | null
          od_addition: number | null
          od_pd: number | null
          oi_sphere: number | null
          oi_cylinder: number | null
          oi_axis: number | null
          oi_addition: number | null
          oi_pd: number | null
          lens_type: "monofocal" | "bifocal" | "progresivo" | "ocupacional" | null
          lens_material: "cr39" | "policarbonato" | "trivex" | "alto_indice_167" | "alto_indice_174" | "cristal_mineral" | null
          treatments: string[]
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["prescriptions"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Insert"]>
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          name: string
          category: "armazones" | "lentes" | "contactologia" | "accesorios" | "sol" | "otro"
          sku: string | null
          price: number
          cost: number | null
          stock: number
          stock_min: number
          active: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>
      }
      appointments: {
        Row: {
          id: string
          tenant_id: string
          patient_id: string
          scheduled_at: string
          duration_minutes: number
          type: "examen_visual" | "control" | "entrega" | "eleccion" | "otro"
          status: "pendiente" | "confirmado" | "presente" | "ausente" | "cancelado"
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["appointments"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          patient_id: string | null
          prescription_id: string | null
          status: "en_proceso" | "en_produccion" | "listo" | "entregado" | "cancelado"
          payment_method: "efectivo" | "transferencia" | "mercadopago" | "obra_social" | "credito" | "debito"
          subtotal: number
          discount: number
          total: number
          notes: string | null
          invoice_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["sales"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          tenant_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: Omit<Database["public"]["Tables"]["sale_items"]["Row"], "id">
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Insert"]>
      }
      invoices: {
        Row: {
          id: string
          tenant_id: string
          sale_id: string | null
          invoice_number: string
          invoice_type: "A" | "B" | "C"
          client_name: string
          client_cuit: string | null
          client_condition: string
          includes_iva: boolean
          subtotal: number
          iva_amount: number
          total: number
          cae: string | null
          cae_expiry: string | null
          afip_status: "borrador" | "pendiente" | "aprobada" | "error"
          afip_error: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Tipos de conveniencia
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"]
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"]
export type Product = Database["public"]["Tables"]["products"]["Row"]
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
export type Sale = Database["public"]["Tables"]["sales"]["Row"]
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"]
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
