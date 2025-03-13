import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, getItemDetails, getStockBalance, getCompanies } from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { Loader2, Scan, ArrowLeft } from 'lucide-react';
import ItemSearch from '../components/ItemSearch';

interface Warehouse {
  name: string;
  warehouse_name: string;
  company: string;
  warehouse_type: string;
}

interface Company {
  name: string;
  company_name: string;
  default_currency: string;
}

interface StockBalanceItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  stock_value: number;
  valuation_rate: number;
  warehouse: string;
}

export default function StockBalance() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockBalanceItem | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [currentItemCode, setCurrentItemCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [warehousesRes, companiesRes] = await Promise.all([
          getWarehouses(),
          getCompanies()
        ]);
        setWarehouses(warehousesRes.data || []);
        setCompanies(companiesRes.data || []);
        if (warehousesRes.data?.length > 0) {
          setSelectedWarehouse(warehousesRes.data[0].name);
          // Set initial currency based on the first warehouse's company
          const company = companiesRes.data?.find(c => c.name === warehousesRes.data[0].company);
          if (company?.default_currency) {
            setCurrency(company.default_currency);
          }
        }
      } catch (error) {
        toast.error('Failed to fetch initial data');
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText) => {
          await handleScan(decodedText);
          setIsScanning(false);
          scanner?.clear();
        },
        (error) => {
          console.warn(error);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [isScanning, selectedWarehouse, date]);

  // Effect to refresh stock info when warehouse changes
  useEffect(() => {
    if (currentItemCode && selectedWarehouse) {
      handleScan(currentItemCode);
    }
  }, [selectedWarehouse, date]);

  const handleWarehouseChange = (warehouseName: string) => {
    setSelectedWarehouse(warehouseName);
    const warehouse = warehouses.find(w => w.name === warehouseName);
    if (warehouse) {
      const company = companies.find(c => c.name === warehouse.company);
      if (company?.default_currency) {
        setCurrency(company.default_currency);
      }
    }
  };

  const handleScan = async (itemCode: string) => {
    if (!selectedWarehouse) {
      toast.error('Please select a warehouse first');
      return;
    }

    setLoading(true);
    setCurrentItemCode(itemCode);

    try {
      const [itemDetails, stockBalance] = await Promise.all([
        getItemDetails(itemCode),
        getStockBalance(itemCode, selectedWarehouse, date)
      ]);

      const qty = stockBalance.data.qty || 0;
      const valuation_rate = stockBalance.data.value / qty || 0;
      const stock_value = stockBalance.data.value || 0;

      setStockInfo({
        item_code: itemCode,
        item_name: itemDetails.data.item_name,
        description: itemDetails.data.description || '',
        qty: qty,
        stock_value: stock_value,
        valuation_rate: valuation_rate,
        warehouse: selectedWarehouse
      });

      toast.success('Stock balance retrieved successfully');
    } catch (error) {
      toast.error('Failed to fetch stock balance');
      setStockInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Stock Balance</h2>
          <button
            onClick={() => navigate(-1)}
            className="cohenix-button"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Warehouse</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.name} value={warehouse.name}>
                  {warehouse.warehouse_name} ({warehouse.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Search Item</label>
              <button
                type="button"
                onClick={() => setIsScanning(!isScanning)}
                className="cohenix-button"
              >
                <Scan className="h-5 w-5 mr-2" />
                {isScanning ? 'Cancel Scan' : 'Scan Barcode'}
              </button>
            </div>

            {/* Manual Item Search */}
            <ItemSearch onItemSelect={handleScan} placeholder="Search by item name or barcode..." />

            {isScanning && (
              <div id="reader" className="w-full"></div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          {stockInfo && !loading && (
            <div className="mt-6 border rounded-lg p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{stockInfo.item_name}</h3>
                  <p className="text-sm text-gray-500">{stockInfo.item_code}</p>
                  {stockInfo.description && (
                    <p className="mt-2 text-sm text-gray-600">{stockInfo.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    <p className="mt-1 text-2xl font-semibold text-indigo-600">
                      {stockInfo.qty.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Valuation Rate</label>
                    <p className="mt-1 text-xl font-semibold text-blue-600">
                      {currency} {stockInfo.valuation_rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Stock Value</label>
                    <p className="mt-1 text-2xl font-semibold text-green-600">
                      {currency} {stockInfo.stock_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}