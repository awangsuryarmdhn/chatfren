// FILE: src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
import './index.css';

// Fungsi untuk mengurai teks Markdown dasar
const formatText = (text) => {
  const parts = [];
  let currentText = text;

  // Regex untuk blok kode (```...```)
  const codeBlockRegex = /```(.*?)```/gs;
  let codeMatch;
  let lastIndex = 0;

  while ((codeMatch = codeBlockRegex.exec(currentText)) !== null) {
    const preCode = currentText.substring(lastIndex, codeMatch.index);
    if (preCode) {
      parts.push(preCode);
    }
    // Tambahkan blok kode sebagai elemen <pre><code>
    parts.push(<pre key={`code-${codeMatch.index}`} className="bg-gray-800 text-white p-2 rounded-md my-2 overflow-x-auto"><code>{codeMatch[1].trim()}</code></pre>);
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < currentText.length) {
    parts.push(currentText.substring(lastIndex));
  }
  
  // Pisahkan teks menjadi array per baris untuk memproses bold, italic, dan list
  return parts.flatMap((part, partIndex) => {
    if (typeof part !== 'string') {
      return part;
    }
    return part.split('\n').map((line, lineIndex) => {
      let formattedLine = line;

      // Regex untuk **bold**
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Regex untuk *italic*
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Regex untuk `inline code`
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="bg-gray-200 p-1 rounded-md text-sm">$1</code>');
      
      return (
        <React.Fragment key={`line-${partIndex}-${lineIndex}`}>
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          {lineIndex < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  });
};

const App = () => {
  const [chatHistory, setChatHistory] = useState([{
    role: "model",
    parts: [{ text: "Halo! Apa yang bisa saya bantu?" }]
  }]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackToTopVisible, setIsBackToTopVisible] = useState(false);
  const chatMessagesRef = useRef(null);

  const addMessageToChat = (text, role) => {
    setChatHistory(prevHistory => {
      const newHistory = prevHistory.filter(msg => msg.role !== 'loading');
      newHistory.push({ role, parts: [{ text }] });
      return newHistory;
    });
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 10);
  };

  const sendMessage = async () => {
    const prompt = messageInput.trim();
    if (prompt === '' || isLoading) return;

    setIsLoading(true);
    addMessageToChat(prompt, 'user');
    setMessageInput('');

    setChatHistory(prevHistory => [...prevHistory, { role: 'loading', parts: [{ text: 'Elysia sedang menyiapkan pesanan Anda...' }] }]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }] }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        addMessageToChat(text, 'model');
      } else {
        addMessageToChat("Maaf, sepertinya saya tidak dapat menemukan menu yang Anda cari. 😔", 'model');
      }
    } catch (error) {
      console.error('Error calling the API:', error);
      addMessageToChat("Maaf, ada masalah dengan pesanan Anda. Silakan coba lagi.", 'model');
    } finally {
      setIsLoading(false);
      setChatHistory(prevHistory => prevHistory.filter(msg => msg.role !== 'loading'));
    }
  };

  const handleInput = (e) => {
    setMessageInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (chatMessagesRef.current) {
        if (chatMessagesRef.current.scrollTop > 100) {
          setIsBackToTopVisible(true);
        } else {
          setIsBackToTopVisible(false);
        }
      }
    };
    const chatContainer = chatMessagesRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="page-wrapper">
      
      {/* NAVBAR */}
      <nav className="navbar bg-base-200 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl sm:text-2xl font-bold normal-case">
              <i className="fa-solid fa-mug-saucer text-primary"></i>
              Elysia's Cafe
            </a>
          </div>
        </div>
      </nav>

      {/* KONTEN UTAMA DENGAN APLIKASI CHAT */}
      <main className="flex-grow flex items-center justify-center p-2 sm:p-4">
        <div className="hidden md:block w-32 md:mr-8 lg:mr-16">
          <img src="https://media.tenor.com/Fw5h_sO2N3EAAAAC/nyan-cat-nyan.gif" alt="Nyan Cat GIF" />
        </div>
        
        <div id="app-container" className="card bg-base-100 shadow-xl w-full max-w-sm md:max-w-xl flex flex-col h-full rounded-3xl overflow-hidden border-4 border-base-content/20">
          
          <div className="card-title p-3 sm:p-4 border-b border-base-content/20 bg-base-200 flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-base-content">Asisten Obrolan</h2>
            </div>
            <i className="fa-solid fa-cookie-bite text-secondary opacity-70 text-lg sm:text-xl"></i>
          </div>

          <div ref={chatMessagesRef} id="chat-messages" className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-4">
            {chatHistory.map((message, index) => (
              <div key={index} className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                <div className="chat-header text-xs sm:text-sm text-base-content/80 flex items-center gap-2 mb-1">
                  <div className="chat-image avatar">
                    <div className="w-8 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <i className={`fa-solid ${message.role === 'user' ? 'fa-user' : 'fa-star'} text-lg sm:text-xl ${message.role === 'user' ? 'text-info' : 'text-primary'}`}></i>
                    </div>
                  </div>
                  <span>{message.role === 'user' ? 'Anda' : 'Elysia'}</span>
                </div>
                <div className={`chat-bubble text-sm sm:text-base ${message.role === 'user' ? 'bg-info text-info-content' : message.role === 'loading' ? 'bg-primary text-primary-content animate-pulse' : 'bg-primary text-primary-content'}`}>
                  {formatText(message.parts[0].text)}
                </div>
              </div>
            ))}
          </div>

          <button
            id="back-to-top"
            onClick={scrollToTop}
            className={`btn btn-circle btn-primary btn-md fixed bottom-24 right-4 z-10 shadow-lg transition-opacity duration-300 ${isBackToTopVisible ? 'opacity-100' : 'opacity-0 hidden'}`}
          >
            <i className="fa-solid fa-arrow-up text-white"></i>
          </button>

          <div className="p-3 sm:p-4 border-t border-base-content/20 bg-base-200 flex items-end gap-2">
            <textarea
              id="message-input"
              className="textarea textarea-bordered w-full resize-none bg-white text-base-content placeholder-base-content/70 text-sm sm:text-base"
              placeholder="Pesan apa yang Anda inginkan?..."
              rows="1"
              value={messageInput}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
            ></textarea>
            <button
              id="send-button"
              className="btn btn-primary btn-square shadow-md hover:shadow-lg transition-shadow duration-300 btn-sm sm:btn-md"
              onClick={sendMessage}
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : <i className="fa-solid fa-paper-plane text-white"></i>}
            </button>
          </div>
        </div>
      </main>

      <footer className="footer footer-center p-4 bg-base-200 text-base-content">
        <aside>
          <p>Copyright © 2024 - Dibuat dengan 💖 di Cafe Elysia</p>
        </aside>
      </footer>
    </div>
  );
};

export default App;
