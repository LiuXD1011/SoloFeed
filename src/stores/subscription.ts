import { defineStore } from "pinia";
import { ref } from "vue";
import type { Subscription, Platform } from "../types";
import { getSubscriptions, addSubscription, deleteSubscription } from "../api/subscription";

export const useSubscriptionStore = defineStore("subscription", () => {
  const list = ref<Subscription[]>([]);
  const loading = ref(false);

  async function fetchList() {
    loading.value = true;
    try {
      const res = await getSubscriptions();
      list.value = res.list;
    } finally {
      loading.value = false;
    }
  }

  async function add(data: {
    platform: Platform;
    creatorId: string;
    creatorName: string;
    creatorAvatar?: string;
    creatorDesc?: string;
    rsshubRoute: string;
  }) {
    const sub = await addSubscription(data);
    list.value.unshift(sub);
    return sub;
  }

  async function remove(id: string) {
    await deleteSubscription(id);
    list.value = list.value.filter((s) => s.id !== id);
  }

  function getByPlatform(platform: Platform): Subscription[] {
    return list.value.filter((s) => s.platform === platform);
  }

  return { list, loading, fetchList, add, remove, getByPlatform };
});
