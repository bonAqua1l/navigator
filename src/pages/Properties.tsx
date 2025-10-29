import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Home, Filter } from "lucide-react";
import { ROOM_OPTIONS } from "@/types/property";
import { formatPrice } from "@/lib/priceUtils";
import navigatorLogo from "@/assets/navigator-house-logo.png";
import { useInView } from "react-intersection-observer";

interface Property {
  id: string;
  property_number: number;
  description: string | null;
  price: number;
  currency: string;
  exchange_rate: number | null;
  property_size: number | null;
  property_rooms: string | null;
  property_area_id: string | null;
  property_category_id: string | null;
  property_subcategory_id: string | null;
  property_action_category_id: string | null;
  property_condition_id: string | null;
  property_developer: string | null;
  property_areas: { name: string } | null;
  property_categories: { name: string } | null;
  property_subcategories: { name: string } | null;
  property_action_categories: { name: string } | null;
  property_photos: { photo_url: string }[];
}

const ITEMS_PER_LOAD = 12;

const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [roomsFilter, setRoomsFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [developerFilter, setDeveloperFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_LOAD);
  
  const [actionCategories, setActionCategories] = useState<any[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<any[]>([]);
  const [propertySubcategories, setPropertySubcategories] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    fetchProperties();
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const [actionsRes, categoriesRes, subcategoriesRes, areasRes, conditionsRes, developersRes] = await Promise.all([
        supabase.from("property_action_categories").select("*"),
        supabase.from("property_categories").select("*"),
        supabase.from("property_subcategories").select("*").order("name"),
        supabase.from("property_areas").select("*").order("name"),
        supabase.from("property_conditions").select("*").order("name"),
        supabase.from("property_developers").select("*").order("name")
      ]);
      
      setActionCategories(actionsRes.data || []);
      setPropertyCategories(categoriesRes.data || []);
      setPropertySubcategories(subcategoriesRes.data || []);
      setAreas(areasRes.data || []);
      setConditions(conditionsRes.data || []);
      setDevelopers(developersRes.data || []);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          property_number,
          description,
          price,
          currency,
          exchange_rate,
          property_size,
          property_rooms,
          property_area_id,
          property_category_id,
          property_subcategory_id,
          property_action_category_id,
          property_condition_id,
          property_developer,
          property_areas (name),
          property_categories (name),
          property_subcategories (name),
          property_action_categories (name),
          property_photos (photo_url)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };
  const truncateDescription = (text: string | null, maxLength: number = 100): string => {
    if (!text) return "";

    // Убираем лишние пробелы и переносы строк
    const cleanText = text.trim().replace(/\s+/g, " ");

    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    // Обрезаем до maxLength и ищем последнее предложение
    const truncated = cleanText.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf(".");
    const lastExclamation = truncated.lastIndexOf("!");
    const lastQuestion = truncated.lastIndexOf("?");

    // Находим последний знак препинания
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

    if (lastSentenceEnd > 0 && lastSentenceEnd > maxLength * 0.5) {
      // Если нашли знак препинания и он не слишком близко к началу
      return truncated.substring(0, lastSentenceEnd + 1);
    }

    // Иначе обрезаем по последнему пробелу
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
  };
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      searchTerm === "" ||
      property.property_number.toString().includes(searchTerm) ||
      property.property_areas?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction =
      actionFilter === "all" || property.property_action_category_id === actionFilter;
    
    const matchesCategory =
      categoryFilter === "all" || property.property_category_id === categoryFilter;
    
    const matchesSubcategory =
      subcategoryFilter === "all" || property.property_subcategory_id === subcategoryFilter;
    
    const matchesArea =
      areaFilter === "all" || property.property_area_id === areaFilter;
    
    const matchesRooms =
      roomsFilter === "all" || property.property_rooms === roomsFilter;
    
    const matchesCondition =
      conditionFilter === "all" || property.property_condition_id === conditionFilter;
    
    const matchesDeveloper =
      developerFilter === "all" || property.property_developer === developerFilter;
    
    const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice =
      property.price >= minPriceNum && property.price <= maxPriceNum;

    return matchesSearch && matchesAction && matchesCategory && matchesSubcategory && matchesArea && matchesRooms && matchesCondition && matchesDeveloper && matchesPrice;
  });

  const visibleProperties = filteredProperties.slice(0, displayedCount);
  const hasMore = displayedCount < filteredProperties.length;

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_LOAD);
  }, [searchTerm, actionFilter, categoryFilter, subcategoryFilter, areaFilter, roomsFilter, conditionFilter, developerFilter, minPrice, maxPrice]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setDisplayedCount((prev) => prev + ITEMS_PER_LOAD);
    }
  }, [inView, hasMore, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src={navigatorLogo} alt="Navigator House" className="h-10 w-auto" />
              <div>
                <h1 className="font-semibold text-lg">Navigator House</h1>
                <p className="text-xs text-muted-foreground">Навигатор в мире недвижимости</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Войти
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary-hover to-primary/90 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Каталог недвижимости
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Найдите недвижимость вашей мечты из нашей актуальной базы объектов
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="space-y-4">
            {/* Search Bar and Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по номеру или району..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
              </Button>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                {/* Action Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Тип предложения</label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {actionCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Тип недвижимости</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {propertyCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Subcategory (Дежурка) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Подтип</label>
                  <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {propertySubcategories.map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rooms */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Количество комнат</label>
                  <Select value={roomsFilter} onValueChange={setRoomsFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room.value} value={room.value}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Район</label>
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Состояние</label>
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {conditions.map((condition) => (
                        <SelectItem key={condition.id} value={condition.id}>
                          {condition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Developer (ЖК) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ЖК</label>
                  <Select value={developerFilter} onValueChange={setDeveloperFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {developers.map((developer) => (
                        <SelectItem key={developer.id} value={developer.name}>
                          {developer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      setSearchTerm("");
                      setActionFilter("all");
                      setCategoryFilter("all");
                      setSubcategoryFilter("all");
                      setAreaFilter("all");
                      setRoomsFilter("all");
                      setConditionFilter("all");
                      setDeveloperFilter("all");
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredProperties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Объекты не найдены</h3>
                <p className="text-muted-foreground">
                  Попробуйте изменить параметры поиска
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleProperties.map((property) => (
                  <Card
                    key={property.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/properties/${property.id}/public`)}
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {property.property_photos?.[0] ? (
                        <img
                          src={property.property_photos[0].photo_url}
                          alt={`Объект №${property.property_number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Home className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary text-primary-foreground">
                          {property.property_action_categories?.name || "—"}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl">
                          Объект №{property.property_number}
                        </CardTitle>
                        <Badge variant="secondary">
                          {property.property_categories?.name || "—"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                    {property.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {truncateDescription(property.description, 120)}
                    </p>
                  )}
                      {property.property_size && (
                        <p className="text-sm text-muted-foreground">
                          Площадь: {property.property_size} м²
                        </p>
                      )}
                      {property.property_rooms && (
                        <p className="text-sm text-muted-foreground">
                          Комнат: {property.property_rooms}
                        </p>
                      )}
                      <div className="pt-2 border-t">
                        {(() => {
                          const { original, converted } = formatPrice(property.price, property.currency, property.exchange_rate);
                          return (
                            <div>
                              <p className="text-2xl font-bold text-primary">{original}</p>
                              {converted && <p className="text-sm text-muted-foreground mt-1">{converted}</p>}
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Loading indicator and sentinel */}
              {hasMore && (
                <div ref={ref} className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}
              
              {!hasMore && visibleProperties.length > 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Показаны все объекты ({filteredProperties.length})
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={navigatorLogo} alt="Navigator House" className="h-10 w-auto" />
              <div>
                <h3 className="font-semibold">Navigator House</h3>
                <p className="text-sm text-muted-foreground">Навигатор в мире недвижимости</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Navigator House. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Properties;
