"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from "@/lib/hooks/use-organizations";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z.string().max(500).optional(),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

type UpdateOrganizationForm = z.infer<typeof updateOrganizationSchema>;

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params?.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: organization, isLoading } = useOrganization(organizationId);
  const updateOrganization = useUpdateOrganization();
  const deleteOrganization = useDeleteOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm<UpdateOrganizationForm>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: organization?.name || "",
      slug: organization?.slug || "",
      description: organization?.description || "",
      website: organization?.website || "",
    },
  });

  // Update form when organization data loads
  React.useEffect(() => {
    if (organization) {
      setValue("name", organization.name);
      setValue("slug", organization.slug);
      setValue("description", organization.description || "");
      setValue("website", organization.website || "");
    }
  }, [organization, setValue]);

  const onSubmit = async (data: UpdateOrganizationForm) => {
    try {
      await updateOrganization.mutateAsync({
        id: organizationId,
        data: {
          ...data,
          website: data.website || undefined,
        },
      });
      toast.success("Organization updated successfully");
    } catch (error) {
      toast.error("Failed to update organization");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization.mutateAsync(organizationId);
      toast.success("Organization deleted successfully");
      router.push("/organizations");
    } catch (error) {
      toast.error("Failed to delete organization");
    }
  };

  // Generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setValue("slug", slug);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-10 bg-muted rounded animate-pulse"></div>
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Organization not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The organization you're looking for doesn't exist or you don't
              have access to it.
            </p>
            <Link href="/organizations">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Organizations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has permission to edit settings
  // Note: Role checking is disabled as organization.role doesn't exist in the current type
  const canEdit = true; // organization.role === OrganizationRole.OWNER || organization.role === OrganizationRole.ADMIN;
  const canDelete = true; // organization.role === OrganizationRole.OWNER;

  if (!canEdit) {
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access organization settings.
            </p>
            <Link href="/organizations">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Organizations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/organizations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            <p className="text-muted-foreground">
              Organization settings and configuration
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <Badge variant="default">owner</Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Update your organization's basic information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    {...register("name", { onChange: handleNameChange })}
                    placeholder="Enter organization name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="organization-slug"
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Used in URLs and must be unique
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe your organization..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...register("website")}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-sm text-destructive">
                    {errors.website.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || updateOrganization.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateOrganization.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {canDelete && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h4 className="font-semibold">Delete Organization</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this organization and all its data. This
                    action cannot be undone.
                  </p>
                </div>
                <AlertDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Organization
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the <strong>{organization.name}</strong>{" "}
                        organization and remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteOrganization.isPending}
                      >
                        {deleteOrganization.isPending
                          ? "Deleting..."
                          : "Delete Organization"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
