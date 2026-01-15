import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

// Helper types for database tables
export interface Profile {
  id: string;
  alias: string;
  email: string;
  created_at: string;
}

export interface Email {
  id: string;
  profile_id: string;
  sender: string;
  subject: string;
  body: string;
  html_body?: string;
  received_at: string;
}
