"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mgcollections:bookshelf-edit-mode";

/**
 * Global Browse/Edit toggle for the bookshelf feature, persisted to
 * localStorage (MVP) so the user's last choice survives navigation and
 * reloads. Defaults to Browse Mode (locked) until localStorage is read on
 * mount, matching the "browse by default" goal even on first paint.
 */
export function useBookshelfEditMode() {
  const [isEditMode, setIsEditModeState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored != null) setIsEditModeState(stored === "true");
  }, []);

  function setIsEditMode(next: boolean) {
    setIsEditModeState(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }

  return {
    isEditMode,
    setIsEditMode,
    toggleEditMode: () => setIsEditMode(!isEditMode),
  };
}
