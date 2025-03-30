
interface NegotiationStrategySectionProps {
  strategy: string;
}

export function NegotiationStrategySection({ strategy }: NegotiationStrategySectionProps) {
  return (
    <div>
      <h3 className="font-medium text-lg mb-2">Negotiation Strategy</h3>
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <p>{strategy}</p>
      </div>
    </div>
  );
}
