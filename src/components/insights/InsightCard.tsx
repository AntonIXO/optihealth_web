import { InsightCardProps } from '@/types/insight';
import Scenario from './Scenario';
import { Search } from 'lucide-react';

export default function InsightCard({
  icon: Icon,
  title,
  keyFinding,
  scenarios,
  verdict,
  recommendation,
  howWeFoundIt,
}: InsightCardProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-lg">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-6 w-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>

      {/* Key Finding */}
      <p className="text-white/90 leading-relaxed">{keyFinding}</p>

      {/* Analysis Label */}
      <div className="mt-6 mb-2">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">🔬 Анализ:</h3>
      </div>

      {/* Scenarios */}
      <div className="space-y-2">
        {scenarios.map((scenario, index) => (
          <div key={index}>
            <h4 className="text-sm font-medium text-white/80 mb-1">
              Сценарий {String.fromCharCode(65 + index)}: {scenario.context.split(':')[0]}
            </h4>
            <Scenario {...scenario} />
          </div>
        ))}
      </div>

      {/* Verdict & Recommendation */}
      <div className="mt-6 rounded-lg bg-white/5 p-4 border border-white/10">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          🧠 Вердикт и рекомендация:
        </h3>
        <p className="text-white/80 text-sm leading-relaxed mb-3">{verdict}</p>
        <p className="text-white/90 text-sm leading-relaxed font-medium">
          <span className="text-green-400">💡 Совет:</span> {recommendation}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-start gap-2 border-t border-white/10 pt-4">
        <Search className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-white/50 leading-relaxed">{howWeFoundIt}</p>
      </div>
    </div>
  );
}
