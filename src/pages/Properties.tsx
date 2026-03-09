import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Home, Filter } from "lucide-react";
import { ROOM_OPTIONS } from "@/types/property";
import { formatPrice } from "@/lib/priceUtils";
import { MultiSelectCombobox } from "@/components/MultiSelectCombobox";
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
  property_floor_old: number | null;
  property_floor_from_old: number | null;
  property_rooms: string | null;
  property_area_id: string | null;
  property_category_id: string | null;
  property_subcategory_id: string | null;
  property_action_category_id: string | null;
  property_condition_id: string | null;
  property_proposal_id: string | null;
  property_developer: string | null;
  property_areas: { name: string; full_name: string | null } | null;
  property_categories: { name: string } | null;
  property_subcategories: { name: string } | null;
  property_action_categories: { name: string } | null;
  property_conditions: { name: string } | null;
  property_proposals: { name: string } | null;
  property_furniture_types?: { furniture_type_id: string; furniture_types: { name: string } | null }[];
  property_communication_types?: { communication_type_id: string; communication_types: { name: string } | null }[];
  property_payment_types?: { payment_type_id: string; payment_types: { name: string } | null }[];
  property_document_types?: { document_type_id: string; document_types: { name: string } | null }[];
  property_photos: { photo_url: string }[];
}

const ITEMS_PER_LOAD = 12;

const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([]);
  const [areaFilter, setAreaFilter] = useState<string[]>([]);
  const [roomsFilter, setRoomsFilter] = useState<string[]>([]);
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [proposalFilter, setProposalFilter] = useState<string[]>([]);
  const [developerFilter, setDeveloperFilter] = useState<string[]>([]);
  const [furnitureFilter, setFurnitureFilter] = useState<string[]>([]);
  const [communicationFilter, setCommunicationFilter] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const [documentFilter, setDocumentFilter] = useState<string[]>([]);
  const [floorFromFilter, setFloorFromFilter] = useState<string>("");
  const [floorToFilter, setFloorToFilter] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_LOAD);

  const [actionCategories, setActionCategories] = useState<any[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<any[]>([]);
  const [propertySubcategories, setPropertySubcategories] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [furnitureTypes, setFurnitureTypes] = useState<any[]>([]);
  const [communicationTypes, setCommunicationTypes] = useState<any[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    fetchProperties();
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const [actionsRes, categoriesRes, subcategoriesRes, areasRes, conditionsRes, proposalsRes, developersRes, furnitureRes, communicationRes, paymentRes, documentRes] = await Promise.all([
        supabase.from("property_action_categories").select("*"),
        supabase.from("property_categories").select("*"),
        supabase.from("property_subcategories").select("*").order("name"),
        supabase.from("property_areas").select("*").order("name"),
        supabase.from("property_conditions").select("*").order("name"),
        supabase.from("property_proposals").select("*").order("name"),
        supabase.from("property_developers").select("*").order("name"),
        supabase.from("furniture_types").select("*").order("name"),
        supabase.from("communication_types").select("*").order("name"),
        supabase.from("payment_types").select("*").order("name"),
        supabase.from("document_types").select("*").order("name")
      ]);

      setActionCategories(actionsRes.data || []);
      setPropertyCategories(categoriesRes.data || []);
      setPropertySubcategories(subcategoriesRes.data || []);
      setAreas(areasRes.data || []);
      setConditions(conditionsRes.data || []);
      setProposals(proposalsRes.data || []);
      setDevelopers(developersRes.data || []);
      setFurnitureTypes(furnitureRes.data || []);
      setCommunicationTypes(communicationRes.data || []);
      setPaymentTypes(paymentRes.data || []);
      setDocumentTypes(documentRes.data || []);
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
          property_floor_old,
          property_floor_from_old,
          property_rooms,
          property_area_id,
          property_category_id,
          property_subcategory_id,
          property_action_category_id,
          property_condition_id,
          property_proposal_id,
          property_developer,
          property_areas (name, full_name),
          property_categories (name),
          property_subcategories (name),
          property_action_categories (name),
          property_conditions (name),
          property_proposals (name),
          property_furniture_types (furniture_type_id, furniture_types(name)),
          property_communication_types (communication_type_id, communication_types(name)),
          property_payment_types (payment_type_id, payment_types(name)),
          property_document_types (document_type_id, document_types(name)),
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

    const matchesProposal =
      proposalFilter.length === 0 || proposalFilter.includes(property.property_proposal_id || '');

    const matchesDeveloper =
      developerFilter.length === 0 || developerFilter.includes(property.property_developer || '');

    const propertyFurnitureIds = (property.property_furniture_types || []).map((item) => item.furniture_type_id);
    const propertyCommunicationIds = (property.property_communication_types || []).map((item) => item.communication_type_id);
    const propertyPaymentIds = (property.property_payment_types || []).map((item) => item.payment_type_id);
    const propertyDocumentIds = (property.property_document_types || []).map((item) => item.document_type_id);

    const matchesFurniture = furnitureFilter.length === 0 || furnitureFilter.some((id) => propertyFurnitureIds.includes(id));
    const matchesCommunication = communicationFilter.length === 0 || communicationFilter.some((id) => propertyCommunicationIds.includes(id));
    const matchesPayment = paymentFilter.length === 0 || paymentFilter.some((id) => propertyPaymentIds.includes(id));
    const matchesDocument = documentFilter.length === 0 || documentFilter.some((id) => propertyDocumentIds.includes(id));

    const floorFromNum = floorFromFilter ? parseInt(floorFromFilter, 10) : null;
    const floorToNum = floorToFilter ? parseInt(floorToFilter, 10) : null;
    const currentFloor = property.property_floor_old ?? null;
    const matchesFloorFrom = floorFromNum === null || (currentFloor !== null && currentFloor >= floorFromNum);
    const matchesFloorTo = floorToNum === null || (currentFloor !== null && currentFloor <= floorToNum);

    const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice =
      property.price >= minPriceNum && property.price <= maxPriceNum;

    return matchesSearch && matchesAction && matchesCategory && matchesSubcategory && matchesArea && matchesRooms && matchesCondition && matchesProposal && matchesDeveloper && matchesFurniture && matchesCommunication && matchesPayment && matchesDocument && matchesFloorFrom && matchesFloorTo && matchesPrice;
  });

  const visibleProperties = filteredProperties.slice(0, displayedCount);
  const hasMore = displayedCount < filteredProperties.length;

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_LOAD);
  }, [searchTerm, actionFilter, categoryFilter, subcategoryFilter, areaFilter, roomsFilter, conditionFilter, proposalFilter, developerFilter, furnitureFilter, communicationFilter, paymentFilter, documentFilter, floorFromFilter, floorToFilter, minPrice, maxPrice]);

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
                  <MultiSelectCombobox
                    options={actionCategories}
                    selected={actionFilter}
                    onChange={setActionFilter}
                    placeholder="Все"
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
                    placeholder="Все"
                    searchPlaceholder="Поиск типа недвижимости..."
                  />
                </div>

                {/* Property Subcategory (Дежурка) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Подтип</label>
                  <MultiSelectCombobox
                    options={propertySubcategories}
                    selected={subcategoryFilter}
                    onChange={setSubcategoryFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск подтипа..."
                  />
                </div>

                {/* Rooms */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Количество комнат</label>
                  <MultiSelectCombobox
                    options={ROOM_OPTIONS.map((room) => ({ id: room.value, name: room.label }))}
                    selected={roomsFilter}
                    onChange={setRoomsFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск количества комнат..."
                  />
                </div>

                {/* Area (Multi-Select) */}
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
                    placeholder="Все"
                    searchPlaceholder="Поиск состояния..."
                  />
                </div>

                {/* Proposal */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Предложение</label>
                  <MultiSelectCombobox
                    options={proposals}
                    selected={proposalFilter}
                    onChange={setProposalFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск предложения..."
                  />
                </div>

                {/* Developer (ЖК) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ЖК</label>
                  <MultiSelectCombobox
                    options={developers.map((developer: any) => ({ id: developer.name, name: developer.name }))}
                    selected={developerFilter}
                    onChange={setDeveloperFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск ЖК..."
                  />
                </div>

                {/* Furniture */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Мебель</label>
                  <MultiSelectCombobox
                    options={furnitureTypes}
                    selected={furnitureFilter}
                    onChange={setFurnitureFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск мебели..."
                  />
                </div>

                {/* Communications */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Коммуникации</label>
                  <MultiSelectCombobox
                    options={communicationTypes}
                    selected={communicationFilter}
                    onChange={setCommunicationFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск коммуникаций..."
                  />
                </div>

                {/* Payment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Способы оплаты</label>
                  <MultiSelectCombobox
                    options={paymentTypes}
                    selected={paymentFilter}
                    onChange={setPaymentFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск способа оплаты..."
                  />
                </div>

                {/* Documents */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Документы</label>
                  <MultiSelectCombobox
                    options={documentTypes}
                    selected={documentFilter}
                    onChange={setDocumentFilter}
                    placeholder="Все"
                    searchPlaceholder="Поиск документов..."
                  />
                </div>

                {/* Floor From */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Этаж от</label>
                  <Input
                    type="number"
                    placeholder="Мин. этаж"
                    value={floorFromFilter}
                    onChange={(e) => setFloorFromFilter(e.target.value)}
                  />
                </div>

                {/* Floor To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Этаж до</label>
                  <Input
                    type="number"
                    placeholder="Макс. этаж"
                    value={floorToFilter}
                    onChange={(e) => setFloorToFilter(e.target.value)}
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
                      setSearchTerm("");
                      setActionFilter([]);
                      setCategoryFilter([]);
                      setSubcategoryFilter([]);
                      setAreaFilter([]);
                      setRoomsFilter([]);
                      setConditionFilter([]);
                      setProposalFilter([]);
                      setDeveloperFilter([]);
                      setFurnitureFilter([]);
                      setCommunicationFilter([]);
                      setPaymentFilter([]);
                      setDocumentFilter([]);
                      setFloorFromFilter("");
                      setFloorToFilter("");
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
                  <a
                    key={property.id}
                    href={`/properties/${property.id}/public`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block no-underline text-inherit"
                  >
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
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
                        {property.property_floor_old && (
                          <p className="text-sm text-muted-foreground">
                            Этаж: {property.property_floor_old}
                            {property.property_floor_from_old ? ` из ${property.property_floor_from_old}` : ""}
                          </p>
                        )}
                        {property.property_conditions?.name && (
                          <p className="text-sm text-muted-foreground">
                            Состояние: {property.property_conditions.name}
                          </p>
                        )}
                        {property.property_proposals?.name && (
                          <p className="text-sm text-muted-foreground">
                            Предложение: {property.property_proposals.name}
                          </p>
                        )}
                        {property.property_areas?.full_name && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            Локация: {property.property_areas.full_name}
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
                  </a>
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
