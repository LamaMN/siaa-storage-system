"use client";

import React, { useState, useEffect, useRef } from 'react';
import { translations, type Language } from '@/lib/translations';

type Question = {
  q: string;
  a: string;
};

type Section = {
  id: string;
  title: string;
  questions: Question[];
};

export default function Chatbot() {
  const [lang, setLang] = useState<Language>('en');
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // Ticketing state
  const [isTicketing, setIsTicketing] = useState(false);
  const [ticketStep, setTicketStep] = useState<number>(0); 
  // 0: Ask category (or login prompt)
  // 1: Ask subject
  // 2: Ask description
  // 3: Submitting / Result
  const [ticketData, setTicketData] = useState({ category: '', subject: '', description: '' });
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<'success' | 'failed' | null>(null);
  const [user, setUser] = useState<{ id: number, userType: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    if (match?.[1] === 'ar') setLang('ar');

    const storedUser = localStorage.getItem('siaaUser');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticketStep, ticketResult]);

  const t = translations[lang];

  const chatbotData: Section[] = [
    {
      id: 'general',
      title: t.chatbotSectionGeneral,
      questions: [
        { q: t.chatbotQ1, a: t.chatbotA1 },
        { q: t.chatbotQ2, a: t.chatbotA2 },
      ],
    },
    {
      id: 'renters',
      title: t.chatbotSectionRenters,
      questions: [
        { q: t.chatbotQ3, a: t.chatbotA3 },
        { q: t.chatbotQ4, a: t.chatbotA4 },
      ],
    },
    {
      id: 'hosts',
      title: t.chatbotSectionHosts,
      questions: [
        { q: t.chatbotQ5, a: t.chatbotA5 },
        { q: t.chatbotQ6, a: t.chatbotA6 },
      ],
    },
  ];

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      resetChat();
    }
  };

  const resetChat = () => {
      setCurrentSection(null);
      setCurrentQuestion(null);
      setIsTicketing(false);
      setTicketStep(0);
      setTicketData({ category: '', subject: '', description: '' });
      setInputText('');
      setIsSubmitting(false);
      setTicketResult(null);
  };

  const handleBack = () => {
    if (currentQuestion) {
      setCurrentQuestion(null);
    } else if (currentSection || isTicketing) {
      resetChat();
    }
  };

  const startTicketing = () => {
      setIsTicketing(true);
      setTicketStep(0);
      setTicketResult(null);
      setTicketData({ category: '', subject: '', description: '' });
  };

  const handleCategorySelect = (category: string) => {
      setTicketData(prev => ({ ...prev, category }));
      setTicketStep(1); // Move to ask subject
  };

  const handleSendInput = async () => {
      if (!inputText.trim()) return;

      if (ticketStep === 1) {
          setTicketData(prev => ({ ...prev, subject: inputText.trim() }));
          setInputText('');
          setTicketStep(2); // Move to ask description
      } else if (ticketStep === 2) {
          const description = inputText.trim();
          setTicketData(prev => ({ ...prev, description }));
          setInputText('');
          setTicketStep(3); // Move to submitting
          submitTicket(description);
      }
  };

  const submitTicket = async (description: string) => {
      setIsSubmitting(true);
      try {
          const payload = {
              seekerId: user?.userType === 'seeker' ? user.id : null,
              providerId: user?.userType === 'provider' ? user.id : null,
              userType: user?.userType,
              category: ticketData.category,
              subject: ticketData.subject,
              description: description
          };

          const res = await fetch('/api/tickets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              setTicketResult('success');
          } else {
              setTicketResult('failed');
          }
      } catch (error) {
          console.error(error);
          setTicketResult('failed');
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              {currentSection || currentQuestion || isTicketing ? (
                <button className="chatbot-back-btn" onClick={handleBack} aria-label={t.chatbotBack}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
              ) : (
                <i className="fa-solid fa-robot chatbot-robot-icon"></i>
              )}
              <span>{t.chatbotAssistant}</span>
            </div>
            <button className="chatbot-close-btn" onClick={toggleChat} aria-label={t.chatbotClose}>
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
          
          <div className="chatbot-content">
            {!currentSection && !currentQuestion && !isTicketing && (
              <div className="chatbot-sections-view">
                <p className="chatbot-greeting">{t.chatbotGreeting}</p>
                <div className="chatbot-list">
                  {chatbotData.map((section) => (
                    <button 
                      key={section.id} 
                      className="chatbot-list-item"
                      onClick={() => setCurrentSection(section)}
                    >
                      {section.title}
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  ))}
                  <button 
                      className="chatbot-list-item"
                      style={{ borderLeft: '4px solid #ff6b35' }}
                      onClick={startTicketing}
                    >
                      {t.chatbotIssueTicket || "Issue a Support Ticket"}
                      <i className="fa-solid fa-ticket"></i>
                  </button>
                </div>
              </div>
            )}

            {currentSection && !currentQuestion && !isTicketing && (
              <div className="chatbot-questions-view">
                <p className="chatbot-subtitle">{currentSection.title}</p>
                <div className="chatbot-list">
                  {currentSection.questions.map((item, idx) => (
                    <button 
                      key={idx} 
                      className="chatbot-list-item"
                      onClick={() => setCurrentQuestion(item)}
                    >
                      {item.q}
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentQuestion && !isTicketing && (
              <div className="chatbot-answer-view">
                <div className="chatbot-bubble chatbot-bubble-user">
                  {currentQuestion.q}
                </div>
                <div className="chatbot-bubble chatbot-bubble-bot">
                  {currentQuestion.a}
                </div>
              </div>
            )}

            {/* Ticketing Flow */}
            {isTicketing && (
                <div className="chatbot-answer-view" style={{ flex: 1 }}>
                    {!user ? (
                        <div className="chatbot-bubble chatbot-bubble-bot">
                            {t.ticketMustLogin || "You must be logged in to issue a support ticket."}
                        </div>
                    ) : (
                        <>
                            {/* Step 0: Category */}
                            <div className="chatbot-bubble chatbot-bubble-bot">
                                {t.ticketAskCategory || "Please select the category of your issue:"}
                            </div>
                            
                            {ticketStep === 0 && (
                                <div className="chatbot-list" style={{ marginTop: '10px' }}>
                                    {[(t.categoryBooking || "Booking"), (t.categoryPayment || "Payment"), (t.categoryTechnical || "Technical"), (t.categoryOther || "Other")].map(cat => (
                                        <button 
                                            key={cat} 
                                            className="chatbot-list-item"
                                            style={{ padding: '10px', fontSize: '14px' }}
                                            onClick={() => handleCategorySelect(cat)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {ticketStep >= 1 && (
                                <div className="chatbot-bubble chatbot-bubble-user">
                                    {ticketData.category}
                                </div>
                            )}

                            {/* Step 1: Subject */}
                            {ticketStep >= 1 && (
                                <div className="chatbot-bubble chatbot-bubble-bot">
                                    {t.ticketAskSubject || "Please type a short subject for your ticket:"}
                                </div>
                            )}
                            
                            {ticketStep >= 2 && (
                                <div className="chatbot-bubble chatbot-bubble-user">
                                    {ticketData.subject}
                                </div>
                            )}

                            {/* Step 2: Description */}
                            {ticketStep >= 2 && (
                                <div className="chatbot-bubble chatbot-bubble-bot">
                                    {t.ticketAskDescription || "Please describe your issue in detail:"}
                                </div>
                            )}

                            {ticketStep >= 3 && (
                                <div className="chatbot-bubble chatbot-bubble-user">
                                    {ticketData.description}
                                </div>
                            )}

                            {/* Step 3: Submitting / Result */}
                            {ticketStep === 3 && (
                                <div className="chatbot-bubble chatbot-bubble-bot">
                                    {isSubmitting 
                                        ? (t.ticketSubmitting || "Submitting your ticket...") 
                                        : (ticketResult === 'success' ? (t.ticketSuccess || "Your ticket has been submitted successfully!") : (t.ticketFailed || "Failed to submit ticket."))}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
            )}
          </div>

          {/* Input Area for Ticketing */}
          {isTicketing && user && (ticketStep === 1 || ticketStep === 2) && (
              <div className="chatbot-input-container">
                  <input 
                      type="text" 
                      className="chatbot-input" 
                      placeholder={t.typeMessage || "Type your message..."}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendInput()}
                      autoFocus
                  />
                  <button className="chatbot-send-btn" onClick={handleSendInput} disabled={!inputText.trim()}>
                      <i className="fa-solid fa-paper-plane"></i>
                  </button>
              </div>
          )}
        </div>
      )}
      
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`} 
        onClick={toggleChat}
        aria-label={t.chatbotToggle}
      >
        <i className={`fa-solid ${isOpen ? 'fa-times' : 'fa-comment-dots'}`}></i>
      </button>
    </div>
  );
}
