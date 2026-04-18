// SenpaiChat.tsx
import React, { useState } from 'react';
import styles from './SenpAI.module.css'; 

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export default function SenpaiChat() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Greeting
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hi there! I am SenpAI. What anime are you looking for today? ✨' }
    ]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage = inputText.trim();
        
        // 1. Instantly show the user's message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInputText('');
        setIsLoading(true);

        try {
            // 2. Call API endpoint
            const response = await fetch('/api/senpai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userMessage }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // 3. Add Claude's response
            setMessages(prev => [...prev, { role: 'ai', content: data.text }]);
            
        } catch (error) {
            console.error("Failed to fetch from AI:", error);
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: 'Gomen nasai! (Sorry!) I am having trouble connecting to my database right now. 😭' 
            }]);
        } finally {
            // 4. End loading state
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className={styles['senpai-container']}>
            {/* 1. CHAT WINDOW (Conditionally Renders) */}
            {isOpen && (
                <div className={styles['chat-window']}>
                    <div className={styles['chat-header']}>
                        <span>✨ SenpAI Anime Guide</span>
                        <button className={styles['close-button']} onClick={() => setIsOpen(false)} aria-label="Close Chat">
                            ✕
                        </button>
                    </div>
                    
                    <div className={styles['chat-messages']}>
                        {messages.map((msg, index) => (
                            /* We use a template literal here to combine the base "message" class and the dynamic "user/ai" class */
                            <div key={index} className={`${styles.message} ${styles[msg.role]}`}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={styles['typing-indicator']}>SenpAI is thinking...</div>
                        )}
                    </div>

                    <div className={styles['chat-input-area']}>
                        <input 
                            type="text" 
                            placeholder="Ask SenpAI about an anime..." 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button 
                            className={styles['send-button']} 
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputText.trim()}
                            aria-label="Send Message"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* 2. BIGGER & BETTER GLOWY BUTTON (Always Renders) */}
            <button 
                className={styles['glowy-button']} 
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close SenpAI Chat" : "Open SenpAI Chat"}
            >
                {isOpen ? (
                    // Simple Icon when Open
                    <span className={styles['btn-icon']}>✕</span>
                ) : (
                    // Big, Stacked text/icon when Closed
                    <>
                        <span className={styles['btn-icon']}>✨</span>
                        <span className={styles['btn-text']}>ASK</span>
                        <span className={styles['btn-text']}>SENPAI</span>
                    </>
                )}
            </button>
        </div>
    );
}