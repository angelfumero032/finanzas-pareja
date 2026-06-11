-- Migration 014: Zona de archivos del hogar (Supabase Storage)
-- Crea el bucket privado 'archivos' y las politicas de acceso por hogar:
-- cada hogar solo ve/sube/borra dentro de su carpeta `<hogar_id>/...`.
-- Idempotente. Si da error "must be owner of table objects", crear las
-- politicas desde el dashboard (Storage -> Policies) con las mismas reglas.

INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos', 'archivos', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_select'
  ) THEN
    CREATE POLICY archivos_select ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_insert'
  ) THEN
    CREATE POLICY archivos_insert ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_update'
  ) THEN
    CREATE POLICY archivos_update ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'archivos_delete'
  ) THEN
    CREATE POLICY archivos_delete ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = mi_hogar()::text);
  END IF;
END $$;
