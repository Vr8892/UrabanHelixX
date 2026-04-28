import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiRefreshCw } from 'react-icons/fi';
import { projectAPI, deptAPI } from '../services/api';

// ─── Predefined Q&A for UrbanHeliX ───────────────────────────────────────────
const FAQ = [
    {
        id: 1,
        question: '🏗️ How do I track a project?',
        answer: 'Go to the Projects page from the sidebar. You can search by name, filter by status (proposed, in_progress, completed), and click any project to see its full details including milestones and fund history.',
    },
    {
        id: 2,
        question: '💰 How are funds verified?',
        answer: 'Every fund transaction requires 2-stage verification. The Financial Officer verifies Stage 1 and Stage 2 before funds are released. All transactions are recorded permanently on the blockchain for tamper-proof tracking.',
    },
    {
        id: 3,
        question: '😤 How do I file a Grievance?',
        answer: 'Go to Grievances page → click "New Grievance" → select the project → choose a category (delay, corruption, quality, etc.) → describe the issue. Other citizens can upvote your grievance to give it priority.',
    },
    {
        id: 4,
        question: '🔐 What is the Audit Chain?',
        answer: 'The Audit Chain is a tamper-proof record of all critical actions (fund allocation, project status changes, milestone approvals). It uses SHA-256 hashing — if anyone changes even one record, the chain breaks and the tampering is detected instantly.',
    },
    {
        id: 5,
        question: '👥 What are the user roles?',
        answer: 'There are 6 roles:\n• Citizen — view projects, file grievances\n• Engineer — approve milestones\n• Contractor — view assigned projects\n• Financial Officer — verify fund transactions\n• Admin — full access, approve projects, manage budgets\n• Auditor — read-only audit access',
    },
    {
        id: 6,
        question: '📊 How does the Dashboard work?',
        answer: 'The Dashboard shows a real-time overview: total projects, allocated funds, grievances count, and charts for budget utilization, project status breakdown, and monthly fund flow. Data updates every time you reload.',
    },
    {
        id: 7,
        question: '🏆 What is a Milestone?',
        answer: 'Milestones are stages of a project (e.g., 25% complete, 50% complete). An engineer submits a milestone, then it needs engineer approval + financial officer approval before the corresponding payment is released to the contractor.',
    },
    {
        id: 8,
        question: '⛓️ What is Blockchain in this system?',
        answer: 'UrbanHeliX uses Ethereum smart contracts (Solidity) running on a local Hardhat network. When key events happen (project created, fund disbursed), the data is written permanently to the blockchain. The transactionHash links every MongoDB record to the blockchain.',
    },
    {
        id: 9,
        question: '📁 Can I upload documents?',
        answer: 'Yes! When creating a project or filing a grievance, you can upload images or documents. Files are stored in the server/uploads/ folder and linked to the record. Supported formats include images and PDFs.',
    },
    {
        id: 10,
        question: '🚨 What happens if tampering is detected?',
        answer: 'If any record in the Hash Chain is modified, the SHA-256 hash will not match. When an auditor runs "Verify Chain" on the Audit page, the system will show exactly which record was tampered with and flag it as invalid.',
    },
];

const WELCOME_MSG = {
    id: 'welcome',
    from: 'bot',
    text: "👋 Hello! I'm the **UrbanHeliX Assistant**.\n\nI can answer questions about how this municipal governance platform works. Click a question below or type your own!",
    time: new Date(),
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MSG]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [projects, setProjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const messagesEndRef = useRef(null);

    // Fetch real-time data for the chatbot
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projRes, deptRes] = await Promise.all([
                    projectAPI.getAll({ limit: 100 }),
                    deptAPI.getAll()
                ]);
                setProjects(projRes.data.projects || []);
                setDepartments(deptRes.data.departments || []);
            } catch (err) {
                console.error('Chatbot data fetch error:', err);
            }
        };
        fetchData();
        // Refresh data every 30 seconds to stay "active"
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Show unread dot after 3 seconds if chat is closed
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) setHasUnread(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleOpen = () => {
        setIsOpen(true);
        setHasUnread(false);
    };

    const sendBotReply = (text) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                { id: Date.now(), from: 'bot', text, time: new Date() },
            ]);
        }, 700);
    };

    const handleQuestionClick = (faq) => {
        // Add user question
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), from: 'user', text: faq.question, time: new Date() },
        ]);
        sendBotReply(faq.answer);
    };

    const handleSend = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        // Add user message
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), from: 'user', text: trimmed, time: new Date() },
        ]);
        setInputValue('');

        // Find best matching FAQ
        const lower = trimmed.toLowerCase();

        // ─── Custom Dynamic Logic for Areas/Wards ───
        if (lower.includes('area') || lower.includes('ward') || lower.includes('status')) {
            const wardInfo = departments.map(d => {
                const wardProjects = projects.filter(p => 
                    p.location?.ward === d.ward || 
                    p.department?._id === d._id || 
                    p.department?.name === d.name
                );
                return {
                    name: d.name,
                    ward: d.ward,
                    projectCount: wardProjects.length,
                    projects: wardProjects
                };
            });

            if (lower.includes('all') || lower.includes('list') || lower.includes('areas')) {
                let response = "Here is the status of all areas (wards):\n\n";
                wardInfo.forEach(w => {
                    response += `• **${w.name} (Ward ${w.ward})**: ${w.projectCount > 0 ? `${w.projectCount} projects` : 'No active projects'}\n`;
                });
                sendBotReply(response);
                return;
            }

            // Check if user is asking about a specific ward/area
            const specificWard = wardInfo.find(w => 
                lower.includes(w.name.toLowerCase()) || 
                lower.includes(`ward ${w.ward}`) || 
                lower.includes(w.ward.toLowerCase())
            );

            if (specificWard) {
                let response = `Status for **${specificWard.name} (Ward ${specificWard.ward})**:\n\n`;
                if (specificWard.projectCount === 0) {
                    response += "Currently, there are no projects assigned to this area.";
                } else {
                    response += `There are **${specificWard.projectCount}** projects in this area:\n`;
                    specificWard.projects.forEach(p => {
                        response += `\n• **${p.title}**\n  Status: ${p.status.replace('_', ' ')}\n  Budget: ₹${p.estimatedBudget.toLocaleString()}`;
                    });
                }
                sendBotReply(response);
                return;
            }
        }

        const matched = FAQ.find((f) =>
            f.question.toLowerCase().includes(lower) ||
            lower.includes('project') && f.id === 1 ||
            lower.includes('fund') && f.id === 2 ||
            lower.includes('grievance') && f.id === 3 ||
            lower.includes('audit') && f.id === 4 ||
            lower.includes('role') && f.id === 5 ||
            lower.includes('dashboard') && f.id === 6 ||
            lower.includes('milestone') && f.id === 7 ||
            lower.includes('blockchain') && f.id === 8 ||
            lower.includes('upload') && f.id === 9 ||
            lower.includes('tamper') && f.id === 10 ||
            lower.includes('sha') && f.id === 4
        );

        if (matched) {
            sendBotReply(matched.answer);
        } else {
            sendBotReply(
                "I don't have a specific answer for that yet. You can ask about **ward status**, **all areas**, or a **specific project name**. I now have real-time access to our project database! 🚀"
            );
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReset = () => {
        setMessages([WELCOME_MSG]);
    };

    const formatText = (text) => {
        // Convert **bold** and newlines
        return text.split('\n').map((line, i) => (
            <span key={i}>
                {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
                {i < text.split('\n').length - 1 && <br />}
            </span>
        ));
    };

    const formatTime = (date) =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            {/* ── Floating Toggle Button ── */}
            <button
                id="chatbot-toggle-btn"
                className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
                onClick={isOpen ? () => setIsOpen(false) : handleOpen}
                title={isOpen ? 'Close Chat' : 'Open UrbanHeliX Assistant'}
            >
                {isOpen ? <FiX size={22} /> : <FiMessageCircle size={22} />}
                {!isOpen && hasUnread && <span className="chatbot-unread-dot" />}
            </button>

            {/* ── Chat Window ── */}
            <div className={`chatbot-window ${isOpen ? 'chatbot-window--open' : ''}`}>
                {/* Header */}
                <div className="chatbot-header">
                    <div className="chatbot-header-info">
                        <div className="chatbot-avatar">🏛️</div>
                        <div>
                            <div className="chatbot-title">UrbanHeliX Assistant</div>
                            <div className="chatbot-status">
                                <span className="chatbot-online-dot" />
                                Online · FAQ Bot
                            </div>
                        </div>
                    </div>
                    <div className="chatbot-header-actions">
                        <button
                            id="chatbot-reset-btn"
                            className="chatbot-icon-btn"
                            onClick={handleReset}
                            title="Reset conversation"
                        >
                            <FiRefreshCw size={14} />
                        </button>
                        <button
                            id="chatbot-close-btn"
                            className="chatbot-icon-btn"
                            onClick={() => setIsOpen(false)}
                            title="Close"
                        >
                            <FiX size={14} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="chatbot-messages">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chatbot-msg-row ${msg.from === 'user' ? 'chatbot-msg-row--user' : ''}`}
                        >
                            {msg.from === 'bot' && (
                                <div className="chatbot-msg-avatar">🏛️</div>
                            )}
                            <div className={`chatbot-bubble chatbot-bubble--${msg.from}`}>
                                <p className="chatbot-bubble-text">{formatText(msg.text)}</p>
                                <span className="chatbot-bubble-time">{formatTime(msg.time)}</span>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="chatbot-msg-row">
                            <div className="chatbot-msg-avatar">🏛️</div>
                            <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                <div className="chatbot-quick-section">
                    <div className="chatbot-quick-label">Quick Questions</div>
                    <div className="chatbot-quick-list">
                        {FAQ.map((faq) => (
                            <button
                                key={faq.id}
                                id={`chatbot-faq-${faq.id}`}
                                className="chatbot-quick-btn"
                                onClick={() => handleQuestionClick(faq)}
                            >
                                {faq.question}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Bar */}
                <div className="chatbot-input-bar">
                    <input
                        id="chatbot-input"
                        type="text"
                        className="chatbot-input"
                        placeholder="Type your question..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={200}
                    />
                    <button
                        id="chatbot-send-btn"
                        className="chatbot-send-btn"
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        title="Send"
                    >
                        <FiSend size={16} />
                    </button>
                </div>
            </div>
        </>
    );
}
