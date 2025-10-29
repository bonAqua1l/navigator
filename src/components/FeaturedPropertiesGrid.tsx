import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MapPin, Bed, Maximize } from "lucide-react";
interface Property {
  id: string;
  property_number: number;
  price: number;
  currency: string;
  address: string;
  description: string | null;
  property_rooms: string | null;
  property_size: number | null;
  property_category_id: string | null;
  property_subcategory_id: string | null;
  property_action_category_id: string | null;
}
interface FeaturedProperty {
  id: string;
  property_id: string;
  display_order: number;
  properties: Property;
  property_photos: {
    photo_url: string;
  }[];
}
export function FeaturedPropertiesGrid() {
  const [featured, setFeatured] = useState<FeaturedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Функция для обрезки описания
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
  useEffect(() => {
    fetchFeaturedProperties();
  }, []);
  const fetchFeaturedProperties = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("featured_properties").select(`
          id,
          property_id,
          display_order,
          properties:property_id (
            id,
            property_number,
            price,
            currency,
            address,
            description,
            property_rooms,
            property_size,
            property_category_id,
            property_subcategory_id,
            property_action_category_id,
            status
          )
        `).order("display_order", {
        ascending: true
      });
      if (error) throw error;

      // Filter only published properties
      const publishedData = (data || []).filter(
        (item: any) => item.properties?.status === 'published'
      );

      const propertiesWithPhotos = await Promise.all(publishedData.map(async item => {
        const {
          data: photos
        } = await supabase.from("property_photos").select("photo_url").eq("property_id", item.property_id).order("display_order", {
          ascending: true
        }).limit(1);
        return {
          ...item,
          property_photos: photos || []
        };
      }));
      setFeatured(propertiesWithPhotos as any);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return null;
  }

  if (featured.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 bg-amber-500">
              Рекомендуемые объекты
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Лучшие предложения</h2>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Скоро появятся новые объекты</h3>
              <p className="text-muted-foreground mb-6">
                Мы работаем над добавлением лучших предложений для вас
              </p>
              <Button onClick={() => navigate('/properties')} variant="outline">
                Смотреть все объекты
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }
  return <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 bg-amber-500">
            Рекомендуемые объекты
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Лучшие предложения</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {featured.map(item => {
          const property = item.properties as Property;
          const photoUrl = item.property_photos[0]?.photo_url;
          return <Card key={item.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg group cursor-pointer" onClick={() => navigate(`/properties/${property.id}/public`)}>
                <div className="relative h-48 bg-muted overflow-hidden">
                  {photoUrl ? <img src={photoUrl} alt={`Объект ${property.property_number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">№{property.property_number}</Badge>
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{property.price.toLocaleString("ru-RU")}</span>
                    <span className="text-sm text-muted-foreground">{property.currency}</span>
                  </div>

                  {property.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {truncateDescription(property.description, 120)}
                    </p>
                  )}

                  <div className="flex gap-4 pt-2 border-t border-border">
                    {property.property_rooms && <div className="flex items-center gap-1.5 text-sm">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {property.property_rooms === "studio" ? "Студия" : `${property.property_rooms} комн.`}
                        </span>
                      </div>}
                    {property.property_size && <div className="flex items-center gap-1.5 text-sm">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                        <span>{property.property_size} м²</span>
                      </div>}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-primary to-primary-hover hover:opacity-90" onClick={e => {
                e.stopPropagation();
                navigate(`/properties/${property.id}/public`);
              }}>
                    Подробнее
                  </Button>
                </CardContent>
              </Card>;
        })}
        </div>

        <div className="flex justify-center mt-8">
          <Button size="lg" onClick={() => navigate('/properties')} className="px-8 py-6 text-lg bg-yellow-600 hover:bg-yellow-500 text-white">
            Еще больше
          </Button>
        </div>
      </div>
    </section>;
}