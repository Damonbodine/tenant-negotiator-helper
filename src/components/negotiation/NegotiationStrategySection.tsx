
interface NegotiationStrategySectionProps {
  strategy: string;
}

export function NegotiationStrategySection({ strategy }: NegotiationStrategySectionProps) {
  return (
    <div>
      <h3 className="font-medium text-lg mb-2 gradient-heading">Negotiation Strategy</h3>
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-1 h-1 rounded-full bg-blue-400 mt-2" />
          <p className="text-white/90">{strategy}</p>
        </div>
      </div>
    </div>
  );
}
