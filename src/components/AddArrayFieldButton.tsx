"use client"

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export default function AddArrayFieldButton({ onClick, disabled = false }: Props) {
  return (
    <Button type="button"
            variant="outline"
            size="sm"
            className="gap-1 h-7 text-xs font-normal"
            onClick={onClick}
            disabled={disabled}>
        <Plus className="h-3 w-3" />
    </Button>
  );
}