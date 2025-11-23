import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAppSettings() {
  const queryClient = useQueryClient();

  const { data: logoUrl, isLoading } = useQuery({
    queryKey: ['app-settings', 'logo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'logo_url')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.value || '';
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Save to settings
      const { error: dbError } = await supabase
        .from('app_settings')
        .upsert({ key: 'logo_url', value: publicUrl });

      if (dbError) throw dbError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'logo'] });
      toast.success('Logo uploaded successfully!');
    },
    onError: (error) => {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    },
  });

  return {
    logoUrl: logoUrl || '',
    isLoading,
    uploadLogo: uploadLogo.mutate,
    isUploading: uploadLogo.isPending,
  };
}
