/**
 * Database types.
 *
 * ---------------------------------------------------------------------------
 * THIS FILE IS GENERATED. Do not edit it by hand.
 *
 *   npm run types:generate         # against the linked hosted project
 *   npm run types:generate:local   # against `supabase start` (needs Docker)
 *
 * It is checked in so the app typechecks without a database connection, and so
 * schema drift shows up as a diff in code review rather than as a runtime error.
 * Run `npm run types:check` in CI to catch a migration that landed without a
 * regeneration.
 * ---------------------------------------------------------------------------
 *
 * SEEDED BY HAND: this first copy was written to match the Phase 0 migrations
 * exactly, because neither Docker nor a hosted project was available when they
 * were authored. Regenerate it as the first step after `supabase link` — the
 * generator is the source of truth from that point on, and anything it disagrees
 * with here is this file's fault.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      event_categories: {
        Row: {
          id: string;
          name: string;
          color_hex: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          color_hex: string;
          sort_order: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          color_hex?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      auth_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/* -------------------------------------------------------------------------- */
/* Convenience aliases                                                         */
/* -------------------------------------------------------------------------- */

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

/**
 * `role` is a CHECK-constrained text column, not a Postgres enum, so the
 * generator types it as `string`. The requirements (§2.2) allow exactly two
 * values; this is the narrow type the app should use at its boundaries.
 *
 * Kept identical to `Role` in src/lib/mock/types.ts so screens can move from the
 * prototype store to real queries without a type change.
 */
export type Role = 'admin' | 'standard';
