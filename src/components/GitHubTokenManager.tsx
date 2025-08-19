import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Github
} from 'lucide-react';

interface GitHubTokenManagerProps {
  onTokenChange: (token: string) => void;
}

export function GitHubTokenManager({ onTokenChange }: GitHubTokenManagerProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'none' | 'valid' | 'invalid' | 'checking'>('none');
  const [showInstructions, setShowInstructions] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      validateToken(savedToken);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    if (!tokenToValidate.trim()) {
      setTokenStatus('none');
      return;
    }

    setTokenStatus('checking');
    
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (response.ok) {
        setTokenStatus('valid');
        localStorage.setItem('github_token', tokenToValidate);
        onTokenChange(tokenToValidate);
      } else {
        setTokenStatus('invalid');
        localStorage.removeItem('github_token');
        onTokenChange('');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenStatus('invalid');
      localStorage.removeItem('github_token');
      onTokenChange('');
    }
  };

  const handleTokenSubmit = () => {
    validateToken(token);
  };

  const handleClearToken = () => {
    setToken('');
    setTokenStatus('none');
    localStorage.removeItem('github_token');
    onTokenChange('');
  };

  const getStatusBadge = () => {
    switch (tokenStatus) {
      case 'valid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Invalid</Badge>;
      case 'checking':
        return <Badge variant="outline"><div className="w-3 h-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />Checking</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Required for Private Repos</Badge>;
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <h3 className="text-lg font-semibold">GitHub Access Token</h3>
            {getStatusBadge()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            Need Help?
          </Button>
        </div>

        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              type={showToken ? 'text' : 'password'}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <Button 
            onClick={handleTokenSubmit}
            disabled={!token.trim() || tokenStatus === 'checking'}
          >
            <Key className="w-4 h-4 mr-2" />
            Validate
          </Button>
          {tokenStatus === 'valid' && (
            <Button variant="outline" onClick={handleClearToken}>
              Clear
            </Button>
          )}
        </div>

        {showInstructions && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p><strong>To analyze private repositories, you need a GitHub Personal Access Token:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
                <li>Click "Generate new token (classic)"</li>
                <li>Select the "repo" scope for full repository access</li>
                <li>Copy the generated token and paste it above</li>
              </ol>
              <div className="flex items-center space-x-2 mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Create Token
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Security Note:</strong> Your token is stored locally in your browser and only used to access GitHub API.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {tokenStatus === 'invalid' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid token. Please check your token and ensure it has the "repo" scope for private repository access.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}