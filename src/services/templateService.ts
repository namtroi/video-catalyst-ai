import { supabase } from "@/integrations/supabase/client";
import { Template } from "../types";

export class TemplateService {
  static async getUserTemplates(): Promise<Template[]> {
    const { data, error } = await supabase
      .from('user_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data?.map(template => ({
      ...template,
      created_at: new Date(template.created_at),
      updated_at: new Date(template.updated_at),
    })) || [];
  }

  static async createTemplate(template: Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Template> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_templates')
      .insert({
        ...template,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  static async updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Template> {
    const { data, error } = await supabase
      .from('user_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }
}