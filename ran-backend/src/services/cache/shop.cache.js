const cache = {
  categories: null,
  itemsByCategory: null,
};

export const getCachedCategories = () => cache.categories;
export const setCachedCategories = (data) => {
  cache.categories = data;
};

export const getCachedItems = () => cache.itemsByCategory;
export const setCachedItems = (data) => {
  cache.itemsByCategory = data;
};

export const clearShopCache = () => {
  cache.categories = null;
  cache.itemsByCategory = null;
};
