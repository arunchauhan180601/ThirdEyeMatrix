import { Star } from "lucide-react";

export default function Templates() {
  const data = [
    { product: "Product A", customer: "Customer X", order: "Order 123", payment: "Cash", rating: 5 },
    { product: "Product B", customer: "Customer Y", order: "Order 456", payment: "Online", rating: 4 },
    { product: "Product C", customer: "Customer Z", order: "Order 789", payment: "Cash", rating: 3 },
  ];

  return (
    <>
      <div className="container px-1 py-2 sm:p-4">
        <p className="text-md font-semibold md:text-2xl font-custom">
          Shopify
        </p>
      </div>

      <div className="overflow-x-auto px-1 sm:px-4 scrollbar-hide ">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 font-custom">
            <tr className="font-semibold text-sm">
              <th className="px-6 py-4 text-left uppercase tracking-wider">Products</th>
              <th className="px-6 py-4 text-left uppercase tracking-wider">Customers</th>
              <th className="px-6 py-4 text-left uppercase tracking-wider">Orders</th>
              <th className="px-6 py-4 text-left uppercase tracking-wider">Payment</th>
              <th className="px-6 py-4 text-left uppercase tracking-wider ">Rating</th>
              <th className="px-6 py-4 text-left uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="font-custom">
                <td className="px-6 py-4 whitespace-nowrap">{row.product}</td>
                <td className="px-6 py-4 whitespace-nowrap">{row.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap">{row.order}</td>
                <td className="px-6 py-4 whitespace-nowrap">{row.payment}</td>
                <td className="px-6 py-6 whitespace-nowrap flex ">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < row.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </td>

                <td className="px-6 py-4  whitespace-nowrap">
                  <button className="button text-center px-2 py-1 border rounded-md bg-red-500 text-white cursor-pointer">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
