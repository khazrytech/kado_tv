import { supabase } from "./supabase";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getChannels() {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getFeaturedChannels() {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getMovies() {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSeries() {
  const { data, error } = await supabase
    .from("series")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function toggleFavorite(userId, contentType, contentId) {
  const { data: existing, error: findError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: userId,
    content_type: contentType,
    content_id: contentId
  });
  if (error) throw error;
  return true;
}

export async function isFavorite(userId, contentType, contentId) {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function saveWatch(userId, contentType, contentId, positionSeconds, durationSeconds) {
  const { error } = await supabase.from("watch_history").upsert({
    user_id: userId,
    content_type: contentType,
    content_id: contentId,
    position_seconds: positionSeconds,
    duration_seconds: durationSeconds,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id,content_type,content_id" });
  if (error) throw error;
}

export async function adminList(table) {
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adminUpsert(table, row) {
  const { data, error } = await supabase.from(table).upsert(row).select().single();
  if (error) throw error;
  return data;
}

export async function adminDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function adminUpdateUser(userId, status) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
