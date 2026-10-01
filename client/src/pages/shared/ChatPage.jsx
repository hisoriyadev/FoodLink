import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, User, Sparkles, Inbox } from 'lucide-react';
import ChatBox from '../../components/chat/ChatBox';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chat');
      setChats(res.data.chats || []);
      if (res.data.chats?.length > 0 && !selectedChat) {
        setSelectedChat(res.data.chats[0]);
      }
    } catch {
      toast.error('Failed to load active chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Direct Messages & Chat Hub</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time communication between Donors, NGOs, and Volunteers.</p>
      </div>

      {loading ? (
        <div className="h-[560px] bg-white border border-slate-200 rounded-2xl animate-pulse" />
      ) : chats.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 mt-3">No conversations started yet</h3>
          <p className="text-xs text-slate-500 mt-1">Chat rooms open automatically when a donation is claimed or assigned!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Conversations Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 px-1">Active Conversations</h3>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {chats.map((c) => {
                const isSelected = selectedChat?._id === c._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedChat(c)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {c.recipient?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{c.recipient?.organizationName || c.recipient?.name || 'Partner'}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.lastMessage?.content || 'No messages yet'}</p>
                      </div>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Active Chat Window */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <ChatBox chatId={selectedChat._id} recipient={selectedChat.recipient} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                Select a conversation from the left to start messaging.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
