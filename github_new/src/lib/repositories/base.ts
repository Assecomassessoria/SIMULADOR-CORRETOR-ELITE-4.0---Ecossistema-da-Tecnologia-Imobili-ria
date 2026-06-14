/**
 * BaseRepository
 * Centraliza as operações CRUD comuns sobre tabelas do Supabase.
 * Cada repositório concreto estende esta classe e tipa Row/Insert/Update.
 *
 * Padrão Phase 2: todo acesso a dados deve passar por um repositório,
 * eliminando o uso espalhado de `supabase.from(...)` pelos componentes.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;

export type RepoResult<T> = {
  data: T | null;
  error: Error | null;
};

export abstract class BaseRepository<
  T extends TableName,
  Row = Tables[T]["Row"],
  Insert = Tables[T]["Insert"],
  Update = Tables[T]["Update"],
> {
  protected abstract readonly table: T;

  protected get db(): any {
    return (supabase as any).from(this.table as string);
  }

  protected normalize<R>(res: { data: R | null; error: any }): RepoResult<R> {
    if (res.error) {
      console.error(`[${String(this.table)}] error:`, res.error);
      return { data: null, error: new Error(res.error.message) };
    }
    return { data: res.data ?? null, error: null };
  }

  async findById(id: string): Promise<RepoResult<Row>> {
    const res = await this.db.select("*").eq("id", id).maybeSingle();
    return this.normalize<Row>(res);
  }

  async list(opts?: { limit?: number; orderBy?: string; ascending?: boolean }): Promise<RepoResult<Row[]>> {
    let q = this.db.select("*");
    if (opts?.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
    if (opts?.limit) q = q.limit(opts.limit);
    const res = await q;
    return this.normalize<Row[]>(res as any);
  }

  async create(payload: Insert): Promise<RepoResult<Row>> {
    const res = await this.db.insert(payload as any).select().maybeSingle();
    return this.normalize<Row>(res as any);
  }

  async update(id: string, payload: Update): Promise<RepoResult<Row>> {
    const res = await this.db.update(payload as any).eq("id", id as any).select().maybeSingle();
    return this.normalize<Row>(res as any);
  }

  async remove(id: string): Promise<RepoResult<true>> {
    const res = await this.db.delete().eq("id", id as any);
    if (res.error) {
      console.error(`[${String(this.table)}] delete error:`, res.error);
      return { data: null, error: new Error(res.error.message) };
    }
    return { data: true, error: null };
  }
}
