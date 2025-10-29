import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCollaboration } from "./CollaborationProvider";
import {
  MessageCircle,
  Reply,
  MoreHorizontal,
  Trash2,
  Edit,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  position: number;
  threadId?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt?: Date;
  isResolved?: boolean;
  reactions?: Record<string, string[]>; // emoji -> userIds
}

interface CommentSystemProps {
  documentId: string;
  className?: string;
  allowComments?: boolean;
  showResolvedComments?: boolean;
}

interface CommentThreadProps {
  comment: Comment;
  replies: Comment[];
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onResolve: (commentId: string) => void;
  onReaction: (commentId: string, emoji: string) => void;
  currentUserId: string;
}

function CommentThread({
  comment,
  replies,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onReaction,
  currentUserId,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(comment.content);

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent);
    }
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-3">
      {/* Main comment */}
      <Card
        className={cn(
          "border-l-4",
          comment.isResolved
            ? "border-l-green-500 opacity-75"
            : "border-l-blue-500",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={`/api/avatar/${comment.userId}`} />
                <AvatarFallback className="text-xs">
                  {comment.userId.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  User {comment.userId.slice(0, 8)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.updatedAt &&
                  comment.updatedAt !== comment.createdAt && (
                    <Badge variant="outline" className="text-xs">
                      Edited
                    </Badge>
                  )}
                {comment.isResolved && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700"
                  >
                    Resolved
                  </Badge>
                )}
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="end">
                <div className="space-y-1">
                  {comment.userId === currentUserId && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive"
                        onClick={() => onDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onResolve(comment.id)}
                  >
                    <Check className="h-3 w-3 mr-2" />
                    {comment.isResolved ? "Unresolve" : "Resolve"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
                placeholder="Edit your comment..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

              {/* Reactions */}
              {comment.reactions &&
                Object.keys(comment.reactions).length > 0 && (
                  <div className="flex gap-1">
                    {Object.entries(comment.reactions).map(
                      ([emoji, userIds]) => (
                        <Button
                          key={emoji}
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onReaction(comment.id, emoji)}
                        >
                          {emoji} {userIds.length}
                        </Button>
                      ),
                    )}
                  </div>
                )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsReplying(true)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onReaction(comment.id, "👍")}
                >
                  👍
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onReaction(comment.id, "❤️")}
                >
                  ❤️
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply form */}
      {isReplying && (
        <div className="ml-6 space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[60px]"
            placeholder="Write a reply..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReply}>
              Reply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsReplying(false);
                setReplyContent("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-6 space-y-2">
          {replies.map((reply) => (
            <Card key={reply.id} className="border-l-2 border-l-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={`/api/avatar/${reply.userId}`} />
                    <AvatarFallback className="text-xs">
                      {reply.userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    User {reply.userId.slice(0, 8)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSystem({
  documentId,
  className,
  allowComments = true,
  showResolvedComments = false,
}: CommentSystemProps) {
  const { addComment } = useCollaboration();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [newCommentPosition, setNewCommentPosition] = useState(0);
  const [currentUserId] = useState("current-user-id"); // This should come from auth

  // Group comments by thread
  const commentThreads = comments.reduce(
    (acc, comment) => {
      if (!comment.parentId) {
        acc[comment.id] = {
          main: comment,
          replies: comments.filter((c) => c.parentId === comment.id),
        };
      }
      return acc;
    },
    {} as Record<string, { main: Comment; replies: Comment[] }>,
  );

  const filteredThreads = Object.values(commentThreads).filter(
    (thread) => showResolvedComments || !thread.main.isResolved,
  );

  const handleAddComment = (position: number) => {
    setNewCommentPosition(position);
    setIsAddingComment(true);
  };

  const handleSubmitComment = () => {
    if (newCommentContent.trim()) {
      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        userId: currentUserId,
        content: newCommentContent,
        position: newCommentPosition,
        createdAt: new Date(),
      };

      setComments((prev) => [...prev, newComment]);
      addComment(documentId, newCommentContent, newCommentPosition);

      setNewCommentContent("");
      setIsAddingComment(false);
    }
  };

  const handleReply = (parentId: string, content: string) => {
    const reply: Comment = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      userId: currentUserId,
      content,
      position: 0, // Replies don't have positions
      parentId,
      createdAt: new Date(),
    };

    setComments((prev) => [...prev, reply]);
    addComment(documentId, content, 0, parentId);
  };

  const handleEdit = (commentId: string, content: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, content, updatedAt: new Date() }
          : comment,
      ),
    );
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) =>
      prev.filter(
        (comment) => comment.id !== commentId && comment.parentId !== commentId,
      ),
    );
  };

  const handleResolve = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, isResolved: !comment.isResolved }
          : comment,
      ),
    );
  };

  const handleReaction = (commentId: string, emoji: string) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          const reactions = { ...comment.reactions };
          if (!reactions[emoji]) {
            reactions[emoji] = [];
          }

          const userIndex = reactions[emoji].indexOf(currentUserId);
          if (userIndex > -1) {
            reactions[emoji].splice(userIndex, 1);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji].push(currentUserId);
          }

          return { ...comment, reactions };
        }
        return comment;
      }),
    );
  };

  if (!allowComments) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">
            Comments ({Object.keys(commentThreads).length})
          </span>
        </div>

        <Button
          size="sm"
          onClick={() => handleAddComment(0)}
          disabled={isAddingComment}
        >
          <MessageCircle className="h-3 w-3 mr-2" />
          Add Comment
        </Button>
      </div>

      {/* Add comment form */}
      {isAddingComment && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Add comment at position {newCommentPosition}
              </div>
              <Textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Write your comment..."
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitComment}>Add Comment</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingComment(false);
                    setNewCommentContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comment threads */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to add one!
          </div>
        ) : (
          filteredThreads.map(({ main, replies }) => (
            <CommentThread
              key={main.id}
              comment={main}
              replies={replies}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onResolve={handleResolve}
              onReaction={handleReaction}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}
