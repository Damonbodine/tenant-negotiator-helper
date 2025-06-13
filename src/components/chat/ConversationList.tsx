import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { MessageSquare, Home, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConversationSummary } from '@/hooks/useConversationHistory';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: ConversationSummary[];
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

export function ConversationList({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  isLoading 
}: ConversationListProps) {
  // Safe date formatting function
  const formatSafeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  // Group conversations by date
  const groupedConversations = groupConversationsByDate(conversations);

  const getConversationIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'listing_analyzer': <Home className="h-4 w-4" />,
      'comparables': <Home className="h-4 w-4" />,
      'negotiation_help': <MessageSquare className="h-4 w-4" />,
      'voice_chat': <MessageSquare className="h-4 w-4" />,
      'email_script_builder': <MessageSquare className="h-4 w-4" />,
      'price_analysis': <Home className="h-4 w-4" />,
      'general_advice': <MessageSquare className="h-4 w-4" />
    };
    
    return iconMap[type] || <MessageSquare className="h-4 w-4" />;
  };

  const getConversationTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'listing_analyzer': 'bg-blue-100 text-blue-800',
      'comparables': 'bg-green-100 text-green-800',
      'negotiation_help': 'bg-orange-100 text-orange-800',
      'voice_chat': 'bg-purple-100 text-purple-800',
      'email_script_builder': 'bg-pink-100 text-pink-800',
      'price_analysis': 'bg-indigo-100 text-indigo-800',
      'general_advice': 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const formatConversationType = (type: string) => {
    const typeMap: Record<string, string> = {
      'listing_analyzer': 'Listing',
      'comparables': 'Compare',
      'negotiation_help': 'Negotiate',
      'voice_chat': 'Voice',
      'email_script_builder': 'Script',
      'price_analysis': 'Price',
      'general_advice': 'General'
    };
    
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 border rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start a new chat to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedConversations).map(([dateGroup, groupConversations]) => (
        <div key={dateGroup}>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2 uppercase tracking-wide">
            {dateGroup}
          </h4>
          <div className="space-y-1">
            {groupConversations.map((conversation) => (
              <Button
                key={conversation.conversation_id}
                variant="ghost"
                className={cn(
                  "w-full justify-start p-3 h-auto text-left hover:bg-muted/50",
                  currentConversationId === conversation.conversation_id && "bg-muted border-l-2 border-primary"
                )}
                onClick={() => onSelectConversation(conversation.conversation_id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-0.5 text-muted-foreground">
                    {getConversationIcon(conversation.conversation_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {conversation.title || 'Untitled Conversation'}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs px-1.5 py-0.5", getConversationTypeColor(conversation.conversation_type))}
                      >
                        {formatConversationType(conversation.conversation_type)}
                      </Badge>
                    </div>
                    
                    {conversation.primary_property_address && (
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        📍 {conversation.primary_property_address}
                      </p>
                    )}
                    
                    {conversation.context_summary && (
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {conversation.context_summary}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatSafeDate(conversation.created_at)}</span>
                      {conversation.message_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{conversation.message_count} messages</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupConversationsByDate(conversations: ConversationSummary[]) {
  const groups: Record<string, ConversationSummary[]> = {};
  
  conversations.forEach(conversation => {
    const date = new Date(conversation.created_at);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date found in conversation:', conversation.conversation_id, conversation.created_at);
      return; // Skip this conversation
    }
    
    let groupKey: string;
    
    try {
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = 'This Week';
      } else {
        groupKey = format(date, 'MMMM yyyy');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conversation);
    } catch (error) {
      console.error('Error formatting date for conversation:', conversation.conversation_id, error);
    }
  });
  
  // Sort groups by recency
  const sortedGroups: Record<string, ConversationSummary[]> = {};
  const order = ['Today', 'Yesterday', 'This Week'];
  
  // Add predefined order groups first
  order.forEach(key => {
    if (groups[key]) {
      sortedGroups[key] = groups[key];
    }
  });
  
  // Add remaining groups (months) in reverse chronological order
  Object.keys(groups)
    .filter(key => !order.includes(key))
    .sort((a, b) => new Date(groups[b][0].created_at).getTime() - new Date(groups[a][0].created_at).getTime())
    .forEach(key => {
      sortedGroups[key] = groups[key];
    });
  
  return sortedGroups;
}