export interface InsightScenario {
  context: string;
  action: string;
  result: string;
  resultType: 'positive' | 'negative' | 'neutral';
}

export interface InsightCardProps {
  icon: React.ElementType;
  title: string;
  keyFinding: string;
  scenarios: InsightScenario[];
  verdict: string;
  recommendation: string;
  howWeFoundIt: string;
}
