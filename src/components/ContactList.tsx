import React from 'react';
import { Linkedin, Trash2, Edit, CheckCircle, Clock } from 'lucide-react';
import { Contact } from '../types';
import { groupContacts } from '../utils';

interface ContactListProps {
    contacts: Contact[];
    onEdit: (contact: Contact) => void;
    onDelete: (id: string) => void;
    onMarkDone: (contact: Contact) => void;
    onSnooze: (contact: Contact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
    contacts,
    onEdit,
    onDelete,
    onMarkDone,
    onSnooze,
}) => {
    const grouped = groupContacts(contacts);

    const renderSection = (title: string, items: Contact[], className: string = '') => {
        if (items.length === 0) return null;
        return (
            <div className={`contact-section ${className}`}>
                <h3 className="section-header">{title} ({items.length})</h3>
                <div className="contact-grid">
                    {items.map((contact) => (
                        <div key={contact.id} className="contact-card">
                            <div className="card-header">
                                <h4 className="contact-name">{contact.name || '(No name)'}</h4>
                                <a
                                    href={contact.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="linkedin-link"
                                    title="Open LinkedIn"
                                >
                                    <Linkedin size={18} />
                                </a>
                            </div>

                            <div className="contact-details">
                                {contact.company && <span className="detail">{contact.company}</span>}
                                {contact.role && <span className="detail">{contact.role}</span>}
                            </div>

                            {contact.ai_summary && (
                                <p className="contact-summary">{contact.ai_summary}</p>
                            )}

                            <div className="card-actions">
                                {contact.status !== 'done' && (
                                    <button
                                        onClick={() => onMarkDone(contact)}
                                        className="btn-icon"
                                        title="Mark done"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                )}

                                {contact.status !== 'done' && (
                                    <button
                                        onClick={() => onSnooze(contact)}
                                        className="btn-icon"
                                        title="Snooze 3 days"
                                    >
                                        <Clock size={18} />
                                    </button>
                                )}

                                <button
                                    onClick={() => onEdit(contact)}
                                    className="btn-icon"
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this contact?')) {
                                            onDelete(contact.id);
                                        }
                                    }}
                                    className="btn-icon danger"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="contact-list">
            {renderSection('Overdue', grouped.overdue, 'section-overdue')}
            {renderSection('Today', grouped.today, 'section-today')}
            {renderSection('Upcoming', grouped.upcoming, 'section-upcoming')}
            {renderSection('No Due Date', grouped.noDate, 'section-nodate')}
            {renderSection('Completed', grouped.completed, 'section-completed')}

            {contacts.length === 0 && (
                <div className="empty-state">
                    <p>No contacts yet. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};
