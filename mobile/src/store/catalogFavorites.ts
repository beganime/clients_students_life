import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { University } from '../types/api';

// ManagerSL IDs must not be sent to the unrelated legacy university table.
export const useCatalogFavorites = create<{
  byOwner: Record<string, University[]>;
  toggle: (owner: string, university: University) => void;
}>()(persist((set) => ({
  byOwner: {},
  toggle: (owner, university) => set(state => {
    const items = state.byOwner[owner] || [];
    const exists = items.some(item => String(item.id) === String(university.id));
    return { byOwner: { ...state.byOwner, [owner]: exists ? items.filter(item => String(item.id) !== String(university.id)) : [...items, university] } };
  }),
}), { name: 'manager-catalog-favorites-v1', storage: createJSONStorage(() => AsyncStorage) }));
