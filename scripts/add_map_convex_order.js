const fs = require('fs');
const path = require('path');
const file = path.resolve('src/lib/services/order.service.ts');
let code = fs.readFileSync(file, 'utf8');

const helper = `
function mapConvexOrder(order: any): OrderWithItems {
  return {
    id: order._id,
    restaurant_id: RESTAURANT_ID,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || null,
    order_type: order.orderType,
    table_id: null,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    pickup_time: order.pickupTime || null,
    notes: order.notes || null,
    subtotal_paise: order.subtotalPaise,
    tax_paise: order.taxPaise,
    tip_paise: order.tipPaise,
    total_paise: order.totalPaise,
    idempotency_key: order.idempotencyKey || null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    processed_by: null,
    created_at: new Date(order.createdAt).toISOString(),
    updated_at: new Date(order.createdAt).toISOString(),
    order_items: (order.items || []).map((item: any, idx: number) => ({
      id: \`item-\${idx}\`,
      order_id: order._id,
      dish_id: item.dishId,
      dish_name: item.dishName,
      dish_price_paise: item.dishPricePaise,
      quantity: item.quantity,
      size_name: item.sizeName || null,
      size_price_modifier_paise: item.sizePriceModifierPaise || 0,
      special_instructions: item.specialInstructions || null,
      line_total_paise: item.lineTotalPaise,
      created_at: new Date(order.createdAt).toISOString(),
      order_item_customizations: [],
    })),
  };
}
`;

if (!code.includes('function mapConvexOrder')) {
  code = code.replace('const RESTAURANT_ID =', helper + '\nconst RESTAURANT_ID =');
  fs.writeFileSync(file, code, 'utf8');
  console.log('mapConvexOrder added successfully.');
} else {
  console.log('mapConvexOrder already present.');
}
