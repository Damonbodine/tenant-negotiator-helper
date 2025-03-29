
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PracticeScenario } from "@/components/PracticeScenario";

interface ScenarioSelectorProps {
  selectedScenario: string;
  onScenarioChange: (scenario: string) => void;
}

export function ScenarioSelector({ selectedScenario, onScenarioChange }: ScenarioSelectorProps) {
  const scenarios = [
    { id: "standard", name: "Standard" },
    { id: "luxury", name: "Luxury" },
    { id: "house", name: "House" }
  ];
  
  return (
    <Tabs value={selectedScenario} onValueChange={onScenarioChange}>
      <TabsList className="grid grid-cols-3 mb-4">
        {scenarios.map(scenario => (
          <TabsTrigger key={scenario.id} value={scenario.id}>
            {scenario.name}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {scenarios.map(scenario => (
        <TabsContent key={scenario.id} value={scenario.id} className="mt-0">
          <PracticeScenario scenario={scenario.id} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
