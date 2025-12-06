import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Copy, Check, QrCode, ArrowRight, ArrowLeft } from 'lucide-react';
import { Contact } from '../types';
import { generateAiContext } from '../utils';
import { QRScanner } from './QRScanner';
import { AudioRecorder } from './AudioRecorder';

interface CapturePanelProps {
    onSave: (contact: Partial<Contact>) => Promise<void>;
    initialData?: Partial<Contact> | null;
    onClear: () => void;
}

type Step = 'identity' | 'context' | 'review';

export const CapturePanel: React.FC<CapturePanelProps> = ({ onSave, initialData, onClear }) => {
    const [step, setStep] = useState<Step>('identity');
    const [showScanner, setShowScanner] = useState(false);

    const [formData, setFormData] = useState<Partial<Contact>>({
        linkedin_url: '',
        name: '',
        company: '',
        role: '',
        where_we_met: '',
        raw_notes: '',
        ai_summary: '',
        follow_up_goal: '',
        next_action: '',
        message_draft: '',
    });

    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setStep('review'); // Jump to review if editing
        } else {
            resetForm();
        }
    }, [initialData]);

    const resetForm = () => {
        setFormData({
            linkedin_url: '',
            name: '',
            company: '',
            role: '',
            where_we_met: '',
            raw_notes: '',
            ai_summary: '',
            follow_up_goal: '',
            next_action: '',
            message_draft: '',
        });
        setStep('identity');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleScanSuccess = (decodedText: string) => {
        setFormData(prev => ({ ...prev, linkedin_url: decodedText }));
        setShowScanner(false);
    };

    const handleTranscription = (text: string) => {
        setFormData(prev => ({
            ...prev,
            raw_notes: (prev.raw_notes ? prev.raw_notes + '\n' : '') + text
        }));
    };

    const handleRunAi = async () => {
        if (!formData.raw_notes) return;
        setIsGeneratingAi(true);
        try {
            const aiResult = await generateAiContext(formData.raw_notes, {
                name: formData.name || undefined,
                company: formData.company || undefined,
                role: formData.role || undefined,
                whereWeMet: formData.where_we_met || undefined,
            });
            setFormData((prev) => ({ ...prev, ...aiResult }));
        } catch (error) {
            console.error('AI generation failed', error);
            alert('AI generation failed. Please check your API key.');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
        if (!initialData) {
            resetForm();
        }
    };

    const copyMessage = () => {
        if (formData.message_draft) {
            navigator.clipboard.writeText(formData.message_draft);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const nextStep = () => {
        if (step === 'identity') setStep('context');
        else if (step === 'context') {
            setStep('review');
            // Auto-run AI if notes exist and no summary yet
            if (formData.raw_notes && !formData.ai_summary) {
                handleRunAi();
            }
        }
    };

    const prevStep = () => {
        if (step === 'context') setStep('identity');
        else if (step === 'review') setStep('context');
    };

    return (
        <div className="panel capture-panel relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="panel-title mb-0">Add Contact</h2>
                <div className="flex gap-2 text-sm text-gray-500">
                    <span className={step === 'identity' ? 'text-[#0f62fe] font-bold' : ''}>1. Identity</span>
                    <span>→</span>
                    <span className={step === 'context' ? 'text-[#0f62fe] font-bold' : ''}>2. Context</span>
                    <span>→</span>
                    <span className={step === 'review' ? 'text-[#0f62fe] font-bold' : ''}>3. Review</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">

                {/* STEP 1: IDENTITY */}
                {step === 'identity' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="relative">
                            <input
                                type="text"
                                name="linkedin_url"
                                placeholder="LinkedIn URL"
                                value={formData.linkedin_url || ''}
                                onChange={handleInputChange}
                                className="input-field w-full pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2 rounded-md transition-colors"
                                title="Scan QR Code"
                            >
                                <QrCode size={20} />
                            </button>
                        </div>

                        <div className="form-grid">
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={formData.name || ''}
                                onChange={handleInputChange}
                                className="input-field"
                            />
                            <input
                                type="text"
                                name="company"
                                placeholder="Company"
                                value={formData.company || ''}
                                onChange={handleInputChange}
                                className="input-field"
                            />
                            <input
                                type="text"
                                name="role"
                                placeholder="Role"
                                value={formData.role || ''}
                                onChange={handleInputChange}
                                className="input-field"
                            />
                            <input
                                type="text"
                                name="where_we_met"
                                placeholder="Where we met"
                                value={formData.where_we_met || ''}
                                onChange={handleInputChange}
                                className="input-field"
                            />
                        </div>

                        <div className="flex justify-end mt-8 pt-4">
                            <button type="button" onClick={nextStep} className="btn btn-primary">
                                Next <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: CONTEXT */}
                {step === 'context' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center space-y-4 py-4">
                            <h3 className="text-lg font-medium text-white">Record Context</h3>
                            <AudioRecorder onTranscriptionComplete={handleTranscription} />
                        </div>

                        <div className="form-group">
                            <label className="label">Notes (Transcript)</label>
                            <textarea
                                name="raw_notes"
                                placeholder="Notes will appear here..."
                                value={formData.raw_notes || ''}
                                onChange={handleInputChange}
                                className="textarea-field h-32"
                            />
                        </div>

                        <div className="flex justify-between mt-8 pt-4">
                            <button type="button" onClick={prevStep} className="btn btn-text">
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button type="button" onClick={nextStep} className="btn btn-primary">
                                Review & AI <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW */}
                {step === 'review' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-white">AI Analysis</h3>
                            <button
                                type="button"
                                onClick={handleRunAi}
                                disabled={isGeneratingAi || !formData.raw_notes}
                                className="btn btn-secondary text-sm"
                            >
                                <Sparkles size={16} />
                                {isGeneratingAi ? 'Regenerating...' : 'Regenerate'}
                            </button>
                        </div>

                        {(formData.ai_summary || formData.message_draft) ? (
                            <div className="ai-suggestions">
                                {formData.ai_summary && (
                                    <div className="suggestion-item">
                                        <label className="suggestion-label">Summary</label>
                                        <p className="suggestion-text">{formData.ai_summary}</p>
                                    </div>
                                )}

                                {formData.follow_up_goal && (
                                    <div className="suggestion-item">
                                        <label className="suggestion-label">Goal</label>
                                        <p className="suggestion-text">{formData.follow_up_goal}</p>
                                    </div>
                                )}

                                {formData.next_action && (
                                    <div className="suggestion-item">
                                        <label className="suggestion-label">Next Action</label>
                                        <p className="suggestion-text">{formData.next_action}</p>
                                    </div>
                                )}

                                {formData.message_draft && (
                                    <div className="suggestion-item">
                                        <div className="suggestion-header">
                                            <label className="suggestion-label">Draft Message</label>
                                            <button
                                                type="button"
                                                onClick={copyMessage}
                                                className="btn-link"
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                {copied ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <textarea
                                            name="message_draft"
                                            value={formData.message_draft}
                                            onChange={handleInputChange}
                                            className="textarea-field small bg-[#2a2a2a]"
                                            rows={3}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center p-8 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                                {isGeneratingAi ? (
                                    <p>Generating insights...</p>
                                ) : (
                                    <p>No AI insights yet. Add notes to generate.</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                            <button type="button" onClick={prevStep} className="btn btn-text">
                                <ArrowLeft size={18} /> Back
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={onClear} className="btn btn-text">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} />
                                    Save Contact
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </form>

            {showScanner && (
                <QRScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};
