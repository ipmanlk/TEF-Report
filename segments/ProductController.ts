import { getRepository } from "typeorm";
import { Product, ProductStatus } from "../entity";
import { ProductDao } from "../dao";
import { ValidationUtil, MiscUtil } from "../util";

export class ProductController {
	// determine if this is a request for a single object or a search
	static async get(data) {
		if (data !== undefined && data.id) {
			return this.getOne(data);
		} else {
			return this.search(data);
		}
	}

	private static async getOne({ id }) {
		// search for an entry with given id
		const product = await getRepository(Product)
			.findOne({
				where: { id: id },
				relations: ["employee"],
			})
			.catch((e) => {
				console.log(e.code, e);
				throw {
					status: false,
					type: "server",
					msg: "Server Error!. Please check logs.",
				};
			});

		// check if entry exists
		if (product !== undefined) {
			return {
				status: true,
				data: product,
			};
		} else {
			throw {
				status: false,
				type: "input",
				msg: "Unable to find a product with that id.",
			};
		}
	}

	private static async search(data = {}) {
		const products = await ProductDao.search(data).catch((e) => {
			console.log(e.code, e);
			throw {
				status: false,
				type: "server",
				msg: "Server Error!. Please check logs.",
			};
		});
		return {
			status: true,
			data: products,
		};
	}

	static async save(data, session) {
		// check if valid data is given
		await ValidationUtil.validate("PRODUCT", data);
		// add employee id of the current session as created employee
		data.employeeId = session.data.employeeId;
		// create product object
		const product = data as Product;
		// read photo as buffer
		const decodedBase64 = MiscUtil.decodeBase64Image(data.photo);
		product.photo = decodedBase64.data;
		// generate product code
		const lastProduct = await getRepository(Product).findOne({
			select: ["id", "code"],
			order: { id: "DESC" },
		});
		// set code for new product
		if (lastProduct) {
			product.code = MiscUtil.getNextNumber("PRO", lastProduct.code, 5);
		} else {
			product.code = MiscUtil.getNextNumber("PRO", undefined, 5);
		}
		// save to db
		try {
			const newProduct = await getRepository(Product).save(product);
			return {
				status: true,
				data: { code: newProduct.code },
				msg: "That product has been added!",
			};
		} catch (e) {
			console.log(e);
			throw {
				status: false,
				type: "server",
				msg: "Server Error!. Please check logs.",
			};
		}
	}

	static async update(data) {
		// create product object
		const editedProduct = data as Product;
		// check if product is present with the given id
		const selectedProduct = await getRepository(Product)
			.findOne(editedProduct.id)
			.catch((e) => {
				console.log(e.code, e);
				throw {
					status: false,
					type: "server",
					msg: "Server Error!. Please check logs.",
				};
			});

		if (!selectedProduct) {
			throw {
				status: false,
				type: "input",
				msg: "That product doesn't exist in our database!.",
			};
		}
		// check if photo has changed
		if (data.photo == false) {
			editedProduct.photo = selectedProduct.photo;
		} else {
			// read photo as buffer
			const decodedBase64 = MiscUtil.decodeBase64Image(data.photo);
			editedProduct.photo = decodedBase64.data;
		}
		// check if valid data is given
		await ValidationUtil.validate("PRODUCT", editedProduct);

		try {
			await getRepository(Product).save(editedProduct);
			return {
				status: true,
				msg: "That product has been updated!",
			};
		} catch (e) {
			throw {
				status: false,
				type: "server",
				msg: "Server Error!. Please check logs.",
			};
		}
	}

	static async delete({ id }) {
		// find entry with the given id
		const product = await getRepository(Product)
			.findOne({ id: id })
			.catch((e) => {
				console.log(e.code, e);
				throw {
					status: false,
					type: "server",
					msg: "Server Error!. Please check logs.",
				};
			});
		if (!product) {
			throw {
				status: false,
				type: "input",
				msg: "That product doesn't exist in our database!.",
			};
		}
		// find deleted status
		const deletedStatus = await getRepository(ProductStatus)
			.findOne({ name: "Deleted" })
			.catch((e) => {
				console.log(e.code, e);
				throw {
					status: false,
					type: "server",
					msg: "Server Error!. Please check logs.",
				};
			});
		// delete the product
		product.productStatus = deletedStatus;
		await getRepository(Product)
			.save(product)
			.catch((e) => {
				console.log(e.code, e);
				throw {
					status: false,
					type: "server",
					msg: "Server Error!. Please check logs.",
				};
			});
		return {
			status: true,
			msg: "That product has been deleted!",
		};
	}
}
