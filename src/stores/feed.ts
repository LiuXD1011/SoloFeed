import { defineStore } from "pinia";
import { ref } from "vue";
import type { Entry } from "../types";
import { getEntries } from "../api/feed";

export const useFeedStore = defineStore("feed", () => {
  const entries = ref<Entry[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const nextCursor = ref<string | null>(null);
  const currentPlatform = ref<string>("");

  async function fetchEntries(refresh = false) {
    if (loading.value) return;
    if (!refresh && !hasMore.value) return;

    loading.value = true;
    try {
      const res = await getEntries({
        limit: 20,
        cursor: refresh ? undefined : nextCursor.value ?? undefined,
        platform: currentPlatform.value || undefined,
      });

      if (refresh) {
        entries.value = res.items;
      } else {
        entries.value.push(...res.items);
      }
      hasMore.value = res.hasMore;
      nextCursor.value = res.nextCursor;
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    nextCursor.value = null;
    hasMore.value = true;
    await fetchEntries(true);
  }

  function setPlatform(platform: string) {
    currentPlatform.value = platform;
    refresh();
  }

  return { entries, loading, hasMore, currentPlatform, fetchEntries, refresh, setPlatform };
});
