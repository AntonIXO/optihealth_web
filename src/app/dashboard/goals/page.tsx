"use client";

import { Target, Plus, Edit, Trash2, TrendingUp, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Goal {
  goal_id: number;
  goal_name: string;
  metric_name: string;
  metric_beautiful_name: string;
  target_value: number;
  operator: string;
  is_active: boolean;
  created_at: string;
}

interface MetricDefinition {
  id: number;
  metric_name: string;
  category: string;
  beautiful_name: string;
  default_unit: string;
}

interface GoalAdherence {
  current_streak: number;
  total_days: number;
  successful_days: number;
  adherence_percentage: number;
}

export default function GoalsPage() {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [goalAdherence, setGoalAdherence] = useState<Record<number, GoalAdherence>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    metric_id: '',
    target_value: '',
    operator: '>='
  });

  useEffect(() => {
    fetchGoals();
    fetchMetrics();
  }, []);

  const fetchGoals = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) return;

    const { data, error } = await supabase
      .from('user_goals')
      .select(`
        id,
        goal_name,
        target_value,
        operator,
        is_active,
        created_at,
        metric_definitions!inner (
          metric_name,
          beautiful_name
        )
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const formattedGoals = data.map(goal => ({
        goal_id: goal.id,
        goal_name: goal.goal_name,
        metric_name: (goal.metric_definitions as any).metric_name,
        metric_beautiful_name: (goal.metric_definitions as any).beautiful_name,
        target_value: goal.target_value,
        operator: goal.operator,
        is_active: goal.is_active,
        created_at: goal.created_at
      }));
      setGoals(formattedGoals);
      
      // Fetch adherence data for each goal
      for (const goal of formattedGoals) {
        await fetchGoalAdherence(goal.goal_id, goal.metric_name, goal.target_value, goal.operator);
      }
    }
    setLoading(false);
  };

  const fetchMetrics = async () => {
    const { data } = await supabase
      .from('metric_definitions')
      .select('id, metric_name, category, beautiful_name, default_unit')
      .order('category, metric_name');
    
    if (data) {
      setMetrics(data);
    }
  };

  const fetchGoalAdherence = async (goalId: number, metricName: string, targetValue: number, operator: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) return;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    try {
      // Get daily aggregated data for the metric
      const { data: dataPoints, error } = await supabase
        .from('data_points')
        .select(`
          timestamp,
          value_numeric,
          metric_definitions!inner(metric_name)
        `)
        .eq('user_id', user.user.id)
        .eq('metric_definitions.metric_name', metricName)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .not('value_numeric', 'is', null)
        .order('timestamp');

      if (dataPoints && !error) {
        // Group by day and calculate daily averages
        const dailyData = new Map();
        dataPoints.forEach(point => {
          const day = new Date(point.timestamp).toDateString();
          if (!dailyData.has(day)) {
            dailyData.set(day, []);
          }
          dailyData.get(day).push(point.value_numeric);
        });

        // Calculate adherence for each day
        const dailyAdherence = Array.from(dailyData.entries()).map(([day, values]) => {
          const avgValue = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
          let goalMet = false;
          
          switch (operator) {
            case '>=':
              goalMet = avgValue >= targetValue;
              break;
            case '<=':
              goalMet = avgValue <= targetValue;
              break;
            case '>':
              goalMet = avgValue > targetValue;
              break;
            case '<':
              goalMet = avgValue < targetValue;
              break;
          }
          
          return { day: new Date(day), goalMet };
        }).sort((a, b) => a.day.getTime() - b.day.getTime());

        // Calculate current streak (consecutive days ending with most recent day)
        let currentStreak = 0;
        for (let i = dailyAdherence.length - 1; i >= 0; i--) {
          if (dailyAdherence[i].goalMet) {
            currentStreak++;
          } else {
            break;
          }
        }

        const totalDays = dailyAdherence.length;
        const successfulDays = dailyAdherence.filter(d => d.goalMet).length;
        const adherencePercentage = totalDays > 0 ? (successfulDays / totalDays) * 100 : 0;

        setGoalAdherence(prev => ({
          ...prev,
          [goalId]: {
            current_streak: currentStreak,
            total_days: totalDays,
            successful_days: successfulDays,
            adherence_percentage: adherencePercentage
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching goal adherence:', error);
    }
  };

  const createGoal = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id || !newGoal.goal_name || !newGoal.metric_id || !newGoal.target_value) return;

    const { error } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.user.id,
        metric_id: parseInt(newGoal.metric_id),
        goal_name: newGoal.goal_name,
        target_value: parseFloat(newGoal.target_value),
        operator: newGoal.operator as any,
        is_active: true
      });

    if (!error) {
      setShowCreateForm(false);
      setNewGoal({
        goal_name: '',
        metric_id: '',
        target_value: '',
        operator: '>='
      });
      await fetchGoals();
    }
  };

  const toggleGoalActive = async (goalId: number, isActive: boolean) => {
    const { error } = await supabase
      .from('user_goals')
      .update({ is_active: !isActive })
      .eq('id', goalId);

    if (!error) {
      await fetchGoals();
    }
  };

  const deleteGoal = async (goalId: number) => {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId);

    if (!error) {
      await fetchGoals();
    }
  };

  const getOperatorText = (operator: string) => {
    switch (operator) {
      case '>=': return 'at least';
      case '<=': return 'at most';
      case '>': return 'more than';
      case '<': return 'less than';
      default: return operator;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Goals & Motivation</h1>
          <p className="mt-2 text-white/70">
            Set targets and track your progress towards better health
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Cancel' : 'Create Goal'}
        </Button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Goal</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-name" className="text-white/90 block mb-2">Goal Name</Label>
              <input
                id="goal-name"
                type="text"
                value={newGoal.goal_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal(prev => ({ ...prev, goal_name: e.target.value }))}
                placeholder="e.g., Daily Steps Goal"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
              />
            </div>
            <div>
              <Label htmlFor="metric" className="text-white/90 block mb-2">Metric</Label>
              <select 
                value={newGoal.metric_id} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewGoal(prev => ({ ...prev, metric_id: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
              >
                <option value="">Select a metric</option>
                {metrics.map((metric) => (
                  <option key={metric.id} value={metric.id.toString()}>
                    {metric.beautiful_name || metric.metric_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="operator" className="text-white/90 block mb-2">Condition</Label>
                <select 
                  value={newGoal.operator} 
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewGoal(prev => ({ ...prev, operator: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
                >
                  <option value=">=">At least (≥)</option>
                  <option value="<=">At most (≤)</option>
                  <option value=">">More than (&gt;)</option>
                  <option value="<">Less than (&lt;)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="target-value" className="text-white/90 block mb-2">Target Value</Label>
                <input
                  id="target-value"
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal(prev => ({ ...prev, target_value: e.target.value }))}
                  placeholder="10000"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                />
              </div>
            </div>
            <Button onClick={createGoal} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Create Goal
            </Button>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <Target className="h-8 w-8 animate-pulse mx-auto mb-4 text-white/50" />
            <p className="text-white/70">Loading goals...</p>
          </div>
        ) : goals.length > 0 ? (
          goals.map((goal) => {
            const adherence = goalAdherence[goal.goal_id];
            const metric = metrics.find(m => m.metric_name === goal.metric_name);
            
            return (
              <div key={goal.goal_id} className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className={`h-5 w-5 ${goal.is_active ? 'text-green-400' : 'text-gray-400'}`} />
                    <span className="font-medium text-white">{goal.goal_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleGoalActive(goal.goal_id, goal.is_active)}
                      size="sm"
                      variant="ghost"
                      className="text-white/70 hover:text-white"
                    >
                      {goal.is_active ? <CheckCircle className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => deleteGoal(goal.goal_id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-white/80">
                    <span className="font-medium">{goal.metric_beautiful_name || goal.metric_name}</span>
                    <span className="text-white/60"> {getOperatorText(goal.operator)} </span>
                    <span className="font-medium">{goal.target_value}</span>
                    {metric?.default_unit && <span className="text-white/60"> {metric.default_unit}</span>}
                  </div>
                  
                  {adherence && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Current Streak</span>
                        <span className="text-white font-medium">{adherence.current_streak} days</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Success Rate</span>
                        <span className="text-white font-medium">{adherence.adherence_percentage?.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(adherence.adherence_percentage || 0, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/60">
                        {adherence.successful_days} of {adherence.total_days} days (last 30 days)
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span className={goal.is_active ? 'text-green-400' : 'text-gray-400'}>
                      {goal.is_active ? 'Active' : 'Paused'}
                    </span>
                    <span>Created {new Date(goal.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border border-white/20 bg-white/10 p-12 backdrop-blur-md text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-white/30" />
            <h3 className="text-lg font-medium text-white mb-2">No goals set yet</h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Create your first health goal to start tracking your progress and building healthy habits.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              Create Your First Goal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
