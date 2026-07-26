// ─────────────────────────────────────────────────────────────────────────────
// ServiceFilters — search input + category dropdown + gender pill buttons.
// Pure presentational: parent owns the state.
// ─────────────────────────────────────────────────────────────────────────────

import { Search } from "lucide-react";
import { Card, CardContent } from "../card";
import { Input } from "../input";
import { Button } from "../button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { cn } from "../../lib/utils";
import type { ServiceGender } from "./types";

export type ServiceGenderFilter = "all" | ServiceGender;

interface ServiceFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
  gender: ServiceGenderFilter;
  onGenderChange: (v: ServiceGenderFilter) => void;
  searchPlaceholder?: string;
}

const GENDER_OPTIONS: Array<{ value: ServiceGenderFilter; label: string; activeClass: string }> = [
  { value: "all", label: "All", activeClass: "" },
  {
    value: "female",
    label: "Female",
    activeClass: "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border-pink-500/30",
  },
  {
    value: "male",
    label: "Male",
    activeClass: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30",
  },
  {
    value: "unisex",
    label: "Unisex",
    activeClass: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30",
  },
];

export function ServiceFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  gender,
  onGenderChange,
  searchPlaceholder = "Search services...",
}: ServiceFiltersProps) {
  return (
    <Card className="rounded-2xl border-border/40 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((opt) => {
            const isActive = gender === opt.value;
            return (
              <Button
                key={opt.value}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => onGenderChange(opt.value)}
                className={cn(
                  "h-8 shrink-0 rounded-lg text-xs capitalize",
                  isActive && opt.activeClass,
                )}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
