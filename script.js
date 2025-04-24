// Constants
const GEMINI_API_KEY = "AIzaSyDKPJetjqfZl8RF_iPpywYDpDwebuYQi50";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// DOM Elements
const moodButtons = document.querySelectorAll('.mood-selector button');
const chatbox = document.querySelector('.chatbox');
const inputField = document.querySelector('.input-area input');
const sendButton = document.querySelector('.input-area button');
const breatheButton = document.querySelector('.breathe-btn');

// Chat history to maintain context
let chatHistory = [
  {
    role: "model",
    parts: [{ text: "Hi, I'm Sathi 😊 How are you feeling today?" }]
  }
];

// System prompt to guide the AI
const systemPrompt = {
  role: "user",
  parts: [{ 
    text: `You are Sathi, a compassionate mental health companion. 
    Your purpose is to provide emotional support, listen actively, and offer helpful coping strategies.
    Remember:
    - Be empathetic and non-judgmental
    - Provide evidence-based mental health advice
    - Suggest simple mindfulness exercises when appropriate
    - Recognize serious symptoms and encourage professional help when needed
    - Keep responses concise, warm, and supportive
    - Never diagnose conditions or replace professional mental health services
    Always maintain user privacy and confidentiality.
    Format your responses with markdown for better readability: use **bold** for emphasis, 
    create bullet points with *, and use headings with # when appropriate.`
  }]
};

// Load Showdown for Markdown parsing
function loadShowdown() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Showdown'));
    document.head.appendChild(script);
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load Markdown parser
    await loadShowdown();
    console.log('Showdown loaded successfully');
  } catch (error) {
    console.error('Error loading Showdown:', error);
  }

  // Add event listeners
  moodButtons.forEach(button => {
    button.addEventListener('click', () => handleMoodSelection(button.textContent));
  });
  
  sendButton.addEventListener('click', sendMessage);
  
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  breatheButton.addEventListener('click', startBreathingExercise);

  // Apply animated gradient to the title
  animateTitleGradient();
});

// Animate the title with gradient text
function animateTitleGradient() {
  const title = document.querySelector('h1');
  title.classList.add('gradient-text');
}

// Handle mood selection
function handleMoodSelection(mood) {
  addMessageToChat("user", `I'm feeling ${mood}`);
  
  // Prepare a specific response based on the mood
  let moodPrompt = "";
  switch(mood) {
    case "😊":
      moodPrompt = "I'm feeling happy today!";
      break;
    case "😐":
      moodPrompt = "I'm feeling neutral today.";
      break;
    case "😔":
      moodPrompt = "I'm feeling sad today.";
      break;
    case "😢":
      moodPrompt = "I'm feeling very upset today.";
      break;
    case "😠":
      moodPrompt = "I'm feeling angry today.";
      break;
  }
  
  // Send to API
  sendToGemini(moodPrompt);
}

// Send message to chatbot
async function sendMessage() {
  const userMessage = inputField.value.trim();
  
  if (userMessage) {
    addMessageToChat("user", userMessage);
    inputField.value = '';
    
    try {
      await sendToGemini(userMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      addMessageToChat("bot", "Sorry, I'm having trouble connecting right now. Please try again later.");
    }
  }
}

// Add message to chat interface
function addMessageToChat(sender, message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.classList.add(sender);
  
  // If it's a bot message and Showdown is loaded, convert markdown to HTML
  if (sender === "bot" && window.showdown) {
    try {
      const converter = new showdown.Converter();
      messageElement.innerHTML = converter.makeHtml(message);
    } catch (error) {
      console.error("Error parsing markdown:", error);
      messageElement.textContent = message;
    }
  } else {
    messageElement.textContent = message;
  }
  
  // Add animation class
  messageElement.classList.add('message-animation');
  
  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;
  
  // Update chat history
  chatHistory.push({
    role: sender === "user" ? "user" : "model",
    parts: [{ text: message }]
  });
}

// Send message to Gemini API
async function sendToGemini(userMessage) {
  // Show typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.classList.add('message', 'bot', 'typing');
  
  // Create animated typing dots
  const typingDots = document.createElement('div');
  typingDots.classList.add('typing-dots');
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    typingDots.appendChild(dot);
  }
  
  typingIndicator.appendChild(typingDots);
  chatbox.appendChild(typingIndicator);
  
  // Prepare request body
  const requestBody = {
    contents: [
      systemPrompt,
      ...chatHistory,
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ]
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Remove typing indicator
    chatbox.removeChild(typingIndicator);
    
    // Extract and display bot response
    if (data.candidates && data.candidates[0].content) {
      const botResponse = data.candidates[0].content.parts[0].text;
      addMessageToChat("bot", botResponse);
    } else {
      addMessageToChat("bot", "I'm having trouble understanding. Can you rephrase that?");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Remove typing indicator
    chatbox.removeChild(typingIndicator);
    addMessageToChat("bot", "I'm sorry, I'm having technical difficulties right now.");
  }
}

// Breathing exercise animation
function startBreathingExercise() {
  // Clear chat and show breathing instructions
  const breathingMessage = "Let's take a moment to breathe together. Follow the circle as it expands and contracts.";
  addMessageToChat("bot", breathingMessage);
  
  // Create breathing exercise container to properly position elements
  const breathingContainer = document.createElement('div');
  breathingContainer.classList.add('breathing-container');
  
  // Create breathing animation element
  const breathingElement = document.createElement('div');
  breathingElement.classList.add('breathing-circle');
  
  // Create instructions element
  const instructions = document.createElement('p');
  instructions.classList.add('breathing-instructions');
  instructions.textContent = "Prepare to breathe...";
  
  // Add elements to container
  breathingContainer.appendChild(breathingElement);
  breathingContainer.appendChild(instructions);
  
  // Add container to chatbox
  chatbox.appendChild(breathingContainer);
  
  // Ensure the chatbox scrolls to show the breathing circle
  chatbox.scrollTop = chatbox.scrollHeight;
  
  // Breathing cycle: 4 seconds in, 7 seconds hold, 8 seconds out
  let phase = 'inhale';
  let count = 1;
  let cycle = 1;
  
  const breathingInterval = setInterval(() => {
    if (phase === 'inhale' && count <= 4) {
      instructions.textContent = `Inhale... ${count}/4`;
      breathingElement.style.transform = `scale(${0.5 + count*0.125})`;
      breathingElement.style.boxShadow = `0 0 ${count * 5}px rgba(182, 251, 255, 0.7)`;
      count++;
    } else if (phase === 'inhale' && count > 4) {
      phase = 'hold';
      count = 1;
    } else if (phase === 'hold' && count <= 7) {
      instructions.textContent = `Hold... ${count}/7`;
      count++;
    } else if (phase === 'hold' && count > 7) {
      phase = 'exhale';
      count = 1;
    } else if (phase === 'exhale' && count <= 8) {
      instructions.textContent = `Exhale... ${count}/8`;
      breathingElement.style.transform = `scale(${1 - count*0.0625})`;
      breathingElement.style.boxShadow = `0 0 ${40 - count * 5}px rgba(182, 251, 255, 0.7)`;
      count++;
    } else if (phase === 'exhale' && count > 8) {
      phase = 'inhale';
      count = 1;
      cycle++;
    }
    
    // End after 3 cycles
    if (cycle > 3) {
      clearInterval(breathingInterval);
      chatbox.removeChild(breathingContainer);
      addMessageToChat("bot", "Great job! How do you feel now?");
    }
  }, 1000);
}