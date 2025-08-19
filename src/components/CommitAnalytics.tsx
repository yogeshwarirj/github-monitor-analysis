import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/DateRangePicker';
import { RepositoryInfo } from '@/components/RepositoryInfo';
import { CommitQualityAnalysis } from '@/components/CommitQualityAnalysis';
import { GitActivityAnalysis } from '@/components/GitActivityAnalysis';
import { 
  GitCommit, 
  Users, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  AlertTriangle,
  Github,
  Lock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DateRange } from 'react-day-picker';

interface Team {
  TeamName: string;
  GitHubURL: string;
}

interface CommitData {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: {
    login: string;
    avatar_url: string;
  };
}

interface AnalyticsData {
  totalCommits: number;
  commitTrend: Array<{ date: string; commits: number }>;
  topContributors: Array<{ name: string; commits: number; avatar?: string }>;
  recentCommits: CommitData[];
  dailyActivity: Array<{ day: string; commits: number }>;
}

interface CommitAnalyticsProps {
  team: Team;
  githubToken?: string;
}

export function CommitAnalytics({ team, githubToken }: CommitAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { from: startDate, to: endDate };
  });

  const extractRepoInfo = (githubUrl: string) => {
    try {
      const url = new URL(githubUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return { owner: pathParts[0], repo: pathParts[1] };
      }
      throw new Error('Invalid GitHub URL format');
    } catch {
      throw new Error('Invalid GitHub URL');
    }
  };

  const fetchCommitData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { owner, repo } = extractRepoInfo(team.GitHubURL);
      
      // Build URL with date parameters
      let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
      
      if (dateRange?.from) {
        url += `&since=${dateRange.from.toISOString()}`;
      }
      if (dateRange?.to) {
        // Add one day to include commits from the end date
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        url += `&until=${endDate.toISOString()}`;
      }
      
      // Fetch commits from GitHub API
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      // Add authorization header if token is available
      if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`;
      }
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found or is private. Please check the URL or add a GitHub token for private repositories.');
        } else if (response.status === 401) {
          throw new Error('Invalid GitHub token. Please check your token and try again.');
        } else if (response.status === 403) {
          const remainingRequests = response.headers.get('X-RateLimit-Remaining');
          if (remainingRequests === '0') {
            throw new Error('GitHub API rate limit exceeded. Please try again later or add a GitHub token for higher rate limits.');
          } else {
            throw new Error('Access forbidden. Please check your GitHub token permissions.');
          }
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const commits: CommitData[] = await response.json();

      // Process analytics data
      const processedData = processCommitData(commits);
      setAnalytics(processedData);
    } catch (err) {
      console.error('Error fetching commit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch commit data');
    } finally {
      setLoading(false);
    }
  };

  const processCommitData = (commits: CommitData[]): AnalyticsData => {
    // Group commits by date
    const commitsByDate = commits.reduce((acc, commit) => {
      const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate commit trend based on selected date range
    const generateDateRange = () => {
      if (!dateRange?.from || !dateRange?.to) {
        // Fallback to last 30 days if no date range
        return Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        });
      }

      const dates = [];
      const currentDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    };

    const dateRangeDays = generateDateRange();
    const commitTrend = dateRangeDays.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      commits: commitsByDate[date] || 0
    }));

    // Count contributors
    const contributorCounts = commits.reduce((acc, commit) => {
      const name = commit.author?.login || commit.commit.author.name;
      const avatar = commit.author?.avatar_url;
      
      if (!acc[name]) {
        acc[name] = { count: 0, avatar };
      }
      acc[name].count++;
      return acc;
    }, {} as Record<string, { count: number; avatar?: string }>);

    const topContributors = Object.entries(contributorCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        commits: data.count,
        avatar: data.avatar
      }));

    // Daily activity (by day of week)
    const dayOfWeekCounts = commits.reduce((acc, commit) => {
      const dayOfWeek = new Date(commit.commit.author.date).toLocaleDateString('en-US', { weekday: 'short' });
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      commits: dayOfWeekCounts[day] || 0
    }));

    return {
      totalCommits: commits.length,
      commitTrend,
      topContributors,
      recentCommits: commits.slice(0, 10),
      dailyActivity
    };
  };

  useEffect(() => {
    fetchCommitData();
  }, [team, dateRange, githubToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-card/50 backdrop-blur-glass border-glass-border">
        <div className="absolute inset-0 bg-destructive/5" />
        <div className="relative">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchCommitData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {team.TeamName} Analytics
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <Github className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{team.GitHubURL}</span>
              {githubToken && (
                <div className="flex items-center" title="Private repository access enabled">
                  <Lock className="w-3 h-3 text-green-600" />
                </div>
              )}
            </div>
          </div>
          <Button onClick={fetchCommitData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Date Range Picker */}
        <div className="flex items-center justify-between">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="text-sm text-muted-foreground">
            {dateRange?.from && dateRange?.to && (
              <span>
                {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Repository Information */}
      <RepositoryInfo githubUrl={team.GitHubURL} githubToken={githubToken} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
          <div className="absolute inset-0 bg-gradient-primary opacity-5" />
          <div className="relative p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <GitCommit className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Commits</p>
                <p className="text-2xl font-bold">{analytics.totalCommits}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
          <div className="absolute inset-0 bg-gradient-secondary opacity-5" />
          <div className="relative p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-secondary">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contributors</p>
                <p className="text-2xl font-bold">{analytics.topContributors.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
          <div className="absolute inset-0 bg-gradient-accent opacity-5" />
          <div className="relative p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-accent">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-bold">
                  {analytics.commitTrend.slice(-7).reduce((sum, day) => sum + day.commits, 0)}
                  <span className="text-sm text-muted-foreground ml-1">last 7 days</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commit Trend */}
        <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Commit Trend
            {dateRange?.from && dateRange?.to && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days)
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.commitTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="commits" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Daily Activity */}
        <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
          <h3 className="text-lg font-semibold mb-4">Daily Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="commits" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Contributors & Recent Commits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
          <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {analytics.topContributors.map((contributor, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  {contributor.avatar ? (
                    <img 
                      src={contributor.avatar} 
                      alt={contributor.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                      {contributor.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium">{contributor.name}</span>
                </div>
                <Badge variant="secondary">{contributor.commits} commits</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Commits */}
        <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
          <h3 className="text-lg font-semibold mb-4">Recent Commits</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analytics.recentCommits.map((commit, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium truncate flex-1 mr-2">
                    {commit.commit.message.split('\n')[0]}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {commit.sha.substring(0, 7)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{commit.author?.login || commit.commit.author.name}</span>
                  <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Commit Quality Analysis */}
      <CommitQualityAnalysis 
        githubUrl={team.GitHubURL} 
        githubToken={githubToken} 
        commits={analytics.recentCommits} 
      />

      {/* Git Activity Analysis */}
      <GitActivityAnalysis 
        githubUrl={team.GitHubURL} 
        githubToken={githubToken} 
      />
    </div>
  );
}