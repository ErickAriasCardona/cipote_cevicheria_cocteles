-- Migración: agregar columna email a usuarios_perfil y sincronizar con auth.users
ALTER TABLE public.usuarios_perfil ADD COLUMN IF NOT EXISTS email text;

-- Poblar emails de los usuarios existentes desde auth.users
UPDATE public.usuarios_perfil p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email <> u.email);

-- Función y trigger para sincronizar automáticamente el email desde auth.users
CREATE OR REPLACE FUNCTION public.sync_usuario_perfil_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usuarios_perfil
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sync_email ON auth.users;
CREATE TRIGGER on_auth_user_sync_email
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_usuario_perfil_email();
