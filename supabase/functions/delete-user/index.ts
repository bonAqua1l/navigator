import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  userId: string;
  reassignedToUserId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is a super_admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has super_admin role
    const { data: roles, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (roleCheckError || !roles) {
      return new Response(
        JSON.stringify({ error: 'Недостаточно прав' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId, reassignedToUserId }: DeleteUserRequest = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Нельзя удалить себя' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deletion from admin panel is allowed only for managers.
    const { data: targetRoles, error: targetRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    if (targetRolesError) {
      return new Response(
        JSON.stringify({ error: 'Не удалось проверить роль пользователя' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isManager = (targetRoles || []).some((targetRole) => targetRole.role === 'manager')

    if (!isManager) {
      return new Response(
        JSON.stringify({ error: 'Удаление доступно только для менеджеров' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { count: createdPropertiesCount, error: propertiesCountError } = await supabaseAdmin
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)

    if (propertiesCountError) {
      return new Response(
        JSON.stringify({ error: 'Не удалось проверить объявления менеджера' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const propertiesCount = createdPropertiesCount || 0

    if (propertiesCount > 0) {
      if (!reassignedToUserId) {
        return new Response(
          JSON.stringify({ error: 'Перед удалением нужно переназначить объявления менеджера' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (reassignedToUserId === userId) {
        return new Response(
          JSON.stringify({ error: 'Нельзя переназначить объявления на удаляемого пользователя' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: reassignedProfile, error: reassignedProfileError } = await supabaseAdmin
        .from('profiles')
        .select('id, is_active')
        .eq('id', reassignedToUserId)
        .single()

      if (reassignedProfileError || !reassignedProfile || !reassignedProfile.is_active) {
        return new Response(
          JSON.stringify({ error: 'Пользователь для переназначения не найден или неактивен' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: reassignedRoles, error: reassignedRolesError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', reassignedToUserId)

      if (reassignedRolesError) {
        return new Response(
          JSON.stringify({ error: 'Не удалось проверить роль пользователя для переназначения' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const hasAllowedRole = (reassignedRoles || []).some(
        (targetRole) => targetRole.role === 'manager' || targetRole.role === 'super_admin'
      )

      if (!hasAllowedRole) {
        return new Response(
          JSON.stringify({ error: 'Объявления можно переназначить только на менеджера или супер-админа' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: reassignError } = await supabaseAdmin
        .from('properties')
        .update({ created_by: reassignedToUserId })
        .eq('created_by', userId)

      if (reassignError) {
        return new Response(
          JSON.stringify({ error: 'Не удалось переназначить объявления менеджера' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // First, update audit_logs to set user_id to NULL (preserve audit history)
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .update({ user_id: null })
      .eq('user_id', userId)

    if (auditError) {
      console.error('Error updating audit logs:', auditError)
      return new Response(
        JSON.stringify({ error: 'Ошибка обновления логов аудита' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError)
      return new Response(
        JSON.stringify({ error: 'Ошибка удаления ролей пользователя' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Ошибка удаления профиля' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Finally, delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Ошибка удаления пользователя из системы аутентификации' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Пользователь успешно удален'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
