import { InsightScenario } from '@/types/insight';
import { ArrowRight } from 'lucide-react';

const resultTypeClasses = {
  positive: 'text-green-400',
  negative: 'text-red-400',
  neutral: 'text-gray-300',
};

export default function Scenario({ context, action, result, resultType }: InsightScenario) {
  return (
    <div className="mt-3 rounded-lg bg-white/5 p-4 border border-white/10">
      <div className="flex flex-col md:flex-row md:items-center md:gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-white/50 mb-1">CONTEXT:</p>
          <p className="font-medium text-white text-sm">{context}</p>
          <p className="mt-2 text-sm text-white/80">+ {action}</p>
        </div>
        <ArrowRight className="my-3 h-5 w-5 text-white/30 md:my-0 self-center" />
        <div className="flex-1">
          <p className="text-xs font-medium text-white/50 mb-1">RESULT:</p>
          <p className={`text-lg font-bold ${resultTypeClasses[resultType]}`}>
            {result}
          </p>
        </div>
      </div>
    </div>
  );
}
