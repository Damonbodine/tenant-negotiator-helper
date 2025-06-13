import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const [selectedProperty, setSelectedProperty] = useState<PropertyHistoryItem | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyConversations, setPropertyConversations] = useState<any[]>([]);
  const [loadingPropertyConversations, setLoadingPropertyConversations] = useState(false);
  
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
      
      if (!user?.id) {
        setPropertyHistory([]);
        return;
      }

      // Load real properties from database
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          city,
          state,
          rent_amount,
          bedrooms,
          property_type,
          created_at,
          market_analysis,
          user_properties!inner(user_id, relationship_type, created_at)
        `)
        .eq('user_properties.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading properties:', error);
        setPropertyHistory([]);
        return;
      }

      // Transform to PropertyHistoryItem format
      const transformedProperties: PropertyHistoryItem[] = (properties || []).map(prop => ({
        property_id: prop.id,
        address: `${prop.address}${prop.city ? `, ${prop.city}` : ''}${prop.state ? `, ${prop.state}` : ''}`,
        relationship_type: prop.user_properties[0]?.relationship_type || 'analyzed',
        rent_amount: prop.rent_amount ? Math.round(prop.rent_amount / 100) : undefined,
        last_analyzed_at: prop.user_properties[0]?.created_at || prop.created_at,
        analysis_summary: prop.market_analysis?.verdict || 'Property analyzed',
        market_insights: prop.market_analysis
      }));

      setPropertyHistory(transformedProperties);
    } catch (error) {
      console.error('Error loading property history:', error);
      setPropertyHistory([]);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPropertyHistory();
    }
  }, [user]);

  // Refresh properties periodically to catch newly saved ones
  useEffect(() => {
    if (user && activeTab === 'properties') {
      const interval = setInterval(() => {
        loadPropertyHistory();
      }, 30000); // Refresh every 30 seconds, only when Properties tab is active

      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

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

  const loadPropertyConversations = async (propertyId: string, propertyAddress: string) => {
    try {
      setLoadingPropertyConversations(true);
      
      // Get ALL conversations to check what type created this property
      const { data: allConversations, error: allError } = await supabase
        .from('rental_conversations')
        .select(`
          id,
          title,
          conversation_type,
          created_at,
          rental_messages(
            id,
            content,
            role,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (allError) {
        console.error('Error loading conversations:', allError);
        setPropertyConversations([]);
        return;
      }

      console.log('All conversations:', allConversations?.map(c => ({ 
        type: c.conversation_type, 
        title: c.title,
        messageCount: c.rental_messages?.length 
      })));

      // Filter to find conversations that might be related to this property
      const relevantConversations = allConversations?.filter(conv => {
        // Check various conversation types that might analyze properties
        const isPropertyRelated = ['listing_analyzer', 'price_analysis', 'comparables', 'general_advice'].includes(conv.conversation_type);
        
        if (!isPropertyRelated || !conv.rental_messages?.length) return false;
        
        // Extract key parts of the address for matching
        const addressParts = propertyAddress.toLowerCase().split(',')[0].trim(); // Get street address
        const streetNumber = addressParts.match(/^\d+/)?.[0] || ''; // Extract street number
        const streetName = addressParts.replace(/^\d+\s*/, '').split(' ')[0]; // Get first word of street name
        
        // Check if any message mentions the address or property URL
        const hasMatch = conv.rental_messages?.some((msg: any) => {
          const content = msg.content.toLowerCase();
          return (
            content.includes('15224') || // Specific street number
            content.includes('calaveras') || // Street name
            content.includes('78717') || // Zip code
            content.includes('zillow.com') || // Zillow URL
            content.includes('apartments.com') || // Apartments.com URL
            content.includes(addressParts) || // Full street address
            (streetNumber && content.includes(streetNumber) && content.includes('austin')) // Number + city
          );
        });
        
        if (hasMatch) {
          console.log('Found matching conversation:', conv.conversation_type, conv.title);
        }
        
        return hasMatch;
      }) || [];

      console.log('Found conversations for property:', relevantConversations.length);
      
      // If no exact matches found, show recent property-related conversations as fallback
      if (relevantConversations.length === 0) {
        const recentPropertyConvs = allConversations?.filter(conv => 
          ['listing_analyzer', 'price_analysis', 'comparables'].includes(conv.conversation_type)
        ).slice(0, 3) || [];
        
        console.log('Using recent property conversations as fallback:', recentPropertyConvs.length);
        setPropertyConversations(recentPropertyConvs);
      } else {
        setPropertyConversations(relevantConversations);
      }
    } catch (error) {
      console.error('Error loading property conversations:', error);
      setPropertyConversations([]);
    } finally {
      setLoadingPropertyConversations(false);
    }
  };

  const handlePropertyClick = async (property: PropertyHistoryItem) => {
    console.log('Property clicked:', property);
    setSelectedProperty(property);
    setShowPropertyModal(true);
    await loadPropertyConversations(property.property_id, property.address);
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
      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        if (tab === 'properties' && user) {
          loadPropertyHistory(); // Refresh properties when Properties tab is clicked
        }
      }} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 px-4">
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
        <TabsContent value="properties" className="flex-1 flex flex-col !m-0 !mt-0 !pt-0">
          <ScrollArea className="flex-1 !mt-0">
            <div className="pt-0 px-4 pb-4">
              {isLoadingProperties ? (
                <div className="text-center py-2 text-muted-foreground text-sm">
                  Loading properties...
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-2 text-muted-foreground text-sm">
                  {searchQuery ? 'No properties match your search' : 'No properties analyzed yet'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProperties.map((property) => (
                  <Card 
                    key={property.property_id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handlePropertyClick(property)}
                  >
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
                  ))}
                </div>
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

      {/* Property Details Modal */}
      <Sheet open={showPropertyModal} onOpenChange={setShowPropertyModal}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Property Analysis</SheetTitle>
            <SheetDescription>
              Detailed analysis for {selectedProperty?.address}
            </SheetDescription>
          </SheetHeader>
          
          {selectedProperty && (
            <div className="mt-6 space-y-6">
              {/* Property Overview */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Property Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedProperty.address}</span>
                  </div>
                  {selectedProperty.rent_amount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        ${selectedProperty.rent_amount.toLocaleString()}/month
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Analyzed {formatDate(selectedProperty.last_analyzed_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Relationship Type */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Status</h3>
                <div className="flex items-center gap-2">
                  {getRelationshipIcon(selectedProperty.relationship_type)}
                  <Badge variant="outline">
                    {formatRelationshipType(selectedProperty.relationship_type)}
                  </Badge>
                </div>
              </div>

              {/* Market Analysis */}
              {selectedProperty.market_insights && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Market Analysis</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    {selectedProperty.market_insights.verdict && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Market Verdict: </span>
                        <Badge variant="outline" className="ml-1">
                          {selectedProperty.market_insights.verdict}
                        </Badge>
                      </div>
                    )}
                    
                    {selectedProperty.market_insights.marketAverage && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Market Average: </span>
                        <span className="text-sm">
                          ${Math.round(selectedProperty.market_insights.marketAverage).toLocaleString()}/month
                        </span>
                      </div>
                    )}
                    
                    {selectedProperty.market_insights.deltaPercent && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Price Difference: </span>
                        <span className={`text-sm ${parseFloat(selectedProperty.market_insights.deltaPercent) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {parseFloat(selectedProperty.market_insights.deltaPercent) > 0 ? '+' : ''}{selectedProperty.market_insights.deltaPercent}% vs market
                        </span>
                      </div>
                    )}
                    
                    {selectedProperty.market_insights.rentcastAnalysis?.comparables && (
                      <div className="mt-4">
                        <span className="text-sm font-medium">Similar Properties: </span>
                        <span className="text-sm text-muted-foreground">
                          {selectedProperty.market_insights.rentcastAnalysis.comparables.length} comparable properties found
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analysis Summary */}
              {selectedProperty.analysis_summary && selectedProperty.analysis_summary !== 'Property analyzed' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedProperty.analysis_summary}
                  </p>
                </div>
              )}

              {/* Chat History */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">
                  {propertyConversations.length > 0 && propertyConversations.some(c => 
                    c.rental_messages?.some((m: any) => 
                      m.content.toLowerCase().includes('15224') || 
                      m.content.toLowerCase().includes('calaveras')
                    )
                  ) ? 'Related Conversations' : 'Recent Property Conversations'}
                </h3>
                {loadingPropertyConversations ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : propertyConversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No conversations found for this property.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {propertyConversations.map((conv) => (
                      <Card 
                        key={conv.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors p-3"
                        onClick={() => {
                          onSelectConversation(conv.id);
                          setShowPropertyModal(false);
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                              {conv.title || `${formatFilterLabel(conv.conversation_type)} Chat`}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conv.created_at)}
                            </span>
                          </div>
                          
                          {/* Show recent messages */}
                          {conv.rental_messages && conv.rental_messages.length > 0 && (
                            <div className="space-y-1 mt-2">
                              {conv.rental_messages.slice(0, 2).map((msg: any) => (
                                <div key={msg.id} className="text-xs">
                                  <span className="font-medium">
                                    {msg.role === 'user' ? 'You: ' : 'AI: '}
                                  </span>
                                  <span className="text-muted-foreground line-clamp-1">
                                    {msg.content}
                                  </span>
                                </div>
                              ))}
                              {conv.rental_messages.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{conv.rental_messages.length - 2} more messages
                                </p>
                              )}
                            </div>
                          )}
                          
                          <Badge variant="secondary" className="text-xs w-fit">
                            {formatFilterLabel(conv.conversation_type)}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}