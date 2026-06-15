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
      iit_courses: {
        Row: {
          id: string;
          user_id: string;
          code: string | null;
          name: string;
          credits: number | null;
          semester: string | null;
          status: Database["public"]["Enums"]["course_status"];
          instructor: string | null;
          grade: string | null;
          marks: number | null;
          max_marks: number | null;
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
          status?: Database["public"]["Enums"]["course_status"];
          instructor?: string | null;
          grade?: string | null;
          marks?: number | null;
          max_marks?: number | null;
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
          status?: Database["public"]["Enums"]["course_status"];
          instructor?: string | null;
          grade?: string | null;
          marks?: number | null;
          max_marks?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
        | "custom";
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
    };
    CompositeTypes: {
      [_ in never]: never;
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
    },
  },
} as const;
