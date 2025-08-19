import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Key, 
  Shield, 
  CheckCircle,
  Github,
  ArrowRight 
} from 'lucide-react';

export function GitHubSetupGuide() {
  const steps = [
    {
      number: 1,
      title: "Go to GitHub Settings",
      description: "Navigate to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)",
      action: {
        text: "Open GitHub Settings",
        url: "https://github.com/settings/tokens"
      }
    },
    {
      number: 2,
      title: "Generate New Token",
      description: "Click 'Generate new token (classic)' and give it a descriptive name like 'Commit Analytics Dashboard'"
    },
    {
      number: 3,
      title: "Select Scopes",
      description: "For private repositories, select the 'repo' scope (Full control of private repositories)"
    },
    {
      number: 4,
      title: "Generate & Copy",
      description: "Click 'Generate token' and immediately copy the token (you won't see it again!)"
    },
    {
      number: 5,
      title: "Paste Token Above",
      description: "Paste your token in the GitHub Access Token field and click 'Validate'"
    }
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-glass border-glass-border">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">GitHub API Setup Guide</h3>
            <p className="text-sm text-muted-foreground">
              Follow these steps to create a GitHub Personal Access Token
            </p>
          </div>
        </div>

        <Alert className="bg-primary/10 border-primary/20">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>For Private Repositories:</strong> A GitHub Personal Access Token is required to analyze private repositories. Public repositories work without a token.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {step.number}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.action && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={step.action.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      {step.action.text}
                    </a>
                  </Button>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="flex-shrink-0 pt-4">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <Key className="w-4 h-4 mr-2" />
            Required Token Permissions
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><strong>repo</strong> - Full control of private repositories</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span><strong>read:user</strong> - Read user profile data (optional)</span>
            </div>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Security Note:</strong> Your token is stored locally in your browser and only used to access GitHub API. Never share your token with others.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}