// CommentDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commentText: string;
  onCommentChange: (text: string) => void;
  onSave: () => void;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onOpenChange,
  commentText,
  onCommentChange,
  onSave,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogDescription>
            Enter your comment text below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Textarea
            value={commentText}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Enter your comment here..."
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;