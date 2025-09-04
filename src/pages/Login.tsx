import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gamepad2, Target, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleIntraLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Error during login:', error);
      alert('Failed to initiate login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 relative overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 opacity-20">
        <img
          src={heroImage}
          alt="42 Sports Tracker Hero"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full max-w-md space-y-8 animate-slide-in-up relative z-10">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse-glow">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">42 Sports Tracker</h1>
            <p className="text-muted-foreground text-lg">Foosball & Table Tennis Rankings</p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Target, label: "Track Matches", color: "text-primary" },
            { icon: Trophy, label: "ELO Rankings", color: "text-success" },
            { icon: Zap, label: "Live Updates", color: "text-warning" },
            { icon: Gamepad2, label: "Two Sports", color: "text-primary" },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex flex-col items-center p-4 bg-card/50 backdrop-blur rounded-lg animate-bounce-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Icon className={`w-6 h-6 ${feature.color} mb-2`} />
                <span className="text-sm text-foreground font-medium">{feature.label}</span>
              </div>
            );
          })}
        </div>

        {/* Login Card */}
        <Card className="shadow-card border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Play? 🏓</CardTitle>
            <CardDescription>
              Only for 42 Heilbronn students – track your foosball & table tennis matches!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleIntraLogin}
              size="lg"
              className="w-full gradient-primary shadow-glow animate-pulse-glow text-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-primary-foreground rounded flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">42</span>
                </div>
                <span>Login with Intra</span>
              </div>
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Secure OAuth authentication through 42 Network
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Animated Elements */}
        <div className="flex justify-center space-x-8 opacity-30">
          <div className="animate-bounce" style={{ animationDelay: '0s' }}>🏓</div>
          <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎯</div>
          <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>🏆</div>
        </div>
      </div>
    </div>
  );
};

export default Login;