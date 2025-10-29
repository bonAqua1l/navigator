import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Home, Maximize, Phone, ChevronLeft, ChevronRight, X, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/priceUtils";
import navigatorLogo from "@/assets/navigator-house-logo.png";
import { toast } from "sonner";

interface PropertyDetails {
  id: string;
  property_number: number;
  price: number;
  currency: string;
  exchange_rate: number | null;
  property_size: number | null;
  property_lot_size: number | null;
  property_rooms: string | null;
  description: string | null;
  property_area_id: string | null;
  property_category_id: string | null;
  property_action_category_id: string | null;
  property_condition_id: string | null;
  created_by: string;
  property_areas: { name: string; full_name: string | null } | null;
  property_categories: { name: string } | null;
  property_action_categories: { name: string } | null;
  property_conditions: { name: string } | null;
  property_photos: { id: string; photo_url: string; display_order: number }[];
  profiles?: { full_name: string; phone: string | null; email: string; avatar_url: string | null } | null;
}

const PropertyPublicDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [manager, setManager] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      fetchCollaborators();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          id,
          property_number,
          price,
          currency,
          exchange_rate,
          property_size,
          property_lot_size,
          property_rooms,
          description,
          property_area_id,
          property_category_id,
          property_action_category_id,
          property_condition_id,
          created_by,
          property_areas (name, full_name),
          property_categories (name),
          property_action_categories (name),
          property_conditions (name),
          property_photos (id, photo_url, display_order),
          profiles!properties_created_by_fkey (full_name, phone, email, avatar_url)
        `,
        )
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const sortedPhotos = [...(data.property_photos || [])].sort((a, b) => a.display_order - b.display_order);
        setProperty({ ...data, property_photos: sortedPhotos });
        setManager(data.profiles);
        if (sortedPhotos.length > 0) {
          setSelectedPhoto(sortedPhotos[0].photo_url);
        }
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Не удалось загрузить информацию об объекте");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("property_collaborators")
        .select(
          `
          id,
          user_id,
          profiles:user_id(full_name, phone, email, avatar_url)
        `,
        )
        .eq("property_id", id);

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    }
  };

  const handleContactRequest = () => {
    setContactDialogOpen(true);
  };

  const whatsappNumbers = [
    "+996 506 990 199",
    "+996 506 991 099",
    "+996 506 990 599",
    "+996 506 990 799"
  ];

  const createWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, "").replace("+", "");
    const message = `Здравствуйте! Хочу узнать подробнее об этом объявлении:\n\nОбъект №${property?.property_number}\nСсылка: ${window.location.href}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const openFullscreen = (index: number) => {
    setCurrentPhotoIndex(index);
    setFullscreenOpen(true);
  };

  const nextPhoto = () => {
    if (property && property.property_photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % property.property_photos.length);
    }
  };

  const prevPhoto = () => {
    if (property && property.property_photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + property.property_photos.length) % property.property_photos.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenOpen) {
        if (e.key === "ArrowRight") nextPhoto();
        if (e.key === "ArrowLeft") prevPhoto();
        if (e.key === "Escape") setFullscreenOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenOpen, property]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src={navigatorLogo} alt="Navigator House" className="h-10 w-auto" />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Объект не найден</h3>
              <p className="text-muted-foreground mb-6">Возможно, объект был удален или снят с публикации</p>
              <Button onClick={() => navigate("/properties")}>Вернуться к каталогу</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
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

      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/properties")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />К каталогу
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Объект №{property.property_number}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.property_areas?.name || "Район не указан"}</span>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                {property.property_action_categories?.name || "—"}
              </Badge>
            </div>

            {/* Photos */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {selectedPhoto && (
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                      <img src={selectedPhoto} alt="Property" className="w-full h-full object-cover" />
                      <button
                        onClick={() =>
                          openFullscreen(property.property_photos.findIndex((p) => p.photo_url === selectedPhoto))
                        }
                        className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Maximize className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  {property.property_photos.length > 1 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {property.property_photos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className={`aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedPhoto === photo.photo_url
                              ? "border-primary"
                              : "border-transparent hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedPhoto(photo.photo_url)}
                        >
                          <img src={photo.photo_url} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Details Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Информация об объекте</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="description">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">Описание</TabsTrigger>
                    <TabsTrigger value="details">Характеристики</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="space-y-4">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {property.description || "Описание отсутствует"}
                    </p>
                  </TabsContent>
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Категория</p>
                        <p className="font-medium">{property.property_categories?.name || "—"}</p>
                      </div>
                      {property.property_rooms && (
                        <div>
                          <p className="text-sm text-muted-foreground">Комнат</p>
                          <p className="font-medium">{property.property_rooms}</p>
                        </div>
                      )}
                      {property.property_size && (
                        <div>
                          <p className="text-sm text-muted-foreground">Площадь</p>
                          <p className="font-medium">{property.property_size} м²</p>
                        </div>
                      )}
                      {property.property_lot_size && (
                        <div>
                          <p className="text-sm text-muted-foreground">Площадь участка</p>
                          <p className="font-medium">{property.property_lot_size} соток</p>
                        </div>
                      )}
                      {property.property_conditions?.name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Состояние</p>
                          <p className="font-medium">{property.property_conditions.name}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Район</p>
                        <p className="font-medium">{property.property_areas?.name || "—"}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                {(() => {
                  const { original, converted } = formatPrice(property.price, property.currency, property.exchange_rate);
                  return (
                    <div>
                      <CardTitle className="text-3xl font-bold text-primary">{original}</CardTitle>
                      {converted && <p className="text-sm text-muted-foreground mt-2">{converted}</p>}
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Для получения подробной информации и организации показа свяжитесь с нами
                  </p>
                  <Button className="w-full" size="lg" onClick={handleContactRequest}>
                    <Phone className="h-5 w-5 mr-2" />
                    Связаться с нами
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>* Точный адрес объекта предоставляется после согласования показа</p>
                  <p>* Контактная информация владельца доступна только нашим клиентам</p>
                </div>
              </CardContent>

              {/* Manager Info */}
              {manager && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ответственный менеджер</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={manager.avatar_url || undefined} alt={manager.full_name} />
                        <AvatarFallback>
                          {manager.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{manager.full_name}</p>
                        {manager.phone && <p className="text-xs text-muted-foreground">{manager.phone}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 py-8 border-t mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={navigatorLogo} alt="Navigator House" className="h-10 w-auto" />
              <div>
                <h3 className="font-semibold">Navigator House</h3>
                <p className="text-sm text-muted-foreground">Навигатор в мире недвижимости</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">© 2024 Navigator House. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* Fullscreen Photo Dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-7xl w-[95vw] p-0 border-0">
          <div className="relative w-full bg-background rounded-lg overflow-hidden">
            <button
              onClick={() => setFullscreenOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-background/90 hover:bg-background rounded-lg transition-all shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {property && property.property_photos.length > 0 && (
              <>
                <div className="relative aspect-video bg-muted">
                  <img
                    src={property.property_photos[currentPhotoIndex].photo_url}
                    alt={`Photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {property.property_photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 hover:bg-background rounded-full transition-all shadow-lg"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 hover:bg-background rounded-full transition-all shadow-lg"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-background/90 rounded-lg shadow-lg">
                      <p className="text-sm font-medium">
                        {currentPhotoIndex + 1} / {property.property_photos.length}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Связаться с нами в WhatsApp
            </DialogTitle>
            <DialogDescription>
              Выберите удобный номер для связи. Сообщение будет автоматически заполнено информацией об объекте.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {whatsappNumbers.map((phone, index) => {
              const whatsappLink = createWhatsAppLink(phone);
              return (
                <a
                  key={index}
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setContactDialogOpen(false)}
                  className="flex items-center gap-3 p-3 bg-card border-2 border-border hover:border-green-500/50 rounded-lg transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-base font-medium text-foreground">{phone}</span>
                </a>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
            <p>✓ Нажав на номер, вы перейдете в WhatsApp</p>
            <p>✓ Сообщение будет автоматически заполнено</p>
            <p>✓ Просто отправьте его для начала диалога</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyPublicDetails;
