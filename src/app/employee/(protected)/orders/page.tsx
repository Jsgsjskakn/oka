import { requireEmployee } from '@/lib/auth/employee-auth';
import { getAllOrders } from '@/lib/services/order.service';
import { OrdersDashboard } from '@/components/employee/OrdersDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EmployeeOrdersPage() {
  const employee = await requireEmployee();
  
  const orders = await getAllOrders('a1b2c3d4-0000-0000-0000-000000000001');

  return (
    <div className="h-full">
      <OrdersDashboard 
        initialOrders={orders || []} 
        employeeId={employee.userId}
        employeeName={employee.name}
      />
    </div>
  );
}
