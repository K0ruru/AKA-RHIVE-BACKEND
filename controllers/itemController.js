const Item = require("../models/Item");

// // Get all items
// exports.getItems = async (req, res) => {
// 	try {
// 		const items = await Item.find();
// 		res.status(200).json(items);
// 	} catch (error) {
// 		res.status(500).json({ message: "Error fetching items", error });
// 	}
// };
exports.getItems = async (req, res) => {
	try {
		const items = await Item.find();

		// Count total items
		const totalItems = items.length;

		// Calculate total stock by summing up the stock field for each item
		const totalStock = items.reduce((acc, item) => acc + item.stock, 0);

		res.status(200).json({
			totalItems, // Total number of items
			totalStock, // Total stock count
			items, // Actual items array
		});
	} catch (error) {
		res.status(500).json({ message: "Error fetching items", error });
	}
};

// Get a single item by ID
exports.getItemById = async (req, res) => {
	try {
		const item = await Item.findById(req.params.id);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}
		res.status(200).json(item);
	} catch (error) {
		res.status(500).json({ message: "Error fetching item", error });
	}
};

function getReorderLevel(stock) {
	if (stock >= 50) return 3; // plentiful
	if (stock >= 15 && stock < 50) return 2; // getting low
	return 1; // reorder immediately
}

// Update an item by ID
exports.updateItem = async (req, res) => {
	try {
		const { item_name, stock, supplier } = req.body;
		const reorder_level = getReorderLevel(stock);

		const updatedItem = await Item.findByIdAndUpdate(
			req.params.id,
			{ item_name, stock, supplier, reorder_level },
			{ new: true }
		);

		if (!updatedItem) {
			return res.status(404).json({ message: "Item not found" });
		}

		res.status(200).json(updatedItem);
	} catch (error) {
		res.status(500).json({ message: "Error updating item", error });
	}
};

// Delete an item by ID
exports.deleteItem = async (req, res) => {
	try {
		const deletedItem = await Item.findByIdAndDelete(req.params.id);
		if (!deletedItem) {
			return res.status(404).json({ message: "Item not found" });
		}
		res.status(200).json({ message: "Item deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error deleting item", error });
	}
};

exports.getUniqueSuppliers = async (req, res) => {
	try {
		// Using MongoDB's aggregation pipeline to get unique supplier names
		const suppliers = await Item.aggregate([
			{
				$group: {
					_id: "$supplier", // Group by supplier
				},
			},
			{
				$replaceRoot: { newRoot: { supplier: "$_id" } }, // Format output
			},
		]);

		// Send the list of unique suppliers
		res.status(200).json(suppliers.map((s) => s.supplier));
	} catch (error) {
		console.error("Error fetching unique suppliers:", error);
		res.status(500).json({ message: "Error fetching unique suppliers" });
	}
};
