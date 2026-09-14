import { supabase } from '../lib/supabaseClient'

const BUCKET_NAME = 'catalogo-imagenes'

export const storageService = {
  /**
   * Sube un archivo de imagen al bucket `catalogo-imagenes` de Supabase Storage.
   * Retorna la URL pública permanente para almacenar en la base de datos.
   */
  async subirImagenCatalogo(file: File, prefijo: string = 'item'): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filePath = `${prefijo}/${timestamp}_${randomStr}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Error al subir la imagen: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    if (!data || !data.publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen.')
    }

    return data.publicUrl
  },
}
