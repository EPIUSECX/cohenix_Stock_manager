import axios from "axios";
import { useSettingsStore } from "../store/settingsStore";

interface FrappeResponse<T> {
  data: T;
}

interface ItemLookupResult {
  item_code: string;
  item_name?: string;
  stock_uom?: string;
  barcode?: string;
  serial_no?: string;
  batch_no?: string;
  uom?: string;
}

const normalizeBaseUrl = (url: string) => url.trim().replace(/\/+$/, "");

const getApiConfig = () => {
  const settings = useSettingsStore.getState().apiSettings;
  return {
    baseURL: normalizeBaseUrl(settings.baseUrl),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  };
};

export const api = axios.create();

api.interceptors.request.use((config) => {
  const apiConfig = getApiConfig();
  config.baseURL = apiConfig.baseURL;
  config.headers = { ...config.headers, ...apiConfig.headers };
  config.withCredentials = apiConfig.withCredentials;
  return config;
});

const getErrorDetails = (error: any) => ({
  message: error?.message || "Unknown error",
  status: error?.response?.status,
  data: error?.response?.data,
  code: error?.code,
});

export const loginToSite = async (baseUrl: string, username: string, password: string) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  useSettingsStore.getState().setApiSettings({ baseUrl: normalizedBaseUrl });

  try {
    const loginResponse = await api.post("/api/method/login", {
      usr: username,
      pwd: password,
    });

    if (!loginResponse.data || loginResponse.data.message !== "Logged In") {
      throw new Error("Login failed");
    }

    const userResponse = await api.get("/api/method/frappe.auth.get_logged_user");

    return {
      message: {
        user: {
          name: username,
          full_name: userResponse.data.message || username,
          email: userResponse.data.message,
        },
      },
    };
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    if (errorDetails.code === "ERR_NETWORK") {
      throw new Error("Unable to reach site. Check URL and CORS settings.");
    }
    throw new Error(errorDetails.data?.message || "Invalid credentials");
  }
};

export const getWarehouses = async () => {
  const response = await api.get("/api/resource/Warehouse", {
    params: { fields: '["name", "warehouse_name", "company", "warehouse_type"]' },
  });
  return response.data;
};

export const getCompanies = async () => {
  const response = await api.get("/api/resource/Company", {
    params: { fields: '["name", "company_name", "default_currency"]' },
  });
  return response.data;
};

export const createStockEntry = async (data: any) => {
  const payload = {
    doctype: "Stock Entry",
    stock_entry_type: data.stock_entry_type,
    posting_date: data.posting_date,
    posting_time: data.posting_time,
    company: data.company,
    from_warehouse: data.from_warehouse,
    to_warehouse: data.to_warehouse,
    items: data.items.map((item: any) => ({
      item_code: item.item_code,
      qty: item.qty,
      transfer_qty: item.qty,
      uom: item.uom || "Nos",
      stock_uom: item.stock_uom || "Nos",
      conversion_factor: 1.0,
      serial_no: item.serial_no,
      batch_no: item.batch_no,
    })),
  };

  const response = await api.post("/api/resource/Stock Entry", payload);
  return response.data;
};

const scanBarcode = async (searchValue: string) => {
  const response = await api.get("/api/method/erpnext.stock.utils.scan_barcode", {
    params: { search_value: searchValue },
  });
  return response.data?.message;
};

const searchItemCandidates = async (searchValue: string): Promise<ItemLookupResult[]> => {
  const response = await api.get("/api/resource/Item", {
    params: {
      fields: '["name", "item_name", "stock_uom"]',
      filters: JSON.stringify([
        ["Item", "disabled", "=", 0],
        ["Item", "has_variants", "=", 0],
      ]),
      or_filters: JSON.stringify([
        ["Item", "name", "=", searchValue],
        ["Item", "item_code", "=", searchValue],
        ["Item", "item_name", "like", `%${searchValue}%`],
        ["Item Barcode", "barcode", "=", searchValue],
      ]),
      limit_page_length: 20,
    },
  });

  return (response.data?.data || []).map((item: any) => ({
    item_code: item.name,
    item_name: item.item_name,
    stock_uom: item.stock_uom,
  }));
};

export const getItemDetails = async (searchValue: string): Promise<FrappeResponse<ItemLookupResult>> => {
  const normalized = searchValue.trim();

  try {
    const scanned = await scanBarcode(normalized);
    if (scanned?.item_code) {
      const itemResponse = await api.get(`/api/resource/Item/${encodeURIComponent(scanned.item_code)}`);
      return {
        data: {
          item_code: scanned.item_code,
          item_name: itemResponse.data?.data?.item_name,
          stock_uom: itemResponse.data?.data?.stock_uom,
          serial_no: scanned.serial_no,
          batch_no: scanned.batch_no,
          uom: scanned.uom,
          barcode: normalized,
        },
      };
    }
  } catch {
    // fallback chain for v16/custom sites
  }

  const candidates = await searchItemCandidates(normalized);
  if (!candidates.length) {
    throw new Error(`No item found for scan value: ${normalized}`);
  }

  return { data: candidates[0] };
};

export const searchItems = async (searchTerm: string) => {
  const response = await api.get('/api/method/frappe.desk.search.search_widget', {
    params: {
      doctype: 'Item',
      txt: searchTerm,
      page_length: 10,
      searchfield: 'name',
      fields: '["name", "item_name", "stock_uom", "description"]',
    },
  });

  if (!response.data?.message) return { data: [] };
  return {
    data: response.data.message.map((item: any[]) => ({
      name: item[0],
      item_name: item[1],
      stock_uom: item[2],
      description: item[3],
    })),
  };
};

export const getStockBalance = async (itemCode: string, warehouse: string, date: string) => {
  const response = await api.get('/api/method/erpnext.stock.doctype.quick_stock_balance.quick_stock_balance.get_stock_item_details', {
    params: { item: itemCode, warehouse, date },
  });
  return response.data;
};

export const getDashboardStats = async () => {
  const [itemCount, warehouseCount, companyCount] = await Promise.all([
    api.get('/api/resource/Item', { params: { fields: '["name"]', limit_page_length: 1 } }),
    api.get('/api/resource/Warehouse', { params: { fields: '["name"]', limit_page_length: 1 } }),
    api.get('/api/resource/Company', { params: { fields: '["name"]', limit_page_length: 1 } }),
  ]);

  return {
    itemCount: itemCount.data?.data?.length ?? 0,
    warehouseCount: warehouseCount.data?.data?.length ?? 0,
    companyCount: companyCount.data?.data?.length ?? 0,
  };
};
