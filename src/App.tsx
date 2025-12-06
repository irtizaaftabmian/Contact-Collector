import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CapturePanel } from './components/CapturePanel';
import { ContactList } from './components/ContactList';
import { Contact } from './types';
import './App.css';

function App() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('due_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching contacts:', error);
        } else {
            setContacts(data || []);
        }
        setLoading(false);
    };

    const handleSaveContact = async (contactData: Partial<Contact>) => {
        setSyncStatus('saving');

        // Optimistic update
        const isNew = !contactData.id;
        const tempId = isNew ? crypto.randomUUID() : contactData.id!;
        const now = new Date().toISOString();

        const optimisticContact: Contact = {
            ...contactData,
            id: tempId,
            created_at: contactData.created_at || now,
            updated_at: now,
            status: contactData.status || 'not_started',
        } as Contact;

        if (isNew) {
            setContacts((prev) => [optimisticContact, ...prev]);
        } else {
            setContacts((prev) => prev.map((c) => (c.id === tempId ? optimisticContact : c)));
        }

        // DB Update
        try {
            const { data, error } = await supabase
                .from('contacts')
                .upsert(contactData)
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic with real data
            if (data) {
                setContacts((prev) =>
                    prev.map((c) => (c.id === tempId ? data : c))
                );
            }
            setSyncStatus('synced');
            setEditingContact(null);
        } catch (error) {
            console.error('Error saving contact:', error);
            setSyncStatus('error');
            // Revert optimistic update? For simplicity, we'll just leave it and show error
        }
    };

    const handleDeleteContact = async (id: string) => {
        setSyncStatus('saving');
        setContacts((prev) => prev.filter((c) => c.id !== id));

        const { error } = await supabase.from('contacts').delete().eq('id', id);

        if (error) {
            console.error('Error deleting contact:', error);
            setSyncStatus('error');
            fetchContacts(); // Revert
        } else {
            setSyncStatus('synced');
        }
    };

    const handleMarkDone = async (contact: Contact) => {
        await handleSaveContact({ ...contact, status: 'done' });
    };

    const handleSnooze = async (contact: Contact) => {
        const today = new Date();
        const currentDue = contact.due_date ? new Date(contact.due_date) : today;
        const newDue = new Date(currentDue);
        newDue.setDate(newDue.getDate() + 3);

        await handleSaveContact({
            ...contact,
            due_date: newDue.toISOString().split('T')[0]
        });
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div>
                    <h1 className="app-title">Conference Contact Brain</h1>
                    <p className="app-subtitle">Capture the why behind every connection.</p>
                </div>
                <div className="sync-status">
                    {syncStatus === 'saving' && <span className="status-saving">Saving...</span>}
                    {syncStatus === 'synced' && <span className="status-synced">Synced</span>}
                    {syncStatus === 'error' && <span className="status-error">Error</span>}
                </div>
            </header>

            <main className="main-layout">
                <section className="capture-section">
                    <CapturePanel
                        onSave={handleSaveContact}
                        initialData={editingContact}
                        onClear={() => setEditingContact(null)}
                    />
                </section>

                <section className="list-section">
                    {loading ? (
                        <div className="loading">Loading contacts...</div>
                    ) : (
                        <ContactList
                            contacts={contacts}
                            onEdit={setEditingContact}
                            onDelete={handleDeleteContact}
                            onMarkDone={handleMarkDone}
                            onSnooze={handleSnooze}
                        />
                    )}
                </section>
            </main>

            <div className="export-tools">
                <button
                    className="btn-text small"
                    onClick={() => {
                        const json = JSON.stringify(contacts, null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                    }}
                >
                    Export JSON
                </button>
            </div>
        </div>
    );
}

export default App;
