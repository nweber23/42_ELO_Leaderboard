import { useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";

interface OutletContext {
  openPlayer: (id: number) => void;
}

export default function PlayerProfileRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openPlayer } = useOutletContext<OutletContext>();

  useEffect(() => {
    if (id) {
      // Navigate to arena and open player panel
      navigate("/leaderboard/table_tennis", { replace: true });
      // Small delay to ensure navigation completes
      setTimeout(() => {
        openPlayer(Number(id));
      }, 100);
    }
  }, [id, navigate, openPlayer]);

  return null;
}
