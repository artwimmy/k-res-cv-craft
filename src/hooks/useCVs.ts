import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CVData } from '@/pages/Index';
import { toast } from 'sonner';

export interface SavedCV {
  id: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  cv_data: CVData;
}

export function useCVs() {
  const queryClient = useQueryClient();

  const { data: cvs = [], isLoading } = useQuery({
    queryKey: ['cvs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedCV[];
    },
  });

  const saveCV = useMutation({
    mutationFn: async ({ fileName, cvData, id }: { fileName: string; cvData: CVData; id?: string }) => {
      if (id) {
        // Update existing CV
        const { data, error } = await supabase
          .from('cvs')
          .update({ file_name: fileName, cv_data: cvData })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new CV
        const { data, error } = await supabase
          .from('cvs')
          .insert({ file_name: fileName, cv_data: cvData })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cvs'] });
      toast.success('CV saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving CV:', error);
      toast.error('Failed to save CV');
    },
  });

  const deleteCV = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cvs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cvs'] });
      toast.success('CV deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting CV:', error);
      toast.error('Failed to delete CV');
    },
  });

  return {
    cvs,
    isLoading,
    saveCV: saveCV.mutate,
    deleteCV: deleteCV.mutate,
    isSaving: saveCV.isPending,
    isDeleting: deleteCV.isPending,
  };
}
