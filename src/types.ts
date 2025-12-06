export type ContactStatus = 'not_started' | 'in_progress' | 'done';

export interface Contact {
    id: string;
    created_at: string;
    updated_at: string;
    name: string | null;
    linkedin_url: string;
    company: string | null;
    role: string | null;
    where_we_met: string | null;
    raw_notes: string | null;
    ai_summary: string | null;
    follow_up_goal: string | null;
    next_action: string | null;
    message_draft: string | null;
    due_date: string | null; // ISO date string
    status: ContactStatus;
}
