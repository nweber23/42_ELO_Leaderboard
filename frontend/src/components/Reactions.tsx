import { useState, useEffect } from 'react';
import { reactionAPI } from '../api/client';
import type { Reaction } from '../types';
import EmojiPicker from './EmojiPicker';
import { useToast } from '../state/useToast';
import { Toast } from '../ui/Toast';

interface ReactionsProps {
  matchId: number;
  userId: number;
}

function Reactions({ matchId, userId }: ReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast, show, dismiss } = useToast();

  useEffect(() => {
    loadReactions();
  }, [matchId]);

  const loadReactions = async () => {
    try {
      const data = await reactionAPI.list(matchId);
      setReactions(data || []);
    } catch (err) {
      console.error('Failed to load reactions:', err);
      // Silent fail for loading reactions is usually fine, or show a small toast
    }
  };

  const handleReaction = async (emoji: string) => {
    const existingReaction = reactions.find(
      r => r.user_id === userId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction - optimistic update
      setReactions(reactions.filter(r => r.id !== existingReaction.id));

      setLoading(true);
      try {
        await reactionAPI.remove(matchId, emoji);
      } catch (err) {
        console.error('Failed to remove reaction:', err);
        // Revert on error
        setReactions(reactions);
        show({ title: 'Error', message: 'Failed to remove reaction', tone: 'error' });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Add reaction - optimistic update
    const tempReaction: Reaction = {
      id: Date.now(),
      match_id: matchId,
      user_id: userId,
      emoji,
      created_at: new Date().toISOString(),
    };
    setReactions([...reactions, tempReaction]);

    setLoading(true);
    try {
      const newReaction = await reactionAPI.add(matchId, emoji);
      // Replace temp with real reaction
      setReactions(prev =>
        prev.map(r => (r.id === tempReaction.id ? newReaction : r))
      );
    } catch (err) {
      console.error('Failed to add reaction:', err);
      // Revert on error
      setReactions(reactions);
      show({ title: 'Error', message: 'Failed to add reaction', tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = new Set(
    reactions.filter(r => r.user_id === userId).map(r => r.emoji)
  );

  return (
    <div className="reactions-container">
      <div className="reactions">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <button
            key={emoji}
            className={`reaction-button ${userReactions.has(emoji) ? 'active' : ''}`}
            onClick={() => handleReaction(emoji)}
            disabled={loading}
          >
            <span>{emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        ))}
        <EmojiPicker onSelect={handleReaction} disabled={loading} />
      </div>
      <Toast {...toast} onClose={dismiss} />
    </div>
  );
}

export default Reactions;
