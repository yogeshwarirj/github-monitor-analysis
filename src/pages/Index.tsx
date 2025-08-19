import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { TeamSelector } from '@/components/TeamSelector';
import { CommitAnalytics } from '@/components/CommitAnalytics';
import { GitHubTokenManager } from '@/components/GitHubTokenManager';
import { GitHubSetupGuide } from '@/components/GitHubSetupGuide';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, BarChart3 } from 'lucide-react';

interface Team {
  TeamName: string;
  GitHubURL: string;
}

const Index = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string>('');

  const handleDataLoaded = (loadedTeams: Team[]) => {
    setTeams(loadedTeams);
    setSelectedTeam(null);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Commit Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track team performance and repository insights
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {error && (
            <Alert className="mb-6 bg-destructive/10 border-destructive/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {teams.length === 0 ? (
            // File Upload Screen
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  Get Started
                </h2>
                <p className="text-lg text-muted-foreground">
                  Upload your team data to begin analyzing commit statistics
                </p>
              </div>
              <FileUpload onDataLoaded={handleDataLoaded} onError={handleError} />
            </div>
          ) : (
            // Dashboard Screen
            <div className="space-y-8">
              {/* GitHub Token Manager */}
              <GitHubTokenManager onTokenChange={setGithubToken} />
              
              {/* GitHub Setup Guide */}
              {!githubToken && (
                <GitHubSetupGuide />
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <TeamSelector 
                    teams={teams}
                    selectedTeam={selectedTeam}
                    onTeamSelect={handleTeamSelect}
                  />
                </div>
                <div className="lg:col-span-2">
                  {selectedTeam ? (
                    <CommitAnalytics team={selectedTeam} githubToken={githubToken} />
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-card/50 backdrop-blur-glass border-glass-border rounded-lg border-dashed border-2">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          Select a team to view analytics
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;