"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { migrateLocalToDb } from "@/lib/guardados";

/**
 * Al haber sesión (login por email o vuelta de OAuth), sube el localStorage a la
 * cuenta y lo limpia. migrateLocalToDb() no hace nada si el localStorage está vacío.
 */
export function GuardadosMigrator() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) migrateLocalToDb(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) migrateLocalToDb(session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
