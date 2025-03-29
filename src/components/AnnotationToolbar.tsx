// AnnotationToolbar.tsx
import React from "react";
import { AnnotationType } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnnotationToolbarProps {
  currentTool: AnnotationType | null;
  selectedColor: string;
  onToolChange: (tool: AnnotationType | null) => void;
  onColorChange: (color: string) => void;
}

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  currentTool,
  selectedColor,
  onToolChange,
  onColorChange,
}) => {
  return (
    <div className="flex items-center space-x-4 p-2 bg-white shadow-md rounded-lg">
      <Select
        value={currentTool || ""}
        onValueChange={(value) => {
          onToolChange(value === "" ? null : (value as AnnotationType));
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Tool" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="select">Select Tool</SelectItem>
          <SelectItem value="highlight">Highlight</SelectItem>
          <SelectItem value="underline">Underline</SelectItem>
          <SelectItem value="comment">Comment</SelectItem>
          <SelectItem value="signature">Signature</SelectItem>
        </SelectContent>
      </Select>

      {(currentTool === "highlight" || currentTool === "underline") && (
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-10 h-10 rounded border"
        />
      )}
    </div>
  );
};

export default AnnotationToolbar;