# Cohenix Warehouse Management System

A modern, mobile-first warehouse management system built with React and integrated with Cohenix/ERP.

![Cohenix WMS](https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2000)

## Features

### 1. Mobile-First Design
- Responsive interface optimized for mobile devices
- Touch-friendly controls
- PWA support for offline capabilities
- Installable on mobile devices

### 2. Barcode Scanning
- Real-time barcode scanning using device camera
- Supports multiple barcode formats
- Continuous scan mode for batch operations
- Handles item barcodes, serial numbers, and batch numbers

### 3. Stock Management
- **Stock Entry**
  - Material Issue
  - Material Receipt
  - Material Transfer
  - Material Transfer for Manufacture
  - Material Consumption
  - Manufacture
  - Repack
  - Send to Subcontractor
- **Stock Balance**
  - Real-time stock levels
  - Warehouse-wise balance
  - Valuation tracking
- **Stock Reconciliation**
  - Physical stock verification
  - Variance tracking
  - Automatic stock adjustment

### 4. Dashboard
- Real-time operational metrics
- Work order status
- Job card tracking
- Material requests
- Purchase orders
- Quality inspections

### 5. Multi-Company Support
- Company-wise warehouse segregation
- Role-based access control
- Company-specific stock views

## Technical Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Camera Integration**: HTML5-QRCode
- **Backend Integration**: Frappe/ERPNext REST API

## Setup Instructions

### 1. Prerequisites
- Node.js 16 or higher
- npm or yarn
- Frappe/ERPNext instance

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/epiusegs/cohenix_Stock_manager.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Frappe Integration Setup

#### API Key Generation
1. Log in to your Frappe instance as Administrator
2. Go to Users - user - Settings → API Access
3. Create a new API Key
4. Note down the API Key and API Secret and Server Address

#### Frappe/Cohenix Cloud Configuration:
1. Add custom config
- Config Name: Custom Key
- Key: allow_cors
- Type: String
- Value: *

#### Application Configuration
1. Enter administrator credentials (default: admin/EPI@1epi)
2. Click the "Settings" button on the login screen
3. Configure:
   - Base URL (e.g., https://your-cohenix-instance.com)
   - API Key
   - API Secret
4. Test the connection using the "Test Connection" button

### 4. Required Cohenix Modules:
- Framework
- ERP

### 5. Permissions Setup
Ensure the API user has the following permissions:
- Stock Manager role
- Warehouse User role
- Item Manager role
- Manufacturing User role (if using manufacturing features)

## Usage Guide

### Stock Entry Process
1. Select entry type (Material Transfer, Receipt, etc.)
2. Choose source/destination warehouses
3. Add items via:
   - Barcode scanning
   - Manual search
   - Item code entry
4. Adjust quantities if needed
5. Submit the entry

### Stock Balance Check
1. Select warehouse
2. Scan item or search manually
3. View:
   - Current quantity
   - Valuation rate
   - Total value

### Stock Reconciliation
1. Select warehouse
2. Choose reconciliation date
3. Scan items or add manually
4. Enter actual quantities
5. Submit for processing

## Security Features

- Token-based API authentication
- Session management
- Role-based access control
- Warehouse-level permissions
- Company-wise data segregation

## Best Practices

1. **Stock Entry**
   - Always verify warehouse selection
   - Double-check quantities
   - Use continuous scan mode for bulk entries

2. **Reconciliation**
   - Perform at regular intervals
   - Document variances
   - Maintain audit trail

3. **Data Management**
   - Regular backups
   - Periodic system checks
   - Monitor stock levels

## Troubleshooting

### Common Issues

1. **Scanner Not Working**
   - Ensure camera permissions are granted
   - Check lighting conditions
   - Verify barcode quality

2. **API Connection Issues**
   - Verify API credentials
   - Check network connectivity
   - Validate SSL certificates

3. **Stock Discrepancies**
   - Review recent transactions
   - Check warehouse assignments
   - Verify item configurations

## Support

For technical support or feature requests:
- Create an issue in the repository
- Contact support@cohenix.com
- Visit our documentation at https://docs.cohenix.com

## License

MIT License - See LICENSE file for details
