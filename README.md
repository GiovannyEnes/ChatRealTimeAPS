# ChatRealTime — Rádio Verde

Aplicação de chat em tempo real com suporte a mensagens de texto e áudio, construída com Spring Boot e WebSocket.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Java 17, Spring Boot 3.4.2 |
| WebSocket | Spring WebSocket (raw handler) |
| Persistência | Spring Data JPA + H2 (in-memory) |
| Segurança | `spring-security-crypto` (BCrypt) |
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Build | Maven Wrapper |

---

## Funcionalidades

- **Autenticação** — cadastro e login com senha armazenada em BCrypt
- **Chat em tempo real** — mensagens de texto transmitidas via WebSocket para todos os clientes conectados
- **Mensagens de áudio** — gravação ou upload de arquivo de áudio; o áudio é convertido para Base64 e transmitido pelo WebSocket
- **Persistência local** — histórico de mensagens de texto salvo no `localStorage` do navegador (até 200 mensagens); áudios não são persistidos
- **HTTPS** — certificado autoassinado PKCS12, necessário para acesso à API `getUserMedia` em dispositivos móveis via IP local

---

## Pré-requisitos

- Java 17 ou superior
- Maven (ou use o `mvnw` incluso no projeto)
- O arquivo `keystore.p12` deve estar em `src/main/resources/`

---

## Como executar

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd ChatRealTimeAPS

# Executar com Maven Wrapper
./mvnw spring-boot:run        # Linux/macOS
mvnw.cmd spring-boot:run      # Windows
```

A aplicação sobe em: **https://localhost:8083**

> O navegador exibirá um aviso de certificado autoassinado. Clique em "Avançado" e prossiga para o site.

---

## Usuários pré-cadastrados

| Usuário | Senha  |
|---------|--------|
| Miguel  | 123456 |
| Maria   | 12345  |

Novos usuários podem ser criados pela página de registro em `/register.html`.

---

## Endpoints da API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/login` | Autenticar usuário |
| `POST` | `/api/register` | Cadastrar novo usuário |
| `POST` | `/upload-audio` | Enviar arquivo de áudio para o chat |

### WebSocket

| Endpoint | Descrição |
|----------|-----------|
| `wss://localhost:8083/chat` | Conexão WebSocket do chat |

**Formato da mensagem WebSocket (JSON):**

```json
{
  "username": "Miguel",
  "message": "Olá pessoal!",
  "type": "text"
}
```

Para mensagens de áudio, `type` é `"audio"` e `message` contém um Data URL Base64 (`data:audio/...;base64,...`).

---

## Estrutura do projeto

```
src/
└── main/
    ├── java/com/giovanny/ChatRealTime/
    │   ├── ChatRealTimeApplication.java     # Entry point
    │   ├── config/
    │   │   ├── DataInitializer.java         # Usuários pré-cadastrados
    │   │   └── WebSocketConfig.java         # Registro do handler WebSocket
    │   ├── model/
    │   │   ├── ChatMessage.java             # Modelo de mensagem (text/audio)
    │   │   └── User.java                    # Entidade de usuário
    │   ├── repository/
    │   │   └── UserRepository.java          # Spring Data JPA
    │   └── websocket/
    │       ├── AuthController.java          # REST: login e cadastro
    │       ├── AudioController.java         # REST: upload de áudio
    │       └── ChatWebSocketHandler.java    # Handler WebSocket
    └── resources/
        ├── application.properties
        └── static/
            ├── index.html                   # Página principal do chat
            ├── register.html                # Página de cadastro
            ├── script.js                    # Lógica do chat
            ├── register.js                  # Lógica do cadastro
            └── style.css                    # Estilos
```

---

## Configuração

Todas as configurações ficam em `src/main/resources/application.properties`:

```properties
server.port=8083

# HTTPS (autoassinado)
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=chatrealtimeaps

# H2 in-memory
spring.datasource.url=jdbc:h2:mem:chatdb
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

O console H2 está disponível em **https://localhost:8083/h2-console** (JDBC URL: `jdbc:h2:mem:chatdb`, usuário: `chatuser`, senha: em branco).

---

## Gerar o certificado autoassinado (se necessário)

```bash
keytool -genkeypair -alias chatrealtimeaps \
  -keyalg RSA -keysize 2048 -storetype PKCS12 \
  -keystore src/main/resources/keystore.p12 \
  -validity 365 \
  -storepass chatrealtimeaps
```
