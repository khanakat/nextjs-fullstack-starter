"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrganizationContext } from "@/lib/hooks/use-organizations";
import { Organization } from "@/lib/types/organizations";
import { cn } from "@/lib/utils";

interface OrganizationSwitcherProps {
  onCreateOrganization?: () => void;
  onManageOrganization?: (organization: Organization) => void;
  className?: string;
}

export function OrganizationSwitcher({
  onCreateOrganization,
  onManageOrganization,
  className,
}: OrganizationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { currentOrganization, organizations, switchOrganization, isLoading } =
    useOrganizationContext();

  if (isLoading) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!organizations.length) {
    return (
      <Button
        variant="outline"
        onClick={onCreateOrganization}
        className={cn("justify-start", className)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Organization
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
        >
          {currentOrganization ? (
            <div className="flex items-center space-x-2">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={currentOrganization.imageUrl || undefined}
                  alt={currentOrganization.name}
                />
                <AvatarFallback className="text-xs">
                  {currentOrganization.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{currentOrganization.name}</span>
            </div>
          ) : (
            "Select organization..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations.map((organization) => (
                <CommandItem
                  key={organization.id}
                  value={organization.name}
                  onSelect={() => {
                    switchOrganization(organization.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={organization.imageUrl || undefined}
                        alt={organization.name}
                      />
                      <AvatarFallback className="text-xs">
                        {organization.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{organization.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentOrganization?.id === organization.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {onCreateOrganization && (
                <CommandItem
                  onSelect={() => {
                    onCreateOrganization();
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </CommandItem>
              )}
              {onManageOrganization && currentOrganization && (
                <CommandItem
                  onSelect={() => {
                    onManageOrganization(currentOrganization);
                    setOpen(false);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Organization
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
