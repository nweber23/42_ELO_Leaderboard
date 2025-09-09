
import { useState, useEffect } from "react";
import { Trophy, Zap, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import MatchSubmissionModal from "@/components/match/MatchSubmissionModal";
import { leaderboardApi, matchesApi, statsApi, type Match, type LeaderboardEntry } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface UserStats {
  totalMatches: number;
  winRate: number;
  currentStreak: number;
  eloRating: number;
}

interface RecentMatch {
  opponent: string;
  sport: string;
  result: "Won" | "Lost";
  score: string;
  time: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalMatches: 0,
    winRate: 0,
    currentStreak: 0,
    eloRating: 1200, // Initial ELO rating
  });
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [foosballTopPlayers, setFoosballTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [tableTennisTopPlayers, setTableTennisTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching dashboard data...");
        
        // Fetch all matches to calculate user stats
        const [allMatches, foosballLeaderboard, tableTennisLeaderboard] = await Promise.all([
          matchesApi.getAll(),
          leaderboardApi.get("foosball"),
          leaderboardApi.get("table_tennis")
        ]);

        // Calculate user stats from matches
        const userMatches = allMatches.filter(
          (match: Match) => match.player1_id === user.user_id || match.player2_id === user.user_id
        );
        
        const wins = userMatches.filter((match: Match) => match.winner_id === user.user_id).length;
        const totalMatches = userMatches.length;
        const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
        
        // Find user's ELO rating from leaderboards
        const userInFoosball = foosballLeaderboard.find((player: LeaderboardEntry) => player.name === user.login);
        const userInTableTennis = tableTennisLeaderboard.find((player: LeaderboardEntry) => player.name === user.login);
        const eloRating = userInFoosball?.elo_rating || userInTableTennis?.elo_rating || 1200;

        setUserStats({
          totalMatches,
          winRate,
          currentStreak: 0, // TODO: Calculate streak
          eloRating,
        });

        // Convert recent matches to display format
        const recentMatchesFormatted = userMatches.slice(0, 5).map((match: Match) => {
          const isPlayer1 = match.player1_id === user.user_id;
          const opponentName = isPlayer1 ? match.player2_name : match.player1_name;
          const won = match.winner_id === user.user_id;
          const userScore = isPlayer1 ? match.player1_score : match.player2_score;
          const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;

          return {
            opponent: opponentName,
            sport: match.sport,
            result: won ? "Won" as const : "Lost" as const,
            score: `${userScore}-${opponentScore}`,
            time: new Date(match.created_at).toLocaleDateString(),
          };
        });

        setRecentMatches(recentMatchesFormatted);
        setFoosballTopPlayers(foosballLeaderboard);
        setTableTennisTopPlayers(tableTennisLeaderboard);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const quickStats = [
    {
      label: "Total Matches",
      value: userStats.totalMatches.toString(),
      icon: Target,
      color: "text-primary"
    },
    {
      label: "Win Rate",
      value: userStats.totalMatches > 0 ? `${Math.round(userStats.winRate)}%` : "0%",
      icon: TrendingUp,
      color: "text-success"
    },
    {
      label: "Current Streak",
      value: userStats.currentStreak.toString(),
      icon: Zap,
      color: "text-warning"
    },
    {
      label: "ELO Rating",
      value: userStats.eloRating.toLocaleString(),
      icon: Trophy,
      color: "text-primary"
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center animate-slide-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome Back! 🏓
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready to dominate the leaderboards?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in">
          <MatchSubmissionModal />
          <Button
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate("/leaderboard")}
          >
            <Trophy className="mr-2" size={20} />
            View Leaderboards
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-card animate-slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <Icon size={24} className={stat.color} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 text-primary" size={20} />
                Recent Matches
              </CardTitle>
              <CardDescription>Your latest game results</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMatches.length > 0 ? (
                <div className="space-y-4">
                  {recentMatches.map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <p className="font-medium text-foreground">vs {match.opponent}</p>
                          <p className="text-muted-foreground">{match.sport}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={match.result === "Won" ? "default" : "secondary"}>
                          {match.result} {match.score}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{match.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No matches yet</p>
                  <p className="text-sm text-muted-foreground">Report your first match to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Players Preview */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 text-primary" size={20} />
                Top Players
              </CardTitle>
              <CardDescription>Current leaderboard leaders</CardDescription>
            </CardHeader>
            <CardContent>
              {foosballTopPlayers.length > 0 || tableTennisTopPlayers.length > 0 ? (
                <div className="space-y-6">
                  {foosballTopPlayers.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center">
                        🎯 Table Soccer
                      </h4>
                      <div className="space-y-2">
                        {foosballTopPlayers.slice(0, 3).map((player, index) => (
                          <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-primary">#{index + 1}</span>
                              <span className="text-sm text-foreground">{player.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{player.elo_rating}</p>
                              <p className="text-xs text-muted-foreground">{player.wins} wins</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tableTennisTopPlayers.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center">
                        🏓 Table Tennis
                      </h4>
                      <div className="space-y-2">
                        {tableTennisTopPlayers.slice(0, 3).map((player, index) => (
                          <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-primary">#{index + 1}</span>
                              <span className="text-sm text-foreground">{player.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{player.elo_rating}</p>
                              <p className="text-xs text-muted-foreground">{player.wins} wins</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No players yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to climb the leaderboards!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;