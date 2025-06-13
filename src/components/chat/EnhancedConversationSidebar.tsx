import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  X, 
  Settings,
  History,
  Home,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { ConversationList } from './ConversationList';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PropertyHistoryItem {
  property_id: string;
  address: string;
  relationship_type: 'target' | 'current' | 'comparable' | 'analyzed';
  rent_amount?: number;
  last_analyzed_at: string;
  analysis_summary?: string;
  market_insights?: any;
}

interface EnhancedConversationSidebarProps {
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  className?: string;
}

export function EnhancedConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  className
}: EnhancedConversationSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [propertyHistory, setPropertyHistory] = useState<PropertyHistoryItem[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');
  
  const {
    conversations,
    isLoading,
    error,
    loadRecentConversations
  } = useConversationHistory();


  // Load user's property history
  const loadPropertyHistory = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingProperties(true);
      
      // For now, let's just show mock property data until we have the correct schema
      // The properties table doesn't exist in the current database schema
      const mockProperties: PropertyHistoryItem[] = [
        {
          property_id: '1',
          address: '123 Main St, City, State',
          relationship_type: 'target',
          rent_amount: 2500,
          last_analyzed_at: new Date().toISOString(),
          analysis_summary: 'Great location with competitive pricing'
        },
        {
          property_id: '2', 
          address: '456 Oak Ave, City, State',
          relationship_type: 'comparable',
          rent_amount: 2300,
          last_analyzed_at: new Date(Date.now() - 86400000).toISOString(),
          analysis_summary: 'Similar unit, slightly lower rent'
        }
      ];
      
      setPropertyHistory(mockProperties);
    } catch (error) {
      console.error('Error loading property history:', error);
      setPropertyHistory([]); // Set empty array on error
    } finally {
      setIsLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPropertyHistory();
    }
  }, [user]);

  // Filter conversations based on search and type
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.primary_property_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.context_summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || conv.conversation_type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Filter properties based on search
  const filteredProperties = propertyHistory.filter(prop => {
    const matchesSearch = !searchQuery || 
      prop.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.analysis_summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
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

  const formatRelationshipType = (type: string) => {
    const labels = {
      'target': 'Target Property',
      'current': 'Current Rental',
      'comparable': 'Comparable',
      'analyzed': 'Analyzed'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'target': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'current': return <Home className="h-4 w-4 text-blue-500" />;
      case 'comparable': return <Building2 className="h-4 w-4 text-orange-500" />;
      case 'analyzed': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-900 border-r border-border h-full",
      "w-80 min-w-80", // Fixed width sidebar
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-lg">History & Context</h2>
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
            placeholder="Search conversations & properties..."
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
      </div>

      {/* Tabs for Conversations and Properties */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Properties
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="flex-1 flex flex-col m-0">
          {/* Type Filters */}
          {conversationTypes.length > 0 && (
            <div className="px-4 pb-3">
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
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-4 pb-3">
              <div className="p-3 text-sm text-destructive bg-destructive/10 border rounded">
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
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="flex-1 flex flex-col m-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {isLoadingProperties ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading properties...
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No properties match your search' : 'No properties analyzed yet'}
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <Card key={property.property_id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getRelationshipIcon(property.relationship_type)}
                          <Badge variant="outline" className="text-xs">
                            {formatRelationshipType(property.relationship_type)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(property.last_analyzed_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">
                            {property.address}
                          </span>
                        </div>
                        {property.rent_amount && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              ${property.rent_amount.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                        {property.analysis_summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {property.analysis_summary}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{propertyHistory.length} properties</span>
              {filteredProperties.length !== propertyHistory.length && (
                <span>{filteredProperties.length} filtered</span>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}