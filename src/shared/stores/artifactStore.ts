import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { VisualArtifact } from '@/shared/types/artifacts';

interface ArtifactStore {
  // State
  artifacts: VisualArtifact[];
  currentArtifactId: string | null;
  panelVisible: boolean;
  panelWidth: number;
  layoutMode: 'split' | 'overlay' | 'collapsed';
  
  // Actions
  addArtifact: (artifact: VisualArtifact) => void;
  addArtifacts: (artifacts: VisualArtifact[]) => void;
  setCurrentArtifact: (id: string | null) => void;
  removeArtifact: (id: string) => void;
  clearArtifacts: () => void;
  togglePanel: () => void;
  setPanelVisible: (visible: boolean) => void;
  setPanelWidth: (width: number) => void;
  setLayoutMode: (mode: 'split' | 'overlay' | 'collapsed') => void;
  
  // Utilities
  getArtifactsByPriority: () => VisualArtifact[];
  getArtifactsByType: (type: string) => VisualArtifact[];
  hasHighPriorityArtifacts: () => boolean;
  
  // Smart triggering
  triggerAffordabilityCalculator: (financialData?: { income?: number; rent?: number }) => void;
}

export const useArtifactStore = create<ArtifactStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        artifacts: [],
        currentArtifactId: null,
        panelVisible: false,
        panelWidth: 600, // Default panel width in pixels - increased for better affordability calculator display
        layoutMode: 'split',
        
        
        // Actions
        addArtifact: (artifact) => set((state) => {
          const exists = state.artifacts.some(a => a.id === artifact.id);
          if (exists) return state;
          
          const newArtifacts = [...state.artifacts, artifact];
          
          // Auto-focus first high priority artifact if none selected
          let newCurrentId = state.currentArtifactId;
          let newPanelVisible = state.panelVisible;
          
          if (!state.currentArtifactId && artifact.priority === 'high') {
            newCurrentId = artifact.id;
            newPanelVisible = true;
          }
          
          return {
            ...state,
            artifacts: newArtifacts,
            currentArtifactId: newCurrentId,
            panelVisible: newPanelVisible
          };
        }),
        
        addArtifacts: (artifacts) => set((state) => {
          const newArtifacts = [...state.artifacts];
          let newCurrentId = state.currentArtifactId;
          let newPanelVisible = state.panelVisible;
          
          artifacts.forEach(artifact => {
            const exists = newArtifacts.some(a => a.id === artifact.id);
            if (!exists) {
              newArtifacts.push(artifact);
              
              // Auto-focus first high priority artifact if none selected
              if (!newCurrentId && artifact.priority === 'high') {
                newCurrentId = artifact.id;
                newPanelVisible = true;
              }
            }
          });
          
          return {
            ...state,
            artifacts: newArtifacts,
            currentArtifactId: newCurrentId,
            panelVisible: newPanelVisible
          };
        }),
        
        setCurrentArtifact: (id) => set((state) => ({
          ...state,
          currentArtifactId: id,
          panelVisible: id ? true : state.panelVisible
        })),
        
        removeArtifact: (id) => set((state) => ({
          ...state,
          artifacts: state.artifacts.filter(a => a.id !== id),
          currentArtifactId: state.currentArtifactId === id ? null : state.currentArtifactId
        })),
        
        clearArtifacts: () => set((state) => ({
          ...state,
          artifacts: [],
          currentArtifactId: null,
          panelVisible: false
        })),
        
        togglePanel: () => set((state) => ({
          ...state,
          panelVisible: !state.panelVisible
        })),
        
        setPanelVisible: (visible) => set((state) => ({
          ...state,
          panelVisible: visible
        })),
        
        setPanelWidth: (width) => set((state) => ({
          ...state,
          panelWidth: Math.max(300, Math.min(800, width)) // Constrain between 300-800px
        })),
        
        setLayoutMode: (mode) => set((state) => ({
          ...state,
          layoutMode: mode,
          panelVisible: mode === 'collapsed' ? false : state.panelVisible
        })),
        
        // Utilities
        getArtifactsByPriority: () => {
          const { artifacts } = get();
          return [...artifacts].sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });
        },
        
        getArtifactsByType: (type) => {
          const { artifacts } = get();
          return artifacts.filter(a => a.type === type);
        },
        
        hasHighPriorityArtifacts: () => {
          const { artifacts } = get();
          return artifacts.some(a => a.priority === 'high');
        },
        
        // Smart triggering for affordability calculator
        triggerAffordabilityCalculator: (financialData = {}) => {
          const { artifacts, addArtifact } = get();
          
          // Check if affordability calculator already exists
          const existingCalculator = artifacts.find(a => a.type === 'affordability-calculator');
          if (existingCalculator) {
            console.log('Affordability calculator already exists, skipping trigger');
            return;
          }
          
          // Create new affordability calculator artifact
          const defaultIncome = 60000;
          const defaultRent = 2000;
          
          const calculatorArtifact: VisualArtifact = {
            id: `affordability-${Date.now()}`,
            type: 'affordability-calculator',
            title: 'Affordability Calculator',
            description: 'Analyze your rent affordability and find negotiation opportunities',
            priority: 'high',
            interactive: true,
            timestamp: new Date(),
            data: {
              income: financialData.income || defaultIncome,
              currentRent: financialData.rent || defaultRent,
              recommendedMax: (financialData.income || defaultIncome) * 0.3 / 12,
              savingsWithNegotiation: 0,
              breakdown: {
                thirtyPercent: ((financialData.income || defaultIncome) * 0.3 / 12),
                currentPercentage: ((financialData.rent || defaultRent) / ((financialData.income || defaultIncome) / 12)) * 100,
                postNegotiation: 0
              },
              recommendations: []
            }
          };
          
          console.log('🧮 Triggering affordability calculator with data:', financialData);
          addArtifact(calculatorArtifact);
        }
      }),
      {
        name: 'artifact-store',
        // Only persist layout preferences, not artifacts themselves
        partialize: (state) => ({
          panelWidth: state.panelWidth,
          layoutMode: state.layoutMode,
          panelVisible: state.panelVisible
        })
      }
    ),
    { name: 'artifact-store' }
  )
);

// Convenience hooks - optimized to prevent infinite loops
export const useCurrentArtifact = () => useArtifactStore(
  state => state.artifacts.find(a => a.id === state.currentArtifactId) || null
);

export const useArtifacts = () => useArtifactStore(state => state.artifacts);

// FIXED: Prevent infinite loops by using individual selectors instead of object creation
export const usePanelVisible = () => useArtifactStore(state => state.panelVisible);
export const usePanelWidth = () => useArtifactStore(state => state.panelWidth);
export const useLayoutMode = () => useArtifactStore(state => state.layoutMode);

// Legacy hook - kept for backward compatibility but marked deprecated
/** @deprecated Use individual hooks (usePanelVisible, usePanelWidth, useLayoutMode) to prevent re-renders */
export const usePanelState = () => {
  const visible = usePanelVisible();
  const width = usePanelWidth(); 
  const layoutMode = useLayoutMode();
  return { visible, width, layoutMode };
};