import { Contact } from './types';
import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Initialize OpenAI client only if key is present
const openai = openaiApiKey ? new OpenAI({
    apiKey: openaiApiKey,
    dangerouslyAllowBrowser: true // Client-side usage for prototype
}) : null;

export const isToday = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

export const isOverdue = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
};

export const isUpcoming = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
};

export const groupContacts = (contacts: Contact[]) => {
    const grouped = {
        overdue: [] as Contact[],
        today: [] as Contact[],
        upcoming: [] as Contact[],
        completed: [] as Contact[],
        noDate: [] as Contact[],
    };

    contacts.forEach((contact) => {
        if (contact.status === 'done') {
            grouped.completed.push(contact);
        } else if (!contact.due_date) {
            grouped.noDate.push(contact);
        } else if (isOverdue(contact.due_date)) {
            grouped.overdue.push(contact);
        } else if (isToday(contact.due_date)) {
            grouped.today.push(contact);
        } else {
            grouped.upcoming.push(contact);
        }
    });

    return grouped;
};

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!openai) {
        console.warn('OpenAI API key missing. Returning mock transcription.');
        return "This is a mock transcription because no OpenAI API key was provided.";
    }

    const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });

    try {
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
        });
        return transcription.text;
    } catch (error) {
        console.error("Whisper API error:", error);
        throw error;
    }
}

export async function generateAiContext(
    rawNotes: string,
    fields: { name?: string; company?: string; role?: string; whereWeMet?: string }
): Promise<{
    ai_summary: string;
    follow_up_goal: string;
    next_action: string;
    message_draft: string;
}> {
    if (!openai) {
        // Mock AI response
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const name = fields.name || 'this person';
        const company = fields.company ? ` at ${fields.company}` : '';
        const role = fields.role ? ` as a ${fields.role}` : '';
        const where = fields.whereWeMet ? ` at ${fields.whereWeMet}` : '';

        return {
            ai_summary: `[MOCK] Met ${name}${role}${company}${where}. Context: ${rawNotes}`,
            follow_up_goal: '[MOCK] Establish a professional connection.',
            next_action: '[MOCK] Send a follow-up message on LinkedIn.',
            message_draft: `[MOCK] Hi ${name}, great meeting you${where}! Let's connect!`,
        };
    }

    const prompt = `
    Analyze the following notes about a new contact and extract structured information.
    
    Contact Info:
    Name: ${fields.name || 'Unknown'}
    Company: ${fields.company || 'Unknown'}
    Role: ${fields.role || 'Unknown'}
    Where we met: ${fields.whereWeMet || 'Unknown'}
    
    Notes:
    "${rawNotes}"
    
    Return a JSON object with:
    - ai_summary: A concise summary of who they are and why we met.
    - follow_up_goal: A strategic goal for this relationship.
    - next_action: A concrete next step (e.g., "Send email about X").
    - message_draft: A professional, personalized follow-up message (LinkedIn DM or Email).
  `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful networking assistant." }, { role: "user", content: prompt }],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content from OpenAI");

        return JSON.parse(content);
    } catch (error) {
        console.error("OpenAI API error:", error);
        throw error;
    }
}
