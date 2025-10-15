'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Copy, 
  Download, 
  Star, 
  StarOff,
  MoreHorizontal,
  Calendar,
  User,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  FileText,
  Bookmark,
  Share2,
  Edit
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  isPublic: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  config: {
    components: any[];
    layout: string;
  };
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

interface TemplateGalleryProps {
  userId: string;
  initialCategory?: string;
  initialSearch?: string;
  initialSort?: string;
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'all', name: 'All Templates', description: 'Browse all available templates', icon: 'grid', count: 0 },
  { id: 'analytics', name: 'Analytics', description: 'Performance and metrics reports', icon: 'bar-chart', count: 0 },
  { id: 'financial', name: 'Financial', description: 'Financial and accounting reports', icon: 'pie-chart', count: 0 },
  { id: 'operational', name: 'Operational', description: 'Operations and process reports', icon: 'line-chart', count: 0 },
  { id: 'marketing', name: 'Marketing', description: 'Marketing and campaign reports', icon: 'trending-up', count: 0 },
  { id: 'custom', name: 'Custom', description: 'User-created templates', icon: 'file-text', count: 0 },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'usage', label: 'Most Used' },
];

function TemplateCard({ template, onPreview, onUse, onFavorite, onDuplicate }: {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
  onFavorite: (template: Template) => void;
  onDuplicate: (template: Template) => void;
}) {
  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'analytics': return BarChart3;
      case 'financial': return PieChart;
      case 'operational': return LineChart;
      case 'marketing': return Table;
      default: return FileText;
    }
  };

  const Icon = getIconForCategory(template.category);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold line-clamp-1">
                {template.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                by {template.createdBy.name}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(template)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFavorite(template)}>
                {template.isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from Favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to Favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Template Preview */}
          <div 
            className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => onPreview(template)}
          >
            <div className="text-center">
              <Icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to preview</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {template.usageCount}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>
            {template.isFavorite && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onUse(template)}
            >
              Use Template
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onPreview(template)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateGallery({ userId, initialCategory, initialSearch, initialSort }: TemplateGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>(TEMPLATE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState(initialSort || 'recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data for demonstration
  useEffect(() => {
    const mockTemplates: Template[] = [
      {
        id: '1',
        title: 'Monthly Sales Dashboard',
        description: 'Comprehensive sales performance tracking with key metrics, trends, and regional breakdowns.',
        category: 'analytics',
        tags: ['sales', 'dashboard', 'monthly', 'kpi'],
        isPublic: true,
        isFavorite: true,
        usageCount: 45,
        createdBy: { id: '1', name: 'John Doe' },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        config: { components: [], layout: 'grid' }
      },
      {
        id: '2',
        title: 'Financial Summary Report',
        description: 'Executive-level financial overview with P&L, cash flow, and budget variance analysis.',
        category: 'financial',
        tags: ['finance', 'executive', 'summary', 'budget'],
        isPublic: true,
        isFavorite: false,
        usageCount: 32,
        createdBy: { id: '2', name: 'Jane Smith' },
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T11:45:00Z',
        config: { components: [], layout: 'grid' }
      },
      {
        id: '3',
        title: 'Operational Efficiency Tracker',
        description: 'Monitor operational KPIs, process efficiency, and resource utilization metrics.',
        category: 'operational',
        tags: ['operations', 'efficiency', 'kpi', 'resources'],
        isPublic: true,
        isFavorite: false,
        usageCount: 28,
        createdBy: { id: '3', name: 'Mike Johnson' },
        createdAt: '2024-01-08T14:20:00Z',
        updatedAt: '2024-01-16T16:10:00Z',
        config: { components: [], layout: 'grid' }
      },
      {
        id: '4',
        title: 'Marketing Campaign Analysis',
        description: 'Track campaign performance, ROI, conversion rates, and audience engagement metrics.',
        category: 'marketing',
        tags: ['marketing', 'campaigns', 'roi', 'analytics'],
        isPublic: true,
        isFavorite: true,
        usageCount: 38,
        createdBy: { id: '4', name: 'Sarah Wilson' },
        createdAt: '2024-01-12T08:30:00Z',
        updatedAt: '2024-01-19T13:20:00Z',
        config: { components: [], layout: 'grid' }
      },
      {
        id: '5',
        title: 'Custom Project Status',
        description: 'Project milestone tracking with timeline, resource allocation, and risk assessment.',
        category: 'custom',
        tags: ['project', 'status', 'timeline', 'custom'],
        isPublic: false,
        isFavorite: false,
        usageCount: 12,
        createdBy: { id: userId, name: 'You' },
        createdAt: '2024-01-14T12:00:00Z',
        updatedAt: '2024-01-21T10:15:00Z',
        config: { components: [], layout: 'grid' }
      }
    ];

    // Update category counts
    const updatedCategories = categories.map(cat => ({
      ...cat,
      count: cat.id === 'all' 
        ? mockTemplates.length 
        : mockTemplates.filter(t => t.category === cat.id).length
    }));

    setTemplates(mockTemplates);
    setCategories(updatedCategories);
    setLoading(false);
  }, [userId, categories]);

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usageCount - a.usageCount;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  // Handle template actions
  const handlePreview = (template: Template) => {
    router.push(`/reports/templates/${template.id}/preview`);
  };

  const handleUseTemplate = (template: Template) => {
    router.push(`/reports/builder?template=${template.id}`);
    toast.success(`Using template: ${template.title}`);
  };

  const handleFavorite = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/favorite`, {
        method: template.isFavorite ? 'DELETE' : 'POST',
      });

      if (!response.ok) throw new Error('Failed to update favorite');

      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, isFavorite: !t.isFavorite }
          : t
      ));

      toast.success(
        template.isFavorite 
          ? 'Removed from favorites' 
          : 'Added to favorites'
      );
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to duplicate template');

      const duplicatedTemplate = await response.json();
      router.push(`/reports/builder?edit=${duplicatedTemplate.id}`);
      toast.success('Template duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleCreateTemplate = () => {
    router.push('/reports/builder');
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {category.name}
              {category.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            {filteredTemplates.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No templates found"
                subtitle={
                  searchQuery 
                    ? `No templates match "${searchQuery}". Try adjusting your search terms.`
                    : `No templates available in the ${category.name.toLowerCase()} category yet.`
                }
                action={
                  <Button onClick={handleCreateTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={handlePreview}
                    onUse={handleUseTemplate}
                    onFavorite={handleFavorite}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}