'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  action_taken?: string;
  citations?: string[];
  grounded?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '🏥 **Hello! Welcome to MedVoice City Hospital.**\n\nI am MedVoice AI, your virtual receptionist and clinical information assistant powered by **Google Vertex AI Gemma**.\n\nHow may I assist you today?\n• Check doctor availability & book appointments\n• Inquire about hospital hours, departments & emergency care\n• Ask trusted, educational medical information & clinical guidelines\n• Support available in **English**, **हिन्दी (Hindi)**, and **తెలుగు (Telugu)**'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const resetSession = () => {
    const newId = 'sess_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newId);
    setMessages([
      {
        role: 'assistant',
        content: '🔄 **New session started.** How may I assist you with your appointment or hospital inquiry today?'
      }
    ]);
  };

  const sendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSend, session_id: sessionId }),
      });

      const data = await response.json();
      const botMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I was unable to process your request at this moment.',
        intent: data.intent,
        action_taken: data.action_taken,
        citations: data.citations || [],
        grounded: data.grounded
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error contacting MedVoice API:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ **Connection Error:** Unable to connect to the hospital virtual receptionist server. Please check your connection and try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format text with bold, code, and bullet styles
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div>
        {lines.map((line, idx) => {
          const isHeader = line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ');
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-');
          const cleanLine = isHeader ? line.replace(/^#+\s*/, '') : line;

          // Parse **bold** and `code` tags
          const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

          return (
            <div
              key={idx}
              style={{
                marginBottom: cleanLine.trim() === '' ? '8px' : '4px',
                fontWeight: isHeader ? '700' : 'normal',
                fontSize: isHeader ? '1.02rem' : 'inherit',
                paddingLeft: isBullet ? '12px' : '0'
              }}
            >
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code
                      key={pIdx}
                      style={{
                        background: 'rgba(0,0,0,0.06)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.85em'
                      }}
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return part;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-layout">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">🏥</div>
          <div>
            <h1 className="brand-title">MedVoice AI</h1>
            <p className="brand-subtitle">Multilingual Virtual Receptionist & Clinical Triage Assistant</p>
          </div>
        </div>

        <div className="header-badges">
          <span className="status-badge">
            <span className="status-dot"></span>
            Vertex AI Gemma • 187 RAG Chunks Live
          </span>
          <a href="tel:+18005559111" className="emergency-btn" title="Emergency Hotline">
            🚨 24/7 ER: +1 (800) 555-9111
          </a>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="main-workspace">
        {/* Left Sidebar Info & Quick Actions */}
        <aside className="sidebar">
          <div className="sidebar-card">
            <div className="card-title">🏥 Hospital Overview</div>
            <div className="info-item"><strong>Facility:</strong> MedVoice City Hospital</div>
            <div className="info-item"><strong>OPD Hours:</strong> Mon-Sat 8:00 AM - 8:00 PM</div>
            <div className="info-item"><strong>Emergency:</strong> 24/7 Level 1 Trauma Care</div>
            <div className="info-item"><strong>Phone:</strong> +1 (800) 555-MEDS</div>
          </div>

          <div>
            <div className="quick-category-title">📅 Appointments & Doctors</div>
            <button
              onClick={() => sendMessage('Who is available in cardiology tomorrow?')}
              className="quick-chip"
            >
              🫀 Cardiology Doctors Tomorrow
            </button>
            <button
              onClick={() => sendMessage('I want to book an appointment with Dr. Priya Sharma tomorrow at 10:30 AM')}
              className="quick-chip"
            >
              🩺 Book with Dr. Priya Sharma
            </button>
            <button
              onClick={() => sendMessage('What are your outpatient OPD timings and location?')}
              className="quick-chip"
            >
              📍 OPD Timings & Address
            </button>
            <button
              onClick={() => sendMessage('View appointment APT-1001')}
              className="quick-chip"
            >
              📋 View Appointment Status
            </button>
          </div>

          <div>
            <div className="quick-category-title">📚 Medical Knowledge & RAG</div>
            <button
              onClick={() => sendMessage('What are the common symptoms and blood tests for diabetes?')}
              className="quick-chip"
            >
              🩸 Diabetes Guidelines & Tests
            </button>
            <button
              onClick={() => sendMessage('What should I know about hypertension prevention?')}
              className="quick-chip"
            >
              ❤️ Hypertension Prevention
            </button>
            <button
              onClick={() => sendMessage('What is a Complete Blood Count (CBC) test?')}
              className="quick-chip"
            >
              🧪 CBC Blood Test Info
            </button>
          </div>

          <div>
            <div className="quick-category-title">🌐 Multilingual Voice Queries</div>
            <button
              onClick={() => sendMessage('मुझे कल हृदय रोग विशेषज्ञ (Cardiologist) से मिलना है')}
              className="quick-chip"
            >
              🇮🇳 हिन्दी: हृदय रोग विशेषज्ञ
            </button>
            <button
              onClick={() => sendMessage('చక్కెర వ్యాధి లక్షణాలు మరియు నివారణ జాగ్రత్తలు ఏమిటి?')}
              className="quick-chip"
            >
              🇮🇳 తెలుగు: చక్కెర వ్యాధి లక్షణాలు
            </button>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <button
              onClick={resetSession}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                border: '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🔄 Reset Conversation State
            </button>
          </div>
        </aside>

        {/* Right Chat Interface */}
        <section className="chat-section">
          {/* Chat Messages */}
          <div className="chat-viewport">
            {messages.map((msg, index) => {
              const isEmergency = msg.action_taken === 'EMERGENCY_ALERT' || msg.content.includes('MEDICAL EMERGENCY ALERT');
              return (
                <div key={index} className={`message-row ${msg.role}`}>
                  <div className={`avatar ${msg.role === 'user' ? 'usr' : 'bot'}`}>
                    {msg.role === 'user' ? '👤' : '🏥'}
                  </div>

                  <div className={`message-bubble ${isEmergency ? 'emergency-alert' : ''}`}>
                    {renderFormattedContent(msg.content)}

                    {/* Citations block */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="citations-box">
                        <div className="citations-header">📚 Clinical Source References</div>
                        {msg.citations.map((cite, cIdx) => (
                          <div key={cIdx} className="citation-item">
                            • {cite}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="message-row assistant">
                <div className="avatar bot">🏥</div>
                <div className="typing-indicator">
                  <span>Assistant is consulting clinical knowledge</span>
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Composer */}
          <div className="chat-composer">
            <div className="language-pills">
              <span className="lang-label">Languages:</span>
              <button
                className="lang-pill"
                onClick={() => setInput('Hello! Who is available in Cardiology tomorrow?')}
              >
                English
              </button>
              <button
                className="lang-pill"
                onClick={() => setInput('नमस्ते! क्या कल जनरल फिजिशियन डॉक्टर उपलब्ध हैं?')}
              >
                हिन्दी (Hindi)
              </button>
              <button
                className="lang-pill"
                onClick={() => setInput('నమస్కారం! నాకు రేపు కార్డియాలజిస్ట్ అపాయింట్‌మెంట్ కావాలి.')}
              >
                తెలుగు (Telugu)
              </button>
            </div>

            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask hospital information, doctor availability, appointments, or medical guidelines..."
                className="chat-input"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="send-btn"
              >
                {loading ? 'Thinking...' : 'Send ➔'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        MedVoice AI operates under hospital policies. Clinical knowledge is grounded in WHO & CDC guidelines. For acute medical emergencies, call 911 or visit the ER immediately.
      </footer>
    </div>
  );
}