import NarrativeClient from "./NarrativeClient";
import { supabaseService, DBNarrative } from "@/services/supabase-service";

// Enable dynamic rendering since it reads headers/cookies inside supabaseService
export const dynamic = "force-dynamic";

/**
 * Server Component Entry Point for /narrative.
 * Fetches user profile and narrative chronicle data on the server,
 * then transfers it to the interactive client.
 */
export default async function NarrativePage() {
  let initialUser = null;
  let initialNarratives: DBNarrative[] = [];

  try {
    // Attempt to fetch current user profile on Server render
    initialUser = await supabaseService.getCurrentUser();
    
    // Resolve elderly paired user context
    const elderlyId = initialUser?.role === "self" 
      ? initialUser.id 
      : initialUser?.paired_user_id || "user-elderly-123";
      
    // Fetch narratives
    const list = await supabaseService.getNarratives(elderlyId);
    initialNarratives = [...list].sort((a, b) => a.event_date.localeCompare(b.event_date));
  } catch (err) {
    console.error("Server-side pre-rendering fetch failed:", err);
    // Silent catch, fallback values will hydra-populate on the client
  }

  return (
    <NarrativeClient
      initialUser={initialUser}
      initialNarratives={initialNarratives}
    />
  );
}
