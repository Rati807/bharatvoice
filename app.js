const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.continuous = false;
recognition.interimResults = false;

const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
let isListening = false;
let history = [];

function toggleListening() {
  if (isListening) {
    recognition.stop();
    setIdle();
  } else {
    recognition.start();
    setListening();
  }
}

function setListening() {
  isListening = true;
  document.getElementById('mic-ring').classList.add('active');
  document.getElementById('mic-label').textContent = 'Listening...';
  document.getElementById('mic-btn').textContent = '⏹️';
}

function setIdle() {
  isListening = false;
  document.getElementById('mic-ring').classList.remove('active');
  document.getElementById('mic-label').textContent = 'Tap to Speak';
  document.getElementById('mic-btn').textContent = '🎤';
}

recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  document.getElementById('transcript').textContent = transcript;
  setIdle();
  getAIResponse(transcript);
};

recognition.onerror = function(event) {
  document.getElementById('transcript').textContent = 'Error: ' + event.error + ' — Please try again!';
  setIdle();
};

recognition.onend = function() {
  setIdle();
};

async function getAIResponse(userText) {
  document.getElementById('response').innerHTML = '<span class="loading">Thinking...</span>';

  const systemPrompt = `You are BharatVoice, a friendly AI voice assistant for Indian users. 
  Keep responses short (2-3 sentences max) since they will be spoken aloud.
  You can help with general questions, calculations, jokes, weather info, and more.
  Be warm, helpful, and conversational. If asked in Hindi, respond in Hindi.`;

  const messages = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }]
  }));

  messages.push({ role: 'user', parts: [{ text: userText }] });

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\nUser: " + userText }]
          }
        ]
      })
    });

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    document.getElementById('response').textContent = aiText;

    history.push({ role: "user", content: userText });
    history.push({ role: "assistant", content: aiText });

    if (history.length > 10) history = history.slice(-10);

    addToHistory(userText, aiText);
    speak(aiText);

  } catch (err) {
    document.getElementById('response').textContent = 'Sorry, could not connect to AI. Please try again!';
    console.error(err);
  }
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function addToHistory(userText, aiText) {
  const historyDiv = document.getElementById('history');
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <p class="history-you">You: ${userText}</p>
    <p class="history-ai">AI: ${aiText}</p>
  `;
  historyDiv.insertBefore(item, historyDiv.firstChild);
}