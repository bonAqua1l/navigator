-- Fix property_photos RLS policy to properly handle INSERT operations
-- The issue: FOR ALL with only USING clause doesn't work correctly for INSERT
-- Solution: Add WITH CHECK clause for INSERT operations

DROP POLICY IF EXISTS "Property owners and collaborators can manage photos" ON public.property_photos;

-- Separate SELECT policy
CREATE POLICY "Property owners and collaborators can view photos"
ON public.property_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND (
      properties.created_by = auth.uid()
      OR is_property_collaborator(auth.uid(), properties.id)
    )
  )
);

-- INSERT policy with WITH CHECK
CREATE POLICY "Property owners and collaborators can insert photos"
ON public.property_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND (
      properties.created_by = auth.uid()
      OR is_property_collaborator(auth.uid(), properties.id)
    )
  )
);

-- UPDATE policy
CREATE POLICY "Property owners and collaborators can update photos"
ON public.property_photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND (
      properties.created_by = auth.uid()
      OR is_property_collaborator(auth.uid(), properties.id)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND (
      properties.created_by = auth.uid()
      OR is_property_collaborator(auth.uid(), properties.id)
    )
  )
);

-- DELETE policy
CREATE POLICY "Property owners and collaborators can delete photos"
ON public.property_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND (
      properties.created_by = auth.uid()
      OR is_property_collaborator(auth.uid(), properties.id)
    )
  )
);
