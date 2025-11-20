import { supabase } from "../db/supabase";

export interface File {
  id: string;
  project_id: string;
  path: string;
  content: string;
  size: number;
  type: string;
  last_modified: string;
}

export const fileModel = {
  async saveFile(projectId: string, fileData: { path: string; content: string; size: number }) {
    // Upsert file
    const { data, error } = await supabase
      .from('files')
      .upsert({
        project_id: projectId,
        path: fileData.path,
        content: fileData.content,
        size: fileData.size,
        last_modified: new Date().toISOString()
      }, { onConflict: 'project_id,path' })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getFiles(projectId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('path, size, type, last_modified')
      .eq('project_id', projectId);
      
    if (error) throw error;
    return data || [];
  },

  async getFileContent(projectId: string, filePath: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .eq('path', filePath)
      .single();
      
    if (error) return null;
    return data;
  },
  
  async deleteProjectFiles(projectId: string) {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('project_id', projectId);
      
    if (error) throw error;
  }
};
