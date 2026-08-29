// app/composables/useProductSearch.ts
export interface ProductSearchItem {
  id: string;
  code: string;
  name: string;
  spec?: string | null;
  unit: string;
}

export interface ProductSearchResult {
  product: ProductSearchItem | null;
  isNew: boolean;
  code: string;
  name: string;
  spec: string;
  unit: string;
  category: string;
}

export const useProductSearch = (
  products: Ref<ProductSearchItem[]>,
  options?: { allowNew?: boolean; initialCode?: string },
) => {
  const searchText = ref(options?.initialCode || "");
  const selectedProduct = ref<ProductSearchItem | null>(null);
  const matchedProducts = ref<ProductSearchItem[]>([]);
  const matchCount = ref(0);
  const isNew = ref(false);
  const locked = computed(() => !!selectedProduct.value);

  const search = (text: string) => {
    searchText.value = text;
    if (!text.trim()) {
      resetMatch();
      return;
    }
    const t = text.toLowerCase();

    const codeMatch = products.value.find((p) => p.code.toLowerCase() === t);
    if (codeMatch) {
      selectProduct(codeMatch);
      return;
    }

    const match = products.value.filter(
      (p) =>
        p.code.toLowerCase().includes(t) || p.name.toLowerCase().includes(t),
    );
    applyMatch(match);
  };

  const applyMatch = (match: ProductSearchItem[]) => {
    if (match.length === 1) {
      selectProduct(match[0]!);
    } else if (match.length > 1) {
      selectedProduct.value = null;
      matchCount.value = match.length;
      matchedProducts.value = match;
      isNew.value = false;
    } else {
      resetMatch();
      if (options?.allowNew && searchText.value.trim()) {
        isNew.value = true;
      }
    }
  };

  const selectProduct = (p: ProductSearchItem) => {
    selectedProduct.value = p;
    matchCount.value = 0;
    matchedProducts.value = [];
    isNew.value = false;
    searchText.value = `${p.code} ${p.name}`;
  };

  const selectBySpec = (specId: string) => {
    const found = matchedProducts.value.find((p) => p.id === specId);
    if (found) selectProduct(found);
  };

  const resetMatch = () => {
    selectedProduct.value = null;
    matchCount.value = 0;
    matchedProducts.value = [];
    isNew.value = false;
  };

  const getResult = (): ProductSearchResult => {
    if (selectedProduct.value) {
      return {
        product: selectedProduct.value,
        isNew: false,
        code: selectedProduct.value.code,
        name: selectedProduct.value.name,
        spec: selectedProduct.value.spec || "",
        unit: selectedProduct.value.unit || "pcs",
        category: "",
      };
    }
    return {
      product: null,
      isNew: isNew.value,
      code: searchText.value,
      name: searchText.value,
      spec: "",
      unit: "pcs",
      category: "RAW",
    };
  };

  return {
    searchText,
    selectedProduct,
    matchedProducts,
    matchCount,
    isNew,
    locked,
    search,
    selectBySpec,
    resetMatch,
    getResult,
  };
};
