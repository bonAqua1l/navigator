import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building2, MapPin, Ruler, Home, Calendar, Phone, User, DollarSign, Star, Edit, Trash2, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/priceUtils';
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
} from '@/components/ui/alert-dialog';

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [viewings, setViewings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const photos = property?.property_photos?.slice().sort((a: any, b: any) => a.display_order - b.display_order) || [];

  const handleBack = () => {
    const rawDashboardState = sessionStorage.getItem('dashboard_state');
    let savedDashboardState: { currentPage?: number } | null = null;
    try {
      savedDashboardState = rawDashboardState ? JSON.parse(rawDashboardState) : null;
    } catch {
      savedDashboardState = null;
    }
    const savedPage = Number(savedDashboardState?.currentPage);
    const fallbackUrl = savedPage > 1 ? `/dashboard?page=${savedPage}` : '/dashboard';

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackUrl);
  };

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      fetchViewings();
      if (isAdmin) {
        fetchAuditLogs();
      }
      checkFavorite();
      checkCollaborator();
      fetchCollaborators();
    }
  }, [id, user?.id, isAdmin]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleFullscreenKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
        setZoomLevel(1);
        return;
      }

      if (event.key === 'ArrowRight' && photos.length > 1) {
        setSelectedPhoto((prev) => (prev + 1) % photos.length);
        setZoomLevel(1);
      }

      if (event.key === 'ArrowLeft' && photos.length > 1) {
        setSelectedPhoto((prev) => (prev - 1 + photos.length) % photos.length);
        setZoomLevel(1);
      }
    };

    document.addEventListener('keydown', handleFullscreenKeys);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleFullscreenKeys);
      document.body.style.overflow = '';
    };
  }, [isFullscreen, photos.length]);

  const fetchPropertyDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_categories(name, code),
          property_action_categories(name, code),
          property_areas(name, full_name),
          property_proposals(name, code),
          property_conditions(name, code),
          property_statuses(name, code, description),
          property_photos(id, photo_url, display_order),
          property_furniture_types(furniture_types(name)),
          property_communication_types(communication_types(name)),
          property_payment_types(payment_types(name)),
          property_document_types(document_types(name)),
          profiles!properties_created_by_fkey(full_name, phone, email, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить данные объявления',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchViewings = async () => {
    try {
      const { data, error } = await supabase
        .from('viewings')
        .select(`
          *,
          profiles!viewings_assigned_by_fkey(full_name, phone, avatar_url)
        `)
        .eq('property_id', id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setViewings(data || []);
    } catch (error) {
      console.error('Error fetching viewings:', error);
    }
  };

  const fetchAuditLogs = async () => {
    if (!id) return;

    setAuditLoading(true);

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', id)
        .in('entity_type', [
          'properties',
          'property_photos',
          'property_payment_types',
          'property_document_types',
          'property_communication_types',
          'property_furniture_types',
          'viewings',
        ])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching property audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('property_id', id)
        .eq('user_id', user.id)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      // Not in favorites
    }
  };

  const checkCollaborator = async () => {
    if (!user?.id || !id) return;

    try {
      const { data } = await supabase
        .from('property_collaborators')
        .select('id')
        .eq('property_id', id)
        .eq('user_id', user.id)
        .single();

      setIsCollaborator(!!data);
    } catch (error) {
      // Not a collaborator
    }
  };

  const fetchCollaborators = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('property_collaborators')
        .select(`
          id,
          user_id,
          profiles:user_id(full_name, phone, email, avatar_url)
        `)
        .eq('property_id', id);

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('property_id', id)
          .eq('user_id', user.id);
        setIsFavorite(false);
        toast({ title: 'Удалено из избранного' });
      } else {
        await supabase
          .from('favorites')
          .insert({ property_id: id, user_id: user.id });
        setIsFavorite(true);
        toast({ title: 'Добавлено в избранное' });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось обновить избранное',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'no_ads': return 'bg-yellow-500';
      case 'reserved': return 'bg-blue-500';
      case 'sold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Опубликовано';
      case 'no_ads': return 'Без рекламы';
      case 'reserved': return 'Забронировано';
      case 'sold': return 'Продано';
      default: return status;
    }
  };

  const getViewingStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getViewingStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Запланировано';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const getAuditActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Создание';
      case 'update':
        return 'Обновление';
      case 'delete':
        return 'Удаление';
      default:
        return action;
    }
  };

  const getAuditEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'properties':
        return 'Объявление';
      case 'property_photos':
        return 'Фотографии';
      case 'property_payment_types':
        return 'Способы оплаты';
      case 'property_document_types':
        return 'Документы';
      case 'property_communication_types':
        return 'Коммуникации';
      case 'property_furniture_types':
        return 'Мебель';
      case 'viewings':
        return 'Показы';
      default:
        return entityType;
    }
  };

  const getAuditFieldLabel = (field: string) => {
    switch (field) {
      case 'status':
        return 'Статус';
      case 'price':
        return 'Цена';
      case 'description':
        return 'Описание';
      case 'property_number':
      case 'number':
        return 'Номер';
      case 'photo_url':
        return 'Фото';
      case 'display_order':
        return 'Порядок фото';
      case 'payment_type_id':
        return 'Тип оплаты';
      case 'document_type_id':
        return 'Документ';
      case 'communication_type_id':
        return 'Коммуникация';
      case 'furniture_type_id':
        return 'Мебель';
      default:
        return field.replace(/_/g, ' ');
    }
  };

  const getAuditValueLabel = (field: string, value: any) => {
    if (value === null || value === undefined || value === '') return '—';

    if (field === 'status') {
      switch (value) {
        case 'no_ads':
          return 'Без рекламы';
        case 'published':
          return 'Опубликовано';
        case 'deleted':
          return 'Удалено';
        case 'sold':
          return 'Продано';
        default:
          return value;
      }
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const getAuditChangedFields = (log: any) => {
    const oldValues = log.old_values && typeof log.old_values === 'object' ? log.old_values : {};
    const newValues = log.new_values && typeof log.new_values === 'object' ? log.new_values : {};
    const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    return Array.from(keys)
      .filter(
        (key) =>
          !['id', 'created_at', 'updated_at', 'user_id', 'ip_address', 'user_agent', 'session_id'].includes(
            key
          )
      )
      .filter((key) => {
        if (log.action_type === 'create') {
          return newValues[key] !== undefined && newValues[key] !== null && newValues[key] !== '';
        }

        if (log.action_type === 'delete') {
          return oldValues[key] !== undefined && oldValues[key] !== null && oldValues[key] !== '';
        }

        return JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]);
      })
      .map((key) => ({
        field: key,
        label: getAuditFieldLabel(key),
        oldValue: oldValues[key],
        newValue: newValues[key],
      }));
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Объявление не найдено</h3>
          <p className="text-muted-foreground mb-6">
            Возможно, оно было удалено или у вас нет доступа
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Вернуться к объявлениям
          </Button>
        </Card>
      </div>
    );
  }

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 1));
  const openFullscreen = () => {
    if (!photos.length) return;
    setIsFullscreen(true);
    setZoomLevel(1);
  };
  const closeFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Объявление № {property.property_number}
            </h1>
            <p className="text-muted-foreground">{property.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user && (property.created_by === user.id || isCollaborator || isAdmin) && (
            <Button
              variant="outline"
              onClick={() => navigate(`/properties/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите удалить объявление №{property.property_number}?
                    Объявление будет перемещено в корзину.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('properties')
                          .update({
                            status: 'deleted',
                            deleted_at: new Date().toISOString(),
                            deleted_by: user?.id
                          })
                          .eq('id', id);
                        if (error) throw error;
                        toast({
                          title: 'Успешно',
                          description: 'Объявление перемещено в корзину',
                        });
                        navigate('/dashboard');
                      } catch (error) {
                        console.error('Error deleting property:', error);
                        toast({
                          variant: 'destructive',
                          title: 'Ошибка',
                          description: 'Не удалось удалить объявление',
                        });
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFavorite}
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <Badge className={getStatusColor(property.status)}>
            {getStatusText(property.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photos & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {photos.length > 0 ? (
                <img
                  src={photos[selectedPhoto].photo_url}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Building2 className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              {photos.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-4 right-4 z-20 bg-black/60 text-white hover:bg-black/80"
                  onClick={openFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {photos.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto">
                {photos.map((photo: any, index: number) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedPhoto === index ? 'border-primary' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={photo.photo_url}
                      alt={`${property.address} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="description">
          <TabsList className="w-full">
            <TabsTrigger value="description" className="flex-1">Описание</TabsTrigger>
            <TabsTrigger value="details" className="flex-1">Характеристики</TabsTrigger>
            <TabsTrigger value="viewings" className="flex-1">
              История показов ({viewings.length})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="audit" className="flex-1">
                История изменений ({auditLogs.length})
              </TabsTrigger>
            )}
          </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Описание</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description || 'Описание отсутствует'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Характеристики объекта</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {property.property_categories && (
                    <div>
                      <p className="text-sm text-muted-foreground">Категория</p>
                      <p className="font-medium">{property.property_categories.name}</p>
                    </div>
                  )}
                  {property.property_action_categories && (
                    <div>
                      <p className="text-sm text-muted-foreground">Тип сделки</p>
                      <p className="font-medium">{property.property_action_categories.name}</p>
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
                      <p className="font-medium">{property.property_lot_size} м²</p>
                    </div>
                  )}
                  {property.property_rooms && (
                    <div>
                      <p className="text-sm text-muted-foreground">Количество комнат</p>
                      <p className="font-medium">{property.property_rooms}</p>
                    </div>
                  )}
                  {property.property_floor_old && (
                    <div>
                      <p className="text-sm text-muted-foreground">Этаж</p>
                      <p className="font-medium">
                        {property.property_floor_old}
                        {property.property_floor_from_old && ` из ${property.property_floor_from_old}`}
                      </p>
                    </div>
                  )}
                  {property.property_areas && (
                    <div>
                      <p className="text-sm text-muted-foreground">Район</p>
                      <p className="font-medium">{property.property_areas.name}</p>
                    </div>
                  )}
                  {property.property_conditions && (
                    <div>
                      <p className="text-sm text-muted-foreground">Состояние</p>
                      <p className="font-medium">{property.property_conditions.name}</p>
                    </div>
                  )}
                  {property.property_proposals && (
                    <div>
                      <p className="text-sm text-muted-foreground">Предложение</p>
                      <p className="font-medium">{property.property_proposals.name}</p>
                    </div>
                  )}
                  {property.property_furniture_types?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">Мебель</p>
                      <div className="flex flex-wrap gap-2">
                        {property.property_furniture_types.map((item: any) => (
                          <Badge key={item.furniture_types.name} variant="secondary">
                            {item.furniture_types.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {property.property_communication_types?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">Коммуникации</p>
                      <div className="flex flex-wrap gap-2">
                        {property.property_communication_types.map((item: any) => (
                          <Badge key={item.communication_types.name} variant="secondary">
                            {item.communication_types.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {property.property_payment_types?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">Способы оплаты</p>
                      <div className="flex flex-wrap gap-2">
                        {property.property_payment_types.map((item: any) => (
                          <Badge key={item.payment_types.name} variant="secondary">
                            {item.payment_types.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {property.property_document_types?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">Документы</p>
                      <div className="flex flex-wrap gap-2">
                        {property.property_document_types.map((item: any) => (
                          <Badge key={item.document_types.name} variant="secondary">
                            {item.document_types.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="viewings" className="space-y-4">
              {viewings.length > 0 ? (
                viewings.map((viewing) => (
                  <Card key={viewing.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {new Date(viewing.scheduled_at).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </CardTitle>
                        <Badge className={getViewingStatusColor(viewing.status)}>
                          {getViewingStatusText(viewing.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={viewing.profiles?.avatar_url || undefined} alt={viewing.profiles?.full_name} />
                            <AvatarFallback className="text-xs">
                              {viewing.profiles?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{viewing.profiles?.full_name}</span>
                        </div>
                        {viewing.profiles?.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{viewing.profiles.phone}</span>
                          </div>
                        )}
                        {viewing.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{viewing.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Пока нет назначенных показов</p>
                </Card>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>История изменений объявления</CardTitle>
                    <CardDescription>
                      Изменения по текущему объявлению и связанным сущностям
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {auditLoading ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Загрузка истории изменений...
                      </div>
                    ) : auditLogs.length > 0 ? (
                      <div className="space-y-3">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="rounded-lg border p-4 space-y-3">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold">
                                  {getAuditEntityLabel(log.entity_type)} • {getAuditActionLabel(log.action_type)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(log.created_at).toLocaleString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              <Badge variant="outline" className="w-fit">
                                {log.entity_type}
                              </Badge>
                            </div>

                            {(() => {
                              const changedFields = getAuditChangedFields(log);

                              return changedFields.length > 0 ? (
                                <div className="space-y-3">
                                  {changedFields.map((fieldChange) => (
                                    <div key={`${log.id}-${fieldChange.field}`} className="rounded-md bg-muted/40 p-3">
                                      <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="font-medium">{fieldChange.label}</p>
                                        <Badge variant="outline">{fieldChange.field}</Badge>
                                      </div>

                                      {log.action_type === 'delete' ? (
                                        <div className="text-sm">
                                          <span className="text-muted-foreground">Было: </span>
                                          <span className="font-medium">
                                            {getAuditValueLabel(fieldChange.field, fieldChange.oldValue)}
                                          </span>
                                        </div>
                                      ) : log.action_type === 'create' ? (
                                        <div className="text-sm">
                                          <span className="text-muted-foreground">Стало: </span>
                                          <span className="font-medium">
                                            {getAuditValueLabel(fieldChange.field, fieldChange.newValue)}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="grid gap-3 md:grid-cols-2">
                                          <div>
                                            <p className="text-xs uppercase text-muted-foreground">Было</p>
                                            <p className="text-sm font-medium break-words">
                                              {getAuditValueLabel(fieldChange.field, fieldChange.oldValue)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs uppercase text-muted-foreground">Стало</p>
                                            <p className="text-sm font-medium break-words">
                                              {getAuditValueLabel(fieldChange.field, fieldChange.newValue)}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  В этом событии не найдено изменённых полей.
                                </p>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        История изменений отсутствует
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Column - Price & Contact */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Цена</CardTitle>
              {(() => {
                const { original, converted } = formatPrice(property.price, property.currency, property.exchange_rate);
                return (
                  <div>
                    <div className="text-3xl font-bold text-primary">{original}</div>
                    {converted && <div className="text-sm text-muted-foreground mt-2">{converted}</div>}
                  </div>
                );
              })()}
            </CardHeader>
            {property.price_in_hand && (
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Цена на руки</p>
                  {(() => {
                    const { original, converted } = formatPrice(property.price_in_hand, property.currency, property.exchange_rate);
                    return (
                      <div>
                        <div className="text-2xl font-bold text-green-600">{original}</div>
                        {converted && <div className="text-xs text-muted-foreground mt-1">{converted}</div>}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Owner Contact - Only visible to author, collaborators and super admin */}
          {user && (user.id === property.created_by || isCollaborator || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle>Контакты владельца</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{property.owner_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{property.owner_contacts}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manager Info */}
          {property.profiles && (
            <Card>
              <CardHeader>
                <CardTitle>Ответственный менеджер</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={property.profiles.avatar_url || undefined} alt={property.profiles.full_name} />
                    <AvatarFallback>
                      {property.profiles.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{property.profiles.full_name}</p>
                    {property.profiles.phone && (
                      <p className="text-xs text-muted-foreground">{property.profiles.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collaborators Info */}
          {collaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Дополнительные договорники</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={collaborator.profiles?.avatar_url || undefined} alt={collaborator.profiles?.full_name} />
                      <AvatarFallback>
                        {collaborator.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{collaborator.profiles?.full_name}</p>
                      {collaborator.profiles?.phone && (
                        <p className="text-xs text-muted-foreground">{collaborator.profiles.phone}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Создано:</span>
                <span>
                  {new Date(property.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Обновлено:</span>
                <span>
                  {new Date(property.updated_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isFullscreen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="bg-black/60 text-white hover:bg-black/80"
              onClick={zoomOut}
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="bg-black/60 text-white hover:bg-black/80"
              onClick={zoomIn}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="bg-black/60 text-white hover:bg-black/80"
              onClick={closeFullscreen}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-4 right-4 z-20 rounded-md bg-black/60 px-3 py-1 text-sm text-white">
            {selectedPhoto + 1} / {photos.length}
          </div>

          <div
            className="h-full w-full flex items-center justify-center overflow-hidden"
            onWheel={(event) => {
              event.preventDefault();
              if (event.deltaY < 0) {
                zoomIn();
              } else {
                zoomOut();
              }
            }}
          >
            <img
              src={photos[selectedPhoto].photo_url}
              alt={property.address}
              className="max-h-full max-w-full object-contain select-none transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
