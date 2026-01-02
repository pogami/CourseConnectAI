'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Copy, 
  FileDown, 
  RefreshCw, 
  Trash2 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface HamburgerMenuProps {
  onCopy?: () => void;
  onExport?: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  copyLabel?: string;
  exportLabel?: string;
  resetLabel?: string;
  deleteLabel?: string;
  showCopy?: boolean;
  showExport?: boolean;
  showReset?: boolean;
  showDelete?: boolean;
  className?: string;
}

export function HamburgerMenu({
  onCopy,
  onExport,
  onReset,
  onDelete,
  copyLabel = "Copy",
  exportLabel = "Export",
  resetLabel = "Reset",
  deleteLabel = "Delete",
  showCopy = true,
  showExport = true,
  showReset = true,
  showDelete = true,
  className = ""
}: HamburgerMenuProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      toast({
        title: "Exported!",
        description: "Content has been exported and downloaded",
      });
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
      toast({
        title: "Reset Complete",
        description: "Content has been reset to its initial state",
      });
    }
    setShowResetDialog(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      toast({
        title: "Deleted",
        description: "Content has been permanently deleted",
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`h-8 w-8 p-0 ${className}`}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showCopy && (
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              {copyLabel}
            </DropdownMenuItem>
          )}
          {showExport && (
            <DropdownMenuItem onClick={handleExport}>
              <FileDown className="h-4 w-4 mr-2" />
              {exportLabel}
            </DropdownMenuItem>
          )}
          {showReset && (
            <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {resetLabel}
            </DropdownMenuItem>
          )}
          {showDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteLabel}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              {resetLabel}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reset this content? This will clear all data and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
            >
              {resetLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              {deleteLabel}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              {deleteLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
