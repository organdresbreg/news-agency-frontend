import { create } from 'zustand';

interface Highlights {
  [key: string]: Set<number>;
}

interface HighlightStore {
  highlights: Highlights;
  addHighlight: (page: string, ids: number[]) => void;
  clearHighlights: (page: string) => void;
}

export const useHighlightStore = create<HighlightStore>((set) => ({
  highlights: {
    dashboard: new Set(),
    trash: new Set()
  },
  addHighlight: (page, ids) => set((state) => {
    const newSet = new Set(state.highlights[page] || new Set());
    ids.forEach(id => newSet.add(id));
    return {
      highlights: {
        ...state.highlights,
        [page]: newSet
      }
    };
  }),
  clearHighlights: (page) => set((state) => ({
    highlights: {
      ...state.highlights,
      [page]: new Set()
    }
  }))
}));
