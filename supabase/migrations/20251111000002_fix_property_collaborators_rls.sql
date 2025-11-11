-- Fix property_collaborators RLS policy to properly handle INSERT operations
-- The issue: FOR ALL with only USING clause doesn't work correctly for INSERT
-- Solution: Separate policies for different operations with proper WITH CHECK clauses

DROP POLICY IF EXISTS "Property owners can manage collaborators" ON public.property_collaborators;

-- SELECT policy
CREATE POLICY "Property owners and collaborators can view collaborators"
ON public.property_collaborators
FOR SELECT
USING (
  public.is_property_owner_or_admin(auth.uid(), property_id)
  OR user_id = auth.uid()
);

-- INSERT policy with WITH CHECK
CREATE POLICY "Property owners can insert collaborators"
ON public.property_collaborators
FOR INSERT
WITH CHECK (
  public.is_property_owner_or_admin(auth.uid(), property_id)
);

-- UPDATE policy
CREATE POLICY "Property owners can update collaborators"
ON public.property_collaborators
FOR UPDATE
USING (
  public.is_property_owner_or_admin(auth.uid(), property_id)
)
WITH CHECK (
  public.is_property_owner_or_admin(auth.uid(), property_id)
);

-- DELETE policy
CREATE POLICY "Property owners can delete collaborators"
ON public.property_collaborators
FOR DELETE
USING (
  public.is_property_owner_or_admin(auth.uid(), property_id)
);
