// Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt
frappe.ui.form.on('Restaurant Order Entry', {

    setup: function(frm) {

        //frappe.show_alert({message: __("setup" ), indicator: 'green'});
        let get_item_query = () => {
            return {
                query: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.item_query_restaurant',
                filters: {
                    'table': frm.doc.restaurant_table
                }
            };
        };
        frm.set_query('item', 'items', get_item_query);
        frm.set_query('add_item', get_item_query);
    },
	
    onload: function(frm) {
        frappe.show_alert({message: __("onload " ), indicator: 'green'});
		//frm.events.onload_post_render(frm);


    },

    onload_post_render: function(frm) {
        frappe.show_alert({message: __("onload_post_render " ), indicator: 'green'});
		
        /*if (!frm.item_selector) {
            frm.item_selector = new erpnext.ItemSelector({
                frm: frm,
                item_field: 'item',
                item_query: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.item_query_restaurant',
                get_filters: () => {
                    return {
                        table: frm.doc.restaurant_table
                    };
                }
            });
        }*/
		let $input = frm.get_field('add_item').$input;
        $input.on('keyup', function(e) {
            if (e.which === 13) {
                if (frm.clear_item_timeout) {
                    clearTimeout(frm.clear_item_timeout);
                }

                // clear the item input so user can enter a new item
                frm.clear_item_timeout = setTimeout(() => {
                    frm.set_value('add_item', '');
                }, 500);

                let item = $input.val();

                if (!item) return;

                var added = false;
                (frm.doc.items || []).forEach((d) => {
                    if (d.item === item) {
                        d.qty += 1;
                        added = true;
                    }
                });

                return frappe.run_serially([
                    () => {
                        if (!added) {
                            return frm.add_child('items', {
                                item: item,
                                qty: 1
                            });
                        }
                    },
                    () => frm.get_field("items").refresh()
                ]);
            }
        });

		//mohamed abdelaleem

		let $input_rt = frm.get_field('restaurant_table').$input;
		$input_rt.on('keyup', function(e) {
			//frappe.show_alert({message: __(" $input_s.val(); " +$input_s.val() ), indicator: 'green'});
			if (e.which === 13) {
					if (frm.doc.restaurant_table) {
						frm.get_field('add_item_s').$input.focus();
					}
			}
		});


		let $input_s = frm.get_field('add_item_s').$input;
		$input_s.on('keyup', function(e) {
			//frappe.show_alert({message: __(" $input_s.val(); " +$input_s.val() ), indicator: 'green'});

			if (e.which === 13) {
			    if (frm.clear_item_timeout) {
                    clearTimeout(frm.clear_item_timeout);
                }

                // clear the item input so user can enter a new item
                frm.clear_item_timeout = setTimeout(() => {
                    frm.set_value('add_item_s');
                }, 1);

                let item = $input_s.val();
				item = item.toUpperCase();
				
				if (item.length == 1) {
					item = '0'+item;
					
				};
				if (item.charAt(0) != 'D') {
					item = 'D'+item;
					
				};
				if (!item) return;

				var item_found = true;
				frappe.call({
					method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.get_item_name',
					args: {
						item: item
					},
					callback: (r) => {
						if(!r.message) {
						 frappe.utils.play_sound('alert');
						 //frappe.show_alert({message: __("Item <b>  ( "    + item + "  ) </b> doesn't exist " ), indicator: 'red'});

						 item_found = false;
						 return;
						} else  {
							//frappe.show_alert({message: __(" r.message " +r.message), indicator: 'green'});
							var added = false;
							(frm.doc.items || []).forEach((d) => {
								if (d.item === item) {
									d.qty += 1;
									added = true;
								}
							});

							return frappe.run_serially([
								() => {
									if (!added) {
										return frm.add_child('items', {
											item: item,
											description: r.message,
											qty: 1
										});
									}
									},
								() => frm.get_field("items").refresh()
							]);
							frappe.show_alert({message: __("succeeded : " +r.message ), indicator: 'green'});
						}
					}
				});

			}
		});
		//mohamed abdelaleem
		
    },

//button fields
	b_move_dish: function (frm) {
		
	var me = this;
	let selected_encounter = '';
	var dialog = new frappe.ui.Dialog({
		title: __("Move selected dishes to table"),
		fields:[
			{ fieldtype: 'Link', options: 'Restaurant Table', label: 'New Table', fieldname: "new_table", reqd: true,
				description:'Selected items will be moved from current table to the new one.',
				get_query: function(doc) {
					return {
						filters: { /*patient: dialog.get_value("new_table"), docstatus: 1*/ }
					};
				}
			},
			{ fieldtype: 'Section Break' },
			{ fieldtype: 'HTML', fieldname: 'results_area' }
		]
	});
	var $wrapper;
	var $results;
	var $placeholder;
		dialog.set_primary_action(__("Set"), function() {
			dialog.hide();
			//define to be deleted items
			var new_table = dialog.get_value("new_table");
			if (!new_table) return;
			if (new_table == frm.doc.restaurant_table) return;

			if (new_table) {
				var to_be_moved_items = [];
				(frm.doc.items || []).forEach((d) => {
					if (d.__checked) {
						//frappe.show_alert({ message: __("checke : " + d.item ),indicator: 'yellow'});
						to_be_moved_items.push(d);
					}
				});
				if (to_be_moved_items.length == 0) return;	//nothing to be moved
				//wip
				var new_table_invoice_exist = 0;
				frappe.call({
					method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.get_invoice',
					args: {
						table: new_table
					},
					callback: (r) => {
						if (to_be_moved_items.length == frm.doc.items.length ) {	
							//frappe.show_alert({ message: __("r.message.name  :  " + r.message.name),indicator: 'red'});
							if (r.message.name) {
								frappe.show_alert({ message: __("an invoice for the other table exisits " ),indicator: 'red'});
								frm.events.sync_move_items( frm, new_table, to_be_moved_items);
								frm.events.cancel_invoice( frm, frm.doc.last_sales_invoice);
								return frm.trigger('clear');
							} else {
								frappe.show_alert({ message: __("no  invoice for the other table, will change the invoice " ),indicator: 'red'});
								frm.events.change_invoice_table( frm, frm.doc.last_sales_invoice ,  new_table); // under testing
								return frm.trigger('clear');
							}
;
						} else {
							frappe.run_serially([
								() => 	{
										var tbl = frm.doc.items || [];
										var i = tbl.length;
										while (i--) {
											if(tbl[i].__checked){
												cur_frm.get_field("items").grid.grid_rows[i].remove();
												//frappe.show_alert({ message: __("removing : "+tbl[i].item ),indicator: 'red'});
											}
										}
								},
								() => 	frm.events.sync_move_items( frm, new_table, to_be_moved_items),
								() => 	frm.events.sync(frm),
							]);										
						}
					}
				})
				
			}
		});
		dialog.show();
	},
	
	b_clear: function (frm) {
		return frm.trigger('clear');
	},


	b_update: function (frm) {
		frm.events.sync(frm);
		return frm.events.set_restaurant_table_status(frm, "Ordered");

	},

	b_pos: function (frm) {
		frappe.run_serially([
            () => 	frm.events.sync(frm),
			() => 	frm.events.print_forms(frm,'POS', 'Sales Invoice'),
			() => 	frm.events.set_restaurant_table_status(frm, "Printed")
		]);
	},

	b_tables: function (frm) {
		frappe.set_route("List", "Restaurant Table");
	},

	b_options: function (frm) {
		frappe.set_route("List", "Product Options");
	},

	b_bill: function (frm) {
		frm.trigger('make_invoice');
		return frm.events.set_restaurant_table_status(frm, "Empty");
	},

	b_daily_close: function (frm) {
		frappe.set_route("List", "POS Closing Voucher");
	},

	
	b_send_to_kitchen: function (frm) {
			frappe.run_serially([
                    () => 	frm.events.sync(frm),
					() => 	frm.events.restaurant_table(frm),
					() => 	{
							frm.doc.kitchen_print_flag	= 0;
							frm.doc.beverage_print_flag	= 0;
							},
					() => 	frm.events.check_sent_to_printer(frm),
					() => 	{if (frm.doc.kitchen_print_flag == 0 && frm.doc.beverage_print_flag  == 0) return},
                    () => 	frm.events.sync(frm),
					() => 	{if (frm.doc.kitchen_print_flag == 1 || frm.doc.beverage_print_flag  == 1) frm.events.restaurant_table(frm)},
					() => 	{if (frm.doc.kitchen_print_flag == 1 ) frm.events.print_forms(frm,'Kitchen', 'Sales Invoice')},
					() => 	{if (frm.doc.beverage_print_flag  == 1) frm.events.print_forms(frm,'Beverage', 'Sales Invoice')},
					() => 	{if (frm.doc.kitchen_print_flag == 1) frm.events.set_sent_to_printer (frm,'Kitchen')},
					() =>	{if (frm.doc.beverage_print_flag  == 1) frm.events.set_sent_to_printer (frm,'Beverage')},
					() =>	{if (frm.doc.kitchen_print_flag == 1 || frm.doc.beverage_print_flag  == 1) frm.events.sync(frm)},
					() =>	{if (frm.doc.kitchen_print_flag == 1 || frm.doc.beverage_print_flag  == 1) frm.events.restaurant_table(frm)},
					() =>	{if (frm.doc.kitchen_print_flag == 1 || frm.doc.beverage_print_flag  == 1) frm.events.set_restaurant_table_status(frm, "Kitchen")}
					//() =>	frm.refresh()
			]); 
	},

//buttons fields


    refresh: function(frm) {
		frm.disable_save();
		// add assigned by me


		frm.get_field('restaurant_table').$input.focus();
		
		cur_frm.page.add_menu_item(__("Send to Kitchen"), function() {
			return frm.trigger('b_send_to_kitchen');
		});
		/*cur_frm.page.add_action_item(__("Send to Kitchen"), function() {
			return frm.trigger('b_send_to_kitchen');
		});*/
		
		frm.page.add_sidebar_item(__("Send to Kitchen"), function() {
			return frm.trigger('b_send_to_kitchen');
		});



        /*frm.add_custom_button(__('Update'), () => {
			frm.trigger('b_update');
        });
		

        frm.add_custom_button(__('Send to Kitchen'), () => {
			frm.trigger('b_send_to_kitchen');
        });


        frm.add_custom_button(__('POS'), () => {
			frm.trigger('b_pos');
        });
		
		
		
        frm.add_custom_button(__('Clear'), () => {
            return frm.trigger('clear');
        });
        frm.add_custom_button(__('Bill'), () => {
            frm.trigger('b_bill');
        });*/
    },
	
    clear: function(frm) {
        frm.doc.add_item = '';
        frm.doc.grand_total = 0;
        frm.doc.items = [];
        frm.doc.last_sales_invoice = '';
		frm.doc.ktx_key_posting_time = '';
		frm.doc.restaurant_table = '',
        frm.refresh();
        frm.get_field('restaurant_table').$input.focus();
    },

	set_ktx_key_posting_time: function(frm) {
		//frappe.show_alert({ message: __("before : " +frm.doc.ktx_key_posting_time),indicator: 'red'});
		if (!frm.doc.ktx_key_posting_time) {
			frm.set_value("ktx_key_posting_time", frappe.session.user+":" + frappe.datetime.now_datetime());
			frm.refresh_field("ktx_key_posting_time")
			//frappe.show_alert({ message: __("after : " +frm.doc.ktx_key_posting_time),indicator: 'red'});
		}
    },

    restaurant_table: function(frm) {
        // select the open sales order items for this table
        if (!frm.doc.restaurant_table) {return;};
        return frappe.call({
            method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.get_invoice',
            args: {
                table: frm.doc.restaurant_table
            },
            callback: (r) => {
                frm.events.set_invoice_items(frm, r);
				frm.get_field('add_item_s').$input.focus();		//mohamed
                if (!r.name) frm.events.set_ktx_key_posting_time(frm);
            }
        });
    },

    get_invoice: function(frm, table) {		//mohamed to get invoice of other trables
        // select the open sales order items for this table
        if (!table) {return;};
        frappe.call({
            method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.get_invoice',
            args: {
                table: table
            },
            callback: (r) => {
                return r.message.total_qty; 
				//if (!r.name) frm.events.set_ktx_key_posting_time(frm);
            }
        });
    },


	
    print_forms: function(frm,action_type, doctype) {
		//frappe.show_alert({message: __('sync1 Printed...'+action_type+frappe.session.user),indicator: 'green'});
		frappe.call({
                        method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.ktx_printt_via_printnode',
                        args: {
                            user: frappe.session.user,
                            doctype: doctype,
                            docname: frm.doc.last_sales_invoice,
                            action_type: action_type
                        },
                        callback: function(r) {
                            frappe.show_alert({message: __(action_type + '  Printed...'),indicator: 'green'});
                        }
                    });
    },


	validate: function(frm) {		
		// Mohamed abdelaleem
        if (!frm.doc.ktx_key_posting_time) frm.events.set_ktx_key_posting_time(frm);		
	},


	sync_move_items: function(frm,  new_table, to_be_moved_items ) {
		var ktx_key_posting_time = frappe.session.user+ " : " + frappe.datetime.now_datetime();
		//frappe.show_alert({ message: __("in frm.events.sync_add_items : "+frm.doc.name+ "     :    "+to_be_moved_items.length +" , "+ new_table),indicator: 'yellow'});
		return frappe.call({
            method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.sync_move_items',
            args: {
                new_table: new_table,
                ktx_key_posting_time: ktx_key_posting_time,
                items: to_be_moved_items
            },
            callback: function(r) {
				frappe.show_alert({message: __("Items Moved  " ), indicator: 'green'});
				//frm.events.set_invoice_items(frm, r); 
            }
        });
	},

    sync: function(frm) {
		frm.get_field('add_item_s').$input.focus();
		return frappe.call({
            method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.sync',
            args: {
                ktx_key_posting_time: frm.doc.ktx_key_posting_time,
                table: frm.doc.restaurant_table,
                items: frm.doc.items
            },
            callback: function(r) {
				frm.events.set_invoice_items(frm, r); 
                /*frappe.show_alert({message: __('Saved'), indicator: 'green'});*/
				//Mohamed
				//frm.set_value('last_sales_invoice', r.message.name);
				//Mohamed
            }
        });
    },


   change_invoice_table: function(frm, invoice_name, new_table) {
		frappe.call({
			method: "frappe.client.set_value",
			args: {
				doctype: "Sales Invoice",
				name: invoice_name,
				fieldname: "restaurant_table",
				value: new_table
			},
			callback: function(r) {
				frappe.show_alert({ message: __("Invoice table is changed"),indicator: 'green'});
				
			}
		});
    },

   cancel_invoice: function(frm, invoice_name) {
		frappe.show_alert({ message: __("Invoice is cancelled : "+invoice_name),indicator: 'green'});
		frappe.call({
			method: "erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.cancel_invoice",
			args: {
				invoice_name: invoice_name,
			},
			callback: function(r) {
				frappe.show_alert({ message: __("Invoice is cancelled : "+invoice_name),indicator: 'green'});
				
			}
		});
    },



   set_restaurant_table_status: function(frm, table_status) {
		//frappe.show_alert({ message: __("Table status is set "+frm.doc.restaurant_table),indicator: 'green'}); 
		frappe.call({
			method: "frappe.client.set_value",
			args: {
				doctype: "Restaurant Table",
				name: frm.doc.restaurant_table,
				fieldname: "status",
				value: table_status
			},
			callback: function(r) {
				//frappe.show_alert({ message: __("Table status is set"),indicator: 'green'});
			}
		});
		
		
    },

		
    
    set_sent_to_printer: function(frm, set_action_type) {
        // Mohamed abdelaleem
//        frappe.show_alert({ message: __('Inside ....'),indicator: 'red'});
        (frm.doc.items || []).forEach((d) => {
			if (d.item_group_type == set_action_type ) {
				d.sent_to_printer = 1;
				//frappe.show_alert({ message: __(d.item+" seting_sent_to_printer : "+d.item_group_type +"--"+ set_action_type ),indicator: 'yellow'});
				//refresh fields here
			}
		});
		
        //Mohamed Abdelaleem
    },


    check_sent_to_printer: function(frm) {
        // Mohamed abdelaleem
		frm.doc.kitchen_print_flag	= 0;
		frm.doc.beverage_print_flag	= 0;
        (frm.doc.items || []).forEach((d) => {
			//frappe.show_alert({ message: __("checking "+ d.item + ","+ d.sent_to_printer+","+d.item_group_type),indicator: 'red'});
			if ( d.sent_to_printer == 0 && d.item_group_type == "Kitchen" ) {
				frm.doc.kitchen_print_flag = 1;
			}
			if ( d.sent_to_printer == 0 && d.item_group_type == "Beverage" ) {
				frm.doc.beverage_print_flag = 1;
			}
		});
        //Mohamed Abdelaleem
    },



    make_invoice: function(frm) {
        frm.events.sync(frm).then(() => {
            frappe.prompt([{
                        fieldname: 'customer',
                        label: __('Customer'),
                        fieldtype: 'Link',
                        reqd: 1,
                        options: 'Customer',
                        'default': frm.invoice.customer
                    },
                    {
                        fieldname: 'mode_of_payment',
                        label: __('Mode of Payment'),
                        fieldtype: 'Link',
                        reqd: 1,
                        options: 'Mode of Payment',
                        'default': frm.mode_of_payment || ''
                    }
                ], (data) => {
                    // cache this for next entry
                    frm.mode_of_payment = data.mode_of_payment;
                    return frappe.call({
                        method: 'erpnext.restaurant.doctype.restaurant_order_entry.restaurant_order_entry.make_invoice',
                        args: {
                            table: frm.doc.restaurant_table,
                            customer: data.customer,
                            mode_of_payment: data.mode_of_payment
                        },
                        callback: (r) => {
                            frm.set_value('last_sales_invoice', r.message);
                            frm.trigger('clear');
                        }
                    });
                },
                __("Select Customer"));
        });
    },




    set_invoice_items: function(frm, r) {
		//load invoice in screen
        let invoice = r.message;
		frm.doc.ktx_key_posting_time = invoice.ktx_key_posting_time; 
        frm.doc.items = [];
        (invoice.items || []).forEach((d) => {
            frm.add_child('items', {
                item: d.item_code,
				description: d.item_name,
                item_group_type: d.item_group_type,
                product_options: d.product_options,
                qty: d.qty,
                rate: d.rate,
				sent_to_printer: d.sent_to_printer,
				notes: d.notes,
                //item_group_type: action_type Mohamed stopped it
            });

        });
        //frappe.show_alert({ message: __('Invoice Loaded'),indicator: 'green'});
        //frm.set_value('grand_total', invoice.grand_total); mohamed for rounding_adjustment
		var grand_total = 0.0;
		if (invoice.rounding_adjustment && invoice.rounded_total) {grand_total = invoice.rounded_total; } else {grand_total = invoice.grand_total;};
        frm.set_value('grand_total', grand_total);
        frm.set_value('last_sales_invoice', invoice.name);
        frm.invoice = invoice;
        frm.refresh();
    }
});