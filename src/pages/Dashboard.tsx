import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, Calendar, Star, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { ROOM_OPTIONS } from '@/types/property';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AssignViewingDialog from '@/components/AssignViewingDialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { MultiSelectCombobox } from '@/components/MultiSelectCombobox';

interface PropertyWithPhotos extends Property {
  property_photos?: Array<{ photo_url: string; display_order: number }>;
  property_categories?: { name: string; code: string };
  property_subcategories?: { name: string; code: string };
  property_action_categories?: { name: string; code: string };
  property_areas?: { name: string; full_name: string | null };
  property_proposals?: { name: string; code: string };
  property_conditions?: { name: string; code: string };
  is_featured?: boolean;
  featured_order?: number;
}

const ITEMS_PER_PAGE = 12;

const DASHBOARD_STATE_KEY = 'dashboard_state';

function saveDashboardState(state: Record<string, any>) {
  try {
    sessionStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

function loadDashboardState(): Record<string, any> | null {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return null;
}

function clearDashboardState() {
  sessionStorage.removeItem(DASHBOARD_STATE_KEY);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyWithPhotos[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDialogOpen, setViewingDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<{ id: string; number: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});

  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([]);
  const [areaFilter, setAreaFilter] = useState<string[]>([]);
  const [roomsFilter, setRoomsFilter] = useState<string[]>([]);
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [managerFilter, setManagerFilter] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = Number(searchParams.get('page'));
    return Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
  });

  const [actionCategories, setActionCategories] = useState<any[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<any[]>([]);
  const [propertySubcategories, setPropertySubcategories] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const restoredRef = useRef(false);
  const isRestoringFiltersRef = useRef(false);
  const restoredFiltersSnapshotRef = useRef<string | null>(null);
  const propertiesGridRef = useRef<HTMLDivElement | null>(null);
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();

  // Restore saved state on mount
  useEffect(() => {
    const saved = loadDashboardState();
    if (saved) {
      isRestoringFiltersRef.current = true;
      restoredFiltersSnapshotRef.current = JSON.stringify({
        searchQuery: saved.searchQuery || '',
        actionFilter: saved.actionFilter || [],
        categoryFilter: saved.categoryFilter || [],
        subcategoryFilter: saved.subcategoryFilter || [],
        areaFilter: saved.areaFilter || [],
        roomsFilter: saved.roomsFilter || [],
        conditionFilter: saved.conditionFilter || [],
        managerFilter: saved.managerFilter || [],
        minPrice: saved.minPrice || '',
        maxPrice: saved.maxPrice || '',
      });
      if (saved.searchQuery) setSearchQuery(saved.searchQuery);
      if (saved.actionFilter?.length) setActionFilter(saved.actionFilter);
      if (saved.categoryFilter?.length) setCategoryFilter(saved.categoryFilter);
      if (saved.subcategoryFilter?.length) setSubcategoryFilter(saved.subcategoryFilter);
      if (saved.areaFilter?.length) setAreaFilter(saved.areaFilter);
      if (saved.roomsFilter?.length) setRoomsFilter(saved.roomsFilter);
      if (saved.conditionFilter?.length) setConditionFilter(saved.conditionFilter);
      if (saved.managerFilter?.length) setManagerFilter(saved.managerFilter);
      if (saved.minPrice) setMinPrice(saved.minPrice);
      if (saved.maxPrice) setMaxPrice(saved.maxPrice);
      if (saved.currentPage) setCurrentPage(saved.currentPage);
      if (saved.showFilters) setShowFilters(saved.showFilters);
      restoredRef.current = true;
      clearDashboardState();
    }
  }, []);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (currentPage > 1) {
        next.set('page', String(currentPage));
      } else {
        next.delete('page');
      }
      return next;
    }, { replace: true });
  }, [currentPage, setSearchParams]);

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && restoredRef.current) {
      const saved = sessionStorage.getItem(DASHBOARD_STATE_KEY + '_scrollY');
      if (saved) {
        const scrollY = parseInt(saved, 10);
        sessionStorage.removeItem(DASHBOARD_STATE_KEY + '_scrollY');
        setTimeout(() => window.scrollTo(0, scrollY), 100);
      }
      restoredRef.current = false;
    }
  }, [loading]);

  const saveDashboardNavigationState = useCallback(() => {
    // Save current state before navigating
    saveDashboardState({
      searchQuery,
      actionFilter,
      categoryFilter,
      subcategoryFilter,
      areaFilter,
      roomsFilter,
      conditionFilter,
      managerFilter,
      minPrice,
      maxPrice,
      currentPage,
      showFilters,
    });
    // Save scroll position separately (so restore-on-mount reads filters first)
    sessionStorage.setItem(DASHBOARD_STATE_KEY + '_scrollY', String(window.scrollY));
  }, [searchQuery, actionFilter, categoryFilter, subcategoryFilter, areaFilter, roomsFilter, conditionFilter, managerFilter, minPrice, maxPrice, currentPage, showFilters]);

  useEffect(() => {
    fetchProperties();
    fetchFilters();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFilters = async () => {
    try {
      const [actionsRes, categoriesRes, subcategoriesRes, areasRes, conditionsRes, managersRes] = await Promise.all([
        supabase.from("property_action_categories").select("*"),
        supabase.from("property_categories").select("*"),
        supabase.from("property_subcategories").select("*").order("name"),
        supabase.from("property_areas").select("*").order("name"),
        supabase.from("property_conditions").select("*").order("name"),
        supabase.from("profiles").select("id, full_name").order("full_name")
      ]);

      setActionCategories(actionsRes.data || []);
      setPropertyCategories(categoriesRes.data || []);
      setPropertySubcategories(subcategoriesRes.data || []);
      setAreas(areasRes.data || []);
      setConditions(conditionsRes.data || []);
      setManagers((managersRes.data || []).map(m => ({ id: m.id, name: m.full_name })));
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_photos(photo_url, display_order),
          property_categories(name, code),
          property_subcategories(name, code),
          property_action_categories(name, code),
          property_areas(name, full_name),
          property_proposals(name, code),
          property_conditions(name, code)
        `)
        .in('status', ['published', 'no_ads'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch featured properties info
      const { data: featuredData } = await supabase
        .from('featured_properties')
        .select('property_id, display_order');

      const featuredMap = new Map(
        (featuredData || []).map(f => [f.property_id, f.display_order])
      );

      const propertiesWithFeatured = (data || []).map(p => ({
        ...p,
        is_featured: featuredMap.has(p.id),
        featured_order: featuredMap.get(p.id)
      }));

      setProperties(propertiesWithFeatured);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user?.id);

      if (error) throw error;
      setFavorites(new Set(data?.map(f => f.property_id) || []));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Войдите в систему для добавления в избранное',
      });
      return;
    }

    try {
      const isFavorite = favorites.has(propertyId);

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('property_id', propertyId)
          .eq('user_id', user.id);

        if (error) throw error;

        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });

        toast({
          title: 'Удалено',
          description: 'Объект удален из избранного',
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            property_id: propertyId,
            user_id: user.id,
            priority: 'medium'
          });

        if (error) throw error;

        setFavorites(prev => new Set([...prev, propertyId]));

        toast({
          title: 'Добавлено',
          description: 'Объект добавлен в избранное',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось обновить избранное',
      });
    }
  };

  const toggleFeaturedProperty = async (propertyId: string, isFeatured: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Только супер админ может управлять избранными объявлениями',
      });
      return;
    }

    try {
      if (isFeatured) {
        // Remove from featured
        const { error } = await supabase
          .from('featured_properties')
          .delete()
          .eq('property_id', propertyId);

        if (error) throw error;

        toast({
          title: 'Успешно',
          description: 'Объявление убрано из избранного на главной',
        });
      } else {
        // Check if we have less than 5 featured
        const { data: existingFeatured } = await supabase
          .from('featured_properties')
          .select('id');

        if ((existingFeatured || []).length >= 5) {
          toast({
            variant: 'destructive',
            title: 'Ошибка',
            description: 'Максимум 5 избранных объявлений. Удалите одно в админ панели.',
          });
          return;
        }

        // Get next available order
        const { data: featuredOrders } = await supabase
          .from('featured_properties')
          .select('display_order');

        const usedOrders = (featuredOrders || []).map(f => f.display_order);
        const nextOrder = [1, 2, 3, 4, 5].find(n => !usedOrders.includes(n)) || 1;

        const { error } = await supabase
          .from('featured_properties')
          .insert({
            property_id: propertyId,
            display_order: nextOrder,
            created_by: user?.id
          });

        if (error) throw error;

        toast({
          title: 'Успешно',
          description: `Объявление добавлено на главную страницу (позиция ${nextOrder})`,
        });
      }

      fetchProperties();
    } catch (error) {
      console.error('Error toggling featured property:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось обновить статус избранного',
      });
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      searchQuery === "" ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.property_number.toString().includes(searchQuery) ||
      property.property_areas?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      actionFilter.length === 0 || actionFilter.includes(property.property_action_category_id || '');

    const matchesCategory =
      categoryFilter.length === 0 || categoryFilter.includes(property.property_category_id || '');

    const matchesSubcategory =
      subcategoryFilter.length === 0 || subcategoryFilter.includes(property.property_subcategory_id || '');

    const matchesArea =
      areaFilter.length === 0 || areaFilter.includes(property.property_area_id || '');

    const matchesRooms =
      roomsFilter.length === 0 || roomsFilter.includes(property.property_rooms || '');

    const matchesCondition =
      conditionFilter.length === 0 || conditionFilter.includes(property.property_condition_id || '');

    const matchesManager =
      managerFilter.length === 0 || managerFilter.includes(property.created_by || '');

    const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice =
      property.price >= minPriceNum && property.price <= maxPriceNum;

    return matchesSearch && matchesAction && matchesCategory && matchesSubcategory && matchesArea && matchesRooms && matchesCondition && matchesManager && matchesPrice;
  });

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  useEffect(() => {
    if (!hoveredPropertyId) return;

    const hoveredProperty = paginatedProperties.find((property) => property.id === hoveredPropertyId);
    const photosCount = hoveredProperty?.property_photos?.length || 0;
    if (photosCount < 2) return;
    const currentIndex = photoIndexes[hoveredPropertyId] ?? 0;
    const delayMs = currentIndex === 0 ? 2000 : 4000;

    const timeoutId = window.setTimeout(() => {
      setPhotoIndexes((prev) => ({
        ...prev,
        [hoveredPropertyId]: ((prev[hoveredPropertyId] ?? 0) + 1) % photosCount,
      }));
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [hoveredPropertyId, paginatedProperties, photoIndexes]);

  const changePage = (nextPage: number) => {
    const boundedPage = Math.max(1, Math.min(totalPages || 1, nextPage));
    if (boundedPage === currentPage) return;

    setCurrentPage(boundedPage);
    requestAnimationFrame(() => {
      propertiesGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Reset to first page when filters change
  useEffect(() => {
    if (isRestoringFiltersRef.current) {
      const currentFiltersSnapshot = JSON.stringify({
        searchQuery,
        actionFilter,
        categoryFilter,
        subcategoryFilter,
        areaFilter,
        roomsFilter,
        conditionFilter,
        managerFilter,
        minPrice,
        maxPrice,
      });

      if (restoredFiltersSnapshotRef.current === currentFiltersSnapshot) {
        isRestoringFiltersRef.current = false;
        restoredFiltersSnapshotRef.current = null;
      }

      return;
    }

    setCurrentPage(1);
  }, [searchQuery, actionFilter, categoryFilter, subcategoryFilter, areaFilter, roomsFilter, conditionFilter, managerFilter, minPrice, maxPrice]);

  const stats = [
    {
      title: 'Всего объявлений',
      value: properties.length,
      icon: Building2,
      color: 'text-primary',
    },
    {
      title: 'Опубликовано',
      value: properties.filter((p) => p.status === 'published').length,
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: 'Без рекламы',
      value: properties.filter((p) => p.status === 'no_ads').length,
      icon: Calendar,
      color: 'text-warning',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success/10 text-success';
      case 'no_ads':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Опубликовано';
      case 'no_ads':
        return 'Без рекламы';
      case 'sold':
        return 'Продано';
      case 'deleted':
        return 'Удалено';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Дежурка
        </h1>
        <p className="text-muted-foreground text-lg">
          Все объявления агентства доступны для работы
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Поиск по адресу, номеру или району..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-12"
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-12"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Action Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Тип предложения</label>
                <MultiSelectCombobox
                  options={actionCategories}
                  selected={actionFilter}
                  onChange={setActionFilter}
                  placeholder="Все типы предложений"
                  searchPlaceholder="Поиск типа предложения..."
                />
              </div>

              {/* Property Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Тип недвижимости</label>
                <MultiSelectCombobox
                  options={propertyCategories}
                  selected={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder="Все типы недвижимости"
                  searchPlaceholder="Поиск типа недвижимости..."
                />
              </div>

              {/* Property Subcategory */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Подтип (Дежурка)</label>
                <MultiSelectCombobox
                  options={propertySubcategories}
                  selected={subcategoryFilter}
                  onChange={setSubcategoryFilter}
                  placeholder="Все подтипы"
                  searchPlaceholder="Поиск подтипа..."
                />
              </div>

              {/* Rooms */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Количество комнат</label>
                <MultiSelectCombobox
                  options={ROOM_OPTIONS.map(r => ({ id: r.value, name: r.label }))}
                  selected={roomsFilter}
                  onChange={setRoomsFilter}
                  placeholder="Все варианты"
                  searchPlaceholder="Поиск количества комнат..."
                />
              </div>

              {/* Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Район</label>
                <MultiSelectCombobox
                  options={areas}
                  selected={areaFilter}
                  onChange={setAreaFilter}
                  placeholder="Все районы"
                  searchPlaceholder="Поиск района..."
                />
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Состояние</label>
                <MultiSelectCombobox
                  options={conditions}
                  selected={conditionFilter}
                  onChange={setConditionFilter}
                  placeholder="Все состояния"
                  searchPlaceholder="Поиск состояния..."
                />
              </div>

              {/* Manager Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Менеджер</label>
                <MultiSelectCombobox
                  options={managers}
                  selected={managerFilter}
                  onChange={setManagerFilter}
                  placeholder="Все менеджеры"
                  searchPlaceholder="Поиск менеджера..."
                />
              </div>

              {/* Min Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена от (USD)</label>
                <Input
                  type="number"
                  placeholder="Мин. цена"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              {/* Max Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена до (USD)</label>
                <Input
                  type="number"
                  placeholder="Макс. цена"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              {/* Reset Filters */}
              <div className="lg:col-span-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setActionFilter([]);
                    setCategoryFilter([]);
                    setSubcategoryFilter([]);
                    setAreaFilter([]);
                    setRoomsFilter([]);
                    setConditionFilter([]);
                    setManagerFilter([]);
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Properties Grid */}
      <div ref={propertiesGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProperties.map((property) => {
          const sortedPhotos = (property.property_photos || []).slice().sort((a, b) => a.display_order - b.display_order);
          const previewIndex = hoveredPropertyId === property.id ? (photoIndexes[property.id] ?? 0) : 0;
          const previewPhotoUrl = sortedPhotos[previewIndex]?.photo_url || '/placeholder.svg';

          return (
          <Card
            key={property.id}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 group"
            onMouseEnter={() => {
              if (sortedPhotos.length > 1) {
                setHoveredPropertyId(property.id);
              }
            }}
            onMouseLeave={() => {
              setHoveredPropertyId((prev) => (prev === property.id ? null : prev));
              setPhotoIndexes((prev) => ({ ...prev, [property.id]: 0 }));
            }}
          >
            <Link
              to={`/properties/${property.id}`}
              className="block no-underline"
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                  return;
                }
                saveDashboardNavigationState();
              }}
            >
            <div className="aspect-video bg-muted relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                {isAdmin && property.status === 'published' && (
                  <Button
                    size="icon"
                    variant={property.is_featured ? "default" : "secondary"}
                    className={`rounded-full shadow-lg ${property.is_featured ? 'bg-primary' : ''}`}
                    onClick={(e) => toggleFeaturedProperty(property.id, property.is_featured || false, e)}
                  >
                    <Star
                      className={`h-4 w-4 ${property.is_featured ? 'fill-current' : ''}`}
                    />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(property.id);
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${favorites.has(property.id) ? 'fill-yellow-400 text-yellow-400' : ''}`}
                  />
                </Button>
              </div>
              <div className="absolute bottom-4 left-4 z-20">
                <Badge className={getStatusColor(property.status)}>
                  {getStatusText(property.status)}
                </Badge>
              </div>
              {sortedPhotos.length > 0 ? (
                <div
                  className="h-full w-full flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${previewIndex * 100}%)` }}
                >
                  {sortedPhotos.map((photo, photoIndex) => (
                    <img
                      key={`${property.id}-${photoIndex}-${photo.display_order}`}
                      src={photo.photo_url}
                      alt={property.address}
                      className="w-full h-full min-w-full object-cover"
                      loading={photoIndex === 0 ? 'eager' : 'lazy'}
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={previewPhotoUrl}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  № {property.property_number}
                </span>
                <div className="flex gap-2">
                  {(property as any).property_action_categories && (
                    <Badge variant="outline" className="text-xs">
                      {(property as any).property_action_categories.name}
                    </Badge>
                  )}
                  {(property as any).property_categories && (
                    <Badge variant="secondary" className="text-xs">
                      {(property as any).property_categories.name}
                    </Badge>
                  )}
                  {(property as any).property_subcategories && (
                    <Badge variant="outline" className="text-xs">
                      {(property as any).property_subcategories.name}
                    </Badge>
                  )}
                </div>
              </div>
              <CardTitle className="text-xl line-clamp-1">{property.address}</CardTitle>
              <CardDescription className="line-clamp-2">
                {property.description || 'Описание отсутствует'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold text-primary">
                    ${property.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {property.currency}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {property.property_size && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {property.property_size} м²
                  </span>
                )}
                {property.property_rooms && (
                  <span>• {property.property_rooms} комн.</span>
                )}
                {(property as any).property_floor_old && (
                  <span>• {(property as any).property_floor_old}{(property as any).property_floor_from_old ? `/${(property as any).property_floor_from_old}` : ''} эт.</span>
                )}
                {(property as any).property_areas && (
                  <span>• {(property as any).property_areas.name}</span>
                )}
              </div>

              <Button
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedProperty({ id: property.id, number: property.property_number });
                  setViewingDialogOpen(true);
                }}
              >
                Назначить показ
              </Button>
            </CardContent>
            </Link>
          </Card>
          );
        })}
      </div>

      {filteredProperties.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <CardTitle className="text-2xl mb-2">Объявлений не найдено</CardTitle>
          <CardDescription>
            Попробуйте изменить параметры поиска
          </CardDescription>
        </Card>
      )}

      {/* Pagination */}
      {filteredProperties.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => changePage(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => changePage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => changePage(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {selectedProperty && (
        <AssignViewingDialog
          open={viewingDialogOpen}
          onOpenChange={setViewingDialogOpen}
          propertyId={selectedProperty.id}
          propertyNumber={selectedProperty.number}
        />
      )}
    </div>
  );
}
