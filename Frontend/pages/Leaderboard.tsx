
import { useState, useEffect } from "react";
import { Trophy, Medal, TrendingUp, Target, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { leaderboardApi, type LeaderboardEntry } from "@/lib/api";

const Leaderboard = () => {
  const [foosballPlayers, setFoosballPlayers] = useState<LeaderboardEntry[]>([]);
  const [tableTennisPlayers, setTableTennisPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        console.log("Fetching leaderboard data...");
        const [foosballData, tableTennisData] = await Promise.all([
          leaderboardApi.get("foosball"),
          leaderboardApi.get("table_tennis")
        ]);
        
        setFoosballPlayers(foosballData);
        setTableTennisPlayers(tableTennisData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-warning" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getStreakDisplay = (streak: number) => {
    if (streak >= 3) {
      return (
        <Badge variant="default" className="bg-success text-success-foreground">
          🔥 {streak}
        </Badge>
      );
    } else if (streak > 0) {
      return (
        <Badge variant="secondary">
          ⚡ {streak}
        </Badge>
      );
    } else {
      return <span className="text-muted-foreground">-</span>;
    }
  };

  const PlayerRow = ({ player }: { player: LeaderboardEntry }) => (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer animate-slide-in-up">
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-10 h-10">
          {getRankIcon(player.rank)}
        </div>

        <div>
          <h3 className="font-semibold text-foreground">{player.name}</h3>
          <p className="text-sm text-muted-foreground">
            {player.wins}W / {player.losses}L
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{player.elo_rating}</p>
          <p className="text-xs text-muted-foreground">ELO</p>
        </div>

        <div className="text-center">
          {getStreakDisplay(0)}
        </div>

        <div className="text-center min-w-[60px]">
          <Badge variant="secondary">
            -
          </Badge>
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ sport }: { sport: string }) => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{sport === "foosball" ? "🎯" : "🏓"}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No players yet</h3>
      <p className="text-muted-foreground">
        Be the first to report a {sport === "foosball" ? "table soccer" : "table tennis"} match!
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading leaderboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center animate-slide-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center">
            <Trophy className="mr-3 text-primary" size={36} />
            Leaderboards
          </h1>
          <p className="text-muted-foreground text-lg">
            See where you rank among 42 Heilbronn champions
          </p>
        </div>

        {/* Sport Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-card animate-bounce-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                🎯 Table Soccer
              </CardTitle>
              <CardDescription>Foosball Rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{foosballPlayers.length}</p>
                  <p className="text-sm text-muted-foreground">Players</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {foosballPlayers.length > 0 ? foosballPlayers[0]?.rating || 0 : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Top ELO</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">
                    {foosballPlayers.length > 0 ? Math.max(...foosballPlayers.map(p => p.wins)) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Best Record</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card animate-bounce-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                🏓 Table Tennis
              </CardTitle>
              <CardDescription>Ping Pong Rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{tableTennisPlayers.length}</p>
                  <p className="text-sm text-muted-foreground">Players</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {tableTennisPlayers.length > 0 ? tableTennisPlayers[0]?.rating || 0 : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Top ELO</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">
                    {tableTennisPlayers.length > 0 ? Math.max(...tableTennisPlayers.map(p => p.wins)) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Best Record</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="foosball" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted">
            <TabsTrigger value="foosball" className="flex items-center space-x-2">
              <span>🎯</span>
              <span>Table Soccer</span>
            </TabsTrigger>
            <TabsTrigger value="tabletennis" className="flex items-center space-x-2">
              <span>🏓</span>
              <span>Table Tennis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="foosball" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Table Soccer Rankings</h2>
              <div className="text-sm text-muted-foreground">
                Live rankings
              </div>
            </div>

            {foosballPlayers.length > 0 ? (
              <>
                {/* Header Row */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg text-sm font-medium text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="w-10">Rank</div>
                    <div>Player</div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">Rating</div>
                    <div className="text-center">Streak</div>
                    <div className="text-center min-w-[60px]">Change</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {foosballPlayers.map((player) => (
                    <PlayerRow key={player.username} player={player} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState sport="foosball" />
            )}
          </TabsContent>

          <TabsContent value="tabletennis" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Table Tennis Rankings</h2>
              <div className="text-sm text-muted-foreground">
                Live rankings
              </div>
            </div>

            {tableTennisPlayers.length > 0 ? (
              <>
                {/* Header Row */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg text-sm font-medium text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="w-10">Rank</div>
                    <div>Player</div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">Rating</div>
                    <div className="text-center">Streak</div>
                    <div className="text-center min-w-[60px]">Change</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {tableTennisPlayers.map((player) => (
                    <PlayerRow key={player.username} player={player} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState sport="tabletennis" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;