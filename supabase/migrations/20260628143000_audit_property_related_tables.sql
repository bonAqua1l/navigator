-- Extend audit trail to property-related tables that managers edit directly.
-- The existing audit_logs model stays unchanged; only the trigger coverage grows.

CREATE OR REPLACE FUNCTION public.log_property_related_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action action_type;
  v_entity_id uuid;
BEGIN
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'create'::action_type
    WHEN 'UPDATE' THEN 'update'::action_type
    WHEN 'DELETE' THEN 'delete'::action_type
  END;

  IF TG_OP = 'INSERT' THEN
    v_entity_id := COALESCE(NEW.property_id, NEW.id);

    INSERT INTO public.audit_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      new_values
    ) VALUES (
      v_action,
      TG_TABLE_NAME,
      v_entity_id,
      auth.uid(),
      to_jsonb(NEW)
    );

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_id := COALESCE(NEW.property_id, OLD.property_id, NEW.id, OLD.id);

    INSERT INTO public.audit_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      old_values,
      new_values
    ) VALUES (
      v_action,
      TG_TABLE_NAME,
      v_entity_id,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_entity_id := COALESCE(OLD.property_id, OLD.id);

    INSERT INTO public.audit_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      old_values
    ) VALUES (
      v_action,
      TG_TABLE_NAME,
      v_entity_id,
      auth.uid(),
      to_jsonb(OLD)
    );

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS property_photos_audit_trigger ON public.property_photos;
CREATE TRIGGER property_photos_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.property_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.log_property_related_changes();

DROP TRIGGER IF EXISTS property_payment_types_audit_trigger ON public.property_payment_types;
CREATE TRIGGER property_payment_types_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.property_payment_types
  FOR EACH ROW
  EXECUTE FUNCTION public.log_property_related_changes();

DROP TRIGGER IF EXISTS property_document_types_audit_trigger ON public.property_document_types;
CREATE TRIGGER property_document_types_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.property_document_types
  FOR EACH ROW
  EXECUTE FUNCTION public.log_property_related_changes();

DROP TRIGGER IF EXISTS property_communication_types_audit_trigger ON public.property_communication_types;
CREATE TRIGGER property_communication_types_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.property_communication_types
  FOR EACH ROW
  EXECUTE FUNCTION public.log_property_related_changes();

DROP TRIGGER IF EXISTS property_furniture_types_audit_trigger ON public.property_furniture_types;
CREATE TRIGGER property_furniture_types_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.property_furniture_types
  FOR EACH ROW
  EXECUTE FUNCTION public.log_property_related_changes();
