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
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          parent_topic_id: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_topic_id?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_topic_id?: string | null;
          order_index?: number;
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
          name: string;
          slug: string;
          recognition_clues: string[];
          generic_algorithm: string | null;
          common_mistakes: string[];
          variants: string[];
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          recognition_clues?: string[];
          generic_algorithm?: string | null;
          common_mistakes?: string[];
          variants?: string[];
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          recognition_clues?: string[];
          generic_algorithm?: string | null;
          common_mistakes?: string[];
          variants?: string[];
          description?: string | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
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
    },
  },
} as const;
