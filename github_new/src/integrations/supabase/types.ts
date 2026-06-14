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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          email: string
          id: string
          is_active: boolean
          last_seen_at: string
          session_token: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          email: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          session_token: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          email?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          session_token?: string
        }
        Relationships: []
      }
      cadastro_comercial: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          contato: string | null
          cpf_cnpj: string | null
          created_at: string
          data_envio: string | null
          data_expiracao: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          max_usuarios: number
          nome_contato: string | null
          plano: string
          plano_label: string | null
          razao_social: string
          senha: string
          status: string
          updated_at: string
          validade_dias: number
          whatsapp: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_envio?: string | null
          data_expiracao?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          max_usuarios?: number
          nome_contato?: string | null
          plano?: string
          plano_label?: string | null
          razao_social: string
          senha: string
          status?: string
          updated_at?: string
          validade_dias?: number
          whatsapp?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_envio?: string | null
          data_expiracao?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          max_usuarios?: number
          nome_contato?: string | null
          plano?: string
          plano_label?: string | null
          razao_social?: string
          senha?: string
          status?: string
          updated_at?: string
          validade_dias?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      corretores: {
        Row: {
          cadastro_comercial_id: string | null
          cpf: string
          created_at: string
          creci: string | null
          data_cadastro: string | null
          email: string | null
          id: string
          nome: string
          pin_hash: string
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cadastro_comercial_id?: string | null
          cpf: string
          created_at?: string
          creci?: string | null
          data_cadastro?: string | null
          email?: string | null
          id?: string
          nome: string
          pin_hash: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cadastro_comercial_id?: string | null
          cpf?: string
          created_at?: string
          creci?: string | null
          data_cadastro?: string | null
          email?: string | null
          id?: string
          nome?: string
          pin_hash?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corretores_cadastro_comercial_id_fkey"
            columns: ["cadastro_comercial_id"]
            isOneToOne: false
            referencedRelation: "cadastro_comercial"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activity_log: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          lead_id: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          lead_id?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          lead_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_construtoras: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          estagio_obras: string | null
          id: string
          link_empreendimento: string | null
          nome_empreendimento: string
          ordem: number
          responsavel: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          estagio_obras?: string | null
          id?: string
          link_empreendimento?: string | null
          nome_empreendimento: string
          ordem?: number
          responsavel?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          estagio_obras?: string | null
          id?: string
          link_empreendimento?: string | null
          nome_empreendimento?: string
          ordem?: number
          responsavel?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          construtora_id: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string
          data_ultimo_contato: string | null
          email: string | null
          estagio: string
          id: string
          mensagem: string | null
          nome: string
          notas: string | null
          origem: string | null
          responsavel: string | null
          updated_at: string
          valor_negociacao: number | null
          whatsapp: string | null
        }
        Insert: {
          construtora_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by: string
          data_ultimo_contato?: string | null
          email?: string | null
          estagio?: string
          id?: string
          mensagem?: string | null
          nome: string
          notas?: string | null
          origem?: string | null
          responsavel?: string | null
          updated_at?: string
          valor_negociacao?: number | null
          whatsapp?: string | null
        }
        Update: {
          construtora_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string
          data_ultimo_contato?: string | null
          email?: string | null
          estagio?: string
          id?: string
          mensagem?: string | null
          nome?: string
          notas?: string | null
          origem?: string | null
          responsavel?: string | null
          updated_at?: string
          valor_negociacao?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_construtora_id_fkey"
            columns: ["construtora_id"]
            isOneToOne: false
            referencedRelation: "crm_construtoras"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          created_at: string
          data_vencimento: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          responsavel: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          responsavel?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_licenses: {
        Row: {
          cidade: string | null
          created_at: string
          data_envio: string
          data_expiracao: string
          email: string | null
          id: string
          nome: string
          senha: string
          status: string
          validade_dias: number
          whatsapp: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          data_envio?: string
          data_expiracao: string
          email?: string | null
          id?: string
          nome: string
          senha: string
          status?: string
          validade_dias?: number
          whatsapp?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          data_envio?: string
          data_expiracao?: string
          email?: string | null
          id?: string
          nome?: string
          senha?: string
          status?: string
          validade_dias?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      empreendimento_tabelas: {
        Row: {
          arquivo_path: string | null
          arquivo_tipo: string
          cidade: string | null
          construtora_cnpj: string
          created_at: string
          empreendimento_nome: string
          id: string
          total_unidades: number
          uf: string | null
          updated_at: string
          uploaded_by_email: string | null
        }
        Insert: {
          arquivo_path?: string | null
          arquivo_tipo: string
          cidade?: string | null
          construtora_cnpj: string
          created_at?: string
          empreendimento_nome: string
          id?: string
          total_unidades?: number
          uf?: string | null
          updated_at?: string
          uploaded_by_email?: string | null
        }
        Update: {
          arquivo_path?: string | null
          arquivo_tipo?: string
          cidade?: string | null
          construtora_cnpj?: string
          created_at?: string
          empreendimento_nome?: string
          id?: string
          total_unidades?: number
          uf?: string | null
          updated_at?: string
          uploaded_by_email?: string | null
        }
        Relationships: []
      }
      empreendimento_unidades: {
        Row: {
          andar: string | null
          apto_torre: string | null
          created_at: string
          id: string
          metragem: string | null
          tabela_id: string
          tipologia: string | null
          unidade: string
          valor_lancamento: number | null
        }
        Insert: {
          andar?: string | null
          apto_torre?: string | null
          created_at?: string
          id?: string
          metragem?: string | null
          tabela_id: string
          tipologia?: string | null
          unidade: string
          valor_lancamento?: number | null
        }
        Update: {
          andar?: string | null
          apto_torre?: string | null
          created_at?: string
          id?: string
          metragem?: string | null
          tabela_id?: string
          tipologia?: string | null
          unidade?: string
          valor_lancamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "empreendimento_unidades_tabela_id_fkey"
            columns: ["tabela_id"]
            isOneToOne: false
            referencedRelation: "empreendimento_tabelas"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_otps: {
        Row: {
          attempts: number
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_hash: string
          used: boolean
          verified_token: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          used?: boolean
          verified_token?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          used?: boolean
          verified_token?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ig_user_id: string | null
          meta_access_token: string | null
          meta_ad_account_id: string | null
          meta_connected_at: string | null
          name: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          ig_user_id?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          meta_connected_at?: string | null
          name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ig_user_id?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          meta_connected_at?: string | null
          name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      sugestoes: {
        Row: {
          anexo_path: string | null
          created_at: string
          email: string
          id: string
          mensagem: string
          nome: string
          whatsapp: string | null
        }
        Insert: {
          anexo_path?: string | null
          created_at?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          whatsapp?: string | null
        }
        Update: {
          anexo_path?: string | null
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      used_liberation_passwords: {
        Row: {
          created_at: string
          id: string
          is_used: boolean
          password_hash: string
          used_at: string | null
          used_by_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean
          password_hash: string
          used_at?: string | null
          used_by_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean
          password_hash?: string
          used_at?: string | null
          used_by_email?: string | null
        }
        Relationships: []
      }
      user_pin_access: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          challenge_type: string
          created_at: string
          email: string
          expires_at: string
          id: string
          rp_id: string
        }
        Insert: {
          challenge: string
          challenge_type: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          rp_id: string
        }
        Update: {
          challenge?: string
          challenge_type?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          rp_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          email: string
          id: string
          last_used_at: string | null
          public_key: string
          rp_id: string
          transports: string | null
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          email: string
          id?: string
          last_used_at?: string | null
          public_key: string
          rp_id: string
          transports?: string | null
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          email?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          rp_id?: string
          transports?: string | null
        }
        Relationships: []
      }
      whatsapp_connection_attempts: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
          result_state: string | null
          success: boolean
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
          result_state?: string | null
          success?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
          result_state?: string | null
          success?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "corretor" | "visitante"
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
      app_role: ["admin", "gestor", "corretor", "visitante"],
    },
  },
} as const
