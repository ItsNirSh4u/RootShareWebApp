import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, Search, Users, ArrowLeft, Plus, ImagePlus, Pencil, Check, X,
  LogOut, Trash2, Shield, ShieldOff, UserPlus, MessageCircle, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { useChatSocket, type ChatGroupEvent } from './use-chat-socket';
import { NewGroupModal } from './NewGroupModal';
import {
  fetchChats, fetchMessagesWithParticipants, markAsRead, searchUsers,
  fetchChatWith, createDirectChat, leaveGroup, deleteGroup, deleteDirectChat, renameGroup,
  addAdmin, removeAdmin, removeMember, addMembers, uploadGroupImage,
  updateDescription, toggleMessageLike,
  mapSocketMessage,
  type IChat, type IMessage, type IUser, type SocketMessage,
} from './chat';

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatLastSeen(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return formatTime(date);
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function getDayLabel(iso: string): string {
  const today = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  if (isSameDay(iso, today)) return 'Today';
  if (isSameDay(iso, yesterday)) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

type AvatarProps = { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' };

function Avatar({ src, name, size = 'md' }: AvatarProps): JSX.Element {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return src ? (
    <img src={src} alt={name} className={cn('rounded-full object-cover flex-shrink-0', sizes[size])} />
  ) : (
    <div className={cn('rounded-full bg-primary flex items-center justify-center flex-shrink-0', sizes[size])}>
      <span className="font-semibold text-primary-foreground">{getInitials(name)}</span>
    </div>
  );
}

type ChatListItemProps = {
  chat: IChat;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
};

function ChatListItem({ chat, currentUserId, isSelected, onClick }: ChatListItemProps): JSX.Element {
  const isGroup = chat.type === 'group';
  const displayName = isGroup
    ? (chat.name ?? 'Group')
    : (chat.participants.find((p) => p._id !== currentUserId)?.username ?? 'Chat');
  const avatarSrc = isGroup
    ? chat.imageUrl
    : chat.participants.find((p) => p._id !== currentUserId)?.profileImageUrl;
  const unread = chat.unreadCount?.[currentUserId] ?? 0;
  const lastMsg = chat.lastMessage;
  const lastSender = lastMsg && typeof lastMsg.senderId === 'object' ? lastMsg.senderId.username : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left',
        isSelected ? 'bg-primary/10' : 'hover:bg-bg-muted',
      )}
    >
      <Avatar src={avatarSrc} name={displayName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm font-medium truncate', isSelected ? 'text-primary' : 'text-text-base')}>
            {displayName}
          </span>
          {lastMsg && (
            <span className="text-xs text-text-muted flex-shrink-0">{formatLastSeen(lastMsg.createdAt ?? '')}</span>
          )}
        </div>
        {lastMsg && (
          <p className="text-xs text-text-muted truncate">
            {lastSender ? `${lastSender}: ` : ''}{lastMsg.content}
          </p>
        )}
      </div>
      {unread > 0 && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

type MessageBubbleProps = {
  msg: IMessage;
  isOwn: boolean;
  currentUserId: string;
  onAvatarClick?: (userId: string) => void;
  onLike?: (messageId: string) => void;
};

function MessageBubble({ msg, isOwn, currentUserId, onAvatarClick, onLike }: MessageBubbleProps): JSX.Element {
  const liked = msg.likes.includes(currentUserId);
  const likeCount = msg.likes.length;

  return (
    <div className={cn('flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && (
        onAvatarClick ? (
          <button type="button" onClick={() => onAvatarClick(msg.senderId)} className="flex-shrink-0">
            <Avatar src={msg.senderAvatar} name={msg.senderName} size="sm" />
          </button>
        ) : (
          <Avatar src={msg.senderAvatar} name={msg.senderName} size="sm" />
        )
      )}
      <div className={cn('max-w-[70%] flex flex-col gap-0.5', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && <span className="text-xs text-text-muted px-1">{msg.senderName}</span>}
        <div
          className={cn(
            'px-3 py-2 rounded-2xl text-sm break-words',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-bg-card border border-border-default text-text-base rounded-bl-sm',
          )}
        >
          {msg.content}
        </div>
        <div className={cn('flex items-center gap-1.5 px-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-xs text-text-muted">{formatTime(msg.createdAt)}</span>
          {onLike && (
            <button
              type="button"
              onClick={() => onLike(msg._id)}
              className={cn('flex items-center gap-0.5 transition-colors', liked ? 'text-rose-500' : 'text-text-muted hover:text-rose-400')}
            >
              <Heart size={11} className={liked ? 'fill-rose-500' : ''} />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type NewChatModalProps = { onClose: () => void; onSelect: (userId: string) => void };

function NewChatModal({ onClose, onSelect }: NewChatModalProps): JSX.Element {
  const [search, setSearch] = useState('');
  const { data: results, isLoading } = useQuery({
    queryKey: ['users', 'search', search],
    queryFn: () => searchUsers(search),
    enabled: search.length > 1,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-bg-card border border-border-default rounded-xl w-full max-w-md flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-primary" />
            <h2 className="font-semibold text-text-base">New Chat</h2>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-base transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 border-b border-border-default flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full h-10 pl-8 pr-3 text-sm rounded-md border border-border-input bg-bg-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {search.length <= 1 ? (
            <p className="text-sm text-text-muted text-center py-8">Type to search users</p>
          ) : isLoading ? (
            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
          ) : results && results.length > 0 ? (
            results.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => onSelect(u._id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-muted transition-colors text-left"
              >
                <Avatar src={u.profileImageUrl} name={u.username} size="sm" />
                <span className="text-sm text-text-base">{u.username}</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-text-muted text-center py-8">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({ message, confirmLabel = 'Confirm', destructive = false, onConfirm, onCancel }: ConfirmDialogProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-bg-card border border-border-default rounded-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <p className="text-sm text-text-base">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button size="sm" variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

type GroupInfoPanelProps = {
  chat: IChat;
  currentUserId: string;
  onClose: () => void;
  onChatUpdate: (updated: IChat) => void;
  onChatLeft: () => void;
  onOpenDirectChat: (userId: string) => void;
};

function GroupInfoPanel({ chat, currentUserId, onClose, onChatUpdate, onChatLeft, onOpenDirectChat }: GroupInfoPanelProps): JSX.Element {
  const [renamingMode, setRenamingMode] = useState(false);
  const [newName, setNewName] = useState(chat.name ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState(chat.description ?? '');
  const [addingUsers, setAddingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<IUser[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<{
    message: string; action: () => void; confirmLabel?: string; destructive?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = chat.admins?.some((a) => a._id === currentUserId) ?? false;
  const ownerId = chat.owner !== null && typeof chat.owner === 'object' ? chat.owner._id : (chat.owner ?? null);

  const { data: searchResults } = useQuery({
    queryKey: ['users', 'search', userSearch],
    queryFn: () => searchUsers(userSearch),
    enabled: addingUsers && userSearch.length > 1,
  });

  const renameMutation = useMutation({
    mutationFn: () => renameGroup(chat._id, newName),
    onSuccess: (updated) => { onChatUpdate(updated); setRenamingMode(false); },
  });

  const updateDescMutation = useMutation({
    mutationFn: () => updateDescription(chat._id, newDesc.trim() || null),
    onSuccess: (updated) => { onChatUpdate(updated); setEditingDesc(false); },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(chat._id, userId),
    onSuccess: (updated) => { if (updated) onChatUpdate(updated); else onChatLeft(); },
  });

  const addAdminMutation = useMutation({
    mutationFn: (userId: string) => addAdmin(chat._id, userId),
    onSuccess: (updated) => onChatUpdate(updated),
  });

  const removeAdminMutation = useMutation({
    mutationFn: (userId: string) => removeAdmin(chat._id, userId),
    onSuccess: (updated) => onChatUpdate(updated),
  });

  const addMembersMutation = useMutation({
    mutationFn: () => addMembers(chat._id, selectedToAdd.map((u) => u._id)),
    onSuccess: (updated) => { onChatUpdate(updated); setAddingUsers(false); setSelectedToAdd([]); setUserSearch(''); },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveGroup(chat._id),
    onSuccess: onChatLeft,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(chat._id),
    onSuccess: onChatLeft,
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => uploadGroupImage(chat._id, file),
    onSuccess: (updated) => onChatUpdate(updated),
  });

  const memberIds = chat.participants.map((p) => p._id);
  const filteredSearchResults = searchResults?.filter((u) => !memberIds.includes(u._id) && !selectedToAdd.find((s) => s._id === u._id));

  const sortedParticipants = [...chat.participants].sort((a, b) => {
    const aIsOwner = a._id === ownerId;
    const bIsOwner = b._id === ownerId;
    if (aIsOwner !== bIsOwner) return aIsOwner ? -1 : 1;
    const aIsAdmin = chat.admins?.some((ad) => ad._id === a._id) ?? false;
    const bIsAdmin = chat.admins?.some((ad) => ad._id === b._id) ?? false;
    if (aIsAdmin !== bIsAdmin) return aIsAdmin ? -1 : 1;
    return a.username.localeCompare(b.username);
  });

  return (
    <>
      <div className="flex flex-col h-full bg-bg-card border-l border-border-default w-72 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <span className="font-semibold text-text-base text-sm">Group Info</span>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-base transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
              disabled={!isAdmin}
              title={isAdmin ? 'Change group photo' : undefined}
            >
              <Avatar src={chat.imageUrl} name={chat.name ?? 'Group'} size="lg" />
              {isAdmin && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImagePlus size={16} className="text-white" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImageMutation.mutate(f);
                e.target.value = '';
              }}
            />

            {renamingMode ? (
              <div className="flex items-center gap-1 w-full">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameMutation.mutate();
                    if (e.key === 'Escape') setRenamingMode(false);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={() => renameMutation.mutate()} isLoading={renameMutation.isPending} className="h-8 w-8">
                  <Check size={14} className="text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setRenamingMode(false)} className="h-8 w-8">
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-text-base">{chat.name}</span>
                {isAdmin && (
                  <button type="button" onClick={() => { setNewName(chat.name ?? ''); setRenamingMode(true); }} className="text-text-muted hover:text-text-base">
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            )}
            <span className="text-xs text-text-muted">{chat.participants.length} members</span>

            {editingDesc ? (
              <div className="flex flex-col gap-1 w-full mt-1">
                <textarea
                  className="w-full text-xs text-text-base bg-bg-main border border-border-input rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  rows={3}
                  maxLength={300}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => updateDescMutation.mutate()} isLoading={updateDescMutation.isPending} className="h-7 w-7">
                    <Check size={13} className="text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setEditingDesc(false); setNewDesc(chat.description ?? ''); }} className="h-7 w-7">
                    <X size={13} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1 mt-0.5">
                <span className="text-xs text-text-muted italic flex-1">
                  {chat.description || (isAdmin ? 'Add a description...' : '')}
                </span>
                {isAdmin && (
                  <button type="button" onClick={() => { setNewDesc(chat.description ?? ''); setEditingDesc(true); }} className="text-text-muted hover:text-text-base flex-shrink-0">
                    <Pencil size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Members</span>
            {sortedParticipants.map((p) => {
              const isParticipantAdmin = chat.admins?.some((a) => a._id === p._id) ?? false;
              const isOwnerParticipant = p._id === ownerId;
              return (
                <div key={p._id} className="flex items-center gap-2 py-1.5">
                  <button
                    type="button"
                    disabled={p._id === currentUserId}
                    onClick={() => p._id !== currentUserId && onOpenDirectChat(p._id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left disabled:cursor-default hover:opacity-80 transition-opacity"
                  >
                    <Avatar src={p.profileImageUrl} name={p.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-text-base truncate">{p.username}</span>
                        {isOwnerParticipant && <span title="Owner"><Shield size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" /></span>}
                        {isParticipantAdmin && !isOwnerParticipant && <Shield size={11} className="text-primary flex-shrink-0" />}
                      </div>
                    </div>
                  </button>
                  {isAdmin && p._id !== currentUserId && !isOwnerParticipant && (
                    <div className="flex gap-1">
                      {isParticipantAdmin ? (
                        <button
                          type="button"
                          title="Remove admin"
                          onClick={() => setPendingConfirm({
                            message: `Remove ${p.username}'s admin rights?`,
                            action: () => removeAdminMutation.mutate(p._id),
                            confirmLabel: 'Remove Admin',
                            destructive: true,
                          })}
                          className="text-text-muted hover:text-destructive transition-colors"
                        >
                          <ShieldOff size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Make admin"
                          onClick={() => setPendingConfirm({
                            message: `Make ${p.username} an admin?`,
                            action: () => addAdminMutation.mutate(p._id),
                            confirmLabel: 'Make Admin',
                          })}
                          className="text-text-muted hover:text-primary transition-colors"
                        >
                          <Shield size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => setPendingConfirm({
                          message: `Remove ${p.username} from the group?`,
                          action: () => removeMemberMutation.mutate(p._id),
                          confirmLabel: 'Remove',
                          destructive: true,
                        })}
                        className="text-text-muted hover:text-destructive transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <div>
              {addingUsers ? (
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                  {selectedToAdd.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedToAdd.map((u) => (
                        <span key={u._id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                          {u.username}
                          <button type="button" onClick={() => setSelectedToAdd((prev) => prev.filter((x) => x._id !== u._id))}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {filteredSearchResults?.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => setSelectedToAdd((prev) => [...prev, u])}
                      className="flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-bg-muted transition-colors"
                    >
                      <Avatar src={u.profileImageUrl} name={u.username} size="sm" />
                      <span className="text-sm text-text-base">{u.username}</span>
                    </button>
                  ))}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addMembersMutation.mutate()} disabled={selectedToAdd.length === 0} isLoading={addMembersMutation.isPending} className="flex-1">
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingUsers(false); setSelectedToAdd([]); setUserSearch(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setAddingUsers(true)} className="w-full gap-1.5">
                  <UserPlus size={14} />
                  Add Members
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border-muted">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPendingConfirm({
                message: 'Are you sure you want to leave this group?',
                action: () => leaveMutation.mutate(),
                confirmLabel: 'Leave',
                destructive: true,
              })}
              isLoading={leaveMutation.isPending}
              className="w-full gap-1.5 text-destructive hover:bg-bg-muted"
            >
              <LogOut size={14} />
              Leave Group
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPendingConfirm({
                  message: 'Delete this group? All messages will be permanently lost.',
                  action: () => deleteMutation.mutate(),
                  confirmLabel: 'Delete',
                  destructive: true,
                })}
                isLoading={deleteMutation.isPending}
                className="w-full gap-1.5 text-destructive hover:bg-bg-muted"
              >
                <Trash2 size={14} />
                Delete Group
              </Button>
            )}
          </div>
        </div>
      </div>

      {pendingConfirm && (
        <ConfirmDialog
          message={pendingConfirm.message}
          confirmLabel={pendingConfirm.confirmLabel}
          destructive={pendingConfirm.destructive}
          onConfirm={() => { pendingConfirm.action(); setPendingConfirm(null); }}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </>
  );
}

export function CommunityPage(): JSX.Element {
  const { user, tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const currentUserId = user?.id ?? '';

  const [selectedChat, setSelectedChat] = useState<IChat | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [chatFilter, setChatFilter] = useState('');
  const [newChatId, setNewChatId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChatIdRef = useRef<string | null>(null);
  const selectedChatRef = useRef<IChat | null>(selectedChat);
  selectedChatRef.current = selectedChat;

  const { data: chats = [], isLoading: chatsLoading, error: chatsError } = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
  });

  const onSocketMessage = useCallback((raw: SocketMessage) => {
    setSelectedChat((current) => {
      if (!current || raw.chatId !== current._id) return current;
      const mapped = mapSocketMessage(raw, current.participants);
      setMessages((prev) => {
        if (prev.find((m) => m._id === mapped._id)) return prev;
        return [...prev, mapped];
      });
      return current;
    });
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  }, [queryClient]);

  const onSocketTyping = useCallback((data: { userId: string; isTyping: boolean }) => {
    if (data.isTyping) {
      setTypingUsers((prev) => prev.includes(data.userId) ? prev : [...prev, data.userId]);
    } else {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    }
  }, []);

  const onGroupEvent = useCallback((event: string, data: ChatGroupEvent) => {
    const { chatId } = data;

    if (event === 'message_liked') {
      const messageId = data.messageId as string;
      const likes = data.likes as string[];
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, likes } : m));
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['chats'] });

    const chat = selectedChatRef.current;
    if (chat && chat._id === chatId) {
      const findName = (uid: string) => chat.participants.find((p) => p._id === uid)?.username ?? 'Someone';
      let sysContent: string | null = null;
      if (event === 'member_added') {
        const addedUsers = data.addedUsers as { _id: string; username: string }[] | undefined;
        const ids = data.addedUserIds as string[];
        const resolveName = (uid: string) =>
          addedUsers?.find((u) => u._id === uid)?.username ?? findName(uid);
        if (ids.length >= 10) {
          sysContent = `${ids.length} users were added`;
        } else {
          const now = Date.now();
          const sysMsgs: IMessage[] = ids.map((uid, i) => ({
            _id: `sys-${now}-${i}`,
            chatId,
            senderId: '',
            senderName: '',
            content: `${resolveName(uid)} was added`,
            createdAt: new Date().toISOString(),
            likes: [],
            type: 'system' as const,
          }));
          setMessages((prev) => [...prev, ...sysMsgs]);
        }
      } else if (event === 'member_removed') {
        sysContent = `${findName(data.removedUserId as string)} was removed`;
      } else if (event === 'member_left') {
        sysContent = `${findName(data.userId as string)} left the group`;
      } else if (event === 'admin_added') {
        sysContent = `${findName(data.userId as string)} is now an admin`;
      } else if (event === 'admin_removed') {
        sysContent = `${findName(data.userId as string)} is no longer an admin`;
      } else if (event === 'group_renamed') {
        sysContent = `Group renamed to "${data.name as string}"`;
      }
      if (sysContent) {
        const sysMsg: IMessage = {
          _id: `sys-${Date.now()}-${Math.random()}`,
          chatId,
          senderId: '',
          senderName: '',
          content: sysContent,
          createdAt: new Date().toISOString(),
          likes: [],
          type: 'system',
        };
        setMessages((prev) => [...prev, sysMsg]);
      }
    }

    setSelectedChat((current) => {
      if (!current || current._id !== chatId) return current;

      if (event === 'group_renamed') {
        return { ...current, name: data.name as string };
      }
      if (event === 'group_updated') {
        return {
          ...current,
          ...(data.description !== undefined ? { description: data.description as string | null } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl as string } : {}),
        };
      }
      if (event === 'admin_added') {
        const newAdmin = current.participants.find((p) => p._id === (data.userId as string));
        if (!newAdmin || current.admins.some((a) => a._id === newAdmin._id)) return current;
        return { ...current, admins: [...current.admins, newAdmin] };
      }
      if (event === 'admin_removed') {
        return { ...current, admins: current.admins.filter((a) => a._id !== (data.userId as string)) };
      }
      if (event === 'member_removed' || event === 'member_left') {
        const removedId = (event === 'member_removed' ? data.removedUserId : data.userId) as string;
        if (removedId === currentUserId) {
          setMessages([]);
          setShowGroupInfo(false);
          setShowMobileChat(false);
          return null;
        }
        return {
          ...current,
          participants: current.participants.filter((p) => p._id !== removedId),
          admins: current.admins.filter((a) => a._id !== removedId),
        };
      }
      if (event === 'group_deleted') {
        setMessages([]);
        setShowGroupInfo(false);
        setShowMobileChat(false);
        return null;
      }
      return current;
    });
  }, [queryClient, currentUserId]);

  const { joinRoom, leaveRoom, sendMessage, emitTyping } = useChatSocket(onSocketMessage, onSocketTyping, onGroupEvent);

  useEffect(() => {
    if (!selectedChat) return;
    const chatId = selectedChat._id;

    if (prevChatIdRef.current && prevChatIdRef.current !== chatId) {
      leaveRoom(prevChatIdRef.current);
    }
    prevChatIdRef.current = chatId;
    joinRoom(chatId);
    setTypingUsers([]);
    setMessages([]);
    setMessagesLoading(true);

    fetchMessagesWithParticipants(chatId, selectedChat.participants).then((msgs) => {
      setMessages(msgs);
      setMessagesLoading(false);
    });

    markAsRead(chatId).then(() => queryClient.invalidateQueries({ queryKey: ['chats'] }));

    return () => { leaveRoom(chatId); };
  }, [selectedChat?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const likeMutation = useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: string }) =>
      toggleMessageLike(chatId, messageId),
    onSuccess: ({ _id, likes }) => {
      setMessages((prev) => prev.map((m) => m._id === _id ? { ...m, likes } : m));
    },
  });

  const createDirectChatMutation = useMutation({
    mutationFn: async (userId: string): Promise<{ chat: IChat; isNew: boolean }> => {
      const existing = await fetchChatWith(userId);
      if (existing) return { chat: existing, isNew: false };
      const created = await createDirectChat(userId);
      return { chat: created, isNew: true };
    },
    onSuccess: ({ chat, isNew }) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setNewChatId(isNew ? chat._id : null);
      setSelectedChat(chat);
      setShowNewChat(false);
      setShowGroupInfo(false);
      setShowMobileChat(true);
    },
  });

  async function maybeDeleteEmptyNewChat(chatId: string) {
    if (newChatId === chatId && messages.length === 0) {
      try {
        await deleteDirectChat(chatId);
        queryClient.setQueryData<IChat[]>(['chats'], (prev) => prev?.filter((c) => c._id !== chatId) ?? []);
      } catch {
        // ignore — already deleted or had messages
      }
    }
    setNewChatId(null);
  }

  function handleSendMessage() {
    const content = messageInput.trim();
    if (!content || !selectedChat) return;
    if (newChatId === selectedChat._id) setNewChatId(null);
    setMessageInput('');
    emitTyping(selectedChat._id, false);
    sendMessage(selectedChat._id, content);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMessageInput(e.target.value);
    if (!selectedChat) return;
    emitTyping(selectedChat._id, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping(selectedChat._id, false), 2000);
  }

  function handleSelectChat(chat: IChat) {
    if (selectedChat && newChatId === selectedChat._id) {
      void maybeDeleteEmptyNewChat(selectedChat._id);
    }
    setSelectedChat(chat);
    setShowGroupInfo(false);
    setShowMobileChat(true);
  }

  function handleBackToList() {
    if (selectedChat && newChatId === selectedChat._id) {
      void maybeDeleteEmptyNewChat(selectedChat._id);
    }
    setShowMobileChat(false);
  }

  function handleGroupCreated(chat: IChat) {
    queryClient.invalidateQueries({ queryKey: ['chats'] });
    setSelectedChat(chat);
    setShowNewGroup(false);
    setShowMobileChat(true);
  }

  function handleChatLeft() {
    setNewChatId(null);
    setSelectedChat(null);
    setMessages([]);
    setShowGroupInfo(false);
    setShowMobileChat(false);
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  }

  function handleOpenDirectChat(userId: string) {
    setShowGroupInfo(false);
    createDirectChatMutation.mutate(userId);
  }

  const selectedChatName = selectedChat
    ? (selectedChat.type === 'group'
      ? (selectedChat.name ?? 'Group')
      : (selectedChat.participants.find((p) => p._id !== currentUserId)?.username ?? 'Chat'))
    : '';

  const selectedChatAvatar = selectedChat
    ? (selectedChat.type === 'group'
      ? selectedChat.imageUrl
      : selectedChat.participants.find((p) => p._id !== currentUserId)?.profileImageUrl)
    : null;

  const typingNames = typingUsers
    .map((id) => selectedChat?.participants.find((p) => p._id === id)?.username)
    .filter(Boolean);

  const isConnected = !!tokens;

  const visibleChats = chats.filter((c) => {
    if (!chatFilter.trim()) return true;
    const term = chatFilter.toLowerCase();
    if (c.type === 'group') return (c.name ?? '').toLowerCase().includes(term);
    const other = c.participants.find((p) => p._id !== currentUserId);
    return other?.username.toLowerCase().includes(term) ?? false;
  });

  return (
    <div className="h-full flex bg-bg-main overflow-hidden">
      {/* Left panel: chat list */}
      <div className={cn(
        'flex flex-col w-full md:w-80 lg:w-72 flex-shrink-0 border-r border-border-default bg-bg-card relative',
        showMobileChat ? 'hidden md:flex' : 'flex',
      )}>
        <div className="px-3 pt-4 pb-2 border-b border-border-default flex flex-col gap-2">
          <h1 className="text-base font-bold text-text-base">Community</h1>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-border-input bg-bg-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Filter chats..."
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 pb-16">
          {chatsError ? (
            <ErrorAlert message="Failed to load chats" />
          ) : chatsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : visibleChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
              <MessageCircle size={36} className="opacity-30" />
              <p className="text-sm">{chatFilter ? 'No matching chats' : 'No chats yet'}</p>
            </div>
          ) : (
            visibleChats.map((chat) => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                currentUserId={currentUserId}
                isSelected={selectedChat?._id === chat._id}
                onClick={() => handleSelectChat(chat)}
              />
            ))
          )}
        </div>

        {/* FAB backdrop */}
        {showFab && <div className="fixed inset-0 z-10" onClick={() => setShowFab(false)} />}

        {/* FAB */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
          {showFab && (
            <div className="flex flex-col items-end gap-2 mb-1">
              <button
                type="button"
                onClick={() => { setShowNewChat(true); setShowFab(false); }}
                className="flex items-center gap-2 bg-bg-card border border-border-default text-text-base text-sm px-3 py-2 rounded-full shadow-md hover:bg-bg-muted transition-colors whitespace-nowrap"
              >
                <MessageCircle size={14} className="text-primary" />
                New Chat
              </button>
              <button
                type="button"
                onClick={() => { setShowNewGroup(true); setShowFab(false); }}
                className="flex items-center gap-2 bg-bg-card border border-border-default text-text-base text-sm px-3 py-2 rounded-full shadow-md hover:bg-bg-muted transition-colors whitespace-nowrap"
              >
                <Users size={14} className="text-primary" />
                New Group
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFab((v) => !v)}
            className={cn(
              'w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all',
              showFab && 'rotate-45',
            )}
            aria-label="New conversation"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Right panel: chat window */}
      <div className={cn(
        'flex flex-1 overflow-hidden',
        !showMobileChat ? 'hidden md:flex' : 'flex',
      )}>
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted">
            <MessageCircle size={48} className="opacity-20" />
            <p className="text-sm">Select a chat to start messaging</p>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default bg-bg-card flex-shrink-0">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="md:hidden text-text-muted hover:text-text-base transition-colors mr-1"
                >
                  <ArrowLeft size={20} />
                </button>
                {selectedChat.type === 'group' ? (
                  <button
                    type="button"
                    onClick={() => setShowGroupInfo((v) => !v)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <Avatar src={selectedChatAvatar} name={selectedChatName} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-base truncate">{selectedChatName}</p>
                      <p className="text-xs text-text-muted">{selectedChat.participants.length} members</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar src={selectedChatAvatar} name={selectedChatName} />
                    <p className="text-sm font-semibold text-text-base truncate">{selectedChatName}</p>
                  </div>
                )}
                {selectedChat.type === 'group' && (
                  <button
                    type="button"
                    onClick={() => setShowGroupInfo((v) => !v)}
                    className={cn(
                      'text-text-muted hover:text-text-base transition-colors',
                      showGroupInfo && 'text-primary hover:text-primary',
                    )}
                  >
                    <Users size={18} />
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-4 py-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-text-muted">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const showSep = i === 0 || !isSameDay(msg.createdAt, messages[i - 1].createdAt);
                    return (
                      <Fragment key={msg._id}>
                        {showSep && (
                          <div className="flex items-center gap-2 py-1">
                            <div className="flex-1 h-px bg-border-default" />
                            <span className="text-xs text-text-muted px-1">{getDayLabel(msg.createdAt)}</span>
                            <div className="flex-1 h-px bg-border-default" />
                          </div>
                        )}
                        {msg.type === 'system' ? (
                          <div className="flex justify-center">
                            <span className="text-xs text-text-muted bg-bg-card border border-border-default px-3 py-0.5 rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        ) : (
                          <MessageBubble
                            msg={msg}
                            isOwn={msg.senderId === currentUserId}
                            currentUserId={currentUserId}
                            onAvatarClick={selectedChat.type === 'group' && msg.senderId !== currentUserId ? handleOpenDirectChat : undefined}
                            onLike={(messageId) => likeMutation.mutate({ chatId: selectedChat._id, messageId })}
                          />
                        )}
                      </Fragment>
                    );
                  })
                )}
                {typingNames.length > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-text-muted">{typingNames.join(', ')} typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send input */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-border-default bg-bg-card flex-shrink-0">
                <input
                  className="flex-1 h-10 px-3 text-sm rounded-md border border-border-input bg-bg-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  disabled={!isConnected}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isConnected}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>

            {/* Group info panel */}
            {showGroupInfo && selectedChat.type === 'group' && (
              <GroupInfoPanel
                chat={selectedChat}
                currentUserId={currentUserId}
                onClose={() => setShowGroupInfo(false)}
                onChatUpdate={(updated) => {
                  setSelectedChat(updated);
                  queryClient.invalidateQueries({ queryKey: ['chats'] });
                }}
                onChatLeft={handleChatLeft}
                onOpenDirectChat={handleOpenDirectChat}
              />
            )}
          </>
        )}
      </div>

      {showNewGroup && (
        <NewGroupModal
          currentUserId={currentUserId}
          onClose={() => setShowNewGroup(false)}
          onCreated={handleGroupCreated}
        />
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={(userId) => createDirectChatMutation.mutate(userId)}
        />
      )}
    </div>
  );
}
