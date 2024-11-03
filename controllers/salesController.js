// controllers/salesController.js
const Sale = require("../models/Sale");
const Item = require("../models/Item");
const User = require("../models/User");

// Create a new sale
exports.createSale = async (req, res) => {
	try {
		const sale = new Sale(req.body);
		await sale.save();

		// Update the stock for each item sold
		for (const soldItem of sale.items) {
			await Item.findByIdAndUpdate(soldItem.item_id, {
				$inc: { stock: -soldItem.quantity },
			});
		}

		res.status(201).json(sale);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// Get all sales
exports.getAllSales = async (req, res) => {
	try {
		const sales = await Sale.find()
			.populate("items.item_id")
			.populate("user_id", "name");

		res.status(200).json(sales);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
	try {
		const sale = await Sale.findById(req.params.id).populate("items.item_id");
		if (!sale) return res.status(404).json({ message: "Sale not found" });
		res.status(200).json(sale);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update a sale
exports.updateSale = async (req, res) => {
	try {
		const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		if (!sale) return res.status(404).json({ message: "Sale not found" });
		res.status(200).json(sale);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// Delete a sale
exports.deleteSale = async (req, res) => {
	try {
		const sale = await Sale.findByIdAndDelete(req.params.id);
		if (!sale) return res.status(404).json({ message: "Sale not found" });

		// Adjust stock back for each deleted sale
		for (const soldItem of sale.items) {
			await Item.findByIdAndUpdate(soldItem.item_id, {
				$inc: { stock: soldItem.quantity },
			});
		}

		res.status(200).json({ message: "Sale deleted" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get frequently sold items with weekly, monthly, and yearly totals
exports.getFrequentlySoldItems = async (req, res) => {
	try {
		// Calculate date ranges for past week, month, and year
		const now = new Date();
		const pastWeek = new Date(now);
		pastWeek.setDate(now.getDate() - 7);

		const pastMonth = new Date(now);
		pastMonth.setMonth(now.getMonth() - 1);

		const pastYear = new Date(now);
		pastYear.setFullYear(now.getFullYear() - 1);

		// Aggregate sales with time period filtering
		const frequentlySoldItems = await Sale.aggregate([
			{ $unwind: "$items" }, // Deconstruct items array in each sale

			{
				$facet: {
					// Weekly sales
					weekly: [
						{ $match: { date: { $gte: pastWeek } } },
						{
							$group: {
								_id: { item_id: "$items.item_id", user_id: "$user_id" },
								totalQuantitySold: { $sum: "$items.quantity" },
							},
						},
					],
					// Monthly sales
					monthly: [
						{ $match: { date: { $gte: pastMonth } } },
						{
							$group: {
								_id: { item_id: "$items.item_id", user_id: "$user_id" },
								totalQuantitySold: { $sum: "$items.quantity" },
							},
						},
					],
					// Yearly sales
					yearly: [
						{ $match: { date: { $gte: pastYear } } },
						{
							$group: {
								_id: { item_id: "$items.item_id", user_id: "$user_id" },
								totalQuantitySold: { $sum: "$items.quantity" },
							},
						},
					],
				},
			},
			// Lookup to populate item details
			{
				$project: {
					weekly: {
						$map: {
							input: "$weekly",
							as: "item",
							in: {
								item_id: "$$item._id.item_id",
								user_id: "$$item._id.user_id",
								totalQuantitySold: "$$item.totalQuantitySold",
							},
						},
					},
					monthly: {
						$map: {
							input: "$monthly",
							as: "item",
							in: {
								item_id: "$$item._id.item_id",
								user_id: "$$item._id.user_id",
								totalQuantitySold: "$$item.totalQuantitySold",
							},
						},
					},
					yearly: {
						$map: {
							input: "$yearly",
							as: "item",
							in: {
								item_id: "$$item._id.item_id",
								user_id: "$$item._id.user_id",
								totalQuantitySold: "$$item.totalQuantitySold",
							},
						},
					},
				},
			},
		]);

		// Populate item and user details for each period
		const populateOptions = [
			{
				path: "item_id",
				model: "Item",
				select: "item_name stock supplier reorder_level",
			},
			{ path: "user_id", model: "User", select: "name" },
		];

		const populatedResults = {
			weekly: await Sale.populate(
				frequentlySoldItems[0].weekly,
				populateOptions
			),
			monthly: await Sale.populate(
				frequentlySoldItems[0].monthly,
				populateOptions
			),
			yearly: await Sale.populate(
				frequentlySoldItems[0].yearly,
				populateOptions
			),
		};

		// Format results to include all needed details in the response
		const formatResults = (results) => {
			return results.map((item) => ({
				_id: item.item_id._id,
				item_name: item.item_id.item_name,
				totalQuantitySold: item.totalQuantitySold,
				stock: item.item_id.stock,
				supplier: item.item_id.supplier,
				reorder_level: item.item_id.reorder_level,
				user_name: item.user_id?.name || "Unknown",
			}));
		};

		res.status(200).json({
			weekly: formatResults(populatedResults.weekly),
			monthly: formatResults(populatedResults.monthly),
			yearly: formatResults(populatedResults.yearly),
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
