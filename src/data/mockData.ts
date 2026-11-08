import type { BaseRecord } from '../types/models'
const today='2026-11-06'

const storeProductSeeds: Record<string, BaseRecord[]> = {
  'STR-2048': [
    { id: 'PRD-2048-001', storeId: 'STR-2048', sku: 'NS-TOTE-CAN', name: 'Canvas Tote', slug: 'canvas-tote', description: 'Durable everyday tote in natural canvas.', price: 38, image: 'https://placehold.co/400x400?text=Canvas+Tote', category: 'Accessories', stockQuantity: 42, lowStockThreshold: 10, inventoryUpdatedAt: '2026-11-05', status: 'Active', createdAt: '2026-10-25', updatedAt: '2026-11-05' },
    { id: 'PRD-2048-002', storeId: 'STR-2048', sku: 'NS-MUG-CER', name: 'Ceramic Mug', slug: 'ceramic-mug', description: 'Hand-finished mug for coffee or tea.', price: 24, image: 'https://placehold.co/400x400?text=Ceramic+Mug', category: 'Home', stockQuantity: 3, lowStockThreshold: 5, inventoryUpdatedAt: '2026-11-04', status: 'Draft', createdAt: '2026-10-26', updatedAt: '2026-11-04' },
  ],
  'STR-2047': [
    { id: 'PRD-2047-001', storeId: 'STR-2047', sku: 'SF-LAMP-STD', name: 'Studio Desk Lamp', slug: 'studio-desk-lamp', description: 'Adjustable lamp with warm LED light.', price: 129, image: 'https://placehold.co/400x400?text=Desk+Lamp', category: 'Lighting', stockQuantity: 0, lowStockThreshold: 4, inventoryUpdatedAt: '2026-11-03', status: 'Active', createdAt: '2026-10-23', updatedAt: '2026-11-03' },
  ],
}

const storeCategorySeeds: Record<string, BaseRecord[]> = {
  'STR-2048': [
    { id: 'CAT-2048-001', storeId: 'STR-2048', name: 'Accessories', slug: 'accessories', description: 'Bags, small goods, and add-ons.', image: '', status: 'Active', createdAt: '2026-10-24', updatedAt: '2026-10-24' },
    { id: 'CAT-2048-002', storeId: 'STR-2048', name: 'Home', slug: 'home', description: 'Home and kitchen items.', image: '', status: 'Active', createdAt: '2026-10-24', updatedAt: '2026-10-24' },
  ],
  'STR-2047': [
    { id: 'CAT-2047-001', storeId: 'STR-2047', name: 'Lighting', slug: 'lighting', description: 'Lamps and lighting fixtures.', image: '', status: 'Active', createdAt: '2026-10-23', updatedAt: '2026-10-23' },
  ],
}

const storeStockAdjustmentSeeds: Record<string, BaseRecord[]> = {}

const storeOrderSeeds: Record<string, BaseRecord[]> = {
  'STR-2048': [
    {
      id: 'ORD-2048-1004', storeId: 'STR-2048', orderNumber: 'NS-1004', customerName: 'Jordan Lee', customerEmail: 'jordan.lee@example.demo', customerPhone: '+1 415-555-0142',
      items: [
        { productId: 'PRD-2048-001', productName: 'Canvas Tote', quantity: 2, unitPrice: 38 },
        { productId: 'PRD-2048-002', productName: 'Ceramic Mug', quantity: 1, unitPrice: 24 },
      ],
      subtotal: 100, shipping: 8, discount: 10, total: 98, paymentStatus: 'Paid', fulfillmentStatus: 'Shipped',
      shippingAddress: { line1: '48 Market Street', line2: 'Apt 3B', city: 'San Francisco', state: 'CA', postalCode: '94105', country: 'US' },
      notes: 'Demo order (not a real transaction). Leave at front desk if unattended.',
      status: 'Shipped', createdAt: '2026-11-03', updatedAt: '2026-11-05',
      statusHistory: [
        { previousStatus: 'Unfulfilled', newStatus: 'Processing', timestamp: '2026-11-03T14:10:00.000Z', reason: 'Demo: payment confirmed, preparing items', actorName: 'Demo System', actorEmail: '' },
        { previousStatus: 'Processing', newStatus: 'Shipped', timestamp: '2026-11-05T09:20:00.000Z', reason: 'Demo: handed to carrier', actorName: 'Demo Staff', actorEmail: '' },
      ],
    },
    {
      id: 'ORD-2048-1003', storeId: 'STR-2048', orderNumber: 'NS-1003', customerName: 'Avery Kim', customerEmail: 'avery.kim@example.demo',
      items: [{ productId: 'PRD-2048-002', productName: 'Ceramic Mug', quantity: 3, unitPrice: 24 }],
      subtotal: 72, shipping: 6, discount: 0, total: 78, paymentStatus: 'Pending', fulfillmentStatus: 'Unfulfilled',
      shippingAddress: { line1: '12 Pine Road', city: 'Portland', state: 'OR', postalCode: '97205', country: 'US' },
      notes: 'Demo order (not a real transaction).',
      status: 'Unfulfilled', createdAt: '2026-11-05', updatedAt: '2026-11-05',
      statusHistory: [],
    },
    {
      id: 'ORD-2048-1002', storeId: 'STR-2048', orderNumber: 'NS-1002', customerName: 'Sam Rivera', customerEmail: 'sam.rivera@example.demo', customerPhone: '+1 206-555-0199',
      items: [{ productId: 'PRD-2048-001', productName: 'Canvas Tote', quantity: 1, unitPrice: 38 }],
      subtotal: 38, shipping: 5, discount: 0, total: 43, paymentStatus: 'Paid', fulfillmentStatus: 'Delivered',
      shippingAddress: { line1: '901 Lakeview Ave', city: 'Seattle', state: 'WA', postalCode: '98101', country: 'US' },
      notes: 'Demo order (not a real transaction).',
      status: 'Delivered', createdAt: '2026-10-29', updatedAt: '2026-11-01',
      statusHistory: [
        { previousStatus: 'Unfulfilled', newStatus: 'Processing', timestamp: '2026-10-29T10:00:00.000Z', reason: 'Demo: processing', actorName: 'Demo System', actorEmail: '' },
        { previousStatus: 'Processing', newStatus: 'Shipped', timestamp: '2026-10-30T08:30:00.000Z', reason: 'Demo: shipped', actorName: 'Demo Staff', actorEmail: '' },
        { previousStatus: 'Shipped', newStatus: 'Delivered', timestamp: '2026-11-01T16:00:00.000Z', reason: 'Demo: delivery confirmed', actorName: 'Demo Carrier', actorEmail: '' },
      ],
    },
    {
      id: 'ORD-2048-1001', storeId: 'STR-2048', orderNumber: 'NS-1001', customerName: 'Morgan Patel', customerEmail: 'morgan.patel@example.demo',
      items: [
        { productId: 'PRD-2048-001', productName: 'Canvas Tote', quantity: 1, unitPrice: 38 },
        { productId: 'PRD-2048-002', productName: 'Ceramic Mug', quantity: 2, unitPrice: 24 },
      ],
      subtotal: 86, shipping: 7, discount: 5, total: 88, paymentStatus: 'Failed', fulfillmentStatus: 'Cancelled',
      shippingAddress: { line1: '220 Oak Blvd', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
      notes: 'Demo order (not a real transaction). Payment failed in demo scenario.',
      status: 'Cancelled', createdAt: '2026-10-27', updatedAt: '2026-10-27',
      statusHistory: [
        { previousStatus: 'Unfulfilled', newStatus: 'Cancelled', timestamp: '2026-10-27T11:45:00.000Z', reason: 'Demo: cancelled after payment failure', actorName: 'Demo Staff', actorEmail: '' },
      ],
    },
  ],
  'STR-2047': [
    {
      id: 'ORD-2047-0502', storeId: 'STR-2047', orderNumber: 'SF-0502', customerName: 'Casey Morgan', customerEmail: 'casey.morgan@example.demo',
      items: [{ productId: 'PRD-2047-001', productName: 'Studio Desk Lamp', quantity: 1, unitPrice: 129 }],
      subtotal: 129, shipping: 12, discount: 0, total: 141, paymentStatus: 'Paid', fulfillmentStatus: 'Processing',
      shippingAddress: { line1: '77 Studio Lane', city: 'Denver', state: 'CO', postalCode: '80202', country: 'US' },
      notes: 'Demo order (not a real transaction).',
      status: 'Processing', createdAt: '2026-11-04', updatedAt: '2026-11-04',
      statusHistory: [{ previousStatus: 'Unfulfilled', newStatus: 'Processing', timestamp: '2026-11-04T13:00:00.000Z', reason: 'Demo: order accepted', actorName: 'Demo System', actorEmail: '' }],
    },
    {
      id: 'ORD-2047-0501', storeId: 'STR-2047', orderNumber: 'SF-0501', customerName: 'Taylor Brooks', customerEmail: 'taylor.brooks@example.demo', customerPhone: '+1 303-555-0177',
      items: [{ productId: 'PRD-2047-001', productName: 'Studio Desk Lamp', quantity: 2, unitPrice: 129 }],
      subtotal: 258, shipping: 15, discount: 20, total: 253, paymentStatus: 'Paid', fulfillmentStatus: 'Unfulfilled',
      shippingAddress: { line1: '5 Meridian Ct', city: 'Boulder', state: 'CO', postalCode: '80301', country: 'US' },
      notes: 'Demo order (not a real transaction).',
      status: 'Unfulfilled', createdAt: '2026-11-06', updatedAt: '2026-11-06',
      statusHistory: [],
    },
  ],
}

function getScopedStoreSeed(resource: string, prefix: 'store-products' | 'store-categories' | 'store-stock-adjustments' | 'store-orders', seedsByStore: Record<string, BaseRecord[]>): BaseRecord[] | null {
  const escaped = prefix.replace(/-/g, '\\-')
  const match = new RegExp(`^${escaped}:(.+)$`).exec(resource)
  if (!match) return null
  const storeId = decodeURIComponent(match[1])
  const rows = (seedsByStore[storeId] ?? seedsByStore[match[1]] ?? []).filter((row) => row.storeId === storeId)
  return structuredClone(rows)
}

function getStoreProductSeed(resource: string): BaseRecord[] | null {
  return getScopedStoreSeed(resource, 'store-products', storeProductSeeds)
}

function getStoreCategorySeed(resource: string): BaseRecord[] | null {
  return getScopedStoreSeed(resource, 'store-categories', storeCategorySeeds)
}

function getStoreStockAdjustmentSeed(resource: string): BaseRecord[] | null {
  return getScopedStoreSeed(resource, 'store-stock-adjustments', storeStockAdjustmentSeeds)
}

function getStoreOrderSeed(resource: string): BaseRecord[] | null {
  return getScopedStoreSeed(resource, 'store-orders', storeOrderSeeds)
}

const seeds: Record<string,BaseRecord[]>={
 stores:[
 {id:'STR-2048',name:'Northstar Goods',owner:'Olivia Rhye',domain:'northstargoods.com',plan:'Professional',mrr:149,products:1248,status:'Active',createdAt:'2026-10-24'},{id:'STR-2047',name:'Studio Forma',owner:'Phoenix Baker',domain:'studioforma.co',plan:'Enterprise',mrr:399,products:3480,status:'Active',createdAt:'2026-10-22'},{id:'STR-2046',name:'Harbor & Pine',owner:'Lana Steiner',domain:'harborpine.shop',plan:'Starter',mrr:49,products:312,status:'Trial',createdAt:'2026-10-21'},{id:'STR-2045',name:'Sunday Supply',owner:'Demi Wilkinson',domain:'sundaysupply.com',plan:'Professional',mrr:149,products:890,status:'Past due',createdAt:'2026-10-19'},{id:'STR-2044',name:'Fieldwork Market',owner:'Candice Wu',domain:'fieldwork.market',plan:'Enterprise',mrr:399,products:5680,status:'Active',createdAt:'2026-10-18'},{id:'STR-2043',name:'Mono Objects',owner:'Natali Craig',domain:'monoobjects.com',plan:'Starter',mrr:49,products:164,status:'Suspended',createdAt:'2026-10-16'},{id:'STR-2042',name:'Poppy & Co.',owner:'Drew Cano',domain:'poppyandco.store',plan:'Professional',mrr:149,products:742,status:'Active',createdAt:'2026-10-15'},{id:'STR-2041',name:'Evergreen Living',owner:'Orlando Diggs',domain:'evergreenliving.io',plan:'Enterprise',mrr:399,products:2100,status:'Active',createdAt:'2026-10-12'}],
 tenants:[{id:'TEN-1092',name:'Olivia Rhye',email:'olivia@northstargoods.com',stores:2,plan:'Professional',status:'Active',createdAt:'2026-08-12'},{id:'TEN-1091',name:'Phoenix Baker',email:'phoenix@studioforma.co',stores:1,plan:'Enterprise',status:'Active',createdAt:'2026-08-10'},{id:'TEN-1090',name:'Lana Steiner',email:'lana@harborpine.shop',stores:1,plan:'Starter',status:'Trial',createdAt:'2026-08-08'},{id:'TEN-1089',name:'Demi Wilkinson',email:'demi@sundaysupply.com',stores:1,plan:'Professional',status:'Past due',createdAt:'2026-08-05'}],
 'platform-users':[{id:'USR-014',name:'Olivia Rhye',email:'olivia@platform.io',role:'Super Admin',lastLogin:'2 min ago',status:'Active',createdAt:'2025-04-11'},{id:'USR-013',name:'Phoenix Baker',email:'phoenix@platform.io',role:'Billing Admin',lastLogin:'1 hour ago',status:'Active',createdAt:'2025-06-20'},{id:'USR-012',name:'Lana Steiner',email:'lana@platform.io',role:'Support Agent',lastLogin:'Yesterday',status:'Active',createdAt:'2025-08-02'}],
 roles:['Super Admin','Platform Admin','Billing Admin','Support Agent','Analyst'].map((name,i)=>({id:`ROL-00${i+1}`,name,users:[2,4,3,8,5][i],permissions:[48,38,24,19,22][i],status:'Active',createdAt:'2025-01-01'})),
 plans:[{id:'PLN-001',name:'Free',monthly:0,annual:0,stores:1,products:100,status:'Active',createdAt:'2025-01-01'},{id:'PLN-002',name:'Starter',monthly:49,annual:490,stores:1,products:1000,status:'Active',createdAt:'2025-01-01'},{id:'PLN-003',name:'Professional',monthly:149,annual:1490,stores:5,products:10000,status:'Active',createdAt:'2025-01-01'},{id:'PLN-004',name:'Enterprise',monthly:399,annual:3990,stores:25,products:100000,status:'Active',createdAt:'2025-01-01'}],
 subscriptions:[{id:'SUB-8421',tenant:'Olivia Rhye',store:'Northstar Goods',plan:'Professional',cycle:'Monthly',nextBilling:'Nov 24, 2026',amount:149,status:'Active',createdAt:'2026-10-24'},{id:'SUB-8420',tenant:'Phoenix Baker',store:'Studio Forma',plan:'Enterprise',cycle:'Annual',nextBilling:'Nov 22, 2026',amount:399,status:'Active',createdAt:'2026-10-22'},{id:'SUB-8419',tenant:'Lana Steiner',store:'Harbor & Pine',plan:'Starter',cycle:'Monthly',nextBilling:'Nov 21, 2026',amount:49,status:'Trial',createdAt:'2026-10-21'}],
 billing:[{id:'INV-2026-1842',number:'INV-2026-1842',tenant:'Olivia Rhye',amount:149,dueDate:'Nov 24, 2026',status:'Paid',createdAt:'2026-10-24'},{id:'INV-2026-1841',number:'INV-2026-1841',tenant:'Phoenix Baker',amount:399,dueDate:'Nov 22, 2026',status:'Pending',createdAt:'2026-10-22'},{id:'INV-2026-1840',number:'INV-2026-1840',tenant:'Demi Wilkinson',amount:149,dueDate:'Nov 19, 2026',status:'Past due',createdAt:'2026-10-19'}],
 payments:[{id:'TXN-59284',tenant:'Olivia Rhye',invoice:'INV-2026-1842',gateway:'Stripe',amount:149,date:today,status:'Paid',createdAt:today},{id:'TXN-59283',tenant:'Phoenix Baker',invoice:'INV-2026-1841',gateway:'Stripe',amount:399,date:'2026-11-05',status:'Paid',createdAt:'2026-11-05'},{id:'TXN-59282',tenant:'Demi Wilkinson',invoice:'INV-2026-1840',gateway:'Adyen',amount:149,date:'2026-11-04',status:'Failed',createdAt:'2026-11-04'}],
 promotions:[{id:'PRO-024',name:'Launch offer',code:'LAUNCH20',discount:'20%',redemptions:184,expires:'Dec 31, 2026',status:'Active',createdAt:'2026-09-01'},{id:'PRO-023',name:'Annual upgrade',code:'ANNUAL10',discount:'10%',redemptions:92,expires:'Nov 30, 2026',status:'Active',createdAt:'2026-08-15'}],
 monitoring:[{id:'API',name:'API status',usage:'99.98% uptime',lastSync:'Operational',status:'Active',createdAt:today},{id:'DB',name:'Database',usage:'42% capacity',lastSync:'Operational',status:'Active',createdAt:today},{id:'JOBS',name:'Background jobs',usage:'18 queued',lastSync:'Operational',status:'Active',createdAt:today}],
 settings:[{id:'SET-001',platformName:'Northstar Platform',currency:'USD',timezone:'UTC',language:'en',maintenanceMode:false,status:'Active',createdAt:today}],
 'audit-logs':[{id:'LOG-89012',user:'Olivia Rhye',action:'Updated subscription',resource:'SUB-8421',ip:'192.168.1.18',status:'Active',createdAt:'2026-11-06 10:42'},{id:'LOG-89011',user:'Phoenix Baker',action:'Refund issued',resource:'TXN-59270',ip:'192.168.1.24',status:'Active',createdAt:'2026-11-06 09:18'}],
 notifications:[{id:'NTF-028',title:'November maintenance window',type:'Maintenance',audience:'All tenants',sent:'Nov 5, 2026',status:'Active',createdAt:'2026-11-05'},{id:'NTF-027',title:'New analytics features',type:'Feature update',audience:'Professional+',sent:'Nov 2, 2026',status:'Draft',createdAt:'2026-11-02'}],
 integrations:[{id:'INT-01',name:'Stripe',category:'Payments',usage:'2,841 requests',lastSync:'2 min ago',status:'Active',createdAt:'2026-06-10'},{id:'INT-02',name:'SendGrid',category:'Email',usage:'18,420 emails',lastSync:'5 min ago',status:'Active',createdAt:'2026-06-10'},{id:'INT-03',name:'Shippo',category:'Shipping',usage:'Not connected',lastSync:'—',status:'Suspended',createdAt:'2026-06-10'}],
 security:[{id:'SES-124',name:'Olivia Rhye',email:'olivia@platform.io',role:'Chrome · Mac OS',lastLogin:'Current session',status:'Active',createdAt:'2026-11-06'},{id:'SES-123',name:'Phoenix Baker',email:'phoenix@platform.io',role:'Safari · iPhone',lastLogin:'2 hours ago',status:'Active',createdAt:'2026-11-06'}],
 support:[{id:'TKT-4928',subject:'Custom domain SSL setup',tenant:'Olivia Rhye',priority:'High',assignee:'Lana Steiner',status:'Open',createdAt:'2026-11-06'},{id:'TKT-4927',subject:'Invoice payment question',tenant:'Demi Wilkinson',priority:'Normal',assignee:'Unassigned',status:'Open',createdAt:'2026-11-05'}]
}
export function getSeedData(resource:string):BaseRecord[]{
 const storeProducts = getStoreProductSeed(resource)
 if (storeProducts) return storeProducts
 const storeCategories = getStoreCategorySeed(resource)
 if (storeCategories) return storeCategories
 const storeAdjustments = getStoreStockAdjustmentSeed(resource)
 if (storeAdjustments) return storeAdjustments
 const storeOrders = getStoreOrderSeed(resource)
 if (storeOrders) return storeOrders
 return structuredClone(seeds[resource]??[{id:'DEMO-001',name:'Example record',status:'Active',createdAt:today}])
}
