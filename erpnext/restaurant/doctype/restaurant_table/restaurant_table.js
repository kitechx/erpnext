// Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Restaurant Table', {
	refresh: function(frm) {
        frm.add_custom_button(__("Order"), function() {
			
			frappe.show_alert({message: __( "tabel:"+frm.doc.name), indicator: 'green'});
			var SI_doc = frappe.model.get_new_doc('Restaurant Order Entry');
			SI_doc.restaurant_table = frm.doc.name ;
			frappe.set_route('Form', 'Restaurant Order Entry', SI_doc.name);
			
			
			
			
			
		});
	}
	
	/*creat_an_order: function(frm) {
		//frappe.show_alert({message: __( frm.doc.name), indicator: 'green'});
		//var SI_doc = frappe.model.get_new_doc('Restaurant Order Entry');
		//SI_doc.restaurant_table = frm.doc.name ;
		//frappe.set_route('Form', 'Restaurant Order Entry', {'resturant_table':SI_doc.name});
	};*/
});
