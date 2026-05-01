"use client";

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    if (match?.[1] === 'ar') setLang('ar');
  }, []);

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
      setCurrentSection(null);
      setCurrentQuestion(null);
    }
  };

  const handleBack = () => {
    if (currentQuestion) {
      setCurrentQuestion(null);
    } else if (currentSection) {
      setCurrentSection(null);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              {currentSection || currentQuestion ? (
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
            {!currentSection && !currentQuestion && (
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
                </div>
              </div>
            )}

            {currentSection && !currentQuestion && (
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

            {currentQuestion && (
              <div className="chatbot-answer-view">
                <div className="chatbot-bubble chatbot-bubble-user">
                  {currentQuestion.q}
                </div>
                <div className="chatbot-bubble chatbot-bubble-bot">
                  {currentQuestion.a}
                </div>
              </div>
            )}
          </div>
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
