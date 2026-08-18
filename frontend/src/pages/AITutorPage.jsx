import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, BookOpen, Lightbulb, HelpCircle, Code, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { subjectsApi } from '../api/subjects';
import { aiTutorApi } from '../api/aiTutor';
import { useNotification } from '../contexts/NotificationContext';

export const AITutorPage = () => {
  const { addToast } = useNotification();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [query, setQuery] = useState('');
  const [actionType, setActionType] = useState('explain');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `### 👋 Hi there! I'm your StudyPilot AI Engineering Tutor.\n\nI can provide deep technical explanations, code walkthroughs, real-world analogies, and exam preparation advice tailored directly to your current proficiency levels.\n\n**Select a course and topic above, or pick one of the quick prompts below to get started!**`,
      is_fallback: false,
      source: 'ai_engine'
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await subjectsApi.list();
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId(data[0].id.toString());
          if (data[0].topics && data[0].topics.length > 0) {
            setSelectedTopicId(data[0].topics[0].id.toString());
          }
        }
      } catch (err) {
        addToast('Failed to load subjects for AI Tutor context.', 'error');
      }
    };

    fetchSubjects();
  }, []);

  const handleSubjectChange = (e) => {
    const sId = e.target.value;
    setSelectedSubjectId(sId);
    const sub = subjects.find(s => s.id === parseInt(sId));
    if (sub && sub.topics && sub.topics.length > 0) {
      setSelectedTopicId(sub.topics[0].id.toString());
    } else {
      setSelectedTopicId('');
    }
  };

  const handleSend = async (customQuery = null, customAction = null) => {
    const textToSend = customQuery || query;
    const action = customAction || actionType;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await aiTutorApi.chat(
        textToSend,
        selectedSubjectId ? parseInt(selectedSubjectId) : null,
        selectedTopicId ? parseInt(selectedTopicId) : null,
        action
      );

      const aiMsg = {
        sender: 'ai',
        text: res.response,
        is_fallback: res.is_fallback,
        source: res.source,
        proficiency_context: res.proficiency_context
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      addToast('Error querying AI tutor.', 'error');
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: '⚠️ Unable to connect to the tutoring engine right now. Please try again.', is_fallback: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedSubject = subjects.find(s => s.id === parseInt(selectedSubjectId));
  const selectedTopic = selectedSubject?.topics?.find(t => t.id === parseInt(selectedTopicId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header Context Bar */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.5rem', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                AI Study Tutor
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Context-Aware Engineering Assistant with Built-in Offline Fallback
              </p>
            </div>
          </div>

          {/* Context Dropdowns */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <select
                value={selectedSubjectId}
                onChange={handleSubjectChange}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', width: 'auto' }}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', width: 'auto' }}
              >
                {selectedSubject?.topics?.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Prof: {t.proficiency}/5)</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '0.75rem'
            }}
          >
            {msg.sender === 'ai' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <Bot size={16} />
              </div>
            )}

            <div style={{
              maxWidth: '85%',
              background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: '#FFFFFF',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              fontSize: '0.92rem',
              lineHeight: 1.6
            }}>
              {/* Fallback badge */}
              {msg.is_fallback && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#FBBF24',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <ShieldCheck size={12} />
                  <span>Built-in Tutor Engine (No API Key Required)</span>
                </div>
              )}

              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Sparkles size={16} className="spin" color="var(--accent-primary)" />
            <span>AI Tutor is formulating a contextual explanation...</span>
          </div>
        )}
      </div>

      {/* Quick Action Suggestion Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button
          onClick={() => handleSend(`Explain ${selectedTopic?.name || 'this topic'} in depth for exams`, 'explain')}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
        >
          <BookOpen size={13} />
          <span>Explain In-Depth</span>
        </button>

        <button
          onClick={() => handleSend(`Give me a real-world practical example for ${selectedTopic?.name || 'this topic'}`, 'example')}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
        >
          <Lightbulb size={13} />
          <span>Real-World Example</span>
        </button>

        <button
          onClick={() => handleSend(`Simplify ${selectedTopic?.name || 'this topic'} like I'm 5 years old`, 'simplify')}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
        >
          <Sparkles size={13} />
          <span>Simplify (ELI5)</span>
        </button>
      </div>

      {/* Chat Input Field */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Ask anything about ${selectedTopic?.name || 'your curriculum'}...`}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
