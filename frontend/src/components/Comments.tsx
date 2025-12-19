import { useState, useEffect } from 'react';
import { commentAPI, usersAPI } from '../api/client';
import type { Comment, User } from '../types';

interface CommentsProps {
  matchId: number;
  userId: number;
}

const MAX_COMMENT_LENGTH = 280;

function Comments({ matchId, userId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
    usersAPI.getAll().then(setUsers).catch(console.error);
  }, [matchId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await commentAPI.list(matchId);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const comment = await commentAPI.add(matchId, newComment.trim());
      setComments([...comments, comment]);
      setNewComment('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;

    // Optimistic update
    const originalComments = [...comments];
    setComments(comments.filter(c => c.id !== commentId));

    try {
      await commentAPI.delete(matchId, commentId);
    } catch (err: any) {
      // Revert on error
      setComments(originalComments);
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="comments-container">
      <div className="comments-header">
        Comments ({comments.length})
      </div>

      {loading ? (
        <div className="comments-empty">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">No comments yet. Be the first!</div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => {
            const author = users.find(u => u.id === comment.user_id);
            return (
            <div key={comment.id} className="comment">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="comment-author">
                    {comment.user_id === userId ? 'You' : author?.display_name || `User ${comment.user_id}`}
                  </span>
                  <span className="comment-time">
                    {formatTime(comment.created_at)}
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
          onChange={e => setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          disabled={submitting}
          maxLength={MAX_COMMENT_LENGTH}
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
          {newComment.length}/{MAX_COMMENT_LENGTH}
        </div>
      )}
    </div>
  );
}

export default Comments;
