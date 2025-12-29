import { useState, useEffect, useRef } from 'react';
import { commentAPI } from '../api/client';
import type { Comment } from '../types';
import { useToast } from '../state/useToast';
import { Toast } from '../ui/Toast';
import { COMMENT_MAX_LENGTH } from '../constants';
import { formatRelativeTime } from '../utils';
import { useUsers, findUserById } from '../hooks';

interface CommentsProps {
  matchId: number;
  userId: number;
}

function Comments({ matchId, userId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast, show, dismiss } = useToast();

  // Use the shared useUsers hook (already has isMounted handling)
  const { users } = useUsers();

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadComments();

    return () => {
      isMounted.current = false;
    };
  }, [matchId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await commentAPI.list(matchId);
      if (isMounted.current) {
        setComments(data || []);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Failed to load comments:', err);
        show({ title: 'Error', message: 'Failed to load comments', tone: 'error' });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const comment = await commentAPI.add(matchId, newComment.trim());
      if (isMounted.current) {
        setComments(prev => [...prev, comment]);
        setNewComment('');
        show({ title: 'Success', message: 'Comment added', tone: 'success' });
      }
    } catch (err: any) {
      if (isMounted.current) {
        show({
          title: 'Error',
          message: err.response?.data?.error || 'Failed to add comment',
          tone: 'error'
        });
      }
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;

    // Optimistic update
    const originalComments = [...comments];
    setComments(comments.filter(c => c.id !== commentId));

    try {
      await commentAPI.delete(matchId, commentId);
      if (isMounted.current) {
        show({ title: 'Success', message: 'Comment deleted', tone: 'success' });
      }
    } catch (err: any) {
      if (isMounted.current) {
        // Revert on error
        setComments(originalComments);
        show({
          title: 'Error',
          message: err.response?.data?.error || 'Failed to delete comment',
          tone: 'error'
        });
      }
    }
  };

  return (
    <div className="comments-container">
      <div className="comments-header">
        Comments ({comments.length})
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">No comments yet. Be the first!</div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => {
            const author = findUserById(users, comment.user_id);
            return (
            <div key={comment.id} className="comment">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="comment-author">
                    {comment.user_id === userId ? 'You' : author?.display_name || `User ${comment.user_id}`}
                  </span>
                  <span className="comment-time">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                {comment.user_id === userId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="comment-delete"
                    title="Delete comment"
                    aria-label="Delete comment"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <div className="comment-content">{comment.content}</div>
            </div>
          );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          className="comment-input"
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
          disabled={submitting}
          maxLength={COMMENT_MAX_LENGTH}
        />
        <button
          type="submit"
          className="comment-submit"
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>
      {newComment.length > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {newComment.length}/{COMMENT_MAX_LENGTH}
        </div>
      )}
      <Toast {...toast} onClose={dismiss} />
    </div>
  );
}

export default Comments;
