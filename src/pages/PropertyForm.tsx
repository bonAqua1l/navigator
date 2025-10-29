import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card as ShadCard, CardContent as ShadCardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SearchableSelect } from "@/components/SearchableSelect";
import PhotoPreview from "@/components/PhotoPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload, X, UserPlus } from "lucide-react";
import {
  PropertyActionCategory,
  PropertyCategory,
  PropertyArea,
  PropertyProposal,
  PropertyCondition,
  PaymentType,
  DocumentType,
  CommunicationType,
  FurnitureType,
  ROOM_OPTIONS,
  generateFloorOptions,
} from "@/types/property";

export default function PropertyForm() {
  const navigate = useNavigate();
  const { id: propertyId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const isEditMode = !!propertyId;

  // Справочники
  const [actionCategories, setActionCategories] = useState<PropertyActionCategory[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [areas, setAreas] = useState<PropertyArea[]>([]);
  const [proposals, setProposals] = useState<PropertyProposal[]>([]);
  const [conditions, setConditions] = useState<PropertyCondition[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [communicationTypes, setCommunicationTypes] = useState<CommunicationType[]>([]);
  const [furnitureTypes, setFurnitureTypes] = useState<FurnitureType[]>([]);
  const [seriesList, setSeriesList] = useState<{ id: string; name: string }[]>([]);
  const [developersList, setDevelopersList] = useState<{ id: string; name: string }[]>([]);

  const floorOptions = generateFloorOptions();

  const [formData, setFormData] = useState({
    property_action_category_id: "",
    property_category_id: "",
    property_rooms: "",
    property_size: "",
    property_lot_size: "",
    property_area_id: "",
    property_proposal_id: "",
    property_condition_id: "",
    property_floor_old: "",
    property_floor_from_old: "",
    address: "",
    price: "",
    price_in_hand: "",
    currency: "USD",
    exchange_rate: "",
    description: "",
    owner_name: "",
    owner_contacts: "",
    property_series: "",
    property_developer: "",
  });

  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedCommunications, setSelectedCommunications] = useState<string[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Collaborators state
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState("");

  // Загрузка справочников
  useEffect(() => {
    loadReferenceData();
    loadAvailableManagers();
  }, []);

  // Загрузка данных объявления в режиме редактирования
  useEffect(() => {
    if (isEditMode && propertyId) {
      loadPropertyData(propertyId);
      loadCollaborators(propertyId);
    }
  }, [isEditMode, propertyId]);

  const loadPropertyData = async (id: string) => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
          property_payment_types(payment_type_id),
          property_document_types(document_type_id),
          property_communication_types(communication_type_id),
          property_furniture_types(furniture_type_id),
          property_photos(id, photo_url, display_order)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          property_action_category_id: data.property_action_category_id || "",
          property_category_id: data.property_category_id || "",
          property_rooms: data.property_rooms || "",
          property_size: data.property_size?.toString() || "",
          property_lot_size: data.property_lot_size?.toString() || "",
          property_area_id: data.property_area_id || "",
          property_proposal_id: data.property_proposal_id || "",
          property_condition_id: data.property_condition_id || "",
          property_floor_old: data.property_floor_old?.toString() || "",
          property_floor_from_old: data.property_floor_from_old?.toString() || "",
          address: data.address || "",
          price: data.price?.toString() || "",
          price_in_hand: data.price_in_hand?.toString() || "",
          currency: data.currency || "USD",
          exchange_rate: data.exchange_rate?.toString() || "",
          description: data.description || "",
          owner_name: data.owner_name || "",
          owner_contacts: data.owner_contacts || "",
          property_series: data.property_series || "",
          property_developer: data.property_developer || "",
        });

        if (data.property_payment_types) {
          setSelectedPaymentTypes(data.property_payment_types.map((pt: any) => pt.payment_type_id));
        }
        if (data.property_document_types) {
          setSelectedDocuments(data.property_document_types.map((dt: any) => dt.document_type_id));
        }
        if (data.property_communication_types) {
          setSelectedCommunications(data.property_communication_types.map((ct: any) => ct.communication_type_id));
        }
        if (data.property_furniture_types) {
          setSelectedFurniture(data.property_furniture_types.map((ft: any) => ft.furniture_type_id));
        }
      }
    } catch (error) {
      console.error("Error loading property:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные объявления",
      });
      navigate("/my-properties");
    } finally {
      setLoadingData(false);
    }
  };

  const loadAvailableManagers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("id", user?.id || "");

      if (error) throw error;
      if (data) setAvailableManagers(data);
    } catch (error) {
      console.error("Error loading managers:", error);
    }
  };

  const loadCollaborators = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from("property_collaborators")
        .select(
          `
          id,
          user_id,
          profiles:user_id (id, full_name, email)
        `,
        )
        .eq("property_id", propertyId);

      if (error) throw error;
      if (data) setCollaborators(data);
    } catch (error) {
      console.error("Error loading collaborators:", error);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedCollaborator || !propertyId) return;

    try {
      const { error } = await supabase.from("property_collaborators").insert({
        property_id: propertyId,
        user_id: selectedCollaborator,
        added_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Договорник добавлен",
      });

      loadCollaborators(propertyId);
      setSelectedCollaborator("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      });
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase.from("property_collaborators").delete().eq("id", collaboratorId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Договорник удален",
      });

      loadCollaborators(propertyId!);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      });
    }
  };

  const loadReferenceData = async () => {
    try {
      const [
        actionCategoriesRes,
        propertyCategoriesRes,
        areasRes,
        proposalsRes,
        conditionsRes,
        paymentTypesRes,
        documentTypesRes,
        communicationTypesRes,
        furnitureTypesRes,
        seriesRes,
        developersRes,
      ] = await Promise.all([
        supabase.from("property_action_categories").select("*"),
        supabase.from("property_categories").select("*"),
        supabase.from("property_areas").select("*").order("name"),
        supabase.from("property_proposals").select("*"),
        supabase.from("property_conditions").select("*"),
        supabase.from("payment_types").select("*"),
        supabase.from("document_types").select("*"),
        supabase.from("communication_types").select("*"),
        supabase.from("furniture_types").select("*"),
        supabase.from("property_series").select("*").order("name"),
        supabase.from("property_developers").select("*").order("name"),
      ]);

      if (actionCategoriesRes.data) setActionCategories(actionCategoriesRes.data);
      if (propertyCategoriesRes.data) setPropertyCategories(propertyCategoriesRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (proposalsRes.data) setProposals(proposalsRes.data);
      if (conditionsRes.data) setConditions(conditionsRes.data);
      if (paymentTypesRes.data) setPaymentTypes(paymentTypesRes.data);
      if (documentTypesRes.data) setDocumentTypes(documentTypesRes.data);
      if (communicationTypesRes.data) setCommunicationTypes(communicationTypesRes.data);
      if (furnitureTypesRes.data) setFurnitureTypes(furnitureTypesRes.data);
      if (seriesRes.data) setSeriesList(seriesRes.data);
      if (developersRes.data) setDevelopersList(developersRes.data);
    } catch (error) {
      console.error("Error loading reference data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Клиентская валидация
    if (
      !formData.property_action_category_id ||
      !formData.property_category_id ||
      !formData.property_proposal_id ||
      !formData.property_size ||
      !formData.address ||
      !formData.price ||
      !formData.exchange_rate ||
      !formData.owner_name ||
      !formData.owner_contacts
    ) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните все обязательные поля",
      });
      return;
    }

    // Проверка фотографий только для новых объявлений
    if (!isEditMode && selectedImages.length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Добавьте хотя бы одну фотографию",
      });
      return;
    }

    setLoading(true);
    try {
      const propertyData = {
        property_action_category_id: formData.property_action_category_id || null,
        property_category_id: formData.property_category_id || null,
        property_rooms: formData.property_rooms || null,
        property_size: formData.property_size ? parseFloat(formData.property_size) : null,
        property_lot_size: formData.property_lot_size ? parseFloat(formData.property_lot_size) : null,
        property_area_id: formData.property_area_id || null,
        property_proposal_id: formData.property_proposal_id || null,
        property_condition_id: formData.property_condition_id || null,
        property_floor_old: formData.property_floor_old ? parseInt(formData.property_floor_old) : null,
        property_floor_from_old: formData.property_floor_from_old ? parseInt(formData.property_floor_from_old) : null,
        address: formData.address,
        price: parseFloat(formData.price),
        price_in_hand: formData.price_in_hand ? parseFloat(formData.price_in_hand) : null,
        currency: formData.currency,
        exchange_rate: formData.exchange_rate ? parseFloat(formData.exchange_rate) : null,
        description: formData.description || null,
        owner_name: formData.owner_name,
        owner_contacts: formData.owner_contacts,
        property_series: formData.property_series || null,
        property_developer: formData.property_developer || null,
      };

      let propertyIdToUse: string;

      if (isEditMode && propertyId) {
        // Обновление существующего объявления
        // Получаем текущие данные для проверки property_number
        const { data: currentProperty } = await supabase
          .from("properties")
          .select("property_number")
          .eq("id", propertyId)
          .single();

        // Проверяем, есть ли уже ID в описании
        const propertyNumber = currentProperty?.property_number;
        let finalDescription = propertyData.description || "";

        if (propertyNumber && finalDescription && !finalDescription.includes(`ID: ${propertyNumber}`)) {
          // Если ID нет в описании, добавляем его
          finalDescription = `${finalDescription}\n\nID: ${propertyNumber}`;
        } else if (propertyNumber && !finalDescription) {
          // Если описание пустое, добавляем только ID
          finalDescription = `ID: ${propertyNumber}`;
        }

        const { error: updateError } = await supabase
          .from("properties")
          .update({ ...propertyData, description: finalDescription })
          .eq("id", propertyId);

        if (updateError) throw updateError;
        propertyIdToUse = propertyId;

        // Удаление старых связей
        await Promise.all([
          supabase.from("property_payment_types").delete().eq("property_id", propertyId),
          supabase.from("property_document_types").delete().eq("property_id", propertyId),
          supabase.from("property_communication_types").delete().eq("property_id", propertyId),
          supabase.from("property_furniture_types").delete().eq("property_id", propertyId),
        ]);
      } else {
        // Создание нового объявления
        const { data: property, error: propertyError } = await supabase
          .from("properties")
          .insert({
            ...propertyData,
            created_by: user.id,
            status: "no_ads" as const,
          } as any)
          .select()
          .single();

        if (propertyError) throw propertyError;
        if (!property) throw new Error("Property not created");
        propertyIdToUse = property.id;

        // Автоматически добавляем ID объявления в конец описания
        if (property.property_number) {
          const updatedDescription = formData.description
            ? `${formData.description}\n\nID: ${property.property_number}`
            : `ID: ${property.property_number}`;

          await supabase
            .from("properties")
            .update({ description: updatedDescription })
            .eq("id", propertyIdToUse);
        }
      }

      // Добавление связей для множественных выборов
      if (selectedPaymentTypes.length > 0) {
        await supabase
          .from("property_payment_types")
          .insert(selectedPaymentTypes.map((id) => ({ property_id: propertyIdToUse, payment_type_id: id })));
      }

      if (selectedDocuments.length > 0) {
        await supabase
          .from("property_document_types")
          .insert(selectedDocuments.map((id) => ({ property_id: propertyIdToUse, document_type_id: id })));
      }

      if (selectedCommunications.length > 0) {
        await supabase
          .from("property_communication_types")
          .insert(selectedCommunications.map((id) => ({ property_id: propertyIdToUse, communication_type_id: id })));
      }

      if (selectedFurniture.length > 0) {
        await supabase
          .from("property_furniture_types")
          .insert(selectedFurniture.map((id) => ({ property_id: propertyIdToUse, furniture_type_id: id })));
      }

      // Загрузка новых изображений
      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${propertyIdToUse}/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from("property-photos").upload(fileName, file);

          if (uploadError) {
            console.error("Image upload error:", uploadError);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("property-photos").getPublicUrl(fileName);

          await supabase.from("property_photos").insert({
            property_id: propertyIdToUse,
            photo_url: publicUrl,
            display_order: i,
          });
        }
      }

      toast({
        title: "Успешно",
        description: isEditMode ? "Объявление обновлено" : "Объявление создано",
      });

      navigate(isEditMode ? `/properties/${propertyId}` : "/my-properties");
    } catch (error: any) {
      console.error("Property operation error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 20) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Максимум 20 фотографий",
      });
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...selectedImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setSelectedImages(newImages);
  };

  // Условная логика: показывать поле площади участка только для домов и участков
  const showLotSize =
    formData.property_category_id &&
    propertyCategories.find((c) => c.id === formData.property_category_id)?.code === "houses_land";

  // Условная логика: скрывать документы для аренды
  const showDocuments = actionCategories.find((c) => c.id === formData.property_action_category_id)?.code !== "rent";

  // Условная логика: скрывать коммуникации и мебель для участков
  const showCommunications =
    formData.property_category_id &&
    propertyCategories.find((c) => c.id === formData.property_category_id)?.code !== "land";

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/my-properties")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isEditMode ? "Редактировать объявление" : "Создать объявление"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isEditMode ? "Изменение объекта недвижимости" : "Добавление нового объекта недвижимости"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Информация об объекте</CardTitle>
            <CardDescription>Заполните все обязательные поля</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Группа 1: Категоризация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="property_action_category_id">Тип сделки *</Label>
                <Select
                  value={formData.property_action_category_id}
                  onValueChange={(value) => setFormData({ ...formData, property_action_category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_category_id">Тип недвижимости *</Label>
                <Select
                  value={formData.property_category_id}
                  onValueChange={(value) => setFormData({ ...formData, property_category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Поля "Серия" и "Застройщик" показываются только для квартир */}
              {propertyCategories.find((cat) => cat.id === formData.property_category_id)?.code === "apartment" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="property_series">Серия</Label>
                    <SearchableSelect
                      options={seriesList}
                      value={seriesList.find((s) => s.name === formData.property_series)?.id || ""}
                      onValueChange={(value) => {
                        const series = seriesList.find((s) => s.id === value);
                        setFormData({ ...formData, property_series: series?.name || "" });
                      }}
                      placeholder="Выберите серию"
                      searchPlaceholder="Поиск серии..."
                      emptyText="Серия не найдена"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property_developer">Жилой комплекс</Label>
                    <SearchableSelect
                      options={developersList}
                      value={developersList.find((d) => d.name === formData.property_developer)?.id || ""}
                      onValueChange={(value) => {
                        const developer = developersList.find((d) => d.id === value);
                        setFormData({ ...formData, property_developer: developer?.name || "" });
                      }}
                      placeholder="Выберите ЖК"
                      searchPlaceholder="Поиск ЖК..."
                      emptyText="Жк не найден"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="property_rooms">Количество комнат</Label>
                <Select
                  value={formData.property_rooms}
                  onValueChange={(value) => setFormData({ ...formData, property_rooms: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_proposal_id">Тип предложения *</Label>
                <Select
                  value={formData.property_proposal_id}
                  onValueChange={(value) => setFormData({ ...formData, property_proposal_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите" />
                  </SelectTrigger>
                  <SelectContent>
                    {proposals.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Группа 2: Характеристики */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="property_size">Общая площадь (м²) *</Label>
                <Input
                  id="property_size"
                  type="number"
                  step="0.01"
                  value={formData.property_size}
                  onChange={(e) => setFormData({ ...formData, property_size: e.target.value })}
                  required
                />
              </div>

              {showLotSize && (
                <div className="space-y-2">
                  <Label htmlFor="property_lot_size">Площадь участка (соток)</Label>
                  <Input
                    id="property_lot_size"
                    type="number"
                    step="0.01"
                    value={formData.property_lot_size}
                    onChange={(e) => setFormData({ ...formData, property_lot_size: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="property_floor_old">Этаж</Label>
                <SearchableSelect
                  options={floorOptions.map((opt) => ({ id: opt.value, name: opt.label }))}
                  value={formData.property_floor_old}
                  onValueChange={(value) => setFormData({ ...formData, property_floor_old: value })}
                  placeholder="Выберите этаж"
                  searchPlaceholder="Поиск этажа..."
                  emptyText="Этаж не найден"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_floor_from_old">Этажность</Label>
                <Select
                  value={formData.property_floor_from_old}
                  onValueChange={(value) => setFormData({ ...formData, property_floor_from_old: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите" />
                  </SelectTrigger>
                  <SelectContent>
                    {floorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Группа 3: Местоположение */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="property_area_id">Район</Label>
                <SearchableSelect
                  options={areas.map((area) => ({ id: area.id, name: area.full_name || area.name }))}
                  value={formData.property_area_id}
                  onValueChange={(value) => setFormData({ ...formData, property_area_id: value })}
                  placeholder="Выберите район"
                  searchPlaceholder="Поиск района..."
                  emptyText="Район не найден"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Адрес *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Группа 4: Цена */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Цена *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="KGS">KGS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange_rate">Курс {formData.currency} к сому *</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.01"
                  placeholder="Например: 89.50"
                  value={formData.exchange_rate}
                  onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_in_hand">Цена на руки</Label>
                <Input
                  id="price_in_hand"
                  type="number"
                  step="0.01"
                  value={formData.price_in_hand}
                  onChange={(e) => setFormData({ ...formData, price_in_hand: e.target.value })}
                />
              </div>
            </div>

            {/* Группа 5: Состояние */}
            <div className="space-y-2">
              <Label htmlFor="property_condition_id">Состояние</Label>
              <Select
                value={formData.property_condition_id}
                onValueChange={(value) => setFormData({ ...formData, property_condition_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите состояние" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((cond) => (
                    <SelectItem key={cond.id} value={cond.id}>
                      {cond.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Группа 6: Множественные выборы */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Вид платежа</Label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`payment-${type.id}`}
                        checked={selectedPaymentTypes.includes(type.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPaymentTypes([...selectedPaymentTypes, type.id]);
                          } else {
                            setSelectedPaymentTypes(selectedPaymentTypes.filter((id) => id !== type.id));
                          }
                        }}
                      />
                      <label htmlFor={`payment-${type.id}`} className="text-sm cursor-pointer">
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {showDocuments && (
                <div className="space-y-2">
                  <Label>Документы</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {documentTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`doc-${type.id}`}
                          checked={selectedDocuments.includes(type.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDocuments([...selectedDocuments, type.id]);
                            } else {
                              setSelectedDocuments(selectedDocuments.filter((id) => id !== type.id));
                            }
                          }}
                        />
                        <label htmlFor={`doc-${type.id}`} className="text-sm cursor-pointer">
                          {type.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showCommunications && (
                <>
                  <div className="space-y-2">
                    <Label>Коммуникации</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {communicationTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`comm-${type.id}`}
                            checked={selectedCommunications.includes(type.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCommunications([...selectedCommunications, type.id]);
                              } else {
                                setSelectedCommunications(selectedCommunications.filter((id) => id !== type.id));
                              }
                            }}
                          />
                          <label htmlFor={`comm-${type.id}`} className="text-sm cursor-pointer">
                            {type.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Условия</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {furnitureTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`furn-${type.id}`}
                            checked={selectedFurniture.includes(type.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFurniture([...selectedFurniture, type.id]);
                              } else {
                                setSelectedFurniture(selectedFurniture.filter((id) => id !== type.id));
                              }
                            }}
                          />
                          <label htmlFor={`furn-${type.id}`} className="text-sm cursor-pointer">
                            {type.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Группа 7: Описание */}
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Подробное описание объекта..."
              />
            </div>

            {/* Группа 8: Фотографии */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="images">Фотографии объекта *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Первая фотография будет главной. Максимум 20 фотографий.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("images")?.click()}
                  disabled={selectedImages.length >= 20}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Выбрать фотографии
                </Button>
                <Input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageSelection}
                />
                {selectedImages.length > 0 && (
                  <span className="text-sm text-muted-foreground">Загружено: {selectedImages.length}/20</span>
                )}
              </div>
              <PhotoPreview files={selectedImages} onRemove={handleRemoveImage} onReorder={handleReorderImages} />
            </div>

            {/* Группа 9: Контакты собственника */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="owner_name">ФИО собственника *</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_contacts">Контакты собственника *</Label>
                <Input
                  id="owner_contacts"
                  value={formData.owner_contacts}
                  onChange={(e) => setFormData({ ...formData, owner_contacts: e.target.value })}
                  required
                  placeholder="+996 XXX XXX XXX"
                />
              </div>
            </div>

            {/* Группа 10: Дополнительные договорники (только в режиме редактирования) */}
            {isEditMode && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div>
                  <Label>Дополнительные договорники</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Добавленные менеджеры получат те же права что и автор объявления
                  </p>
                </div>

                {collaborators.length > 0 && (
                  <div className="space-y-2">
                    {collaborators.map((collab) => (
                      <div
                        key={collab.id}
                        className="flex items-center justify-between p-2 bg-background rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={collab.profiles?.avatar_url || undefined} alt={collab.profiles?.full_name} />
                            <AvatarFallback className="text-xs">
                              {collab.profiles?.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <Badge variant="secondary">{collab.profiles?.full_name}</Badge>
                          <span className="text-sm text-muted-foreground">{collab.profiles?.email}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collab.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Select value={selectedCollaborator} onValueChange={setSelectedCollaborator}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите менеджера" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableManagers
                        .filter((m) => !collaborators.some((c) => c.user_id === m.id))
                        .map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={manager.avatar_url || undefined} alt={manager.full_name} />
                                <AvatarFallback className="text-xs">
                                  {manager.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{manager.full_name} ({manager.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddCollaborator} disabled={!selectedCollaborator}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Добавить
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Сохранение..." : "Сохранить объявление"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/my-properties")}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
