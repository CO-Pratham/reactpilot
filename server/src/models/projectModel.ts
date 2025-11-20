import { supabase } from "../db/supabase";

export interface Project {
  id: string;
  name: string;
  description?: string;
  path: string;
  file_count: number;
  status: "active" | "archived" | "analyzing";
  performance_score?: number;
  last_analyzed_at?: string;
  created_at: string;
  updated_at: string;
}

export const projectModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (error) throw error;
    return data as Project[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) return null;
    return data as Project;
  },

  async create(project: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
      
    if (error) throw error;
    return data as Project;
  },

  async update(id: string, data: Partial<Project>) {
    const { data: updated, error } = await supabase
      .from('projects')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return updated as Project;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
      
    return !error;
  },
  
  async updateStats(id: string, fileCount: number) {
    const { data, error } = await supabase
      .from('projects')
      .update({ file_count: fileCount })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
