import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar,
  GitBranch,
  Star,
  Eye,
  GitFork,
  FileText,
  Users,
  Globe
} from 'lucide-react';

interface RepositoryData {
  name: string;
  full_name: string;
  description: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  default_branch: string;
  language: string;
  size: number;
  open_issues_count: number;
  has_readme: boolean;
  visibility: string;
}

interface RepositoryInfoProps {
  githubUrl: string;
  githubToken?: string;
}

export function RepositoryInfo({ githubUrl, githubToken }: RepositoryInfoProps) {
  const [repoData, setRepoData] = useState<RepositoryData | null>(null);
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
    const fetchRepositoryInfo = async () => {
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
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch repository info: ${response.status}`);
        }

        const data: RepositoryData = await response.json();
        setRepoData(data);
      } catch (err) {
        console.error('Error fetching repository info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch repository info');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositoryInfo();
  }, [githubUrl, githubToken]);

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error || !repoData) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSize = (sizeInKB: number) => {
    if (sizeInKB > 1024) {
      return `${(sizeInKB / 1024).toFixed(1)} MB`;
    }
    return `${sizeInKB} KB`;
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Repository Information</h3>
          <p className="text-sm text-muted-foreground">{repoData.description || 'No description available'}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">{formatDate(repoData.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Default Branch</p>
              <p className="text-sm font-medium">{repoData.default_branch}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Language</p>
              <p className="text-sm font-medium">{repoData.language || 'Mixed'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Visibility</p>
              <p className="text-sm font-medium capitalize">{repoData.visibility}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Star className="w-3 h-3" />
            <span>{repoData.stargazers_count} stars</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <GitFork className="w-3 h-3" />
            <span>{repoData.forks_count} forks</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{repoData.watchers_count} watchers</span>
          </Badge>
          <Badge variant="outline">
            Size: {formatSize(repoData.size)}
          </Badge>
          {repoData.has_readme && (
            <Badge variant="outline" className="text-green-600">
              Has README
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Last updated: {formatDate(repoData.updated_at)} • Last push: {formatDate(repoData.pushed_at)}
        </div>
      </div>
    </Card>
  );
}