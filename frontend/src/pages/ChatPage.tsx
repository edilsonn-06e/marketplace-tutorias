import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getConversations } from '../api/chat';
import { getErrorMessage } from '../api/client';
import { Avatar } from '../components/ui/Avatar';
import { Loader } from '../components/ui/Loader';
import { ChatWindow } from '../components/chat/ChatWindow';
import { formatMessageTime } from '../utils/format';
import type { ChatMessage, Conversation } from '../types/api';
import styles from './ChatPage.module.scss';

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const socket = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConversations = useCallback(() => {
    getConversations()
      .then(setConversations)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!socket) return;
    socket.on('conversation:updated', loadConversations);
    return () => {
      socket.off('conversation:updated', loadConversations);
    };
  }, [socket, loadConversations]);

  useEffect(() => {
    if (!conversationId) return;
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
  }, [conversationId, loading]);

  const handleActivity = useCallback((message: ChatMessage) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === message.conversationId);
      if (!target) return prev;
      const updated = { ...target, lastMessage: message, unreadCount: 0 };
      return [updated, ...prev.filter((c) => c.id !== message.conversationId)];
    });
  }, []);

  const active = conversations.find((c) => c.id === conversationId);

  return (
    <div className={`${styles.layout} ${conversationId ? styles.hasActive : ''}`}>
      <aside className={styles.list}>
        <h1>Mensajes</h1>
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <Loader text="Cargando conversaciones…" />
        ) : conversations.length === 0 ? (
          <p className={styles.muted}>
            Aún no tienes conversaciones. Escríbele a un tutor desde su perfil.
          </p>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/chat/${c.id}`}
                  className={`${styles.item} ${c.id === conversationId ? styles.active : ''}`}
                >
                  <Avatar name={c.otherUser.name} photoUrl={c.otherUser.photoUrl} size={44} />
                  <div className={styles.itemText}>
                    <div className={styles.itemTop}>
                      <strong>{c.otherUser.name}</strong>
                      {c.lastMessage && (
                        <span className={styles.time}>{formatMessageTime(c.lastMessage.createdAt)}</span>
                      )}
                    </div>
                    <div className={styles.itemBottom}>
                      <span className={styles.preview}>{c.lastMessage?.content ?? 'Sin mensajes'}</span>
                      {c.unreadCount > 0 && <span className={styles.unread}>{c.unreadCount}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className={styles.chat}>
        {active ? (
          <ChatWindow key={active.id} conversation={active} onActivity={handleActivity} />
        ) : (
          <p className={styles.placeholder}>
            {conversationId && loading ? 'Cargando…' : 'Elige una conversación para empezar a chatear'}
          </p>
        )}
      </div>
    </div>
  );
}
