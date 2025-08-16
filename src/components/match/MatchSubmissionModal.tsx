import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MatchSubmissionModal = () => {
  const [sport, setSport] = useState("");
  const [opponent, setOpponent] = useState("");
  const [playerScore, setPlayerScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const validateTableTennisScore = (playerScore: number, opponentScore: number) => {
    const minWinningScore = 11;
    const winner = Math.max(playerScore, opponentScore);
    const loser = Math.min(playerScore, opponentScore);

    // Check if winner has at least 11 points
    if (winner < minWinningScore) {
      return "The winner must have at least 11 points in table tennis.";
    }

    // If loser has 10 or more points, winner must win by 2
    if (loser >= 10 && winner - loser < 2) {
      return "In table tennis, if the score reaches 10-10 or higher, you must win by 2 points.";
    }

    // If loser has less than 10, winner just needs 11
    if (loser < 10 && winner < minWinningScore) {
      return "The winner must have at least 11 points.";
    }

    return null; // Valid score
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sport || !opponent || !playerScore || !opponentScore) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to submit the match.",
        variant: "destructive",
      });
      return;
    }

    const playerScoreNum = parseInt(playerScore);
    const opponentScoreNum = parseInt(opponentScore);

    if (playerScoreNum === opponentScoreNum) {
      toast({
        title: "Invalid Score",
        description: "Matches cannot end in a tie. Please check the scores.",
        variant: "destructive",
      });
      return;
    }

    // Validate table tennis scores
    if (sport === "Table Tennis") {
      const validationError = validateTableTennisScore(playerScoreNum, opponentScoreNum);
      if (validationError) {
        toast({
          title: "Invalid Table Tennis Score",
          description: validationError,
          variant: "destructive",
        });
        return;
      }
    }

    // TODO: Backend - Submit match to database
    console.log("Submitting match:", { sport, opponent, playerScore, opponentScore });
    
    toast({
      title: "Match Submitted! 🏓",
      description: `Your ${sport} match vs ${opponent} has been sent for confirmation.`,
    });

    // Reset form
    setSport("");
    setOpponent("");
    setPlayerScore("");
    setOpponentScore("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gradient-primary shadow-glow animate-pulse-glow">
          <Plus className="mr-2" size={20} />
          Report New Match
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Trophy className="mr-2 text-primary" size={24} />
            Report Match Result
          </DialogTitle>
          <DialogDescription>
            Submit your match result for opponent confirmation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sport">Sport</Label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Table Soccer">🎯 Table Soccer (Foosball)</SelectItem>
                <SelectItem value="Table Tennis">🏓 Table Tennis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opponent">Opponent</Label>
            <Input
              id="opponent"
              type="text"
              placeholder="Enter opponent's username"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerScore">Your Score</Label>
              <Input
                id="playerScore"
                type="number"
                min="0"
                max="50"
                placeholder="0"
                value={playerScore}
                onChange={(e) => setPlayerScore(e.target.value)}
                className="bg-input border-border text-center text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opponentScore">Opponent Score</Label>
              <Input
                id="opponentScore"
                type="number"
                min="0"
                max="50"
                placeholder="0"
                value={opponentScore}
                onChange={(e) => setOpponentScore(e.target.value)}
                className="bg-input border-border text-center text-lg font-bold"
              />
            </div>
          </div>

          {sport === "Table Tennis" && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Table Tennis Rules:</strong>
              <ul className="mt-1 list-disc list-inside">
                <li>First to 11 points wins</li>
                <li>Must win by 2 points if score reaches 10-10</li>
              </ul>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Target className="mr-2" size={16} />
              Submit Match
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MatchSubmissionModal;
