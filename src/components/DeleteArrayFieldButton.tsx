"use client"

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export default function DeleteArrayFieldButton({ onClick, disabled = false }: Props) {
  return (
    <Button type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onClick}
            disabled={disabled}>
        <Trash2 className="h-4 w-4" />
    </Button>
  );
}