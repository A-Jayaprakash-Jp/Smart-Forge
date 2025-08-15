import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, ChatMessage, Role, MessageStatus, ChatGroup } from '../../types';
import Modal from '../common/Modal';
import { useMessagingData } from '../../hooks/useMessagingData';
import { useUsers } from '../../hooks/useUsers';
import { PaperAirplaneIcon, PaperClipIcon, ArrowUturnLeftIcon, EllipsisVerticalIcon, ShareIcon, TrashIcon, XMarkIcon, ArrowLeftIcon, CheckIcon, CheckBadgeIcon, ClockIcon, MagnifyingGlassIcon, UsersIcon, ChatBubbleOvalLeftEllipsisIcon, PlusIcon } from '../common/Icons';
import { AnimatePresence, motion } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';

interface MessagingPaneProps {
    currentUser: User;
    setCurrentPage: (page: string) => void;
}

const MessageStatusIndicator: React.FC<{ status: MessageStatus }> = ({ status }) => {
    switch (status) {
        case 'read':
            return <CheckBadgeIcon className="w-5 h-5 text-blue-400" />;
        case 'delivered':
            return <div className="relative w-5 h-5"><CheckIcon className="w-5 h-5 absolute" /><CheckIcon className="w-5 h-5 absolute left-1" /></div>;
        case 'sent':
            return <CheckIcon className="w-5 h-5" />;
        case 'sending':
            return <ClockIcon className="w-5 h-5 animate-pulse" />;
        default:
            return null;
    }
};


const MessageMenu: React.FC<{
    message: ChatMessage;
    isSender: boolean;
    onReply: () => void;
    onForward: () => void;
    onDelete: () => void;
}> = ({ message, isSender, onReply, onForward, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    if (message.isDeleted) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-1 rounded-full text-gray-500 hover:bg-black/10 dark:hover:bg-white/10">
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={`absolute z-10 w-40 p-1 rounded-md shadow-lg glass-card ${isSender ? 'right-0' : 'left-0'} top-8`}
                    >
                        <button onClick={onReply} className="flex items-center w-full gap-2 px-3 py-2 text-left text-gray-800 rounded-md dark:text-gray-200 hover:bg-disa-accent-blue/80 hover:text-white">
                            <ArrowUturnLeftIcon className="w-4 h-4" /> Reply
                        </button>
                        <button onClick={onForward} className="flex items-center w-full gap-2 px-3 py-2 text-left text-gray-800 rounded-md dark:text-gray-200 hover:bg-disa-accent-blue/80 hover:text-white">
                            <ShareIcon className="w-4 h-4" />
                            Forward
                        </button>
                        {isSender && (
                            <button onClick={onDelete} className="flex items-center w-full gap-2 px-3 py-2 text-left text-red-500 rounded-md hover:bg-red-500/80 hover:text-white">
                                <TrashIcon className="w-4 h-4" /> Delete
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

type ChatListItem = (User & { isGroup: false }) | (ChatGroup & { isGroup: true });

const MessagingPane: React.FC<MessagingPaneProps> = ({ currentUser, setCurrentPage }) => {
    const { messages, groups, deletedMessageIds, sendMessage, createGroup, forwardMessage, deleteMessage, deleteChatHistory, markMessagesAsRead } = useMessagingData();
    const { users } = useUsers();
    
    const [activeTab, setActiveTab] = useState<'dms' | 'groups'>('dms');
    const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);
    const [messageText, setMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateGroupModalOpen, setCreateGroupModalOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

    const activeChatId = useMemo(() => {
        if (!selectedChat) return null;
        return selectedChat.isGroup ? selectedChat.id : (selectedChat as User).uid;
    }, [selectedChat]);

    const directMessageContacts = useMemo(() => {
        const relevantUsers = users.filter(u => u.uid !== currentUser.uid);
        switch (currentUser.role) {
            case Role.Operator:
                return relevantUsers.filter(u => u.role === Role.Supervisor);
            case Role.Supervisor:
                return relevantUsers.filter(u => u.role === Role.Manager || u.role === Role.Operator);
            case Role.Manager:
                 return relevantUsers.filter(u => u.role === Role.Supervisor);
            default:
                return [];
        }
    }, [currentUser, users]);

    const availableGroups = useMemo(() => {
        switch (currentUser.role) {
            case Role.Operator:
                return groups.filter(g => g.memberIds.includes(currentUser.uid));
            case Role.Supervisor:
                return groups.filter(g => g.supervisorId === currentUser.uid || g.memberIds.includes(currentUser.uid));
            case Role.Manager:
                return groups; // Manager sees all groups
            default:
                return [];
        }
    }, [currentUser, groups]);

    const listItems: ChatListItem[] = useMemo(() => {
        const items: ChatListItem[] = activeTab === 'dms' 
            ? directMessageContacts.map(u => ({...u, isGroup: false})) 
            : availableGroups.map(g => ({...g, isGroup: true}));
        
        return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeTab, directMessageContacts, availableGroups, searchTerm]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (activeChatId) {
            markMessagesAsRead(currentUser.uid, activeChatId);
        }
    }, [messages, activeChatId, replyingTo, markMessagesAsRead, currentUser.uid]);
    
     // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [messageText]);

    const chatHistory = useMemo(() => {
        if (!activeChatId) return [];
        return messages.filter(msg =>
            !deletedMessageIds.includes(msg.id) && msg.chatId === activeChatId
        ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [messages, activeChatId, deletedMessageIds]);
    
    const handleSend = () => {
        if (messageText.trim() && selectedChat && activeChatId) {
            sendMessage(currentUser.uid, activeChatId, !!selectedChat.isGroup, { type: 'text', text: messageText }, replyingTo?.id);
            setMessageText('');
            setReplyingTo(null);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedChat && activeChatId) {
            const file = e.target.files[0];
            sendMessage(currentUser.uid, activeChatId, !!selectedChat.isGroup, { type: 'file', file: file }, replyingTo?.id);
            setReplyingTo(null);
        }
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleForwardSubmit = (toUserIds: string[]) => {
        if (forwardingMessage) {
            forwardMessage(currentUser.uid, toUserIds, forwardingMessage);
        }
        setForwardingMessage(null);
    };

    const handleDeleteSubmit = (forEveryone: boolean) => {
        if(deletingMessage) {
            deleteMessage(deletingMessage.id, forEveryone);
        }
        setDeletingMessage(null);
    };
    
    const getRepliedMessage = (replyId: string) => messages.find(m => m.id === replyId);
    
    const handleSelectChat = (item: ChatListItem) => {
        setSelectedChat(item);
        const newChatId = item.isGroup ? item.id : (item as User).uid;
        markMessagesAsRead(currentUser.uid, newChatId);
    }
    
    const selectedContact = selectedChat && !selectedChat.isGroup ? selectedChat as User : null;
    const selectedGroup = selectedChat && selectedChat.isGroup ? selectedChat as ChatGroup : null;
    
    const getSender = (userId: string) => users.find(u => u.uid === userId);

    return (
        <div className="flex flex-col lg:flex-row h-full bg-disa-light-bg dark:bg-disa-dark-bg">
            <AnimatePresence>
                {isCreateGroupModalOpen && <CreateGroupModal currentUser={currentUser} onClose={() => setCreateGroupModalOpen(false)} onCreateGroup={createGroup} />}
            </AnimatePresence>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            
            {/* Contact/Group List */}
            <div className={`flex flex-col w-full lg:flex-shrink-0 lg:w-1/3 xl:w-1/4 bg-white/60 dark:bg-black/20 ${selectedChat && window.innerWidth < 1024 ? 'hidden' : 'flex'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:text-white border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage('dashboard')} className="p-2 text-gray-500 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label="Back to dashboard">
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h3>
                    </div>
                    {currentUser.role === Role.Supervisor && activeTab === 'groups' && (
                        <button onClick={() => setCreateGroupModalOpen(true)} className="p-2 text-gray-500 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label="Create Group">
                            <PlusIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                 {/* Tabs & Search */}
                <div className="p-4 space-y-4 border-b border-black/10 dark:border-white/10">
                     <div className="flex p-1 rounded-lg bg-gray-200/50 dark:bg-black/20">
                        <TabButton id="dms" label="Direct" icon={ChatBubbleOvalLeftEllipsisIcon} isActive={activeTab === 'dms'} onClick={() => { setActiveTab('dms'); setSelectedChat(null); }} />
                        <TabButton id="groups" label="Groups" icon={UsersIcon} isActive={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); setSelectedChat(null); }} />
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 top-1/2 left-3" />
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 text-gray-900 bg-gray-100 border-2 rounded-lg dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-disa-red focus:border-disa-red"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {listItems.map(item => {
                        const itemId = item.isGroup ? item.id : (item as User).uid;
                        return <ListItem key={itemId} item={item} isSelected={activeChatId === itemId} onClick={() => handleSelectChat(item)} />;
                    })}
                </div>
            </div>

            {/* Chat Pane */}
            <div className={`flex flex-col flex-1 bg-white/80 dark:bg-black/30 ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
                {selectedChat ? (
                    <>
                        <div className="flex items-center gap-4 p-4 border-b border-black/10 dark:border-white/10">
                             <button onClick={() => setSelectedChat(null)} className="p-2 mr-2 text-gray-500 rounded-full lg:hidden hover:bg-black/10 dark:hover:bg-white/10" aria-label="Back to contacts">
                                <ArrowLeftIcon className="w-6 h-6" />
                             </button>
                             <img src={selectedChat.isGroup ? selectedGroup?.avatarUrl || `https://i.pravatar.cc/150?u=${selectedGroup?.id}` : selectedContact?.profilePicUrl || `https://i.pravatar.cc/150?u=${selectedContact?.employeeId}`} alt={selectedChat.name} className="object-cover w-12 h-12 rounded-full" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedChat.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedChat.isGroup ? `${selectedGroup?.memberIds.length} members` : (selectedContact?.isOnline ? "Online" : "Offline")}
                                </p>
                            </div>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                               {chatHistory.map(msg => {
                                   const isSender = msg.fromUserId === currentUser.uid;
                                   const sender = getSender(msg.fromUserId);
                                   const repliedToMsg = msg.replyToMessageId ? getRepliedMessage(msg.replyToMessageId) : null;
                                   const senderOfRepliedMsg = repliedToMsg ? users.find(u => u.uid === repliedToMsg.fromUserId) : null;

                                   return (
                                   <div key={msg.id} 
                                        className={`group flex items-start gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
                                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                                        onMouseLeave={() => setHoveredMessageId(null)}
                                    >
                                       {!isSender && msg.isGroupMessage && <img src={sender?.profilePicUrl || `https://i.pravatar.cc/150?u=${sender?.employeeId}`} alt={sender?.name} className="self-end object-cover w-8 h-8 rounded-full" />}
                                       
                                        <div className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse' : ''}`}>
                                            <div className="flex flex-col max-w-md">
                                                {msg.isGroupMessage && !isSender && <p className="mb-1 text-xs font-bold text-disa-accent-purple">{sender?.name}</p>}
                                                <div className={`relative px-4 py-2 rounded-2xl ${isSender ? 'bg-disa-accent-blue text-white rounded-br-none' : 'bg-gray-200 dark:bg-black/20 text-gray-800 dark:text-white rounded-bl-none'}`}>
                                                    {repliedToMsg && (
                                                        <div className="p-2 mb-2 border-l-2 border-white/50 dark:border-black/50 bg-black/10 dark:bg-white/10 rounded-md">
                                                            <p className="text-xs font-bold">{senderOfRepliedMsg?.uid === currentUser.uid ? 'You' : senderOfRepliedMsg?.name}</p>
                                                            <p className="text-sm opacity-80 truncate">{repliedToMsg.isDeleted ? 'Original message was deleted' : (repliedToMsg.text || repliedToMsg.type)}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {msg.isDeleted ? (
                                                        <p className="italic text-gray-500 dark:text-gray-400">{msg.text}</p>
                                                    ) : msg.type === 'text' ? (
                                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                                    ) : null}
                                                </div>
                                                <div className={`flex items-center gap-1.5 mt-1 text-xs ${isSender ? 'flex-row-reverse' : ''} text-gray-500 dark:text-gray-400`}>
                                                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                  {isSender && <MessageStatusIndicator status={msg.status} />}
                                                </div>
                                            </div>

                                            <div className={`flex items-center self-center transition-opacity duration-200 ${hoveredMessageId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <MessageMenu message={msg} isSender={isSender} onReply={() => setReplyingTo(msg)} onForward={() => setForwardingMessage(msg)} onDelete={() => setDeletingMessage(msg)} />
                                            </div>
                                        </div>

                                   </div>
                                )})
                               }
                                <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-black/10 dark:border-white/10">
                             <AnimatePresence>
                             {replyingTo && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                <div className="flex items-center justify-between p-2 mb-2 rounded-lg bg-gray-200/50 dark:bg-black/20">
                                    <div className="flex-grow overflow-hidden">
                                        <p className="text-sm font-bold text-disa-accent-blue">Replying to {replyingTo.fromUserId === currentUser.uid ? 'yourself' : getSender(replyingTo.fromUserId)?.name}</p>
                                        <p className="text-sm truncate text-gray-600 dark:text-gray-300">{replyingTo.isDeleted ? 'Original message was deleted' : (replyingTo.text || replyingTo.type)}</p>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full text-gray-500 hover:bg-black/10 dark:hover:bg-white/10"><XMarkIcon className="w-5 h-5"/></button>
                                </div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                            <div className="flex items-end gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="p-3 transition-colors rounded-lg text-gray-600 dark:text-gray-300 bg-gray-200/50 dark:bg-black/20 hover:bg-gray-300/80 dark:hover:bg-black/40">
                                    <PaperClipIcon className="w-6 h-6"/>
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={`Message ${selectedChat.name}...`}
                                    rows={1}
                                    className="flex-1 p-3 text-gray-900 bg-gray-100 border-2 rounded-lg resize-none max-h-40 dark:text-white dark:bg-black/20 border-disa-light-border dark:border-disa-dark-border focus:ring-2 focus:ring-disa-red focus:border-disa-red"
                                ></textarea>
                                <button onClick={handleSend} disabled={!messageText.trim()} className="p-3 text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500 disabled:bg-gray-600">
                                    <PaperAirplaneIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-24 h-24" />
                        <p className="mt-4 text-lg">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const ListItem: React.FC<{item: ChatListItem, isSelected: boolean, onClick: () => void}> = ({ item, isSelected, onClick }) => (
    <button onClick={onClick}
        className={`flex items-center w-full gap-3 p-4 text-left transition-colors ${isSelected ? 'bg-disa-accent-blue/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
    >
        <div className="relative">
            <img src={item.isGroup ? (item as ChatGroup).avatarUrl || `https://i.pravatar.cc/150?u=${(item as ChatGroup).id}` : (item as User).profilePicUrl || `https://i.pravatar.cc/150?u=${(item as User).employeeId}`} alt={item.name} className="object-cover w-12 h-12 rounded-full" />
            {!item.isGroup && <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ${(item as User).isOnline ? 'bg-disa-accent-green' : 'bg-gray-400'} border-2 border-white dark:border-gray-800`}></span>}
        </div>
        <div>
            <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.isGroup ? `${(item as ChatGroup).memberIds.length} members` : (item as User).role}</p>
        </div>
    </button>
);

const TabButton: React.FC<{id: string, label: string, icon: React.ElementType, isActive: boolean, onClick: () => void}> = ({id, label, icon: Icon, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold transition-colors rounded-md ${isActive ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-300'}`}
    >
        <Icon className="w-5 h-5" />
        {label}
    </button>
);


export default MessagingPane;