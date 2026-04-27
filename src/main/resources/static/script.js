// Adiciona persistência com localStorage (username + messages)

const STORAGE_KEYS = {
  USERNAME: 'chat_username',
  MESSAGES: 'chat_messages'
};

const state = {
  username: "",
  socket: null,
  messages: []
};

const elements = {
  welcomePanel: document.getElementById("welcomePanel"),
  chatRoom: document.getElementById("chatRoom"),
  usernameInput: document.getElementById("usernameInput"),
  enterButton: document.getElementById("enterButton"),
  currentUsername: document.getElementById("currentUsername"),
  connectionStatus: document.getElementById("connectionStatus"),
  connectionLabel: document.getElementById("connectionLabel"),
  messagesContainer: document.getElementById("messagesContainer"),
  emptyState: document.getElementById("emptyState"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  messageCount: document.getElementById("messageCount")
};

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const wsUrl = `${protocol}://${window.location.host}/chat`;

function setConnectionState(label, isOnline) {
  elements.connectionStatus.hidden = false;
  elements.connectionLabel.textContent = label;
  elements.connectionStatus.classList.toggle("online", isOnline);
}

function renderMessages() {
  const existingMessages = elements.messagesContainer.querySelectorAll(".message-card");
  existingMessages.forEach((node) => node.remove());

  elements.messageCount.textContent = String(state.messages.length);
  elements.emptyState.hidden = state.messages.length > 0;

  state.messages.forEach((message) => {
    const article = document.createElement("article");
    article.className = "message-card";

    if (message.username === state.username) {
      article.classList.add("own-message");
    }

    const username = document.createElement("span");
    username.className = "message-username";
    username.textContent = message.username;

    const text = document.createElement("p");
    text.className = "message-text";
    text.textContent = message.message;

    article.append(username, text);
    elements.messagesContainer.appendChild(article);
  });

  elements.messagesContainer.scrollTo({
    top: elements.messagesContainer.scrollHeight,
    behavior: "smooth"
  });
}

function saveUsernameToStorage(username) {
  try {
    if (username) localStorage.setItem(STORAGE_KEYS.USERNAME, username);
  } catch (e) {
    console.warn('Não foi possível salvar username no localStorage', e);
  }
}

function saveMessagesToStorage(messages) {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages || []));
  } catch (e) {
    console.warn('Não foi possível salvar mensagens no localStorage', e);
  }
}

function loadStateFromStorage() {
  let username = '';
  let messages = [];
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.USERNAME);
    if (rawUser) username = rawUser;
  } catch (e) {
    console.warn('Falha ao ler username do localStorage', e);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) messages = parsed;
    }
  } catch (e) {
    console.warn('Falha ao ler mensagens do localStorage', e);
  }

  return { username, messages };
}

function appendMessage(message) {
  state.messages.push(message);
  // salva no localStorage sempre que for adicionada uma nova mensagem
  saveMessagesToStorage(state.messages);
  renderMessages();
}

function connectWebSocket() {
  if (state.socket) {
    state.socket.close();
  }

  setConnectionState("Conectando...", false);
  state.socket = new WebSocket(wsUrl);

  state.socket.addEventListener("open", () => {
    setConnectionState("Conectado", true);
    elements.messageInput.focus();
  });

  state.socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);

      if (!message || typeof message.username !== "string" || typeof message.message !== "string") {
        return;
      }

      const normalizedMessage = {
        username: message.username.trim(),
        message: message.message.trim()
      };

      if (!normalizedMessage.username || !normalizedMessage.message) {
        return;
      }

      appendMessage(normalizedMessage);
    } catch (error) {
      console.error("Falha ao processar mensagem recebida:", error);
    }
  });

  state.socket.addEventListener("close", () => {
    setConnectionState("Desconectado", false);
  });

  state.socket.addEventListener("error", (error) => {
    console.error("Erro WebSocket:", error);
    setConnectionState("Erro na conexao", false);
  });
}

function enterChat() {
  const username = elements.usernameInput.value.trim();

  if (!username) {
    elements.usernameInput.focus();
    return;
  }

  state.username = username;
  elements.currentUsername.textContent = username;
  elements.welcomePanel.hidden = true;
  elements.chatRoom.hidden = false;

  // salva username e conecta websocket
  saveUsernameToStorage(username);
  connectWebSocket();
}

function sendMessage() {
  const message = elements.messageInput.value.trim();

  if (!message || !state.username || !state.socket || state.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  state.socket.send(JSON.stringify({
    username: state.username,
    message
  }));

  elements.messageInput.value = "";
  elements.messageInput.focus();
}

// eventos
elements.enterButton.addEventListener("click", enterChat);
elements.sendButton.addEventListener("click", sendMessage);

elements.usernameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    enterChat();
  }
});

elements.messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

window.addEventListener("beforeunload", () => {
  if (state.socket) {
    state.socket.close();
  }
});

// Inicializacao: carrega estado do localStorage e restaura UI
window.addEventListener('DOMContentLoaded', () => {
  const stored = loadStateFromStorage();

  if (stored.username) {
    state.username = stored.username;
    elements.usernameInput.value = stored.username;
    elements.currentUsername.textContent = stored.username;
    elements.welcomePanel.hidden = true;
    elements.chatRoom.hidden = false;
    // conecta automaticamente se já havia username salvo
    connectWebSocket();
  }

  if (Array.isArray(stored.messages) && stored.messages.length > 0) {
    state.messages = stored.messages;
  }

  renderMessages();
});
