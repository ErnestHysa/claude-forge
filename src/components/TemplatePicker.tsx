'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { templates, getTemplatesByType } from '@/lib/templates';
import { ArtifactType } from '@/types';

interface TemplatePickerProps {
  artifactType: ArtifactType | 'auto';
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const NO_TEMPLATE_VALUE = '__none__';

export function TemplatePicker({ artifactType, value, onChange }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);

  // Filter templates by type (or show all for auto)
  const filteredTemplates =
    artifactType === 'auto' ? templates : getTemplatesByType(artifactType as ArtifactType);

  const categories = Array.from(new Set(filteredTemplates.map((t) => t.category)));

  // Handle value change - convert sentinel value back to undefined
  const handleValueChange = (newValue: string) => {
    onChange(newValue === NO_TEMPLATE_VALUE ? undefined : newValue);
  };

  // For the Select component, use the sentinel value when value is undefined
  const selectValue = value ?? NO_TEMPLATE_VALUE;

  return (
    <Select open={open} onOpenChange={setOpen} value={selectValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full sm:w-[280px]">
        <SelectValue placeholder="Start from template (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_TEMPLATE_VALUE}>
          <span className="flex items-center gap-2">
            <span>Start from scratch</span>
            <Badge variant="outline" className="text-xs">
              AI only
            </Badge>
          </span>
        </SelectItem>
        {categories.map((category) => (
          <div key={category}>
            {category !== 'Templates' && (
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {category}
              </div>
            )}
            {filteredTemplates
              .filter((t) => t.category === category)
              .map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <span className="flex items-center justify-between gap-2">
                    <span>{template.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {template.type}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
