/**
 * Supabase database types.
 *
 * This file mirrors the schema in `database/migrations/` and matches the shape
 * produced by `supabase gen types typescript`. Once a Supabase project is
 * linked, regenerate it instead of editing by hand:
 *
 *   npm run db:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          timezone: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          parent_topic_id: string | null;
          order_index: number;
          source: Database["public"]["Enums"]["taxonomy_source"];
          status: Database["public"]["Enums"]["taxonomy_status"];
          ai_confidence: number | null;
          ai_rationale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_topic_id?: string | null;
          order_index?: number;
          source?: Database["public"]["Enums"]["taxonomy_source"];
          status?: Database["public"]["Enums"]["taxonomy_status"];
          ai_confidence?: number | null;
          ai_rationale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_topic_id?: string | null;
          order_index?: number;
          source?: Database["public"]["Enums"]["taxonomy_source"];
          status?: Database["public"]["Enums"]["taxonomy_status"];
          ai_confidence?: number | null;
          ai_rationale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_parent_topic_id_fkey";
            columns: ["parent_topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      patterns: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          slug: string;
          recognition_clues: string[];
          generic_algorithm: string | null;
          common_mistakes: string[];
          variants: string[];
          description: string | null;
          source: Database["public"]["Enums"]["taxonomy_source"];
          status: Database["public"]["Enums"]["taxonomy_status"];
          ai_confidence: number | null;
          ai_rationale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          slug: string;
          recognition_clues?: string[];
          generic_algorithm?: string | null;
          common_mistakes?: string[];
          variants?: string[];
          description?: string | null;
          source?: Database["public"]["Enums"]["taxonomy_source"];
          status?: Database["public"]["Enums"]["taxonomy_status"];
          ai_confidence?: number | null;
          ai_rationale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          slug?: string;
          recognition_clues?: string[];
          generic_algorithm?: string | null;
          common_mistakes?: string[];
          variants?: string[];
          description?: string | null;
          source?: Database["public"]["Enums"]["taxonomy_source"];
          status?: Database["public"]["Enums"]["taxonomy_status"];
          ai_confidence?: number | null;
          ai_rationale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      problems: {
        Row: {
          id: string;
          user_id: string | null;
          platform: Database["public"]["Enums"]["problem_platform"];
          external_problem_id: string | null;
          title: string;
          url: string | null;
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null;
          topic_id: string | null;
          pattern_id: string | null;
          estimated_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          platform?: Database["public"]["Enums"]["problem_platform"];
          external_problem_id?: string | null;
          title: string;
          url?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null;
          topic_id?: string | null;
          pattern_id?: string | null;
          estimated_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          platform?: Database["public"]["Enums"]["problem_platform"];
          external_problem_id?: string | null;
          title?: string;
          url?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null;
          topic_id?: string | null;
          pattern_id?: string | null;
          estimated_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problems_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problems_pattern_id_fkey";
            columns: ["pattern_id"];
            referencedRelation: "patterns";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_attempts: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          language: string | null;
          time_taken_seconds: number | null;
          solve_status: Database["public"]["Enums"]["solve_status"] | null;
          confidence: number | null;
          understood_statement: boolean;
          identified_pattern: boolean;
          derived_algorithm: boolean;
          wrote_pseudocode: boolean;
          coded_independently: boolean;
          runtime_error: boolean;
          syntax_error: boolean;
          logic_error: boolean;
          attempted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          language?: string | null;
          time_taken_seconds?: number | null;
          solve_status?: Database["public"]["Enums"]["solve_status"] | null;
          confidence?: number | null;
          understood_statement?: boolean;
          identified_pattern?: boolean;
          derived_algorithm?: boolean;
          wrote_pseudocode?: boolean;
          coded_independently?: boolean;
          runtime_error?: boolean;
          syntax_error?: boolean;
          logic_error?: boolean;
          attempted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          language?: string | null;
          time_taken_seconds?: number | null;
          solve_status?: Database["public"]["Enums"]["solve_status"] | null;
          confidence?: number | null;
          understood_statement?: boolean;
          identified_pattern?: boolean;
          derived_algorithm?: boolean;
          wrote_pseudocode?: boolean;
          coded_independently?: boolean;
          runtime_error?: boolean;
          syntax_error?: boolean;
          logic_error?: boolean;
          attempted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_attempts_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_reflections: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          attempt_id: string | null;
          my_explanation: string | null;
          algorithm_in_words: string | null;
          bug_that_stopped_me: string | null;
          final_takeaway: string | null;
          ai_feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          attempt_id?: string | null;
          my_explanation?: string | null;
          algorithm_in_words?: string | null;
          bug_that_stopped_me?: string | null;
          final_takeaway?: string | null;
          ai_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          attempt_id?: string | null;
          my_explanation?: string | null;
          algorithm_in_words?: string | null;
          bug_that_stopped_me?: string | null;
          final_takeaway?: string | null;
          ai_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_reflections_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_reflections_attempt_id_fkey";
            columns: ["attempt_id"];
            referencedRelation: "problem_attempts";
            referencedColumns: ["id"];
          },
        ];
      };
      problem_code_versions: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          attempt_id: string | null;
          language: string;
          code: string;
          is_final: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          attempt_id?: string | null;
          language: string;
          code: string;
          is_final?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          attempt_id?: string | null;
          language?: string;
          code?: string;
          is_final?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_code_versions_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_code_versions_attempt_id_fkey";
            columns: ["attempt_id"];
            referencedRelation: "problem_attempts";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_queue: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          current_state: Database["public"]["Enums"]["revision_state"];
          last_revision: string | null;
          next_revision: string | null;
          success_count: number;
          failure_count: number;
          editorial_dependency: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          current_state?: Database["public"]["Enums"]["revision_state"];
          last_revision?: string | null;
          next_revision?: string | null;
          success_count?: number;
          failure_count?: number;
          editorial_dependency?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          current_state?: Database["public"]["Enums"]["revision_state"];
          last_revision?: string | null;
          next_revision?: string | null;
          success_count?: number;
          failure_count?: number;
          editorial_dependency?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revision_queue_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_items: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string | null;
          url: string | null;
          storage_path: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title: string;
          content?: string | null;
          url?: string | null;
          storage_path?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          content?: string | null;
          url?: string | null;
          storage_path?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      knowledge_links: {
        Row: {
          id: string;
          user_id: string;
          knowledge_id: string;
          entity_type: string;
          entity_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          knowledge_id: string;
          entity_type: string;
          entity_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          knowledge_id?: string;
          entity_type?: string;
          entity_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_links_knowledge_id_fkey";
            columns: ["knowledge_id"];
            referencedRelation: "knowledge_items";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string | null;
          status: Database["public"]["Enums"]["concept_status"];
          confidence: number | null;
          personal_explanation: string | null;
          recognition_clues: string[];
          when_to_use: string | null;
          common_mistakes: string[];
          topic_id: string | null;
          pattern_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string | null;
          status?: Database["public"]["Enums"]["concept_status"];
          confidence?: number | null;
          personal_explanation?: string | null;
          recognition_clues?: string[];
          when_to_use?: string | null;
          common_mistakes?: string[];
          topic_id?: string | null;
          pattern_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string | null;
          status?: Database["public"]["Enums"]["concept_status"];
          confidence?: number | null;
          personal_explanation?: string | null;
          recognition_clues?: string[];
          when_to_use?: string | null;
          common_mistakes?: string[];
          topic_id?: string | null;
          pattern_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concept_notes_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concept_notes_pattern_id_fkey";
            columns: ["pattern_id"];
            referencedRelation: "patterns";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_resources: {
        Row: {
          id: string;
          user_id: string;
          concept_id: string;
          type: Database["public"]["Enums"]["resource_type"];
          title: string | null;
          url: string | null;
          storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          concept_id: string;
          type: Database["public"]["Enums"]["resource_type"];
          title?: string | null;
          url?: string | null;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          concept_id?: string;
          type?: Database["public"]["Enums"]["resource_type"];
          title?: string | null;
          url?: string | null;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concept_resources_concept_id_fkey";
            columns: ["concept_id"];
            referencedRelation: "concept_notes";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_problems: {
        Row: {
          id: string;
          user_id: string;
          concept_id: string;
          problem_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          concept_id: string;
          problem_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          concept_id?: string;
          problem_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concept_problems_concept_id_fkey";
            columns: ["concept_id"];
            referencedRelation: "concept_notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concept_problems_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string | null;
          kind: Database["public"]["Enums"]["roadmap_kind"];
          title: string;
          slug: string | null;
          description: string | null;
          source_url: string | null;
          tier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          kind?: Database["public"]["Enums"]["roadmap_kind"];
          title: string;
          slug?: string | null;
          description?: string | null;
          source_url?: string | null;
          tier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          kind?: Database["public"]["Enums"]["roadmap_kind"];
          title?: string;
          slug?: string | null;
          description?: string | null;
          source_url?: string | null;
          tier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roadmap_items: {
        Row: {
          id: string;
          roadmap_id: string;
          parent_item_id: string | null;
          depends_on_item_id: string | null;
          title: string;
          problem_id: string | null;
          topic_id: string | null;
          is_section: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          parent_item_id?: string | null;
          depends_on_item_id?: string | null;
          title: string;
          problem_id?: string | null;
          topic_id?: string | null;
          is_section?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          roadmap_id?: string;
          parent_item_id?: string | null;
          depends_on_item_id?: string | null;
          title?: string;
          problem_id?: string | null;
          topic_id?: string | null;
          is_section?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roadmap_items_roadmap_id_fkey";
            columns: ["roadmap_id"];
            referencedRelation: "roadmaps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roadmap_items_parent_item_id_fkey";
            columns: ["parent_item_id"];
            referencedRelation: "roadmap_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roadmap_items_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      roadmap_progress: {
        Row: {
          id: string;
          user_id: string;
          roadmap_id: string;
          item_id: string;
          status: Database["public"]["Enums"]["roadmap_item_status"];
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          roadmap_id: string;
          item_id: string;
          status?: Database["public"]["Enums"]["roadmap_item_status"];
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          roadmap_id?: string;
          item_id?: string;
          status?: Database["public"]["Enums"]["roadmap_item_status"];
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roadmap_progress_roadmap_id_fkey";
            columns: ["roadmap_id"];
            referencedRelation: "roadmaps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roadmap_progress_item_id_fkey";
            columns: ["item_id"];
            referencedRelation: "roadmap_items";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["activity_type"];
          title: string | null;
          description: string | null;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          occurred_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["activity_type"];
          title?: string | null;
          description?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["activity_type"];
          title?: string | null;
          description?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          focus: string | null;
          topic_id: string | null;
          problems_solved: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          focus?: string | null;
          topic_id?: string | null;
          problems_solved?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          focus?: string | null;
          topic_id?: string | null;
          problems_solved?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          problems_solved: number;
          minutes_studied: number;
          revisions_done: number;
          mood: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          log_date: string;
          problems_solved?: number;
          minutes_studied?: number;
          revisions_done?: number;
          mood?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          log_date?: string;
          problems_solved?: number;
          minutes_studied?: number;
          revisions_done?: number;
          mood?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      academic_semesters: {
        Row: {
          id: string;
          user_id: string;
          semester_number: number;
          name: string;
          academic_year: string | null;
          total_credits: number | null;
          earned_credits: number | null;
          sgpa: number | null;
          cgpa_after: number | null;
          backlogs: number | null;
          status: Database["public"]["Enums"]["semester_status"];
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          semester_number: number;
          name: string;
          academic_year?: string | null;
          total_credits?: number | null;
          earned_credits?: number | null;
          sgpa?: number | null;
          cgpa_after?: number | null;
          backlogs?: number | null;
          status?: Database["public"]["Enums"]["semester_status"];
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          semester_number?: number;
          name?: string;
          academic_year?: string | null;
          total_credits?: number | null;
          earned_credits?: number | null;
          sgpa?: number | null;
          cgpa_after?: number | null;
          backlogs?: number | null;
          status?: Database["public"]["Enums"]["semester_status"];
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      academic_goals: {
        Row: {
          id: string;
          user_id: string;
          target_cgpa: number | null;
          dream_company: string | null;
          total_semesters: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_cgpa?: number | null;
          dream_company?: string | null;
          total_semesters?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_cgpa?: number | null;
          dream_company?: string | null;
          total_semesters?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      iit_courses: {
        Row: {
          id: string;
          user_id: string;
          code: string | null;
          name: string;
          credits: number | null;
          semester: string | null;
          semester_id: string | null;
          status: Database["public"]["Enums"]["course_status"];
          instructor: string | null;
          grade: string | null;
          grade_point: number | null;
          marks: number | null;
          max_marks: number | null;
          attempts: number | null;
          attendance_percentage: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code?: string | null;
          name: string;
          credits?: number | null;
          semester?: string | null;
          semester_id?: string | null;
          status?: Database["public"]["Enums"]["course_status"];
          instructor?: string | null;
          grade?: string | null;
          grade_point?: number | null;
          marks?: number | null;
          max_marks?: number | null;
          attempts?: number | null;
          attendance_percentage?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string | null;
          name?: string;
          credits?: number | null;
          semester?: string | null;
          semester_id?: string | null;
          status?: Database["public"]["Enums"]["course_status"];
          instructor?: string | null;
          grade?: string | null;
          grade_point?: number | null;
          marks?: number | null;
          max_marks?: number | null;
          attempts?: number | null;
          attendance_percentage?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "iit_courses_semester_id_fkey";
            columns: ["semester_id"];
            referencedRelation: "academic_semesters";
            referencedColumns: ["id"];
          },
        ];
      };
      iit_assignments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          status: Database["public"]["Enums"]["assignment_status"];
          score: number | null;
          max_score: number | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: Database["public"]["Enums"]["assignment_status"];
          score?: number | null;
          max_score?: number | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: Database["public"]["Enums"]["assignment_status"];
          score?: number | null;
          max_score?: number | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "iit_assignments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "iit_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      iit_lectures: {
        Row: {
          id: string;
          user_id: string;
          course_id: string | null;
          title: string;
          lecture_number: number | null;
          status: Database["public"]["Enums"]["lecture_status"];
          duration_minutes: number | null;
          video_url: string | null;
          notes: string | null;
          watched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: string | null;
          title: string;
          lecture_number?: number | null;
          status?: Database["public"]["Enums"]["lecture_status"];
          duration_minutes?: number | null;
          video_url?: string | null;
          notes?: string | null;
          watched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string | null;
          title?: string;
          lecture_number?: number | null;
          status?: Database["public"]["Enums"]["lecture_status"];
          duration_minutes?: number | null;
          video_url?: string | null;
          notes?: string | null;
          watched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "iit_lectures_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "iit_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      academic_documents: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["document_type"];
          title: string;
          description: string | null;
          storage_bucket: string | null;
          storage_path: string | null;
          file_url: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          course_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: Database["public"]["Enums"]["document_type"];
          title: string;
          description?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          file_url?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          course_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["document_type"];
          title?: string;
          description?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          file_url?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          course_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "academic_documents_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "iit_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_daily_briefs: {
        Row: {
          id: string;
          user_id: string;
          brief_date: string;
          summary: string | null;
          battle_plan: Json;
          focus_areas: string[];
          recommended_problem_ids: string[];
          model: string | null;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brief_date: string;
          summary?: string | null;
          battle_plan?: Json;
          focus_areas?: string[];
          recommended_problem_ids?: string[];
          model?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brief_date?: string;
          summary?: string | null;
          battle_plan?: Json;
          focus_areas?: string[];
          recommended_problem_ids?: string[];
          model?: string | null;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["ai_insight_type"];
          title: string;
          detail: string | null;
          severity: number | null;
          entity_type: string | null;
          entity_id: string | null;
          is_dismissed: boolean;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["ai_insight_type"];
          title: string;
          detail?: string | null;
          severity?: number | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_dismissed?: boolean;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["ai_insight_type"];
          title?: string;
          detail?: string | null;
          severity?: number | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_dismissed?: boolean;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      taxonomy_usage: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          usage_count: number;
          last_used_at: string | null;
          relevance_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          usage_count?: number;
          last_used_at?: string | null;
          relevance_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          usage_count?: number;
          last_used_at?: string | null;
          relevance_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recall_grades: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          revision_id: string | null;
          recalled_pattern: boolean;
          recalled_algorithm: boolean;
          recalled_complexity: boolean;
          recalled_mistakes: boolean;
          confidence: number | null;
          success: boolean;
          grade_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          revision_id?: string | null;
          recalled_pattern?: boolean;
          recalled_algorithm?: boolean;
          recalled_complexity?: boolean;
          recalled_mistakes?: boolean;
          confidence?: number | null;
          success: boolean;
          grade_score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          revision_id?: string | null;
          recalled_pattern?: boolean;
          recalled_algorithm?: boolean;
          recalled_complexity?: boolean;
          recalled_mistakes?: boolean;
          confidence?: number | null;
          success?: boolean;
          grade_score?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recall_grades_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recall_grades_revision_id_fkey";
            columns: ["revision_id"];
            referencedRelation: "revision_queue";
            referencedColumns: ["id"];
          },
        ];
      };
      recall_strength: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          score: number;
          risk: Database["public"]["Enums"]["forgetting_risk"];
          trend: Database["public"]["Enums"]["memory_trend"];
          computed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          score: number;
          risk?: Database["public"]["Enums"]["forgetting_risk"];
          trend?: Database["public"]["Enums"]["memory_trend"];
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          score?: number;
          risk?: Database["public"]["Enums"]["forgetting_risk"];
          trend?: Database["public"]["Enums"]["memory_trend"];
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recall_strength_problem_id_fkey";
            columns: ["problem_id"];
            referencedRelation: "problems";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_memory_health: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          health_score: number;
          status: Database["public"]["Enums"]["memory_health_status"];
          trend: Database["public"]["Enums"]["memory_trend"];
          problems_tracked: number;
          problems_at_risk: number;
          computed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          health_score: number;
          status?: Database["public"]["Enums"]["memory_health_status"];
          trend?: Database["public"]["Enums"]["memory_trend"];
          problems_tracked?: number;
          problems_at_risk?: number;
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          health_score?: number;
          status?: Database["public"]["Enums"]["memory_health_status"];
          trend?: Database["public"]["Enums"]["memory_trend"];
          problems_tracked?: number;
          problems_at_risk?: number;
          computed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_context: {
        Row: {
          id: string;
          user_id: string;
          active_entity_type: string | null;
          active_entity_id: string | null;
          active_session_type: string | null;
          last_activity_at: string;
          current_focus_topic: string | null;
          pending_action: string | null;
          resume_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          active_entity_type?: string | null;
          active_entity_id?: string | null;
          active_session_type?: string | null;
          last_activity_at?: string;
          current_focus_topic?: string | null;
          pending_action?: string | null;
          resume_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          active_entity_type?: string | null;
          active_entity_id?: string | null;
          active_session_type?: string | null;
          last_activity_at?: string;
          current_focus_topic?: string | null;
          pending_action?: string | null;
          resume_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: Database["public"]["Enums"]["reminder_category"];
          recurrence: Database["public"]["Enums"]["reminder_recurrence"];
          interval_days: number | null;
          interval_weeks: number | null;
          interval_months: number | null;
          time_of_day: string | null;
          scheduled_at: string | null;
          next_occurrence_at: string | null;
          status: Database["public"]["Enums"]["reminder_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: Database["public"]["Enums"]["reminder_category"];
          recurrence?: Database["public"]["Enums"]["reminder_recurrence"];
          interval_days?: number | null;
          interval_weeks?: number | null;
          interval_months?: number | null;
          time_of_day?: string | null;
          scheduled_at?: string | null;
          next_occurrence_at?: string | null;
          status?: Database["public"]["Enums"]["reminder_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["reminder_category"];
          recurrence?: Database["public"]["Enums"]["reminder_recurrence"];
          interval_days?: number | null;
          interval_weeks?: number | null;
          interval_months?: number | null;
          time_of_day?: string | null;
          scheduled_at?: string | null;
          next_occurrence_at?: string | null;
          status?: Database["public"]["Enums"]["reminder_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          state: Database["public"]["Enums"]["notification_state"];
          source_type: Database["public"]["Enums"]["notification_source_type"];
          source_id: string | null;
          title: string;
          body: string | null;
          category: Database["public"]["Enums"]["reminder_category"] | null;
          due_at: string | null;
          snoozed_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          state?: Database["public"]["Enums"]["notification_state"];
          source_type: Database["public"]["Enums"]["notification_source_type"];
          source_id?: string | null;
          title: string;
          body?: string | null;
          category?: Database["public"]["Enums"]["reminder_category"] | null;
          due_at?: string | null;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          state?: Database["public"]["Enums"]["notification_state"];
          source_type?: Database["public"]["Enums"]["notification_source_type"];
          source_id?: string | null;
          title?: string;
          body?: string | null;
          category?: Database["public"]["Enums"]["reminder_category"] | null;
          due_at?: string | null;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_focus_mode: Database["public"]["Enums"]["focus_mode"];
          notifications_enabled: boolean;
          daily_brief_enabled: boolean;
          evening_review_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          hidden_categories: Database["public"]["Enums"]["reminder_category"][];
          default_hourly_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_focus_mode?: Database["public"]["Enums"]["focus_mode"];
          notifications_enabled?: boolean;
          daily_brief_enabled?: boolean;
          evening_review_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          hidden_categories?: Database["public"]["Enums"]["reminder_category"][];
          default_hourly_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_focus_mode?: Database["public"]["Enums"]["focus_mode"];
          notifications_enabled?: boolean;
          daily_brief_enabled?: boolean;
          evening_review_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          hidden_categories?: Database["public"]["Enums"]["reminder_category"][];
          default_hourly_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          type: Database["public"]["Enums"]["project_type"];
          status: Database["public"]["Enums"]["project_status"];
          priority: Database["public"]["Enums"]["project_priority"];
          tags: string[];
          client_id: string | null;
          client_name: string | null;
          client_email: string | null;
          repository_url: string | null;
          deployment_url: string | null;
          production_url: string | null;
          estimated_hours: number | null;
          actual_hours: number;
          budget: number | null;
          revenue: number | null;
          start_date: string | null;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          type?: Database["public"]["Enums"]["project_type"];
          status?: Database["public"]["Enums"]["project_status"];
          priority?: Database["public"]["Enums"]["project_priority"];
          tags?: string[];
          client_id?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          repository_url?: string | null;
          deployment_url?: string | null;
          production_url?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number;
          budget?: number | null;
          revenue?: number | null;
          start_date?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          type?: Database["public"]["Enums"]["project_type"];
          status?: Database["public"]["Enums"]["project_status"];
          priority?: Database["public"]["Enums"]["project_priority"];
          tags?: string[];
          client_id?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          repository_url?: string | null;
          deployment_url?: string | null;
          production_url?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number;
          budget?: number | null;
          revenue?: number | null;
          start_date?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      project_tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["task_status"];
          priority: Database["public"]["Enums"]["project_priority"];
          estimated_minutes: number | null;
          actual_minutes: number;
          due_date: string | null;
          completed_at: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          priority?: Database["public"]["Enums"]["project_priority"];
          estimated_minutes?: number | null;
          actual_minutes?: number;
          due_date?: string | null;
          completed_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          priority?: Database["public"]["Enums"]["project_priority"];
          estimated_minutes?: number | null;
          actual_minutes?: number;
          due_date?: string | null;
          completed_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_milestones: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          target_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_time_entries: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          task_id: string | null;
          category: Database["public"]["Enums"]["time_entry_category"];
          description: string | null;
          minutes: number;
          logged_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          task_id?: string | null;
          category?: Database["public"]["Enums"]["time_entry_category"];
          description?: string | null;
          minutes: number;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          task_id?: string | null;
          category?: Database["public"]["Enums"]["time_entry_category"];
          description?: string | null;
          minutes?: number;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_time_entries_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_documents: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          title: string;
          doc_type: string;
          content: string | null;
          file_url: string | null;
          storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          title: string;
          doc_type?: string;
          content?: string | null;
          file_url?: string | null;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          title?: string;
          doc_type?: string;
          content?: string | null;
          file_url?: string | null;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_change_requests: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          title: string;
          description: string | null;
          original_scope: string | null;
          requested_change: string | null;
          estimated_hours: number | null;
          suggested_price: number | null;
          status: Database["public"]["Enums"]["change_request_status"];
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          original_scope?: string | null;
          requested_change?: string | null;
          estimated_hours?: number | null;
          suggested_price?: number | null;
          status?: Database["public"]["Enums"]["change_request_status"];
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          original_scope?: string | null;
          requested_change?: string | null;
          estimated_hours?: number | null;
          suggested_price?: number | null;
          status?: Database["public"]["Enums"]["change_request_status"];
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_change_requests_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_quotes: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          client_id: string | null;
          title: string;
          summary: string | null;
          features: Json;
          milestones: Json;
          total_estimated_hours: number | null;
          price_min: number | null;
          price_max: number | null;
          status: Database["public"]["Enums"]["quote_status"];
          sent_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          client_id?: string | null;
          title: string;
          summary?: string | null;
          features?: Json;
          milestones?: Json;
          total_estimated_hours?: number | null;
          price_min?: number | null;
          price_max?: number | null;
          status?: Database["public"]["Enums"]["quote_status"];
          sent_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          client_id?: string | null;
          title?: string;
          summary?: string | null;
          features?: Json;
          milestones?: Json;
          total_estimated_hours?: number | null;
          price_min?: number | null;
          price_max?: number | null;
          status?: Database["public"]["Enums"]["quote_status"];
          sent_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_quotes_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          company: string | null;
          industry: string | null;
          website: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          timezone: string | null;
          address: string | null;
          tax_info: string | null;
          status: Database["public"]["Enums"]["client_status"];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          company?: string | null;
          industry?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          timezone?: string | null;
          address?: string | null;
          tax_info?: string | null;
          status?: Database["public"]["Enums"]["client_status"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          company?: string | null;
          industry?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          timezone?: string | null;
          address?: string | null;
          tax_info?: string | null;
          status?: Database["public"]["Enums"]["client_status"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pipeline_entries: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          title: string;
          value_estimate: number | null;
          stage: Database["public"]["Enums"]["pipeline_stage"];
          probability: number;
          expected_close_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          title: string;
          value_estimate?: number | null;
          stage?: Database["public"]["Enums"]["pipeline_stage"];
          probability?: number;
          expected_close_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          title?: string;
          value_estimate?: number | null;
          stage?: Database["public"]["Enums"]["pipeline_stage"];
          probability?: number;
          expected_close_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_entries_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          project_id: string | null;
          invoice_number: string;
          line_items: Json;
          total_amount: number;
          currency: string;
          status: Database["public"]["Enums"]["invoice_status"];
          due_date: string | null;
          sent_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          project_id?: string | null;
          invoice_number: string;
          line_items?: Json;
          total_amount?: number;
          currency?: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          due_date?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          project_id?: string | null;
          invoice_number?: string;
          line_items?: Json;
          total_amount?: number;
          currency?: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          due_date?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      income_entries: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          project_id: string | null;
          invoice_id: string | null;
          amount: number;
          currency: string;
          category: string;
          description: string | null;
          received_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          project_id?: string | null;
          invoice_id?: string | null;
          amount: number;
          currency?: string;
          category?: string;
          description?: string | null;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          project_id?: string | null;
          invoice_id?: string | null;
          amount?: number;
          currency?: string;
          category?: string;
          description?: string | null;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "income_entries_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };

      time_blocks: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      focus_sessions: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      user_goals: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      capture_items: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      scratchpad_items: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      daily_plans: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      memory_edges: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      memory_nodes: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      resources: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      resource_links: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      expense_entries: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          amount: number;
          currency: string;
          description: string | null;
          occurred_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category?: string;
          amount: number;
          currency?: string;
          description?: string | null;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          amount?: number;
          currency?: string;
          description?: string | null;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      
    };
    Functions: {
      match_semantic_items: {
        Args: any;
        Returns: any;
      };
      
    };
    Enums: {
      taxonomy_source: "seed" | "user" | "ai_proposed" | "ai_auto";
      taxonomy_status: "active" | "proposed" | "dismissed";
      difficulty_level: "easy" | "medium" | "hard";
      problem_platform:
        | "leetcode"
        | "codeforces"
        | "hackerrank"
        | "codechef"
        | "geeksforgeeks"
        | "atcoder"
        | "interviewbit"
        | "other";
      solve_status:
        | "solved"
        | "solved_with_help"
        | "partial"
        | "unsolved"
        | "gave_up";
      revision_state:
        | "new"
        | "learning"
        | "reviewing"
        | "mastered"
        | "struggling";
      concept_status:
        | "learning"
        | "understood"
        | "weak"
        | "forgotten"
        | "mastered";
      resource_type:
        | "screenshot"
        | "image"
        | "pdf"
        | "youtube"
        | "article"
        | "link";
      roadmap_kind:
        | "striver_a2z"
        | "blind_75"
        | "neetcode_150"
        | "iit"
        | "custom"
        | "placement";
      roadmap_item_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "skipped";
      activity_type:
        | "problem_solved"
        | "problem_attempted"
        | "concept_added"
        | "concept_revised"
        | "pattern_revised"
        | "revision_completed"
        | "lecture_watched"
        | "assignment_completed"
        | "document_uploaded"
        | "study_session"
        | "note_added";
      course_status: "planned" | "in_progress" | "completed" | "dropped";
      semester_status: "upcoming" | "in_progress" | "completed";
      assignment_status:
        | "pending"
        | "in_progress"
        | "submitted"
        | "graded"
        | "late"
        | "missed";
      lecture_status: "not_started" | "in_progress" | "completed";
      document_type:
        | "id_card"
        | "hall_ticket"
        | "certificate"
        | "event_registration"
        | "lecture_notes"
        | "transcript"
        | "other";
      ai_insight_type:
        | "weakness"
        | "forgotten_topic"
        | "strength"
        | "recommendation"
        | "milestone"
        | "warning";
      reminder_category:
        | "learning_dsa"
        | "learning_revision"
        | "learning_concepts"
        | "learning_roadmaps"
        | "academic_iit"
        | "academic_assignments"
        | "academic_exams"
        | "project_development"
        | "project_client_work"
        | "personal_priorities"
        | "personal_relationships"
        | "personal_family"
        | "health_sleep"
        | "health_exercise";
      reminder_recurrence: "one_time" | "daily" | "weekly" | "monthly" | "custom";
      reminder_status: "active" | "paused" | "completed" | "archived";
      notification_state:
        | "unread"
        | "read"
        | "snoozed"
        | "completed"
        | "expired";
      notification_source_type:
        | "reminder"
        | "revision"
        | "iit_assignment"
        | "system";
      focus_mode:
        | "work"
        | "academic"
        | "personal"
        | "family"
        | "recovery"
        | "deep_focus"
        | "none";
      memory_health_status:
        | "strong"
        | "stable"
        | "at_risk"
        | "decaying"
        | "neglected";
      forgetting_risk:
        | "recently_reinforced"
        | "stable"
        | "at_risk"
        | "likely_forgotten";
      memory_trend: "improving" | "stable" | "declining";
      project_status: "planning" | "active" | "on_hold" | "completed" | "cancelled" | "archived";
      project_type: "client" | "internal" | "open_source";
      project_priority: "critical" | "high" | "medium" | "low";
      task_status: "backlog" | "ready" | "in_progress" | "review" | "testing" | "completed" | "cancelled";
      time_entry_category: "design" | "frontend" | "backend" | "testing" | "meetings" | "research" | "deployment" | "other";
      change_request_status: "pending" | "estimated" | "approved" | "rejected" | "implemented";
      quote_status: "draft" | "sent" | "accepted" | "rejected" | "expired";
      client_status: "prospect" | "active" | "inactive" | "churned";
      pipeline_stage: "lead" | "discovery" | "proposal" | "negotiation" | "won" | "lost";
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
    };
    CompositeTypes: {
      
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ["easy", "medium", "hard"],
      problem_platform: [
        "leetcode",
        "codeforces",
        "hackerrank",
        "codechef",
        "geeksforgeeks",
        "atcoder",
        "interviewbit",
        "other",
      ],
      solve_status: [
        "solved",
        "solved_with_help",
        "partial",
        "unsolved",
        "gave_up",
      ],
      revision_state: ["new", "learning", "reviewing", "mastered", "struggling"],
      concept_status: [
        "learning",
        "understood",
        "weak",
        "forgotten",
        "mastered",
      ],
      resource_type: [
        "screenshot",
        "image",
        "pdf",
        "youtube",
        "article",
        "link",
      ],
      roadmap_kind: [
        "striver_a2z",
        "blind_75",
        "neetcode_150",
        "iit",
        "custom",
        "placement",
      ],
      roadmap_item_status: [
        "not_started",
        "in_progress",
        "completed",
        "skipped",
      ],
      activity_type: [
        "problem_solved",
        "problem_attempted",
        "concept_added",
        "concept_revised",
        "pattern_revised",
        "revision_completed",
        "lecture_watched",
        "assignment_completed",
        "document_uploaded",
        "study_session",
        "note_added",
      ],
      course_status: ["planned", "in_progress", "completed", "dropped"],
      semester_status: ["upcoming", "in_progress", "completed"],
      assignment_status: [
        "pending",
        "in_progress",
        "submitted",
        "graded",
        "late",
        "missed",
      ],
      lecture_status: ["not_started", "in_progress", "completed"],
      document_type: [
        "id_card",
        "hall_ticket",
        "certificate",
        "event_registration",
        "lecture_notes",
        "transcript",
        "other",
      ],
      ai_insight_type: [
        "weakness",
        "forgotten_topic",
        "strength",
        "recommendation",
        "milestone",
        "warning",
      ],
      reminder_category: [
        "learning_dsa",
        "learning_revision",
        "learning_concepts",
        "learning_roadmaps",
        "academic_iit",
        "academic_assignments",
        "academic_exams",
        "project_development",
        "project_client_work",
        "personal_priorities",
        "personal_relationships",
        "personal_family",
        "health_sleep",
        "health_exercise",
      ],
      reminder_recurrence: ["one_time", "daily", "weekly", "monthly", "custom"],
      reminder_status: ["active", "paused", "completed", "archived"],
      notification_state: ["unread", "read", "snoozed", "completed", "expired"],
      notification_source_type: [
        "reminder",
        "revision",
        "iit_assignment",
        "system",
      ],
      memory_health_status: [
        "strong",
        "stable",
        "at_risk",
        "decaying",
        "neglected",
      ],
      forgetting_risk: [
        "recently_reinforced",
        "stable",
        "at_risk",
        "likely_forgotten",
      ],
      memory_trend: ["improving", "stable", "declining"],
      focus_mode: [
        "work",
        "academic",
        "personal",
        "family",
        "recovery",
        "deep_focus",
        "none",
      ],
      project_status: ["planning", "active", "on_hold", "completed", "cancelled", "archived"],
      project_type: ["client", "internal", "open_source"],
      project_priority: ["critical", "high", "medium", "low"],
      task_status: ["backlog", "ready", "in_progress", "review", "testing", "completed", "cancelled"],
      time_entry_category: ["design", "frontend", "backend", "testing", "meetings", "research", "deployment", "other"],
      change_request_status: ["pending", "estimated", "approved", "rejected", "implemented"],
      quote_status: ["draft", "sent", "accepted", "rejected", "expired"],
      client_status: ["prospect", "active", "inactive", "churned"],
      pipeline_stage: ["lead", "discovery", "proposal", "negotiation", "won", "lost"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
    },
  },
} as const;
