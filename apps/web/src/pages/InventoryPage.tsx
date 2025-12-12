export function InventoryPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-800 mb-6">My Plant Inventory</h1>
        {/* TODO: Implement plant grid with PlantCard components */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <p className="col-span-full text-gray-600">Inventory page - To be implemented</p>
        </div>
      </div>
    </div>
  );
}
