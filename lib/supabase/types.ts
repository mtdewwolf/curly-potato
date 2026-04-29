export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          role: "user" | "reviewer" | "admin";
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          role?: "user" | "reviewer" | "admin";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      tracked_services: {
        Row: {
          id: string;
          name: string;
          slug: string;
          website_url: string | null;
          description: string | null;
          category: string | null;
          status: "active" | "paused" | "draft" | "archived";
          overall_risk_score: number | null;
          overall_risk_level: string | null;
          last_checked_at: string | null;
          last_changed_at: string | null;
          subscriber_count: number;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["tracked_services"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracked_services"]["Insert"]>;
      };
      policy_documents: {
        Row: {
          id: string;
          service_id: string;
          document_type: string;
          title: string | null;
          url: string;
          status: "active" | "paused" | "draft" | "archived";
          scan_frequency: "daily" | "weekly" | "monthly" | "manual";
          last_checked_at: string | null;
          last_changed_at: string | null;
          latest_snapshot_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["policy_documents"]["Row"]> & {
          service_id: string;
          document_type: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["policy_documents"]["Insert"]>;
      };
      policy_snapshots: {
        Row: {
          id: string;
          policy_document_id: string;
          fetched_url: string | null;
          raw_html: string | null;
          cleaned_text: string;
          content_hash: string;
          effective_date: string | null;
          detected_title: string | null;
          fetched_at: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["policy_snapshots"]["Row"]> & {
          policy_document_id: string;
          cleaned_text: string;
          content_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["policy_snapshots"]["Insert"]>;
      };
      policy_changes: {
        Row: {
          id: string;
          policy_document_id: string;
          old_snapshot_id: string | null;
          new_snapshot_id: string | null;
          change_summary: string | null;
          risk_impact_score: number | null;
          risk_impact_level: string | null;
          status: "pending_review" | "approved" | "rejected" | "published" | "ignored";
          reviewed_by: string | null;
          reviewed_at: string | null;
          published_at: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["policy_changes"]["Row"]> & {
          policy_document_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["policy_changes"]["Insert"]>;
      };
      policy_change_findings: {
        Row: {
          id: string;
          policy_change_id: string;
          category: string;
          severity: string;
          confidence: number | null;
          title: string;
          what_changed: string | null;
          before_text: string | null;
          after_text: string | null;
          explanation: string | null;
          user_impact: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["policy_change_findings"]["Row"]> & {
          policy_change_id: string;
          category: string;
          severity: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["policy_change_findings"]["Insert"]>;
      };
      risk_reports: {
        Row: {
          id: string;
          policy_document_id: string;
          snapshot_id: string;
          overall_score: number;
          overall_level: string;
          summary: string | null;
          plain_english_summary: string | null;
          confidence: number | null;
          status: "draft" | "published" | "archived";
          created_at: string | null;
          published_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["risk_reports"]["Row"]> & {
          policy_document_id: string;
          snapshot_id: string;
          overall_score: number;
          overall_level: string;
        };
        Update: Partial<Database["public"]["Tables"]["risk_reports"]["Insert"]>;
      };
      risk_findings: {
        Row: {
          id: string;
          risk_report_id: string;
          category: string;
          severity: string;
          score: number;
          confidence: number | null;
          title: string;
          evidence: string[] | null;
          explanation: string | null;
          user_impact: string | null;
          mitigation: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["risk_findings"]["Row"]> & {
          risk_report_id: string;
          category: string;
          severity: string;
          score: number;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["risk_findings"]["Insert"]>;
      };
      user_service_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          service_id: string;
          notify_email: boolean;
          notify_in_app: boolean;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["user_service_subscriptions"]["Row"]> & {
          user_id: string;
          service_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_service_subscriptions"]["Insert"]>;
      };
      tracking_suggestions: {
        Row: {
          id: string;
          submitted_by: string | null;
          company_name: string;
          website_url: string | null;
          terms_url: string | null;
          privacy_url: string | null;
          category: string | null;
          reason: string | null;
          notes: string | null;
          status: "pending" | "approved" | "rejected" | "already_tracked" | "needs_more_info";
          admin_notes: string | null;
          duplicate_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_service_id: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["tracking_suggestions"]["Row"]> & {
          company_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_suggestions"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          service_id: string | null;
          policy_change_id: string | null;
          title: string;
          message: string;
          read_at: string | null;
          emailed_at: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          title: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      scan_logs: {
        Row: {
          id: string;
          policy_document_id: string | null;
          status: "started" | "success" | "failed" | "skipped";
          message: string | null;
          changed: boolean | null;
          error: string | null;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["scan_logs"]["Row"]> & {
          status: "started" | "success" | "failed" | "skipped";
        };
        Update: Partial<Database["public"]["Tables"]["scan_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      review_tracking_suggestion: {
        Args: {
          suggestion_id: string;
          next_status: string;
          notes: string | null;
          service_id: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Service = Database["public"]["Tables"]["tracked_services"]["Row"];
export type PolicyDocument = Database["public"]["Tables"]["policy_documents"]["Row"];
export type PolicyChange = Database["public"]["Tables"]["policy_changes"]["Row"];
