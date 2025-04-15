
interface NegotiationStrategySectionProps {
  strategy: string;
}

export function NegotiationStrategySection({ strategy }: NegotiationStrategySectionProps) {
  return (
    <div className="transform transition-all duration-300 hover:scale-102">
      <h3 className="font-medium text-lg mb-2 gradient-heading">Negotiation Strategy</h3>
      <div className="glass-card space-y-4 hover:shadow-blue-500/10">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mt-2" />
          <p className="text-white/90 leading-relaxed">{strategy}</p>
        </div>
      </div>
    </div>
  );
}
