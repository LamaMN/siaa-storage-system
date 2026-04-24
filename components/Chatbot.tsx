"use client";

import React, { useState } from 'react';

type Question = {
  q: string;
  a: string;
};

type Section = {
  id: string;
  title: string;
  questions: Question[];
};

const chatbotData: Section[] = [
  {
    id: 'general',
    title: 'General Information',
    questions: [
      {
        q: 'What is Si\'aa?',
        a: 'Si\'aa is a peer-to-peer storage marketplace in Saudi Arabia where you can find verified nearby storage spaces or list your extra space to earn income.'
      },
      {
        q: 'How does the platform work?',
        a: 'Hosts list their unused spaces, and Renters search for spaces that meet their needs. Si\'aa handles the connection and payment securely.'
      }
    ]
  },
  {
    id: 'renters',
    title: 'For Renters (Looking for Storage)',
    questions: [
      {
        q: 'How do I book a storage space?',
        a: 'You can browse available spaces, select the one that fits your needs, choose your dates, and click book.'
      },
      {
        q: 'Is my stored items safe?',
        a: 'We verify all hosts and spaces to ensure a safe environment for your belongings.'
      }
    ]
  },
  {
    id: 'hosts',
    title: 'For Hosts (Listing Space)',
    questions: [
      {
        q: 'How do I list my space?',
        a: 'Click on "List your space", fill in the details about your location, size, and price, and publish your listing!'
      },
      {
        q: 'How do I get paid?',
        a: 'Payments are processed securely through our platform and transferred directly to your registered bank account.'
      }
    ]
  }
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

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
                <button className="chatbot-back-btn" onClick={handleBack} aria-label="Back">
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
              ) : (
                <i className="fa-solid fa-robot chatbot-robot-icon"></i>
              )}
              <span>Si'aa Assistant</span>
            </div>
            <button className="chatbot-close-btn" onClick={toggleChat} aria-label="Close Chat">
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
          
          <div className="chatbot-content">
            {!currentSection && !currentQuestion && (
              <div className="chatbot-sections-view">
                <p className="chatbot-greeting">Hello! How can I help you today? Please choose a topic below:</p>
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
        aria-label="Toggle Chat"
      >
        <i className={`fa-solid ${isOpen ? 'fa-times' : 'fa-comment-dots'}`}></i>
      </button>
    </div>
  );
}
