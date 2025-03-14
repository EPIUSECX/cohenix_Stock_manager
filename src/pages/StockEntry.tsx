import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getWarehouses, createStockEntry, getCompanies, getItemDetails } from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, Trash2, Scan, ArrowLeft } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
}

interface ItemDetails {
  name: string;
  item_name: string;
  stock_uom: string;
}

interface StockItem {
  item_code: string;
  qty: number;
  item_name?: string;
  stock_uom?: string;
  serial_no?: string;
  batch_no?: string;
  uom?: string;
}

const STOCK_ENTRY_TYPES = [
  { value: 'Material Issue', label: 'Material Issue', requiresTo: false, requiresFrom: true },
  { value: 'Material Receipt', label: 'Material Receipt', requiresTo: true, requiresFrom: false },
  { value: 'Material Transfer', label: 'Material Transfer', requiresTo: true, requiresFrom: true },
  { value: 'Material Transfer for Manufacture', label: 'Material Transfer for Manufacture', requiresTo: true, requiresFrom: true },
  { value: 'Material Consumption for Manufacture', label: 'Material Consumption for Manufacture', requiresTo: false, requiresFrom: true },
  { value: 'Manufacture', label: 'Manufacture', requiresTo: true, requiresFrom: true },
  { value: 'Repack', label: 'Repack', requiresTo: true, requiresFrom: true },
  { value: 'Send to Subcontractor', label: 'Send to Subcontractor', requiresTo: true, requiresFrom: true }
];

const successSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEYODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFZr+ftrVoXCECY3PLEcSYELIHO8diJOQgZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRQ0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1oU2Bhxqvu3mnEYODlOq5O+zYRsGPJLZ88p3KgUme8rx3I4+CRVht+rq');

export default function StockEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [items, setItems] = useState<StockItem[]>([]);
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldown = 1500;
  
  const [formData, setFormData] = useState({
    company: '',
    fromWarehouse: '',
    toWarehouse: '',
    stock_entry_type: 'Material Transfer',
    posting_date: new Date().toISOString().split('T')[0],
    posting_time: new Date().toTimeString().split(' ')[0],
    scan_mode: false,
  });

  const selectedEntryType = STOCK_ENTRY_TYPES.find(type => type.value === formData.stock_entry_type);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [warehousesRes, companiesRes] = await Promise.all([
          getWarehouses(),
          getCompanies()
        ]);
        setWarehouses(warehousesRes.data || []);
        setCompanies(companiesRes.data || []);
        
        if (companiesRes.data?.length > 0) {
          setFormData(prev => ({
            ...prev,
            company: companiesRes.data[0].name
          }));
        }

        if (location.state?.itemCode) {
          handleAddItem(location.state.itemCode);
        }
      } catch (error) {
        toast.error('Failed to fetch initial data');
      }
    };

    fetchInitialData();
  }, [location.state?.itemCode]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: "environment"
          }
        },
        false
      );

      scanner.render(
        async (decodedText) => {
          const now = Date.now();
          if (now - lastScanTimeRef.current < scanCooldown) {
            return;
          }
          lastScanTimeRef.current = now;

          const element = document.getElementById('reader');
          if (element) {
            element.classList.add('scan-success');
            setTimeout(() => {
              element.classList.remove('scan-success');
            }, 500);
          }

          try {
            await successSound.play();
          } catch (error) {
            // Ignore audio play errors
          }

          await handleAddItem(decodedText);
          
          if (!formData.scan_mode) {
            setIsScanning(false);
            scanner?.clear();
          }
        },
        (errorMessage) => {
          if (errorMessage && typeof errorMessage === 'string' && !errorMessage.includes('undefined')) {
            console.warn(errorMessage);
          }
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [isScanning, formData.scan_mode]);

  const handleAddItem = async (itemCode: string) => {
    try {
      const response = await getItemDetails(itemCode);
      const itemDetails = response.data;
      
      setItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => 
          item.item_code === (itemDetails.item_code || itemCode)
        );
        
        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            qty: updatedItems[existingItemIndex].qty + 1
          };
          return updatedItems;
        } else {
          return [...prevItems, {
            item_code: itemDetails.item_code || itemCode,
            item_name: itemDetails.item_name,
            qty: 1,
            stock_uom: itemDetails.stock_uom,
            uom: itemDetails.uom,
            serial_no: itemDetails.serial_no,
            batch_no: itemDetails.batch_no
          }];
        }
      });

      toast.success('Item added successfully');
    } catch (error) {
      toast.error('Failed to fetch item details');
    }
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        qty: newQty
      };
      return updatedItems;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setLoading(true);

    try {
      await createStockEntry({
        company: formData.company,
        stock_entry_type: formData.stock_entry_type,
        posting_date: formData.posting_date,
        posting_time: formData.posting_time,
        from_warehouse: formData.fromWarehouse,
        to_warehouse: formData.toWarehouse,
        items: items.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          uom: item.uom || item.stock_uom || "Nos",
          stock_uom: item.stock_uom || "Nos",
          serial_no: item.serial_no,
          batch_no: item.batch_no
        })),
      });

      toast.success('Stock entry created successfully');
      setItems([]);
      navigate('/scanner');
    } catch (error) {
      toast.error('Failed to create stock entry');
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(
    warehouse => warehouse.company === formData.company
  );

  const getWarehouseLabel = (warehouse: Warehouse) => {
    const company = companies.find(c => c.name === warehouse.company);
    return `${warehouse.warehouse_name} (${company?.company_name || warehouse.company})`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Stock Entry</h2>
          <button
            onClick={() => navigate(-1)}
            className="cohenix-button"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <select
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.name} value={company.name}>
                  {company.company_name || company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Entry Type</label>
            <select
              value={formData.stock_entry_type}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  stock_entry_type: newType,
                  fromWarehouse: STOCK_ENTRY_TYPES.find(t => t.value === newType)?.requiresFrom ? prev.fromWarehouse : '',
                  toWarehouse: STOCK_ENTRY_TYPES.find(t => t.value === newType)?.requiresTo ? prev.toWarehouse : ''
                }));
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              {STOCK_ENTRY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {selectedEntryType?.requiresFrom && (
            <div>
              <label className="block text-sm font-medium text-gray-700">From Warehouse</label>
              <select
                value={formData.fromWarehouse}
                onChange={(e) => setFormData({ ...formData, fromWarehouse: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select Warehouse</option>
                {filteredWarehouses.map((warehouse) => (
                  <option key={warehouse.name} value={warehouse.name}>
                    {getWarehouseLabel(warehouse)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedEntryType?.requiresTo && (
            <div>
              <label className="block text-sm font-medium text-gray-700">To Warehouse</label>
              <select
                value={formData.toWarehouse}
                onChange={(e) => setFormData({ ...formData, toWarehouse: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select Warehouse</option>
                {filteredWarehouses.map((warehouse) => (
                  <option key={warehouse.name} value={warehouse.name}>
                    {getWarehouseLabel(warehouse)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Posting Date</label>
              <input
                type="date"
                value={formData.posting_date}
                onChange={(e) => setFormData({ ...formData, posting_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Posting Time</label>
              <input
                type="time"
                value={formData.posting_time}
                onChange={(e) => setFormData({ ...formData, posting_time: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="scan_mode"
              checked={formData.scan_mode}
              onChange={(e) => setFormData({ ...formData, scan_mode: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="scan_mode" className="text-sm text-gray-700">
              Continuous Scan Mode
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScanning(!isScanning)}
                  className="cohenix-button"
                >
                  <Scan className="h-4 w-4 mr-1" />
                  {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                </button>
              </div>
            </div>

            <ItemSearch onItemSelect={handleAddItem} />

            {isScanning && (
              <div id="reader" className="w-full transition-all duration-300"></div>
            )}

            <div className="mt-4 border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 bg-gray-50 p-3 border-b">
                <div className="col-span-6 text-sm font-medium text-gray-700">Item</div>
                <div className="col-span-2 text-sm font-medium text-gray-700">UOM</div>
                <div className="col-span-3 text-sm font-medium text-gray-700">Quantity</div>
                <div className="col-span-1 text-sm font-medium text-gray-700"></div>
              </div>

              <div className="divide-y">
                {items.map((item, index) => (
                  <div key={`${item.item_code}-${index}`} className="grid grid-cols-12 gap-4 p-3 items-center">
                    <div className="col-span-6">
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-gray-500">{item.item_code}</p>
                      {item.serial_no && (
                        <p className="text-xs text-blue-600">Serial: {item.serial_no}</p>
                      )}
                      {item.batch_no && (
                        <p className="text-xs text-green-600">Batch: {item.batch_no}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{item.uom || item.stock_uom || 'Nos'}</p>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No items added yet. Scan a barcode or search for items to add them.
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="cohenix-button w-full justify-center py-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Create Stock Entry'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
