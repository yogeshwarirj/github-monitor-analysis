import { useState } from 'react';
import { Check, ChevronDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Team {
  TeamName: string;
  GitHubURL: string;
}

interface TeamSelectorProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamSelect: (team: Team) => void;
}

export function TeamSelector({ teams, selectedTeam, onTeamSelect }: TeamSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur-glass border-glass-border">
      <div className="absolute inset-0 bg-gradient-secondary opacity-5" />
      <div className="relative p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-secondary">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Select Team</h3>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-12 bg-background/50 border-border hover:bg-background/80 transition-all duration-300"
            >
              {selectedTeam ? (
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedTeam.TeamName}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {selectedTeam.GitHubURL}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Choose a team...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-[400px] p-0 bg-popover/95 backdrop-blur-glass border-glass-border" align="start">
            <div className="max-h-64 overflow-auto">
              {teams.map((team, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-3 cursor-pointer transition-all duration-200",
                    "hover:bg-accent/50 border-b border-border/50 last:border-b-0",
                    selectedTeam?.TeamName === team.TeamName && "bg-accent/30"
                  )}
                  onClick={() => {
                    onTeamSelect(team);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 transition-opacity",
                      selectedTeam?.TeamName === team.TeamName
                        ? "opacity-100 text-primary"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{team.TeamName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {team.GitHubURL}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {teams.length} team{teams.length !== 1 ? 's' : ''} loaded
          </p>
        </div>
      </div>
    </Card>
  );
}