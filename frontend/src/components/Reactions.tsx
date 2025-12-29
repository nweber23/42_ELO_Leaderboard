import { useState, useEffect, useRef } from 'react';
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

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadReactions();

    return () => {
      isMounted.current = false;
    };
  }, [matchId]);

  const loadReactions = async () => {
    try {
      const data = await reactionAPI.list(matchId);
      if (isMounted.current) {
        setReactions(data || []);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Failed to load reactions:', err);
      }
      // Silent fail for loading reactions is usually fine
    }
  };

  // Reconcile with server to handle conflicts from concurrent updates
  const reconcileWithServer = async () => {
    try {
      const serverReactions = await reactionAPI.list(matchId);
      if (isMounted.current) {
        setReactions(serverReactions || []);
      }
    } catch (err) {
      // Silent fail - we already have optimistic state
      console.error('Failed to reconcile reactions:', err);
    }
  };

  const handleReaction = async (emoji: string) => {
    const existingReaction = reactions.find(
      r => r.user_id === userId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction - optimistic update
      const originalReactions = [...reactions];
      setReactions(reactions.filter(r => r.id !== existingReaction.id));

      setLoading(true);
      try {
        await reactionAPI.remove(matchId, emoji);
        // Reconcile with server to handle concurrent updates
        await reconcileWithServer();
      } catch (err) {
        if (isMounted.current) {
          console.error('Failed to remove reaction:', err);
          // Revert on error
          setReactions(originalReactions);
          show({ title: 'Error', message: 'Failed to remove reaction', tone: 'error' });
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
      return;
    }

    // Add reaction - optimistic update
    const originalReactions = [...reactions];
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
      await reactionAPI.add(matchId, emoji);
      // Reconcile with server to handle concurrent updates
      // This ensures we get the real reaction ID and any other users' reactions
      await reconcileWithServer();
    } catch (err) {
      if (isMounted.current) {
        console.error('Failed to add reaction:', err);
        // Revert on error
        setReactions(originalReactions);
        show({ title: 'Error', message: 'Failed to add reaction', tone: 'error' });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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
