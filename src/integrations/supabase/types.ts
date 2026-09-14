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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string
          data: string
          descricao: string
          especialidade: string | null
          hora: string | null
          id: string
          local: string | null
          medico: string | null
          motivo: string | null
          observacoes: string | null
          realizado: boolean
          realizado_em: string | null
          residente_id: string
          resultado_data: string | null
          resultado_retirado: boolean
          resultado_retirado_em: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao: string
          especialidade?: string | null
          hora?: string | null
          id?: string
          local?: string | null
          medico?: string | null
          motivo?: string | null
          observacoes?: string | null
          realizado?: boolean
          realizado_em?: string | null
          residente_id: string
          resultado_data?: string | null
          resultado_retirado?: boolean
          resultado_retirado_em?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          especialidade?: string | null
          hora?: string | null
          id?: string
          local?: string | null
          medico?: string | null
          motivo?: string | null
          observacoes?: string | null
          realizado?: boolean
          realizado_em?: string | null
          residente_id?: string
          resultado_data?: string | null
          resultado_retirado?: boolean
          resultado_retirado_em?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      estoque: {
        Row: {
          apresentacao: string | null
          codigo: string | null
          consumo_diario: number
          created_at: string
          estoque_minimo: number
          gotas_por_ml: number | null
          id: string
          lancado_em: string | null
          local: string | null
          lote: string | null
          medicacao: string
          observacao: string | null
          origem: string | null
          pacientes_uso: Json
          proxima_compra: string | null
          proxima_retirada: string | null
          quantidade: number
          tipo_uso: string
          ultima_baixa: string | null
          ultima_retirada: string | null
          unidade: string
          updated_at: string
          user_id: string
          validade: string | null
        }
        Insert: {
          apresentacao?: string | null
          codigo?: string | null
          consumo_diario?: number
          created_at?: string
          estoque_minimo?: number
          gotas_por_ml?: number | null
          id?: string
          lancado_em?: string | null
          local?: string | null
          lote?: string | null
          medicacao: string
          observacao?: string | null
          origem?: string | null
          pacientes_uso?: Json
          proxima_compra?: string | null
          proxima_retirada?: string | null
          quantidade?: number
          tipo_uso?: string
          ultima_baixa?: string | null
          ultima_retirada?: string | null
          unidade?: string
          updated_at?: string
          user_id: string
          validade?: string | null
        }
        Update: {
          apresentacao?: string | null
          codigo?: string | null
          consumo_diario?: number
          created_at?: string
          estoque_minimo?: number
          gotas_por_ml?: number | null
          id?: string
          lancado_em?: string | null
          local?: string | null
          lote?: string | null
          medicacao?: string
          observacao?: string | null
          origem?: string | null
          pacientes_uso?: Json
          proxima_compra?: string | null
          proxima_retirada?: string | null
          quantidade?: number
          tipo_uso?: string
          ultima_baixa?: string | null
          ultima_retirada?: string | null
          unidade?: string
          updated_at?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: []
      }
      insumos: {
        Row: {
          apresentacao: string | null
          categoria: string | null
          codigo: string | null
          consumo_diario: number
          created_at: string
          estoque_minimo: number
          id: string
          local: string | null
          lote: string | null
          nome: string
          origem: string | null
          quantidade: number
          updated_at: string
          user_id: string
          validade: string | null
        }
        Insert: {
          apresentacao?: string | null
          categoria?: string | null
          codigo?: string | null
          consumo_diario?: number
          created_at?: string
          estoque_minimo?: number
          id?: string
          local?: string | null
          lote?: string | null
          nome: string
          origem?: string | null
          quantidade?: number
          updated_at?: string
          user_id: string
          validade?: string | null
        }
        Update: {
          apresentacao?: string | null
          categoria?: string | null
          codigo?: string | null
          consumo_diario?: number
          created_at?: string
          estoque_minimo?: number
          id?: string
          local?: string | null
          lote?: string | null
          nome?: string
          origem?: string | null
          quantidade?: number
          updated_at?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: []
      }
      procedimentos: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string | null
          desfecho: string
          destino: string | null
          hora: string | null
          id: string
          observacoes: string | null
          profissional: string | null
          residente_id: string | null
          updated_at: string
          user_id: string
          valores: Json
        }
        Insert: {
          categoria: string
          created_at?: string
          data?: string
          descricao?: string | null
          desfecho?: string
          destino?: string | null
          hora?: string | null
          id?: string
          observacoes?: string | null
          profissional?: string | null
          residente_id?: string | null
          updated_at?: string
          user_id: string
          valores?: Json
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string | null
          desfecho?: string
          destino?: string | null
          hora?: string | null
          id?: string
          observacoes?: string | null
          profissional?: string | null
          residente_id?: string | null
          updated_at?: string
          user_id?: string
          valores?: Json
        }
        Relationships: []
      }
      receitas: {
        Row: {
          arquivada_em: string | null
          arquivo: string | null
          codigo: string | null
          created_at: string
          dados: Json
          data_emissao: string | null
          dosagem: string | null
          id: string
          lista: string
          medicacao: string
          medico: string | null
          origem: string | null
          residente_id: string
          substituida_por: string | null
          tipo: string | null
          updated_at: string
          user_id: string
          validade_dias: number
          vencimento: string | null
        }
        Insert: {
          arquivada_em?: string | null
          arquivo?: string | null
          codigo?: string | null
          created_at?: string
          dados?: Json
          data_emissao?: string | null
          dosagem?: string | null
          id?: string
          lista?: string
          medicacao: string
          medico?: string | null
          origem?: string | null
          residente_id: string
          substituida_por?: string | null
          tipo?: string | null
          updated_at?: string
          user_id: string
          validade_dias?: number
          vencimento?: string | null
        }
        Update: {
          arquivada_em?: string | null
          arquivo?: string | null
          codigo?: string | null
          created_at?: string
          dados?: Json
          data_emissao?: string | null
          dosagem?: string | null
          id?: string
          lista?: string
          medicacao?: string
          medico?: string | null
          origem?: string | null
          residente_id?: string
          substituida_por?: string | null
          tipo?: string | null
          updated_at?: string
          user_id?: string
          validade_dias?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receitas_substituida_por_fkey"
            columns: ["substituida_por"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      residentes: {
        Row: {
          a_revisar: boolean
          alergias: string[]
          alertas: string[]
          codigo: string | null
          created_at: string
          data_nascimento: string | null
          dependencia: string | null
          diagnosticos: string[]
          dieta: string | null
          extras: Json
          haldol_injetavel: Json | null
          id: string
          medico: string | null
          mobilidade: string | null
          nome: string
          observacoes: string | null
          responsavel: string | null
          ubs: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          a_revisar?: boolean
          alergias?: string[]
          alertas?: string[]
          codigo?: string | null
          created_at?: string
          data_nascimento?: string | null
          dependencia?: string | null
          diagnosticos?: string[]
          dieta?: string | null
          extras?: Json
          haldol_injetavel?: Json | null
          id?: string
          medico?: string | null
          mobilidade?: string | null
          nome: string
          observacoes?: string | null
          responsavel?: string | null
          ubs?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          a_revisar?: boolean
          alergias?: string[]
          alertas?: string[]
          codigo?: string | null
          created_at?: string
          data_nascimento?: string | null
          dependencia?: string | null
          diagnosticos?: string[]
          dieta?: string | null
          extras?: Json
          haldol_injetavel?: Json | null
          id?: string
          medico?: string | null
          mobilidade?: string | null
          nome?: string
          observacoes?: string | null
          responsavel?: string | null
          ubs?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
