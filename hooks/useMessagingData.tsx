
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChatMessage, FileAttachment, SyncQueueItem, User, MessageStatus, ChatGroup } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useOnlineStatus } from './useOnlineStatus';
import { syncData } from '../services/apiService';
import { readFileAsBase64 } from '../utils/helpers';
import { useUsers } from './useUsers';

interface MessagingDataContextType {
  messages: ChatMessage[];
  groups: ChatGroup[];
  deletedMessageIds: string[];
  sendMessage: (fromUserId: string, chatId: string, isGroupMessage: boolean, content: { type: 'text'; text: string } | { type: 'file'; file: File }, replyToMessageId?: string) => void;
  createGroup: (name: string, supervisorId: string, memberIds: string[]) => void;
  forwardMessage: (fromUserId: string, toUserIds: string[], messageToForward: ChatMessage) => void;
  deleteMessage: (messageId: string, forEveryone: boolean) => void;
  deleteChatHistory: (currentUserId: string, contactId: string, isGroup: boolean) => void;
  markMessagesAsRead: (currentUserId: string, chatId: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  queueLength: number;
  syncQueue: SyncQueueItem[];
}

const MessagingDataContext = createContext<MessagingDataContextType | undefined>(undefined);

export const MessagingDataProvider: React.FC<{ children: ReactNode; initialMessages: ChatMessage[] }> = ({ children, initialMessages }) => {
    const { isOnline } = useOnlineStatus();
    const { users } = useUsers(); // For forwarding name
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [groups, setGroups] = useState<ChatGroup[]>([]);

    const [deletedMessageIds, setDeletedMessageIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('disa-deleted-ids');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
        try {
            const saved = localStorage.getItem('disa-messaging-sync-queue');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

    useEffect(() => {
        if (initialMessages.length > 0 && messages.length === 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages, messages.length]);

    // Persist state to localStorage
    useEffect(() => { 
        localStorage.setItem('disa-messages', JSON.stringify(messages)); 
    }, [messages]);
    useEffect(() => { 
        localStorage.setItem('disa-groups', JSON.stringify(groups)); 
    }, [groups]);
    useEffect(() => { localStorage.setItem('disa-deleted-ids', JSON.stringify(deletedMessageIds)); }, [deletedMessageIds]);
    useEffect(() => { localStorage.setItem('disa-messaging-sync-queue', JSON.stringify(syncQueue)); }, [syncQueue]);
    
    const addToQueue = useCallback((action: SyncQueueItem['action'], payload: any, entityId?: string) => {
        setSyncQueue(prev => [...prev, { id: uuidv4(), action, payload, timestamp: Date.now(), entityId }]);
    }, []);

    // Effect to handle synchronization when online status changes
    useEffect(() => {
        if (isOnline) {
            if (syncQueue.length > 0) {
                setSyncStatus('syncing');
                syncData(syncQueue).then(result => {
                    if (result.success) {
                        setSyncQueue([]);
                        setSyncStatus('synced');
                    } else {
                        setSyncStatus('error');
                    }
                });
            } else {
                setSyncStatus('synced');
            }
        } else {
            setSyncStatus('offline');
        }
    }, [isOnline, syncQueue]);

    const updateMessageStatus = useCallback((messageId: string, status: ChatMessage['status']) => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, status} : msg));
    }, []);
    
    const createGroup = useCallback((name: string, supervisorId: string, memberIds: string[]) => {
        const newGroup: ChatGroup = {
            id: uuidv4(),
            name,
            supervisorId,
            memberIds: [...new Set([supervisorId, ...memberIds])], // Ensure supervisor is a member
            lastMessageTimestamp: new Date(),
        };
        setGroups(prev => [newGroup, ...prev]);
        // addToQueue('CREATE_GROUP', newGroup); // Optional: sync group creation
    }, []);


    const sendMessage = useCallback(async (
        fromUserId: string, 
        chatId: string, 
        isGroupMessage: boolean,
        content: { type: 'text'; text: string } | { type: 'file'; file: File },
        replyToMessageId?: string
      ) => {
        let partialMessage: Pick<ChatMessage, 'type' | 'text' | 'attachment'>;

        if (content.type === 'text') {
            if (!content.text.trim()) return;
            partialMessage = { type: 'text', text: content.text };
        } else {
            const fileData = await readFileAsBase64(content.file);
            const attachment: FileAttachment = { name: content.file.name, type: content.file.type, size: content.file.size, data: fileData };
            const messageType = content.file.type.startsWith('image/') ? 'image' : 'file';
            partialMessage = { type: messageType, text: content.file.name, attachment };
        }

        const newMessage: ChatMessage = {
            id: uuidv4(),
            fromUserId,
            chatId,
            isGroupMessage,
            toUserId: isGroupMessage ? undefined : chatId,
            timestamp: new Date(),
            status: 'sending',
            replyToMessageId,
            ...partialMessage
        };

        setMessages(prev => [...prev, newMessage]);
        if(isGroupMessage) {
            setGroups(prev => prev.map(g => g.id === chatId ? {...g, lastMessageTimestamp: new Date()} : g));
        }

        addToQueue('SEND_MESSAGE', newMessage, newMessage.id);
        
        setTimeout(() => updateMessageStatus(newMessage.id, 'sent'), 500);
        setTimeout(() => updateMessageStatus(newMessage.id, 'delivered'), 1500);

    }, [updateMessageStatus, addToQueue]);

    const forwardMessage = useCallback((fromUserId: string, toUserIds: string[], messageToForward: ChatMessage) => {
        const senderName = users.find(u => u.uid === messageToForward.fromUserId)?.name || 'Unknown';
        
        toUserIds.forEach(toUserId => {
            const forwardedMessage: ChatMessage = {
                ...messageToForward,
                id: uuidv4(),
                chatId: toUserId,
                isGroupMessage: false,
                toUserId: toUserId,
                fromUserId: fromUserId,
                timestamp: new Date(),
                status: 'sending',
                replyToMessageId: undefined,
                isDeleted: false,
                forwardedFrom: { name: senderName }
            };
            setMessages(prev => [...prev, forwardedMessage]);
            addToQueue('SEND_MESSAGE', forwardedMessage, forwardedMessage.id);
            setTimeout(() => updateMessageStatus(forwardedMessage.id, 'sent'), 500);
            setTimeout(() => updateMessageStatus(forwardedMessage.id, 'delivered'), 1500);
        });
    }, [users, updateMessageStatus, addToQueue]);

    const deleteMessage = useCallback((messageId: string, forEveryone: boolean) => {
        if (forEveryone) {
            addToQueue('DELETE_MESSAGE', { messageId }, messageId);
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    return { ...msg, isDeleted: true, text: 'This message was deleted', attachment: undefined, type: 'text' };
                }
                return msg;
            }));
        } else {
            setDeletedMessageIds(prev => [...new Set([...prev, messageId])]);
        }
    }, [addToQueue]);
    
    const deleteChatHistory = useCallback((currentUserId: string, chatId: string, isGroup: boolean) => {
        const idsToDelete = messages.filter(msg => {
            if (isGroup) {
                return msg.chatId === chatId;
            }
            return (msg.fromUserId === currentUserId && msg.toUserId === chatId) ||
                   (msg.fromUserId === chatId && msg.toUserId === currentUserId);
        }).map(msg => msg.id);

        if(idsToDelete.length > 0) {
            setDeletedMessageIds(prev => [...new Set([...prev, ...idsToDelete])]);
        }
    }, [messages]);

    const markMessagesAsRead = useCallback((currentUserId: string, chatId: string) => {
        setMessages((prevMessages) => {
            let hasChanges = false;
            const updatedMessages = prevMessages.map((msg): ChatMessage => {
                if (msg.chatId === chatId && msg.fromUserId !== currentUserId && msg.status !== 'read') {
                    hasChanges = true;
                    return { ...msg, status: 'read' };
                }
                return msg;
            });
    
            return hasChanges ? updatedMessages : prevMessages;
        });
    }, []);

    return (
        <MessagingDataContext.Provider value={{ messages, groups, deletedMessageIds, sendMessage, createGroup, forwardMessage, deleteMessage, deleteChatHistory, markMessagesAsRead, syncStatus, queueLength: syncQueue.length, syncQueue }}>
            {children}
        </MessagingDataContext.Provider>
    );
};

export const useMessagingData = (): MessagingDataContextType => {
  const context = useContext(MessagingDataContext);
  if (!context) {
    throw new Error('useMessagingData must be used within a MessagingDataProvider');
  }
  return context;
};
