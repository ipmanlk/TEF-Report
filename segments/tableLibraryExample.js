// get regexes for validation and store on window tempData
const response = await Request.send("/api/regexes", "GET", {
	data: { module: "PRODUCT" },
});

const validationInfo = response.data;
// create an array from permission string
const permission = permissionStr.split("").map((p) => parseInt(p));
// load main table
const dataBuilderFunction = (responseData) => {
	// parse resposne data and return in data table friendly format
	return responseData.map((entry) => {
		return {
			Code: entry.code,
			Name: entry.name,
			Cost: entry.cost,
			Price: entry.price,
			Category: entry.category.name,
			Status: entry.productStatus.name,
			View: `<button class="btn btn-success btn-sm" onclick="showEditEntryModal('${entry.id}', true)"><i class="glyphicon glyphicon-eye-open" aria-hidden="true"></i> View</button>`,
			Edit: `<button class="btn btn-warning btn-sm" onclick="showEditEntryModal('${entry.id}')"><i class="glyphicon glyphicon-edit" aria-hidden="true"></i> Edit</button>`,
			Delete: `${
				entry.productStatus.name == "Deleted"
					? ""
					: `<button class="btn btn-danger btn-sm" onclick="deleteEntry('${entry.id}')"><i class="glyphicon glyphicon-edit" aria-hidden="true"></i> Delete</button>`
			}`,
		};
	});
};

window.mainTable = new DataTable(
	"mainTableHolder",
	"/api/products",
	permission,
	dataBuilderFunction,
	"Product List"
);
