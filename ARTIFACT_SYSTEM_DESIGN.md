# Visual Artifact System Design

## 🎯 Core Design Principles

**Renter Education First**: Every artifact should directly help users make better rental decisions
**Progressive Enhancement**: Text responses work standalone, artifacts add value
**Contextual Relevance**: Artifacts appear when they provide actionable insights
**Performance**: Fast loading, responsive interactions

---

## 🏗️ Layout Architecture Options

### **Option A: Right Panel Split Layout (Recommended)**
```
┌─────────────────┬─────────────────┐
│                 │                 │
│   Chat Stream   │   Artifacts     │
│                 │   Panel         │
│   Messages +    │                 │
│   Input         │   [Chart]       │
│                 │   [Table]       │
│                 │   [Map]         │
│                 │                 │
│                 │   Scroll ↕      │
└─────────────────┴─────────────────┘
     60%              40%
```

**Pros:**
- Simultaneous chat + data viewing
- Familiar pattern (Claude Desktop, GitHub Copilot)
- Persistent artifact access during conversation
- Natural for data comparison workflows

**Cons:**
- Reduced chat space on smaller screens
- Complexity in responsive design

### **Option B: Modal/Overlay System**
```
┌─────────────────────────────────────┐
│                                     │
│        Full-Width Chat              │
│                                     │
│   [Click artifact preview]          │
│                                     │
└─────────────────────────────────────┘
            ↓ triggers
┌─────────────────────────────────────┐
│  ╔═══════════════════════════════╗  │
│  ║                               ║  │
│  ║      Artifact Modal           ║  │
│  ║                               ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘
```

**Pros:**
- Full-screen artifacts for detailed analysis
- Simpler responsive implementation
- Maintains chat focus

**Cons:**
- Context switching between chat and artifacts
- No simultaneous viewing

### **Option C: Expandable Inline Cards**
```
┌─────────────────────────────────────┐
│  User: What's the market trend?     │
│  AI: Based on data analysis...      │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 📊 Rent Trend Chart            │ │
│  │ ┌─────────────────────────────┐ │ │
│  │ │     [Expandable Chart]      │ │ │
│  │ └─────────────────────────────┘ │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 🏠 Comparable Properties        │ │
│  │ ┌─────────────────────────────┐ │ │
│  │ │     [Expandable Table]      │ │ │
│  │ └─────────────────────────────┘ │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Pros:**
- Context preserved in chat flow
- Progressive disclosure
- Mobile-friendly

**Cons:**
- Chat becomes lengthy with many artifacts
- Difficult to compare multiple artifacts

---

## 🔧 Technical Architecture

### **Component Hierarchy**
```typescript
// Main Layout Component
<TenantNegotiatorApp>
  <ChatInterface>
    <ChatMessages />
    <ChatInput />
  </ChatInterface>
  
  <ArtifactPanel> // Right panel
    <ArtifactContainer>
      <ArtifactHeader />
      <ArtifactRenderer artifact={currentArtifact} />
      <ArtifactActions />
    </ArtifactContainer>
    
    <ArtifactHistory>
      <ArtifactThumbnail />
      <ArtifactThumbnail />
    </ArtifactHistory>
  </ArtifactPanel>
</TenantNegotiatorApp>
```

### **State Management Strategy**
```typescript
// Zustand store for artifact state
interface ArtifactStore {
  artifacts: VisualArtifact[];
  currentArtifact: string | null;
  panelVisible: boolean;
  
  // Actions
  addArtifact: (artifact: VisualArtifact) => void;
  setCurrentArtifact: (id: string) => void;
  togglePanel: () => void;
  clearArtifacts: () => void;
}

// Chat integration
interface ChatMessage {
  id: string;
  content: string;
  artifacts?: string[]; // References to artifact IDs
  timestamp: Date;
}
```

### **Artifact Component Registry**
```typescript
// Dynamic component loading
const ARTIFACT_COMPONENTS = {
  'rent-trend-chart': lazy(() => import('./artifacts/RentTrendChart')),
  'property-comparison': lazy(() => import('./artifacts/PropertyComparison')),
  'negotiation-roadmap': lazy(() => import('./artifacts/NegotiationRoadmap')),
  'market-heatmap': lazy(() => import('./artifacts/MarketHeatmap')),
  'affordability-calculator': lazy(() => import('./artifacts/AffordabilityCalculator')),
  'lease-analyzer': lazy(() => import('./artifacts/LeaseAnalyzer')),
  'script-generator': lazy(() => import('./artifacts/ScriptGenerator'))
};

// Renderer component
const ArtifactRenderer = ({ artifact }: { artifact: VisualArtifact }) => {
  const Component = ARTIFACT_COMPONENTS[artifact.type];
  
  return (
    <Suspense fallback={<ArtifactSkeleton />}>
      <Component data={artifact.data} />
    </Suspense>
  );
};
```

---

## 📱 Responsive Design Strategy

### **Desktop (1200px+)**
- Full right panel layout (60/40 split)
- Rich interactive artifacts
- Multiple artifacts visible simultaneously

### **Tablet (768px - 1199px)**
- Collapsible right panel
- Overlay mode for detailed artifact viewing
- Swipe gestures for artifact navigation

### **Mobile (< 768px)**
- Full-screen chat by default
- Bottom sheet for artifacts
- Simplified artifact components
- Touch-optimized interactions

```typescript
// Responsive hooks
const useArtifactLayout = () => {
  const { width } = useWindowSize();
  
  if (width >= 1200) return 'split-panel';
  if (width >= 768) return 'collapsible-panel';
  return 'bottom-sheet';
};
```

---

## 🔄 Data Flow & Integration

### **Enhanced Chat Response Processing**
```typescript
// Updated chat-ai-enhanced function response
interface EnhancedChatResponse {
  text: string;
  artifacts: VisualArtifact[];
  metadata: {
    contextUsed: string[];
    confidence: number;
    triggerWords: string[];
  };
}

// Frontend processing
const processChatResponse = (response: EnhancedChatResponse) => {
  // Add message to chat
  addMessage({
    content: response.text,
    artifacts: response.artifacts.map(a => a.id)
  });
  
  // Process artifacts
  response.artifacts.forEach(artifact => {
    addArtifact(artifact);
    
    // Auto-focus first high-priority artifact
    if (artifact.priority === 'high' && !currentArtifact) {
      setCurrentArtifact(artifact.id);
      setPanelVisible(true);
    }
  });
};
```

### **Artifact Generation Rules**
```typescript
// Server-side artifact generation logic
const generateArtifacts = (userMessage: string, aiResponse: string, tools: any[]) => {
  const artifacts: VisualArtifact[] = [];
  
  // Market analysis triggers
  if (containsMarketAnalysis(userMessage)) {
    artifacts.push(createRentTrendChart(tools.rent_predictions));
    artifacts.push(createMarketPositionIndicator(tools.market_data));
  }
  
  // Property comparison triggers
  if (containsPropertyDetails(userMessage)) {
    artifacts.push(createPropertyComparison(extractedProperties));
    artifacts.push(createNegotiationRoadmap(analysisResults));
  }
  
  // Location analysis triggers
  if (containsLocationQuery(userMessage)) {
    artifacts.push(createNeighborhoodHeatmap(locationData));
  }
  
  return artifacts;
};
```

---

## 🎨 User Experience Features

### **Artifact Management**
- **History**: Previous artifacts accessible in sidebar
- **Bookmarking**: Save important analyses for later
- **Sharing**: Export artifacts as images/PDFs
- **Customization**: Adjust chart parameters, filters

### **Interactive Features**
- **Cross-Artifact Navigation**: Click map points to load property comparisons
- **Real-time Updates**: Live market data refreshing
- **Collaborative Elements**: Share analysis with roommates/family

### **Progressive Enhancement**
1. **Level 1**: Text response works standalone
2. **Level 2**: Static artifact (chart image) appears
3. **Level 3**: Interactive artifact loads with hover/click
4. **Level 4**: Cross-artifact interactions and real-time data

---

## 🚀 Implementation Roadmap

### **Phase 1: Foundation (Week 1-2)**
- [ ] Right panel layout implementation
- [ ] Basic artifact container and routing
- [ ] Simple chart component (rent trends)
- [ ] State management setup

### **Phase 2: Core Artifacts (Week 3-4)**
- [ ] Property comparison tables
- [ ] Market position indicators
- [ ] Negotiation roadmap builder
- [ ] Responsive design implementation

### **Phase 3: Advanced Features (Week 5-6)**
- [ ] Interactive maps integration
- [ ] Real-time data connections
- [ ] Export/sharing functionality
- [ ] Artifact history and bookmarking

### **Phase 4: Polish & Optimization (Week 7-8)**
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] User testing and refinements
- [ ] Analytics and usage tracking

---

## 💭 Recommended Starting Approach

**Start with Right Panel Split Layout** because:
1. **User Research**: Claude Desktop pattern is proven effective
2. **Renter Context**: Property analysis requires simultaneous data viewing
3. **Technical Simplicity**: Clear separation of concerns
4. **Scalability**: Easy to add new artifact types

**First Artifacts to Implement**:
1. **Rent Trend Chart** - High visual impact, uses existing prediction data
2. **Property Comparison Table** - Essential for negotiation prep
3. **Market Position Indicator** - Simple but valuable visual context

Would you like me to start implementing the right panel layout and basic artifact system?