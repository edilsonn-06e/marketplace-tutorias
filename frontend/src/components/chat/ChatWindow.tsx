import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMessages } from '../../api/chat';
import { getErrorMessage } from '../../api/client';
import { Avatar } from '../ui/Avatar';
import { Loader } from '../ui/Loader';
import { formatMessageTime, ROLE_LABEL } from '../../utils/format';
import type { ChatMessage, Conversation } from '../../types/api';
import styles from './ChatWindow.module.scss';

interface ChatWindowProps {
  conversation: Conversation;
  onActivity: (message: ChatMessage) => void;
}

export function ChatWindow({ conversation, onActivity }: ChatWindowProps) {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const id = conversation.id;
  const myId = user?.id;
  const other = conversation.otherUser;

  useEffect(() => {
    getMessages(id)
      .then(setMessages)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const join = () => {
      socket.emit('conversation:join', id);
      socket.emit('message:read', { conversationId: id });
    };

    const onNew = (message: ChatMessage) => {
      if (message.conversationId !== id) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      onActivity(message);
      if (message.senderId !== myId) socket.emit('message:read', { conversationId: id });
    };

    const onRead = (payload: { conversationId: string; readerId: string; readAt: string }) => {
      if (payload.conversationId !== id || payload.readerId === myId) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderId === myId && !m.readAt ? { ...m, readAt: payload.readAt } : m)),
      );
    };

    join();
    socket.on('connect', join);
    socket.on('message:new', onNew);
    socket.on('message:read', onRead);

    return () => {
      socket.emit('conversation:leave', id);
      socket.off('connect', join);
      socket.off('message:new', onNew);
      socket.off('message:read', onRead);
    };
  }, [socket, id, myId, onActivity]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !socket) return;
    setText('');
    setError('');
    socket.emit('message:send', { conversationId: id, content }, (res) => {
      if (!res.ok) {
        setError(res.error);
        setText(content);
      }
    });
  };

  return (
    <section className={styles.window}>
      <header className={styles.header}>
        <Link to="/chat" className={styles.back} aria-label="Volver a la lista">←</Link>
        <Avatar name={other.name} photoUrl={other.photoUrl} size={40} />
        <div>
          <strong>{other.name}</strong>
          {other.role && <span className={styles.muted}>{ROLE_LABEL[other.role]}</span>}
        </div>
      </header>

      <div className={styles.messages}>
        {loading ? (
          <Loader text="Cargando mensajes…" />
        ) : messages.length === 0 ? (
          <p className={styles.empty}>Escribe el primer mensaje para coordinar tu clase.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId;
            return (
              <div key={m.id} className={`${styles.bubble} ${mine ? styles.mine : styles.theirs}`}>
                <p>{m.content}</p>
                <span className={styles.meta}>
                  {formatMessageTime(m.createdAt)}
                  {mine && (
                    <span
                      className={m.readAt ? styles.read : styles.sent}
                      title={m.readAt ? `Leído ${formatMessageTime(m.readAt)}` : 'Enviado'}
                    >
                      {m.readAt ? '✓✓' : '✓'}
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="form-error">{error}</p>}

      <form className={styles.composer} onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={socket?.connected === false ? 'Conectando…' : 'Escribe un mensaje'}
          maxLength={2000}
          aria-label="Mensaje"
        />
        <button type="submit" className="btn" disabled={!text.trim()}>Enviar</button>
      </form>
    </section>
  );
}
