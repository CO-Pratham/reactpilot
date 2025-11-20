import { supabase } from "../db/supabase";

export interface Report {
  id: string;
  project_id: string;
  performance_score: number;
  issues: any[];
  suggestions: any[];
  patches: any[];
  created_at: string;
}

export const reportModel = {
  async saveReport(projectId: string, reportData: any) {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        project_id: projectId,
        issues: reportData.issues || [],
        suggestions: reportData.suggestions || [],
        patches: reportData.patches || [],
        performance_score: reportData.performanceScore || 0
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getLatestReport(projectId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) return null;
    return data;
  },
  
  async getReports(projectId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }
};
