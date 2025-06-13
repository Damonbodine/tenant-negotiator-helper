import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  X, 
  ChevronLeft,
  Settings,
  History
} from 'lucide-react';
import { ConversationList } from './ConversationList';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  className?: string;
}

export function ConversationSidebar({
  isOpen,
  onToggle,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  className
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const {
    conversations,
    isLoading,
    error,
    loadRecentConversations
  } = useConversationHistory();

  // Filter conversations based on search and type
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.primary_property_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.context_summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || conv.conversation_type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get unique conversation types for filter
  const conversationTypes = [...new Set(conversations.map(conv => conv.conversation_type))];

  const formatFilterLabel = (type: string) => {
    const labels: Record<string, string> = {
      'listing_analyzer': 'Listings',
      'comparables': 'Comparisons',
      'negotiation_help': 'Negotiations',
      'voice_chat': 'Voice Chats',
      'email_script_builder': 'Scripts',
      'price_analysis': 'Analysis',
      'general_advice': 'General'
    };
    return labels[type] || type;
  };

  if (!isOpen) {
    return (
      <div className={cn("flex flex-col", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-10 h-10 p-0"
          title="Open conversation history"
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-900 border-r border-border h-full",
      "w-80 min-w-80", // Fixed width sidebar
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Conversations</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-8 h-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        {/* New Conversation Button */}
        <Button 
          onClick={onNewConversation}
          className="w-full mb-3"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Type Filters */}
        {conversationTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={filterType === 'all' ? 'default' : 'secondary'}
              className="cursor-pointer text-xs"
              onClick={() => setFilterType('all')}
            >
              All
            </Badge>
            {conversationTypes.map(type => (
              <Badge
                key={type}
                variant={filterType === type ? 'default' : 'secondary'}
                className="cursor-pointer text-xs"
                onClick={() => setFilterType(type)}
              >
                {formatFilterLabel(type)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border-b">
          <p>{error}</p>
          <Button
            variant="link"
            size="sm"
            onClick={loadRecentConversations}
            className="p-0 h-auto text-destructive"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <ConversationList
            conversations={filteredConversations}
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            isLoading={isLoading}
          />
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{conversations.length} conversations</span>
          {filteredConversations.length !== conversations.length && (
            <span>{filteredConversations.length} filtered</span>
          )}
        </div>
      </div>
    </div>
  );
}