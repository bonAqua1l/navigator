import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, Calendar, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

type LookupMaps = Record<string, Record<string, string>>;

type FieldChange = {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
};

type AuditGroup = {
  key: string;
  propertyId: string | null;
  propertyLabel: string;
  timestamp: string;
  sortTime: number;
  logs: AuditLog[];
};

const TECHNICAL_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'user_id',
  'session_id',
  'ip_address',
  'user_agent',
]);

const PROPERTY_LINKED_ENTITY_TYPES = new Set([
  'properties',
  'property_photos',
  'property_payment_types',
  'property_document_types',
  'property_communication_types',
  'property_furniture_types',
  'viewings',
]);

const ENTITY_LABELS: Record<string, string> = {
  properties: 'Объявления',
  property_photos: 'Фотографии объявления',
  property_payment_types: 'Способы оплаты',
  property_document_types: 'Документы',
  property_communication_types: 'Коммуникации',
  property_furniture_types: 'Мебель',
  viewings: 'Показы',
  profiles: 'Профили',
};

const FIELD_LABELS: Record<string, string> = {
  number: 'Номер',
  title: 'Название',
  description: 'Описание',
  price: 'Цена',
  floor: 'Этаж',
  total_floors: 'Всего этажей',
  rooms_count: 'Количество комнат',
  room_count: 'Количество комнат',
  area: 'Площадь',
  property_area_id: 'Район',
  property_action_category_id: 'Тип сделки',
  property_category_id: 'Тип недвижимости',
  property_subcategory_id: 'Подтип',
  property_proposal_id: 'Предложение',
  property_condition_id: 'Состояние',
  property_status_id: 'Статус',
  payment_type_id: 'Тип оплаты',
  document_type_id: 'Тип документа',
  communication_type_id: 'Тип коммуникации',
  furniture_type_id: 'Тип мебели',
  photo_url: 'Фото',
  display_order: 'Порядок',
  property_id: 'Объявление',
  created_by: 'Автор',
  assigned_by: 'Назначил',
  initiated_by: 'Инициатор',
  confirmed_by: 'Подтвердил',
  scheduled_at: 'Дата показа',
  status: 'Статус',
  notes: 'Комментарий',
  deal_price: 'Цена сделки',
  deal_date: 'Дата сделки',
  buyer_name: 'Покупатель',
  buyer_contacts: 'Контакты покупателя',
  payment_method: 'Способ оплаты',
  commission_amount: 'Комиссия',
};

const FIELD_VALUE_LABELS: Record<string, Record<string, string>> = {
  status: {
    no_ads: 'Без рекламы',
    published: 'Опубликовано',
    deleted: 'Удалено',
    sold: 'Продано',
  },
  action_type: {
    create: 'Создание',
    update: 'Обновление',
    delete: 'Удаление',
    login: 'Вход',
    logout: 'Выход',
    view_contacts: 'Просмотр контактов',
    assign_show: 'Назначение показа',
    change_status: 'Изменение статуса',
  },
};

const LOOKUP_TABLES: Array<{
  field: string;
  table: string;
  labelKey: 'name' | 'full_name';
}> = [
  { field: 'property_action_category_id', table: 'property_action_categories', labelKey: 'name' },
  { field: 'property_category_id', table: 'property_categories', labelKey: 'name' },
  { field: 'property_subcategory_id', table: 'property_subcategories', labelKey: 'name' },
  { field: 'property_area_id', table: 'property_areas', labelKey: 'name' },
  { field: 'property_proposal_id', table: 'property_proposals', labelKey: 'name' },
  { field: 'property_condition_id', table: 'property_conditions', labelKey: 'name' },
  { field: 'property_status_id', table: 'property_statuses', labelKey: 'name' },
  { field: 'payment_type_id', table: 'payment_types', labelKey: 'name' },
  { field: 'document_type_id', table: 'document_types', labelKey: 'name' },
  { field: 'communication_type_id', table: 'communication_types', labelKey: 'name' },
  { field: 'furniture_type_id', table: 'furniture_types', labelKey: 'name' },
  { field: 'user_id', table: 'profiles', labelKey: 'full_name' },
  { field: 'created_by', table: 'profiles', labelKey: 'full_name' },
  { field: 'assigned_by', table: 'profiles', labelKey: 'full_name' },
  { field: 'initiated_by', table: 'profiles', labelKey: 'full_name' },
  { field: 'confirmed_by', table: 'profiles', labelKey: 'full_name' },
];

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupMaps, setLookupMaps] = useState<LookupMaps>({});
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const fetchLogs = async () => {
    try {
      const [logsResult, lookupResults] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(150),
        Promise.allSettled(
          LOOKUP_TABLES.map(async ({ field, table, labelKey }) => {
            const columns = table === 'profiles' ? 'id, full_name, email' : 'id, name, code';
            const { data } = await supabase.from(table as any).select(columns);
            const map: Record<string, string> = {};

            (data ?? []).forEach((row: any) => {
              const label =
                labelKey === 'full_name'
                  ? row.full_name || row.email || row.id
                  : row.name || row.code || row.id;

              map[row.id] = label;
            });

            return [field, map] as const;
          })
        ),
      ]);

      const { data, error } = logsResult;

      if (error) throw error;

      setLogs(data || []);
      const resolvedLookupMaps = lookupResults.flatMap((result, index) => {
        if (result.status === 'fulfilled') {
          return [result.value];
        }

        console.warn(
          `Failed to load audit lookup table ${LOOKUP_TABLES[index]?.table}:`,
          result.reason
        );

        return [];
      });

      setLookupMaps(Object.fromEntries(resolvedLookupMaps));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить логи',
      });
    } finally {
      setLoading(false);
    }
  };

  const normalizeAction = (action: string) => action.toLowerCase();

  const getActionBadgeVariant = (action: string) => {
    switch (normalizeAction(action)) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getActionLabel = (action: string) => {
    switch (normalizeAction(action)) {
      case 'create':
        return 'Создание';
      case 'update':
        return 'Обновление';
      case 'delete':
        return 'Удаление';
      case 'login':
        return 'Вход';
      case 'logout':
        return 'Выход';
      default:
        return action;
    }
  };

  const getEntityLabel = (entityType: string) => ENTITY_LABELS[entityType] || entityType;

  const getShortId = (value: string | null | undefined) => {
    if (!value) return '—';
    return value.length > 10 ? `${value.slice(0, 8)}…` : value;
  };

  const isUuidLike = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  const prettyPrimitive = (value: any) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (typeof value === 'number') return new Intl.NumberFormat('ru-RU').format(value);
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return format(new Date(value), 'dd.MM.yyyy HH:mm', { locale: ru });
      }
      if (value === 'true') return 'Да';
      if (value === 'false') return 'Нет';
      return value;
    }
    return String(value);
  };

  const getReadableValue = (field: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (Array.isArray(value)) {
      return value.map((item) => getReadableValue(field, item)).join(', ');
    }

    if (typeof value === 'string') {
      const fieldLabel = FIELD_VALUE_LABELS[field]?.[value];
      if (fieldLabel) return fieldLabel;

      const mappedLabel = lookupMaps[field]?.[value];
      if (mappedLabel) return mappedLabel;
      if (isUuidLike(value)) return getShortId(value);
      return prettyPrimitive(value);
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return prettyPrimitive(value);
  };

  const getPropertyIdFromLog = (log: AuditLog) => {
    if (log.entity_type === 'properties') {
      return log.entity_id;
    }

    if (PROPERTY_LINKED_ENTITY_TYPES.has(log.entity_type)) {
      return (
        log.new_values?.property_id ||
        log.old_values?.property_id ||
        log.entity_id ||
        null
      );
    }

    return null;
  };

  const getPropertyLabelFromLog = (log: AuditLog, fallbackPropertyId: string | null) => {
    const possibleNumber =
      log.new_values?.number ||
      log.old_values?.number ||
      log.new_values?.title ||
      log.old_values?.title ||
      log.new_values?.name ||
      log.old_values?.name;

    if (possibleNumber) {
      return `№ ${possibleNumber}`;
    }

    if (fallbackPropertyId) {
      return getShortId(fallbackPropertyId);
    }

    return getShortId(log.entity_id);
  };

  const buildFieldChanges = (log: AuditLog): FieldChange[] => {
    const oldValues = log.old_values && typeof log.old_values === 'object' ? log.old_values : {};
    const newValues = log.new_values && typeof log.new_values === 'object' ? log.new_values : {};
    const action = normalizeAction(log.action_type);
    const fields = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    return Array.from(fields)
      .filter((field) => !TECHNICAL_FIELDS.has(field))
      .filter((field) => {
        const oldValue = oldValues[field];
        const newValue = newValues[field];

        if (action === 'create') {
          return newValue !== undefined && newValue !== null && newValue !== '';
        }

        if (action === 'delete') {
          return oldValue !== undefined && oldValue !== null && oldValue !== '';
        }

        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
      })
      .map((field) => ({
        field,
        label: FIELD_LABELS[field] || field.replace(/_/g, ' '),
        oldValue: getReadableValue(field, oldValues[field]),
        newValue: getReadableValue(field, newValues[field]),
      }));
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const propertyId = getPropertyIdFromLog(log);
      const searchTarget = [
        log.id,
        log.action_type,
        log.entity_type,
        log.entity_id,
        propertyId,
        JSON.stringify(log.old_values ?? {}),
        JSON.stringify(log.new_values ?? {}),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
      const matchesAction =
        actionFilter === 'all' || normalizeAction(log.action_type) === actionFilter;
      const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
      const matchesProperty =
        !propertyFilter ||
        (propertyId?.toLowerCase().includes(propertyFilter.toLowerCase()) ?? false) ||
        (log.entity_id?.toLowerCase().includes(propertyFilter.toLowerCase()) ?? false) ||
        (propertyId ? getShortId(propertyId).toLowerCase().includes(propertyFilter.toLowerCase()) : false) ||
        (log.entity_id ? getShortId(log.entity_id).toLowerCase().includes(propertyFilter.toLowerCase()) : false);

      return matchesSearch && matchesAction && matchesEntity && matchesProperty;
    });
  }, [logs, actionFilter, entityFilter, propertyFilter, searchQuery, lookupMaps]);

  const groupedLogs = useMemo<AuditGroup[]>(() => {
    const groups = new Map<string, AuditGroup>();

    filteredLogs.forEach((log) => {
      const propertyId = getPropertyIdFromLog(log);
      const minuteBucket = format(new Date(log.created_at), 'yyyy-MM-dd HH:mm');
      const groupKey = propertyId
        ? `property:${propertyId}:${minuteBucket}`
        : `entity:${log.entity_type}:${log.entity_id ?? log.id}:${minuteBucket}`;

      const groupLabel = getPropertyLabelFromLog(log, propertyId);
      const existing = groups.get(groupKey);

      if (existing) {
        existing.logs.push(log);
        existing.sortTime = Math.max(existing.sortTime, new Date(log.created_at).getTime());
        return;
      }

      groups.set(groupKey, {
        key: groupKey,
        propertyId,
        propertyLabel: groupLabel,
        timestamp: minuteBucket,
        sortTime: new Date(log.created_at).getTime(),
        logs: [log],
      });
    });

    return Array.from(groups.values())
      .sort((a, b) => b.sortTime - a.sortTime)
      .map((group) => ({
        ...group,
        logs: [...group.logs].sort(
          (left, right) =>
            new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        ),
      }));
  }, [filteredLogs]);

  const hasPropertyRelatedLogs = groupedLogs.some((group) => group.propertyId);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра журнала аудита
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аудит действий</h1>
          <p className="text-muted-foreground mt-2">
            История изменений и действий пользователей в системе
          </p>
        </div>

        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по событию, ID или JSON значениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input
            placeholder="ID объявления"
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="w-full max-w-[240px]"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Тип действия" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все действия</SelectItem>
              <SelectItem value="create">Создание</SelectItem>
              <SelectItem value="update">Обновление</SelectItem>
              <SelectItem value="delete">Удаление</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Тип сущности" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сущности</SelectItem>
              <SelectItem value="properties">Объявления</SelectItem>
              <SelectItem value="property_photos">Фотографии</SelectItem>
              <SelectItem value="property_payment_types">Способы оплаты</SelectItem>
              <SelectItem value="property_document_types">Документы</SelectItem>
              <SelectItem value="property_communication_types">Коммуникации</SelectItem>
              <SelectItem value="property_furniture_types">Мебель</SelectItem>
              <SelectItem value="viewings">Показы</SelectItem>
              <SelectItem value="profiles">Профили</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground mb-4">
          <span>
            Показано групп: {groupedLogs.length} • записей: {filteredLogs.length}
          </span>
          {hasPropertyRelatedLogs && (
            <span>Изменения сгруппированы по объявлению и минуте</span>
          )}
        </div>

        {groupedLogs.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <p className="text-muted-foreground">Логи не найдены</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedLogs.map((group) => (
              <Card key={group.key} className="p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {group.propertyId
                        ? `Объявление ${group.propertyLabel}`
                        : `Событие ${getEntityLabel(group.logs[0].entity_type)}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {group.propertyId ? `ID объявления: ${group.propertyId}` : 'Без привязки к объявлению'} •{' '}
                      {format(new Date(group.logs[0].created_at), 'dd MMM yyyy, HH:mm', {
                        locale: ru,
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">{group.logs.length} изменений</Badge>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Действие</TableHead>
                        <TableHead>Сущность</TableHead>
                        <TableHead>Поля</TableHead>
                        <TableHead>Дата и время</TableHead>
                        <TableHead>IP адрес</TableHead>
                        <TableHead className="text-right">Детали</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.logs.map((log) => {
                        const changes = buildFieldChanges(log);

                        return (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.action_type)}>
                                {getActionLabel(log.action_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {getEntityLabel(log.entity_type)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {changes.length === 0 ? (
                                  <span className="text-sm text-muted-foreground">
                                    Нет изменений в полях
                                  </span>
                                ) : (
                                  <>
                                    {changes.slice(0, 4).map((change) => (
                                      <Badge key={`${log.id}-${change.field}`} variant="outline">
                                        {change.label}
                                      </Badge>
                                    ))}
                                    {changes.length > 4 && (
                                      <Badge variant="outline">+{changes.length - 4}</Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', {
                                    locale: ru,
                                  })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.ip_address || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Открыть
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Детали изменения</DialogTitle>
                                    <DialogDescription>
                                      {getActionLabel(log.action_type)} •{' '}
                                      {getEntityLabel(log.entity_type)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-5">
                                    <div className="grid gap-3 rounded-md border p-4 text-sm md:grid-cols-2">
                                      <div>
                                        <p className="text-muted-foreground">Сущность</p>
                                        <p className="font-medium">{getEntityLabel(log.entity_type)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">ID сущности</p>
                                        <p className="font-mono text-xs break-all">{log.entity_id || '—'}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Дата</p>
                                        <p className="font-medium">
                                          {format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm:ss', {
                                            locale: ru,
                                          })}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">IP</p>
                                        <p className="font-medium">{log.ip_address || '—'}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="text-sm font-semibold mb-3">Изменённые поля</h4>
                                      {changes.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                          Для этого события нет различий по полям.
                                        </p>
                                      ) : (
                                        <div className="space-y-3">
                                          {changes.map((change) => {
                                            const action = normalizeAction(log.action_type);

                                            return (
                                              <div
                                                key={`${log.id}-${change.field}`}
                                                className="rounded-md border p-3"
                                              >
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                  <p className="font-medium">{change.label}</p>
                                                  <Badge variant="outline">{change.field}</Badge>
                                                </div>

                                                {action === 'create' && (
                                                  <p className="text-sm">
                                                    <span className="text-muted-foreground">Значение: </span>
                                                    <span className="font-medium">{change.newValue}</span>
                                                  </p>
                                                )}

                                                {action === 'delete' && (
                                                  <p className="text-sm">
                                                    <span className="text-muted-foreground">Было: </span>
                                                    <span className="font-medium">{change.oldValue}</span>
                                                  </p>
                                                )}

                                                {action === 'update' && (
                                                  <div className="grid gap-3 md:grid-cols-2">
                                                    <div>
                                                      <p className="text-xs uppercase text-muted-foreground">
                                                        Было
                                                      </p>
                                                      <p className="text-sm font-medium break-words">
                                                        {change.oldValue}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p className="text-xs uppercase text-muted-foreground">
                                                        Стало
                                                      </p>
                                                      <p className="text-sm font-medium break-words">
                                                        {change.newValue}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {log.user_agent && (
                                      <div>
                                        <h4 className="text-sm font-semibold mb-2">User Agent</h4>
                                        <p className="text-xs text-muted-foreground break-all">
                                          {log.user_agent}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Показано последних {logs.length} записей
        </div>
      </Card>
    </div>
  );
}
