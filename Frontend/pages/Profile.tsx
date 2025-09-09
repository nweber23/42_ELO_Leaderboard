import { TrendingUp, Trophy, Target, Zap, Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual backend calls
        // const userResponse = await fetch('/api/user/profile');
        // const userStats = await userResponse.json();

        // const matchesResponse = await fetch('/api/user/matches');
        // const matches = await matchesResponse.json();

        // const achievementsResponse = await fetch('/api/user/achievements');
        // const userAchievements = await achievementsResponse.json();

        // Use user data from authentication
        if (user) {
          setUserStats({
            username: user.login,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            imageUrl: user.image_url,
            campus: user.campus,
            totalMatches: 0,
            totalWins: 0,
            winRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            foosball: {
              rating: 1200,
              rank: 0,
              matches: 0,
              wins: 0,
              losses: 0,
            },
            tabletennis: {
              rating: 1200,
              rank: 0,
              matches: 0,
              wins: 0,
              losses: 0,
            },
          });
        }

        setRecentMatches([]);
        setAchievements([]);

      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulse space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full mx-auto"></div>
              <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-6 bg-muted rounded w-32 mx-auto"></div>
            </div>
          </div>
        ) : userStats ? (
          <>
            {/* Profile Header */}
            <div className="text-center animate-slide-in-up">
              <div className="flex justify-center mb-4">
                {userStats.imageUrl ? (
                  <img 
                    src={userStats.imageUrl} 
                    alt={`${userStats.username}'s avatar`}
                    className="w-20 h-20 rounded-full shadow-glow border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-glow">
                    <User className="w-10 h-10 text-primary-foreground" />
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {userStats.firstName} {userStats.lastName}
              </h1>
              <p className="text-muted-foreground text-lg">@{userStats.username}</p>
              <p className="text-muted-foreground">42 {userStats.campus} Student</p>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Matches", value: userStats.totalMatches, icon: Target },
                { label: "Win Rate", value: `${userStats.winRate}%`, icon: TrendingUp },
                { label: "Current Streak", value: userStats.currentStreak, icon: Zap },
                { label: "Best Streak", value: userStats.bestStreak, icon: Trophy },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="shadow-card animate-bounce-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <Icon size={24} className="text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Sport-specific Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    🎯 Table Soccer Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">ELO Rating</span>
                    <span className="text-xl font-bold text-foreground">{userStats.foosball.rating}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Rank</span>
                    <Badge variant="outline">#{userStats.foosball.rank}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Matches Played</span>
                    <span className="text-foreground">{userStats.foosball.matches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">W/L Record</span>
                    <span className="text-foreground">{userStats.foosball.wins}/{userStats.foosball.losses}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    🏓 Table Tennis Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">ELO Rating</span>
                    <span className="text-xl font-bold text-foreground">{userStats.tabletennis.rating}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Rank</span>
                    <Badge variant="outline">#{userStats.tabletennis.rank}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Matches Played</span>
                    <span className="text-foreground">{userStats.tabletennis.matches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">W/L Record</span>
                    <span className="text-foreground">{userStats.tabletennis.wins}/{userStats.tabletennis.losses}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Match History and Achievements */}
            <Tabs defaultValue="matches" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted">
                <TabsTrigger value="matches">Match History</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="matches" className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Recent Matches</h2>
                <div className="space-y-3">
                  {recentMatches.length === 0 ? (
                    <Card className="shadow-card">
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">No matches played yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    recentMatches.map((match) => (
                      <Card key={match.id} className="shadow-card">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl">
                                {match.sport === "Table Soccer" ? "🎯" : "🏓"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  vs {match.opponent}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  {new Date(match.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={match.result === "Won" ? "default" : "secondary"}
                                  className={match.result === "Won" ? "bg-success text-success-foreground" : ""}
                                >
                                  {match.result} {match.score}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={match.ratingChange.startsWith('+') ? "text-success" : "text-destructive"}
                                >
                                  {match.ratingChange}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{match.sport}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Achievements</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-muted-foreground">No achievements unlocked yet</p>
                    </div>
                  ) : (
                    achievements.map((achievement, index) => (
                      <Card
                        key={achievement.title}
                        className={`shadow-card ${achievement.earned ? 'border-primary/50' : 'opacity-60'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-foreground flex items-center">
                                {achievement.earned ? "🏆" : "🔒"} {achievement.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {achievement.description}
                              </p>
                            </div>
                            {achievement.earned && (
                              <Badge variant="default" className="bg-success text-success-foreground">
                                Earned
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Failed to load profile data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;