import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GitPullRequest,
  GitMerge,
  Upload,
  Download,
  Users,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GitEvent {
  id: string;
  type: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  payload: any;
}

interface ActivityMetrics {
  pushEvents: number;
  pullRequestEvents: number;
  mergeEvents: number;
  totalEvents: number;
  memberActivity: Array<{
    member: string;
    pushes: number;
    pulls: number;
    merges: number;
    total: number;
    avatar?: string;
  }>;
  dailyActivity: Array<{
    date: string;
    pushes: number;
    pulls: number;
    merges: number;
  }>;
  eventDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

interface GitActivityAnalysisProps {
  githubUrl: string;
  githubToken?: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function GitActivityAnalysis({ githubUrl, githubToken }: GitActivityAnalysisProps) {
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extractRepoInfo = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return { owner: pathParts[0], repo: pathParts[1] };
      }
      throw new Error('Invalid GitHub URL format');
    } catch {
      throw new Error('Invalid GitHub URL');
    }
  };

  useEffect(() => {
    const fetchGitActivity = async () => {
      setLoading(true);
      setError(null);

      try {
        const { owner, repo } = extractRepoInfo(githubUrl);
        
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
        };
        
        if (githubToken) {
          headers['Authorization'] = `Bearer ${githubToken}`;
        }
        
        // Fetch repository events
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/events?per_page=100`, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const events: GitEvent[] = await response.json();
        
        // Process events
        const processedMetrics = processGitEvents(events);
        setMetrics(processedMetrics);
      } catch (err) {
        console.error('Error fetching git activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch git activity');
      } finally {
        setLoading(false);
      }
    };

    fetchGitActivity();
  }, [githubUrl, githubToken]);

  const processGitEvents = (events: GitEvent[]): ActivityMetrics => {
    const memberActivity: Record<string, {
      pushes: number;
      pulls: number;
      merges: number;
      avatar?: string;
    }> = {};

    const dailyActivity: Record<string, {
      pushes: number;
      pulls: number;
      merges: number;
    }> = {};

    let pushEvents = 0;
    let pullRequestEvents = 0;
    let mergeEvents = 0;

    events.forEach(event => {
      const member = event.actor.login;
      const date = new Date(event.created_at).toISOString().split('T')[0];

      // Initialize member if not exists
      if (!memberActivity[member]) {
        memberActivity[member] = {
          pushes: 0,
          pulls: 0,
          merges: 0,
          avatar: event.actor.avatar_url
        };
      }

      // Initialize daily activity if not exists
      if (!dailyActivity[date]) {
        dailyActivity[date] = {
          pushes: 0,
          pulls: 0,
          merges: 0
        };
      }

      // Count events by type
      switch (event.type) {
        case 'PushEvent':
          pushEvents++;
          memberActivity[member].pushes++;
          dailyActivity[date].pushes++;
          break;
        case 'PullRequestEvent':
          pullRequestEvents++;
          memberActivity[member].pulls++;
          dailyActivity[date].pulls++;
          break;
        case 'PullRequestReviewEvent':
        case 'MergeEvent':
          mergeEvents++;
          memberActivity[member].merges++;
          dailyActivity[date].merges++;
          break;
      }
    });

    // Convert to arrays and sort
    const memberActivityArray = Object.entries(memberActivity)
      .map(([member, activity]) => ({
        member,
        pushes: activity.pushes,
        pulls: activity.pulls,
        merges: activity.merges,
        total: activity.pushes + activity.pulls + activity.merges,
        avatar: activity.avatar
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Get last 30 days of activity
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyActivityArray = last30Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pushes: dailyActivity[date]?.pushes || 0,
      pulls: dailyActivity[date]?.pulls || 0,
      merges: dailyActivity[date]?.merges || 0
    }));

    const eventDistribution = [
      { name: 'Pushes', value: pushEvents, color: COLORS[0] },
      { name: 'Pull Requests', value: pullRequestEvents, color: COLORS[1] },
      { name: 'Merges/Reviews', value: mergeEvents, color: COLORS[2] }
    ].filter(item => item.value > 0);

    return {
      pushEvents,
      pullRequestEvents,
      mergeEvents,
      totalEvents: events.length,
      memberActivity: memberActivityArray,
      dailyActivity: dailyActivityArray,
      eventDistribution
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
          <div className="absolute inset-0 bg-gradient-primary opacity-5" />
          <div className="relative p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pushes</p>
                <p className="text-xl font-bold">{metrics.pushEvents}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
          <div className="absolute inset-0 bg-gradient-secondary opacity-5" />
          <div className="relative p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-secondary">
                <GitPullRequest className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pull Requests</p>
                <p className="text-xl font-bold">{metrics.pullRequestEvents}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
          <div className="absolute inset-0 bg-gradient-accent opacity-5" />
          <div className="relative p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-accent">
                <GitMerge className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Merges</p>
                <p className="text-xl font-bold">{metrics.mergeEvents}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
          <div className="absolute inset-0 bg-gradient-tertiary opacity-5" />
          <div className="relative p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-tertiary">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-xl font-bold">{metrics.totalEvents}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
          <h3 className="text-lg font-semibold mb-4">Daily Git Activity (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="pushes" stackId="a" fill="hsl(var(--chart-1))" name="Pushes" />
              <Bar dataKey="pulls" stackId="a" fill="hsl(var(--chart-2))" name="Pull Requests" />
              <Bar dataKey="merges" stackId="a" fill="hsl(var(--chart-3))" name="Merges" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Event Distribution */}
        <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
          <h3 className="text-lg font-semibold mb-4">Event Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.eventDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.eventDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Member Activity */}
      <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Member Git Activity
        </h3>
        <div className="space-y-3">
          {metrics.memberActivity.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="flex items-center space-x-3">
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.member}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                    {member.member.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{member.member}</span>
              </div>
              <div className="flex space-x-2 text-sm">
                <Badge variant="outline" title="Pushes">{member.pushes}P</Badge>
                <Badge variant="outline" title="Pull Requests">{member.pulls}PR</Badge>
                <Badge variant="outline" title="Merges">{member.merges}M</Badge>
                <Badge variant="secondary">{member.total} total</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}