// Initialize IndexedDB
let db;
const request = window.indexedDB.open('groupChatDB', 1);

request.onupgradeneeded = function(event) {
  db = event.target.result;
  const objectStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement:true });
  objectStore.createIndex('text', 'text', { unique: false });
  objectStore.createIndex('timestamp', 'timestamp', { unique: false });
};

request.onsuccess = function(event) {
  db = event.target.result;
  displayMessages();
};

request.onerror = function(event) {
  console.error('IndexedDB error:', event.target.error);
};

// Function to display messages in the chat window
function displayMessages() {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.innerHTML = '';

  const transaction = db.transaction('messages', 'readonly');
  const objectStore = transaction.objectStore('messages');
  objectStore.openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      const messageElement = createMessageElement(cursor.value);
      chatWindow.appendChild(messageElement);
      chatWindow.scrollTop = chatWindow.scrollHeight;
      cursor.continue();
    }
  };
}

// Function to create message element
function createMessageElement(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.innerHTML = `
    <div class="avatar" style="background-color: ${message.color};"></div>
    <div class="message-content">${message.text}</div>
  `;
  return messageElement;
}

// Function to send message
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  if (message !== '') {
    const transaction = db.transaction('messages', 'readwrite');
    const objectStore = transaction.objectStore('messages');
    const timestamp = new Date().getTime();
    const color = getRandomColor();
    objectStore.add({ text: message, timestamp: timestamp, color: color });
    displayMessages();
    messageInput.value = '';
  }
}

// Generate random color
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Event listener for sending message
document.getElementById('send-btn').addEventListener('click', sendMessage);

// Event listener for Enter key
document.getElementById('message-input').addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// Event listener for Exit command
document.getElementById('message-input').addEventListener('keyup', function(event) {
  if (event.key === 'Enter' && event.shiftKey) {
    event.preventDefault();
  } else if (event.key === 'Enter' && this.value.toUpperCase() === 'EXIT') {
    clearMessages();
    this.value = '';
  }
});

// Function to clear messages from IndexedDB
function clearMessages() {
  const transaction = db.transaction('messages', 'readwrite');
  const objectStore = transaction.objectStore('messages');
  objectStore.clear();
  displayMessages();
}