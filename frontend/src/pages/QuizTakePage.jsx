import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, Sparkles, Award, RotateCcw, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { quizzesApi } from '../api/quizzes';
import { useNotification } from '../contexts/NotificationContext';

export const QuizTakePage = () => {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topic_id');
  const subjectId = searchParams.get('subject_id');
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: optionIdx }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (!topicId || !subjectId) {
      navigate('/quizzes');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const data = await quizzesApi.getTopicQuiz(topicId, subjectId, 5);
        setQuestions(data);
      } catch (err) {
        addToast('Failed to load quiz questions.', 'error');
        navigate('/quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [topicId, subjectId]);

  const handleSelectOption = (questionId, optionIdx) => {
    if (quizResult) return; // Locked after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) return;
    }

    setSubmitting(true);
    try {
      const answersPayload = questions.map(q => ({
        question_id: q.id,
        selected_option_index: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
      }));

      const result = await quizzesApi.submit(parseInt(subjectId), parseInt(topicId), answersPayload);
      setQuizResult(result);
      addToast(`Quiz submitted! You scored ${result.score}/${result.total_questions} (${result.percentage}%)`, 'success');

      if (result.percentage >= 80) {
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        } catch (e) {}
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to submit quiz.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
        <p>Preparing diagnostic questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No questions available for this topic.</p>
        <button onClick={() => navigate('/quizzes')} className="btn btn-secondary">
          Back to Quizzes
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const allAnswered = questions.every(q => selectedAnswers[q.id] !== undefined);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/quizzes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Exit Quiz</span>
        </button>

        {!quizResult && (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
        )}
      </div>

      {!quizResult ? (
        <div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-card)', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                height: '100%',
                background: 'var(--accent-primary)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>

          {/* Question Card */}
          <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {currentQ.question_text}
            </h3>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === idx;
                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-primary)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {letter}
                    </div>
                    <span style={{ fontSize: '0.95rem', color: isSelected ? '#FFFFFF' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="btn btn-primary"
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-success"
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? 'Submitting...' : 'Submit Answers'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results & Explanations Scorecard View */
        <div>
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: quizResult.percentage >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: quizResult.percentage >= 80 ? '#10B981' : '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Award size={36} />
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              You Scored {quizResult.percentage}%
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {quizResult.score} of {quizResult.total_questions} questions correct. Your topic proficiency rating has been updated to <strong>Level {quizResult.updated_topic_proficiency || 3}/5</strong> in the adaptive engine.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/quizzes')}
                className="btn btn-secondary"
              >
                Back to Quizzes
              </button>
              <button
                onClick={() => navigate('/study-plan')}
                className="btn btn-primary"
              >
                <span>View Adapted Timetable</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Breakdown & Explanations */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>
            Question-by-Question Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {quizResult.answers_breakdown.map((item, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  borderLeft: `4px solid ${item.is_correct ? '#10B981' : '#EF4444'}`,
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                    Q{idx + 1}. {item.question_text}
                  </h4>
                  {item.is_correct ? (
                    <span className="badge badge-low" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={13} />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="badge badge-urgent" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <XCircle size={13} />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Your Answer: <strong style={{ color: item.is_correct ? '#10B981' : '#EF4444' }}>
                    {item.selected_option_index >= 0 ? item.options[item.selected_option_index] : 'No answer selected'}
                  </strong>
                </div>

                {!item.is_correct && (
                  <div style={{ fontSize: '0.85rem', color: '#10B981', marginBottom: '0.75rem' }}>
                    Correct Answer: <strong>{item.options[item.correct_option_index]}</strong>
                  </div>
                )}

                {item.explanation && (
                  <div style={{
                    background: 'var(--bg-primary)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    marginTop: '0.5rem'
                  }}>
                    💡 <strong>Explanation:</strong> {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
