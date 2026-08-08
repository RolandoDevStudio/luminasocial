export type PhotoStatus = "pending" | "approved" | "rejected";

export type ScreenViewType = "IDLE" | "PHOTO" | "TRIVIA" | "POSE_BATTLE";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Event = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
};

export type Photo = {
  id: string;
  event_id: string;
  table_number: number;
  photo_url: string;
  status: PhotoStatus;
  created_at: string;
};

export type TriviaQuestion = {
  id: string;
  event_id: string;
  question: string;
  options: Json;
  correct_option: number;
  is_active: boolean;
  created_at: string;
};

export type TriviaAnswer = {
  id: string;
  question_id: string;
  table_number: number;
  selected_option: number;
  is_correct: boolean;
  created_at: string;
};

export type PoseBattle = {
  id: string;
  event_id: string;
  table_a: number;
  table_b: number;
  photo_a_url: string;
  photo_b_url: string;
  is_active: boolean;
  created_at: string;
};

export type PoseVote = {
  id: string;
  battle_id: string;
  voted_table: number;
  created_at: string;
};

export type LiveScreenState = {
  id: string;
  event_id: string;
  current_view: ScreenViewType;
  active_payload: Json;
  updated_at: string;
};

/** Payload helpers for live_screen_state.active_payload */
export type PhotoPayload = {
  photo_id: string;
  photo_url: string;
  table_number: number;
};

export type TriviaPayload = {
  question_id: string;
  question: string;
  options: string[];
  correct_option: number;
  started_at: string;
  duration_sec: number;
  phase?: "answering" | "reveal";
};

export type PoseBattlePayload = {
  battle_id: string;
  table_a: number;
  table_b: number;
  photo_a_url: string;
  photo_b_url: string;
  started_at: string;
  duration_sec: number;
};

export type LiveActivePayload =
  | PhotoPayload
  | TriviaPayload
  | PoseBattlePayload
  | Record<string, never>;

export type Database = {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: {
          id?: string;
          name: string;
          code: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      photos: {
        Row: Photo;
        Insert: {
          id?: string;
          event_id: string;
          table_number: number;
          photo_url: string;
          status?: PhotoStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          table_number?: number;
          photo_url?: string;
          status?: PhotoStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      trivia_questions: {
        Row: TriviaQuestion;
        Insert: {
          id?: string;
          event_id: string;
          question: string;
          options: Json;
          correct_option: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          question?: string;
          options?: Json;
          correct_option?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trivia_questions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      trivia_answers: {
        Row: TriviaAnswer;
        Insert: {
          id?: string;
          question_id: string;
          table_number: number;
          selected_option: number;
          is_correct: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          table_number?: number;
          selected_option?: number;
          is_correct?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trivia_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "trivia_questions";
            referencedColumns: ["id"];
          },
        ];
      };
      pose_battles: {
        Row: PoseBattle;
        Insert: {
          id?: string;
          event_id: string;
          table_a: number;
          table_b: number;
          photo_a_url: string;
          photo_b_url: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          table_a?: number;
          table_b?: number;
          photo_a_url?: string;
          photo_b_url?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pose_battles_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      pose_votes: {
        Row: PoseVote;
        Insert: {
          id?: string;
          battle_id: string;
          voted_table: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          voted_table?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pose_votes_battle_id_fkey";
            columns: ["battle_id"];
            isOneToOne: false;
            referencedRelation: "pose_battles";
            referencedColumns: ["id"];
          },
        ];
      };
      live_screen_state: {
        Row: LiveScreenState;
        Insert: {
          id?: string;
          event_id: string;
          current_view?: ScreenViewType;
          active_payload?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          current_view?: ScreenViewType;
          active_payload?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "live_screen_state_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
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
      photo_status: PhotoStatus;
      screen_view_type: ScreenViewType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
