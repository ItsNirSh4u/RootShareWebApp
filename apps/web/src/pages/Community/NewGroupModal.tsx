import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Search, Users, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { cn } from '@/lib/utils';
import { searchUsers, createGroupChat, uploadGroupImage, type IUser, type IChat } from './chat';

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

type NewGroupModalProps = {
  currentUserId: string;
  onClose: () => void;
  onCreated: (chat: IChat) => void;
};

export function NewGroupModal({ currentUserId: _currentUserId, onClose, onCreated }: NewGroupModalProps): JSX.Element {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selected, setSelected] = useState<IUser[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['users', 'search', userSearch],
    queryFn: () => searchUsers(userSearch),
    enabled: userSearch.length > 1,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const chat = await createGroupChat(groupName.trim(), selected.map((u) => u._id), groupDescription.trim() || undefined);
      if (selectedImage) {
        return uploadGroupImage(chat._id, selectedImage);
      }
      return chat;
    },
    onSuccess: onCreated,
  });

  const filteredResults = searchResults?.filter((u) => !selected.find((s) => s._id === u._id));
  const canCreate = groupName.trim().length >= 2 && selected.length >= 1;

  function toggleUser(u: IUser) {
    setSelected((prev) =>
      prev.find((s) => s._id === u._id) ? prev.filter((s) => s._id !== u._id) : [...prev, u],
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-bg-card border border-border-default rounded-xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="font-semibold text-text-base">New Group Chat</h2>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-base transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group flex-shrink-0"
              title="Set group photo"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Group" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-bg-muted border border-border-default flex items-center justify-center">
                  <ImagePlus size={20} className="text-text-muted group-hover:text-text-base transition-colors" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </button>

            <div className="flex-1">
              <Input
                label="Group name"
                placeholder="e.g. Plant Lovers"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                minLength={2}
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Description <span className="text-text-muted font-normal">(optional)</span></label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-md border border-border-input bg-bg-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
              placeholder="What's this group about?"
              rows={2}
              maxLength={300}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Add members</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className="w-full h-10 pl-8 pr-3 text-sm rounded-md border border-border-input bg-bg-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Search by username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <span
                  key={u._id}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                >
                  {u.username}
                  <button type="button" onClick={() => toggleUser(u)} className="hover:text-primary-hover">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {userSearch.length > 1 && (
            <div className="flex flex-col gap-1">
              {searching ? (
                <div className="flex justify-center py-3"><Spinner size="sm" /></div>
              ) : filteredResults && filteredResults.length > 0 ? (
                filteredResults.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleUser(u)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                      selected.find((s) => s._id === u._id)
                        ? 'bg-primary/10'
                        : 'hover:bg-bg-muted',
                    )}
                  >
                    {u.profileImageUrl ? (
                      <img src={u.profileImageUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary-foreground">{getInitials(u.username)}</span>
                      </div>
                    )}
                    <span className="text-sm text-text-base">{u.username}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-text-muted text-center py-2">No users found</p>
              )}
            </div>
          )}

          {createMutation.isError && <ErrorAlert message="Failed to create group" />}
        </div>

        <div className="px-4 py-3 border-t border-border-default flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canCreate}
            isLoading={createMutation.isPending}
            className="flex-1"
          >
            Create Group
          </Button>
        </div>
      </div>
    </div>
  );
}
