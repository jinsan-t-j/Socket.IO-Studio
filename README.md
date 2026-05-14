# Socket Studio

Socket Studio is a high-performance, developer-first **Socket.IO testing client**. It is designed to be the definitive workbench for Socket.IO power users, providing deep protocol-level control and observability that general-purpose API tools like Postman, Insomnia, or Hoppscotch lack.

![Socket Studio Screenshot](public/screenshot.png) _(Note: Placeholder for your actual screenshot)_

## 🚀 Why Socket Studio?

Socket.IO isn't just "WebSockets". It has namespaces, handshake authentication, volatile emits, and specific ACK mechanisms. Socket Studio was built to support these as first-class citizens.

| Feature                | Postman | Socket Studio |
| :--------------------- | :-----: | :-----------: |
| **Namespaces**         |   ❌    |      ✅       |
| **Handshake Auth**     |   ❌    |      ✅       |
| **Volatile Emits**     |   ❌    |      ✅       |
| **Multi-arg Emits**    |   ❌    |      ✅       |
| **Socket.IO v2/v3/v4** |   ❌    |      ✅       |
| **Scripting Hooks**    |   ❌    |      ✅       |
| **ACK Inspector**      |   ⚠️    |      ✅       |

## ✨ Features

- **Postman-style Workspace**: Manage multiple simultaneous connections using a robust tab system.
- **Deep Connection Control**: First-class support for custom paths, namespaces, and Socket.IO protocol versions.
- **Advanced Auth**: Support for Bearer tokens, Basic auth, and the Socket.IO-specific `handshake.auth` object.
- **Emitter Library**: Save and organize frequently used event payloads with modifiers like `volatile`, `compress`, and `multi-argument`.
- **Wildcard Listeners**: Listen to every incoming event with `onAny` and outgoing with `onAnyOutgoing`.
- **Real-time Metrics**: Live latency (ping/pong) tracking, throughput charts, and connection health dashboard.
- **Scripting Engine**: Pre-connection and Post-event JavaScript hooks to automate authentication flows and data extraction.
- **Packet-level Inspection**: Toggle between a clean event timeline and a raw protocol-level packet viewer.
- **Fully Offline & Secure**: All sessions and logs are stored locally in your browser (LocalStorage/IndexedDB). No account required.

## 🛠️ Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Pinia](https://pinia.vuejs.org/) (with persistent state)
- **Real-time**: [Socket.io-client v4](https://socket.io/docs/v4/client-api/)
- **Components**: [Shadcn Vue](https://www.shadcn-vue.com/) & [Radix Vue](https://www.radix-vue.com/)

## 🏃 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jinsantj/socket-studio.git
   cd socket-studio
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development environment:
   ```bash
   npm run dev
   ```
   _This command starts both the Vite client and a demo Socket.IO server._

### Available Scripts

- `npm run dev`: Full dev environment (Client + Demo Server).
- `npm run dev:client`: Vite dev server only.
- `npm run dev:server`: Demo Socket.IO server only (listens on `http://localhost:5001`).
- `npm run build`: Production build.
- `npm run typecheck`: TypeScript validation.

## 📁 Project Structure

- `src/components`: UI components organized by feature (layout, connection, logs, metrics).
- `src/stores`: Pinia workspace store managing sessions, tabs, and real-time logs.
- `src/utils`: Socket manager wrapper and event handling logic.
- `src/types`: Strict TypeScript definitions for the workspace and protocol.
- `scripts`: Helper scripts for development orchestration and demo server.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
