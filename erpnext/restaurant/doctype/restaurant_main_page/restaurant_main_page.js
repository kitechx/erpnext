// Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Restaurant Main Page', {
	refresh: function(frm) {

	},

		b_dine_in: function (frm) {
			//frappe.set_route('Form', 'Restaurant Order Entry', {'resturant_table':SI_doc.name});
			frappe.set_route('Form', 'Restaurant Order Entry', {'resturant_table': ''});
		},
		
		
		b_take_away: function (frm) {
			var SI_doc = frappe.model.get_new_doc('Sales Invoice');
			SI_doc.service_type = 'Take Away';
			frappe.set_route('Form', 'Sales Invoice', SI_doc.name);
		},
		
		
		b_delivery: function (frm) {
			var SI_doc = frappe.model.get_new_doc('Sales Invoice');
			SI_doc.service_type = 'Delivery';
			frappe.set_route('Form', 'Sales Invoice', SI_doc.name);
			
		},
		
		b_applications: function (frm) {
			var SI_doc = frappe.model.get_new_doc('Sales Invoice');
			SI_doc.service_type = 'Application';
			frappe.set_route('Form', 'Sales Invoice', SI_doc.name);
		},
		

		b_daily_close: function (frm) {
			frappe.set_route("List", "POS Closing Voucher");
		},
		
		
		b_tables: function (frm) {
			frappe.set_route("List", "Restaurant Table");
		},
		
		
		b_options: function (frm) {
			frappe.set_route("List", "Product Options");
		},
	
});