import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  GitCommit
} from 'lucide-react';

interface CommitData {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

interface QualityMetrics {
  totalCommits: number;
  commitsWithDescription: number;
  emptyMessages: number;
  shortMessages: number;
  averageMessageLength: number;
  hasReadme: boolean;
  readmeContent?: string;
  commitPatterns: {
    fix: number;
    feat: number;
    refactor: number;
    docs: number;
    test: number;
    style: number;
    other: number;
  };
}

interface CommitQualityAnalysisProps {
  githubUrl: string;
  githubToken?: string;
  commits: CommitData[];
}

export function CommitQualityAnalysis({ githubUrl, githubToken, commits }: CommitQualityAnalysisProps) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

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
    const analyzeCommitQuality = async () => {
      setLoading(true);

      try {
        const { owner, repo } = extractRepoInfo(githubUrl);
        
        // Check if README exists
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
        };
        
        if (githubToken) {
          headers['Authorization'] = `Bearer ${githubToken}`;
        }

        let hasReadme = false;
        let readmeContent = '';

        try {
          const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
          if (readmeResponse.ok) {
            const readmeData = await readmeResponse.json();
            hasReadme = true;
            readmeContent = atob(readmeData.content).slice(0, 500); // First 500 chars
          }
        } catch (error) {
          console.log('No README found or unable to fetch');
        }

        // Analyze commit messages
        const totalCommits = commits.length;
        let commitsWithDescription = 0;
        let emptyMessages = 0;
        let shortMessages = 0;
        let totalMessageLength = 0;

        const commitPatterns = {
          fix: 0,
          feat: 0,
          refactor: 0,
          docs: 0,
          test: 0,
          style: 0,
          other: 0
        };

        commits.forEach(commit => {
          const message = commit.commit.message.trim();
          const lines = message.split('\n').filter(line => line.trim());
          
          totalMessageLength += message.length;

          if (!message) {
            emptyMessages++;
          } else if (message.length < 10) {
            shortMessages++;
          }

          // Check if commit has description (more than just title)
          if (lines.length > 1) {
            commitsWithDescription++;
          }

          // Categorize commits by patterns
          const lowerMessage = message.toLowerCase();
          if (lowerMessage.includes('fix') || lowerMessage.includes('bug') || lowerMessage.includes('patch')) {
            commitPatterns.fix++;
          } else if (lowerMessage.includes('feat') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
            commitPatterns.feat++;
          } else if (lowerMessage.includes('refactor') || lowerMessage.includes('cleanup') || lowerMessage.includes('reorganize')) {
            commitPatterns.refactor++;
          } else if (lowerMessage.includes('doc') || lowerMessage.includes('readme') || lowerMessage.includes('comment')) {
            commitPatterns.docs++;
          } else if (lowerMessage.includes('test') || lowerMessage.includes('spec')) {
            commitPatterns.test++;
          } else if (lowerMessage.includes('style') || lowerMessage.includes('format') || lowerMessage.includes('lint')) {
            commitPatterns.style++;
          } else {
            commitPatterns.other++;
          }
        });

        const averageMessageLength = totalCommits > 0 ? Math.round(totalMessageLength / totalCommits) : 0;

        setMetrics({
          totalCommits,
          commitsWithDescription,
          emptyMessages,
          shortMessages,
          averageMessageLength,
          hasReadme,
          readmeContent,
          commitPatterns
        });
      } catch (error) {
        console.error('Error analyzing commit quality:', error);
      } finally {
        setLoading(false);
      }
    };

    if (commits.length > 0) {
      analyzeCommitQuality();
    } else {
      setLoading(false);
    }
  }, [githubUrl, githubToken, commits]);

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!metrics) return null;

  const qualityScore = Math.round(
    (metrics.commitsWithDescription / Math.max(metrics.totalCommits, 1)) * 40 +
    ((metrics.totalCommits - metrics.emptyMessages - metrics.shortMessages) / Math.max(metrics.totalCommits, 1)) * 30 +
    (metrics.hasReadme ? 20 : 0) +
    (metrics.averageMessageLength > 20 ? 10 : 0)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quality Overview */}
      <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Commit Quality Score
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Quality</span>
              <span className="text-2xl font-bold">{qualityScore}/100</span>
            </div>
            <Progress value={qualityScore} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">With Description:</span>
              <Badge variant={metrics.commitsWithDescription > metrics.totalCommits * 0.5 ? "default" : "destructive"}>
                {metrics.commitsWithDescription}/{metrics.totalCommits}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Empty Messages:</span>
              <Badge variant={metrics.emptyMessages === 0 ? "default" : "destructive"}>
                {metrics.emptyMessages}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Short Messages:</span>
              <Badge variant={metrics.shortMessages < metrics.totalCommits * 0.2 ? "default" : "secondary"}>
                {metrics.shortMessages}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg Length:</span>
              <Badge variant="outline">
                {metrics.averageMessageLength} chars
              </Badge>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">README Status:</span>
              {metrics.hasReadme ? (
                <Badge variant="default" className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Present</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <XCircle className="w-3 h-3" />
                  <span>Missing</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Commit Patterns */}
      <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <GitCommit className="w-5 h-5 mr-2" />
          Commit Patterns
        </h3>
        
        <div className="space-y-3">
          {Object.entries(metrics.commitPatterns).map(([pattern, count]) => {
            const percentage = Math.round((count / Math.max(metrics.totalCommits, 1)) * 100);
            return (
              <div key={pattern} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="capitalize font-medium">{pattern}:</span>
                  <span className="text-muted-foreground">{count} ({percentage}%)</span>
                </div>
                <Progress value={percentage} className="h-1" />
              </div>
            );
          })}
        </div>

        {metrics.hasReadme && metrics.readmeContent && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">README Preview:</h4>
            <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
              {metrics.readmeContent}...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}