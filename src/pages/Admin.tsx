import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCheck, UserX, Shield, UserPlus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeaturedPropertiesManager } from '@/components/FeaturedPropertiesManager';
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

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  roles: { role: string }[];
}

type AppRole = 'super_admin' | 'manager' | 'intern';

export default function Admin() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'manager' as AppRole
  });
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, avatar_url, is_active, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || [])
          .filter(role => role.user_id === profile.id)
          .map(role => ({ role: role.role }))
      }));

      setUsers(usersWithRoles as any);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователей',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: `Пользователь ${!currentStatus ? 'активирован' : 'деактивирован'}`,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось изменить статус пользователя',
      });
    }
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Роль назначена',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось назначить роль',
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Роль удалена',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось удалить роль',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://zikqbffckorauiasbbrg.supabase.co/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ userId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось удалить пользователя');
      }

      toast({
        title: 'Успешно',
        description: 'Пользователь удален',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить пользователя',
      });
    }
  };

  const createUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
      });
      return;
    }

    setCreatingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://zikqbffckorauiasbbrg.supabase.co/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(newUserData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось создать пользователя');
      }

      toast({
        title: 'Успешно',
        description: 'Пользователь создан',
      });

      setCreateDialogOpen(false);
      setNewUserData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'manager'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать пользователя',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole =
      roleFilter === 'all' ||
      user.roles.some((r) => r.role === roleFilter);

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'intern':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Супер Админ';
      case 'manager':
        return 'Менеджер';
      case 'intern':
        return 'Стажер';
      default:
        return role;
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра этой страницы
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
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">Панель администратора</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Управление пользователями, ролями и контентом
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="text-xs sm:text-sm">Пользователи</TabsTrigger>
          <TabsTrigger value="featured" className="text-xs sm:text-sm">Избранное на главной</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Управление пользователями</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Администрирование пользователей и ролей
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto text-sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Создать пользователя
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Создать нового пользователя</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Введите данные для создания нового менеджера или стажера
                  </DialogDescription>
                </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Полное имя *</Label>
                <Input
                  id="full_name"
                  placeholder="Иванов Иван Иванович"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@example.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  placeholder="+996 XXX XXX XXX"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Роль *</Label>
                <Select 
                  value={newUserData.role} 
                  onValueChange={(value) => setNewUserData({ ...newUserData, role: value as AppRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="intern">Стажер</SelectItem>
                    <SelectItem value="super_admin">Супер Админ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creatingUser}>
                Отмена
              </Button>
              <Button onClick={createUser} disabled={creatingUser}>
                {creatingUser ? 'Создание...' : 'Создать'}
              </Button>
            </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px] text-sm">
                  <SelectValue placeholder="Фильтр по роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="super_admin">Супер Админ</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="intern">Стажер</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Роли</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Пользователи не найдены
                  </TableCell>
                </TableRow>
              ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                            <AvatarFallback>
                              {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Нет ролей</span>
                        ) : (
                          user.roles.map((role, idx) => (
                            <Badge
                              key={idx}
                              variant={getRoleBadgeVariant(role.role) as any}
                              className="cursor-pointer"
                              onClick={() => removeRole(user.id, role.role)}
                            >
                              {getRoleLabel(role.role)} ×
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="default">Активен</Badge>
                      ) : (
                        <Badge variant="secondary">Неактивен</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Shield className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Назначить роль</DialogTitle>
                              <DialogDescription>
                                Выберите роль для {user.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => assignRole(user.id, 'super_admin')}
                              >
                                Супер Админ
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => assignRole(user.id, 'manager')}
                              >
                                Менеджер
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => assignRole(user.id, 'intern')}
                              >
                                Стажер
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите удалить {user.full_name}? Это действие нельзя отменить.
                                Все данные пользователя будут безвозвратно удалены.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Пользователи не найдены
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="space-y-3">
                      {/* User Info */}
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                          <AvatarFallback>
                            {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                        </div>
                        <div>
                          {user.is_active ? (
                            <Badge variant="default" className="text-xs">Активен</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Неактивен</Badge>
                          )}
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Нет ролей</span>
                        ) : (
                          user.roles.map((role, idx) => (
                            <Badge
                              key={idx}
                              variant={getRoleBadgeVariant(role.role) as any}
                              className="cursor-pointer text-xs"
                              onClick={() => removeRole(user.id, role.role)}
                            >
                              {getRoleLabel(role.role)} ×
                            </Badge>
                          ))
                        )}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted-foreground">
                        Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Роли
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="text-base">Назначить роль</DialogTitle>
                              <DialogDescription className="text-xs">
                                Выберите роль для {user.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full justify-start text-sm"
                                onClick={() => assignRole(user.id, 'super_admin')}
                              >
                                Супер Админ
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-sm"
                                onClick={() => assignRole(user.id, 'manager')}
                              >
                                Менеджер
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-sm"
                                onClick={() => assignRole(user.id, 'intern')}
                              >
                                Стажер
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? (
                            <UserX className="h-3 w-3 mr-1" />
                          ) : (
                            <UserCheck className="h-3 w-3 mr-1" />
                          )}
                          {user.is_active ? 'Деактивировать' : 'Активировать'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base">Удалить пользователя?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs">
                                Вы уверены, что хотите удалить {user.full_name}? Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-xs">Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="featured">
          <FeaturedPropertiesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
