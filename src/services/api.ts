import axios from "axios";
import { useSettingsStore } from "../store/settingsStore";

const getApiConfig = () => {
  const settings = useSettingsStore.getState().apiSettings;
  return {
    baseURL: settings.baseUrl,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `token ${settings.apiKey}:${settings.apiSecret}`
    },
    withCredentials: false,
  };
};

export const api = axios.create();

// Update axios instance config before each request
api.interceptors.request.use((config) => {
  const apiConfig = getApiConfig();
  config.baseURL = apiConfig.baseURL;
  config.headers = { ...config.headers, ...apiConfig.headers };
  config.withCredentials = apiConfig.withCredentials;
  return config;
});

export const testConnection = async (settings: { baseUrl: string; apiKey: string; apiSecret: string }) => {
  try {
    const response = await axios.get(`${settings.baseUrl}/api/method/frappe.auth.get_logged_user`, {
      headers: {
        "Authorization": `token ${settings.apiKey}:${settings.apiSecret}`
      }
    });
    return response.data && response.data.message;
  } catch (error) {
    throw new Error("Failed to connect to server");
  }
};

const getErrorDetails = (error: any) => {
  return {
    message: error?.message || 'Unknown error',
    status: error?.response?.status,
    data: error?.response?.data,
    code: error?.code,
  };
};

export const login = async (username: string, password: string) => {
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
          email: userResponse.data.message
        },
      },
    };
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Login error:", errorDetails);
    throw new Error(errorDetails.data?.message || "Invalid credentials");
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/api/method/frappe.auth.get_logged_user");
    return response.data;
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error fetching current user:", errorDetails);
    throw new Error("Failed to fetch user");
  }
};

export const getWarehouses = async () => {
  try {
    const response = await api.get("/api/resource/Warehouse", {
      params: {
        fields: '["name", "warehouse_name", "company", "warehouse_type"]'
      }
    });
    return response.data;
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error fetching warehouses:", errorDetails);
    throw new Error("Failed to fetch warehouses");
  }
};

export const getCompanies = async () => {
  try {
    const response = await api.get("/api/resource/Company", {
      params: {
        fields: '["name", "company_name", "default_currency"]'
      }
    });
    return response.data;
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error fetching companies:", errorDetails);
    throw new Error("Failed to fetch companies");
  }
};

export const createStockEntry = async (data: any) => {
  try {
    const payload = {
      doctype: "Stock Entry",
      naming_series: "MAT-STE-.YYYY.-",
      stock_entry_type: data.stock_entry_type,
      posting_date: new Date().toISOString().split('T')[0],
      posting_time: new Date().toTimeString().split(' ')[0],
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
      })),
    };

    const response = await api.post("/api/resource/Stock Entry", payload);
    return response.data;
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error creating stock entry:", errorDetails);
    throw new Error("Failed to create stock entry");
  }
};

export const getItemDetails = async (itemCode: string) => {
  try {
    // First try to get item by scanning
    const scanResponse = await api.get("/api/method/erpnext.stock.utils.scan_barcode", {
      params: { search_value: itemCode }
    });

    if (scanResponse.data?.message?.item_code) {
      // If we got an item from scanning, get its full details
      const itemResponse = await api.get(`/api/resource/Item/${scanResponse.data.message.item_code}`);
      return {
        ...itemResponse.data,
        uom: scanResponse.data.message.uom,
        serial_no: scanResponse.data.message.serial_no,
        batch_no: scanResponse.data.message.batch_no
      };
    }

    // If scanning didn't work, try direct item lookup
    const response = await api.get(`/api/resource/Item/${itemCode}`);
    return response.data;
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error fetching item details:", errorDetails);
    throw new Error("Failed to fetch item details");
  }
};

export const searchItems = async (searchTerm: string) => {
  try {
    const filters = [
      ["name", "like", `%${searchTerm}%`],
      ["item_name", "like", `%${searchTerm}%`]
    ];

    const response = await api.get("/api/method/frappe.desk.search.search_widget", {
      params: {
        doctype: "Item",
        txt: searchTerm,
        page_length: 10,
        fields: '["name", "item_name", "stock_uom", "barcode"]'
      }
    });

    if (response.data && response.data.message) {
      return {
        data: response.data.message.map((item: any[]) => ({
          name: item[0],
          item_name: item[1],
          stock_uom: item[2],
          barcode: item[3]
        }))
      };
    }

    return { data: [] };
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error searching items:", errorDetails);
    throw new Error("Failed to search items");
  }
};

export const getStockBalance = async (itemCode: string, warehouse: string, date: string) => {
  try {
    // Use the Quick Stock Balance API endpoint
    const response = await api.get("/api/method/erpnext.stock.doctype.quick_stock_balance.quick_stock_balance.get_stock_item_details", {
      params: {
        warehouse,
        date,
        item: itemCode
      }
    });

    // The API returns qty and value directly
    return {
      data: {
        qty: response.data.message.qty || 0,
        value: response.data.message.value || 0
      }
    };
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error fetching stock balance:", errorDetails);
    throw new Error("Failed to fetch stock balance");
  }
};

export const getDashboardStats = async () => {
  try {
    // First, get all job cards to count statuses
    const jobCardsResponse = await api.get("/api/resource/Job Card", {
      params: {
        fields: '["name", "status"]',
        limit_page_length: 1000
      }
    });

    const jobCardStats = {
      Open: 0,
      "Work In Progress": 0,
      "On Hold": 0
    };

    // Count job cards by status
    jobCardsResponse.data.data.forEach((card: any) => {
      if (card.status in jobCardStats) {
        jobCardStats[card.status as keyof typeof jobCardStats]++;
      }
    });

    // Get other stats
    const statsQueries = [
      // Work Orders
      api.get("/api/method/frappe.desk.reportview.get", {
        params: {
          doctype: "Work Order",
          fields: '["name", "status"]',
          filters: JSON.stringify([
            ["status", "in", ["Not Started", "In Process"]],
            ["docstatus", "=", 1]
          ])
        }
      }),
      // Stock Entries
      api.get("/api/method/frappe.desk.reportview.get", {
        params: {
          doctype: "Stock Entry",
          fields: '["name", "posting_date"]',
          filters: JSON.stringify([["docstatus", "=", 1]]),
          limit_page_length: 30,
          order_by: "creation desc"
        }
      }),
      // Material Requests
      api.get("/api/method/frappe.desk.reportview.get", {
        params: {
          doctype: "Material Request",
          fields: '["name", "status"]',
          filters: JSON.stringify([
            ["status", "in", ["Pending", "Partially Ordered"]],
            ["docstatus", "=", 1]
          ])
        }
      }),
      // Purchase Orders
      api.get("/api/method/frappe.desk.reportview.get", {
        params: {
          doctype: "Purchase Order",
          fields: '["name", "status"]',
          filters: JSON.stringify([
            ["status", "in", ["To Receive", "To Receive and Bill"]],
            ["docstatus", "=", 1]
          ])
        }
      }),
      // Quality Inspections
      api.get("/api/method/frappe.desk.reportview.get", {
        params: {
          doctype: "Quality Inspection",
          fields: '["name", "status"]',
          filters: JSON.stringify([["status", "=", "Pending"]])
        }
      })
    ];

    const responses = await Promise.all(statsQueries);

    const stats = {
      "Work Order": responses[0]?.data?.message?.values?.length || 0,
      "Job Card": jobCardStats,
      "Stock Entry": responses[1]?.data?.message?.values?.length || 0,
      "Material Request": responses[2]?.data?.message?.values?.length || 0,
      "Purchase Order": responses[3]?.data?.message?.values?.length || 0,
      "Quality Inspection": responses[4]?.data?.message?.values?.length || 0
    };

    return { message: stats };
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("Error fetching dashboard stats:", errorDetails);
    throw new Error("Failed to fetch dashboard stats");
  }
};