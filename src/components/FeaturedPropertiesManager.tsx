import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Property {
  id: string;
  property_number: number;
  address: string;
  price: number;
  currency: string;
  status: string;
}

interface FeaturedProperty {
  id: string;
  property_id: string;
  display_order: number;
  properties: Property;
}

export function FeaturedPropertiesManager() {
  const [featured, setFeatured] = useState<FeaturedProperty[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch featured properties
      const { data: featuredData, error: featuredError } = await supabase
        .from("featured_properties")
        .select(`
          id,
          property_id,
          display_order,
          properties:property_id (
            id,
            property_number,
            address,
            price,
            currency,
            status
          )
        `)
        .order("display_order", { ascending: true });

      if (featuredError) throw featuredError;

      setFeatured((featuredData as any) || []);

      // Fetch all published properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id, property_number, address, price, currency, status")
        .eq("status", "published")
        .order("property_number", { ascending: false });

      if (propertiesError) throw propertiesError;

      // Filter out already featured properties
      const featuredIds = (featuredData || []).map((f) => f.property_id);
      const available = (propertiesData || []).filter(
        (p) => !featuredIds.includes(p.id)
      );

      setAvailableProperties(available);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeatured = async (propertyId: string, order: number) => {
    try {
      const { error } = await supabase.from("featured_properties").insert({
        property_id: propertyId,
        display_order: order,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Объявление добавлено в избранное",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error adding featured property:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось добавить объявление",
      });
    }
  };

  const removeFeatured = async (id: string) => {
    try {
      const { error } = await supabase
        .from("featured_properties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Объявление удалено из избранного",
      });

      fetchData();
    } catch (error) {
      console.error("Error removing featured property:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить объявление",
      });
    }
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      // Check if order is already taken
      const existing = featured.find((f) => f.display_order === newOrder && f.id !== id);
      
      if (existing) {
        // Swap orders
        await supabase
          .from("featured_properties")
          .update({ display_order: 0 })
          .eq("id", existing.id);

        await supabase
          .from("featured_properties")
          .update({ display_order: newOrder })
          .eq("id", id);

        const oldOrder = featured.find((f) => f.id === id)?.display_order;
        if (oldOrder) {
          await supabase
            .from("featured_properties")
            .update({ display_order: oldOrder })
            .eq("id", existing.id);
        }
      } else {
        await supabase
          .from("featured_properties")
          .update({ display_order: newOrder })
          .eq("id", id);
      }

      toast({
        title: "Успешно",
        description: "Порядок обновлен",
      });

      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить порядок",
      });
    }
  };

  const filteredProperties = availableProperties.filter(
    (p) =>
      p.property_number.toString().includes(searchQuery) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableOrders = [1, 2, 3, 4, 5].filter(
    (order) => !featured.some((f) => f.display_order === order)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Избранные объявления на главной странице
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {featured.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              Нет избранных объявлений
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {featured.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Badge variant="secondary" className="shrink-0 w-fit text-xs">
                    #{item.display_order}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base">
                      Объект №{item.properties.property_number}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">
                      {item.properties.address}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-primary">
                      {item.properties.price.toLocaleString("ru-RU")}{" "}
                      {item.properties.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={item.display_order.toString()}
                      onValueChange={(value) => updateOrder(item.id, parseInt(value))}
                    >
                      <SelectTrigger className="w-20 sm:w-24 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((order) => (
                          <SelectItem key={order} value={order.toString()}>
                            {order}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeatured(item.id)}
                      className="h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {featured.length < 5 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Добавить объявление</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру или адресу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {filteredProperties.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                Нет доступных объявлений
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base">
                        Объект №{property.property_number}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {property.address}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-primary">
                        {property.price.toLocaleString("ru-RU")} {property.currency}
                      </div>
                    </div>
                    {availableOrders.length > 0 ? (
                      <Select
                        onValueChange={(value) =>
                          addFeatured(property.id, parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                          <SelectValue placeholder="Позиция" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOrders.map((order) => (
                            <SelectItem key={order} value={order.toString()}>
                              Позиция {order}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="text-xs w-fit">Нет мест</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
