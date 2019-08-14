# -*- coding: utf-8 -*-
# Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe, json
from frappe.model.document import Document
from frappe import _
from erpnext.controllers.queries import item_query



import datetime #mohamed abdelaleem
import json
import frappe
from frappe.utils.background_jobs import enqueue
from . import api
from frappe.utils import now_datetime, nowdate, to_timedelta





class RestaurantOrderEntry(Document):
	pass

####By Maysaa
@frappe.whitelist()
def ktx_printt_via_printnode( user,doctype, docname,action_type):
	from printnode_integration.api import printt_via_printnode
	kwargs = dict(
		user=user,
		doctype=doctype,	
		docname=docname,	
		action_type=action_type
		)
	printt_via_printnode(**kwargs)
	return "Printed"

@frappe.whitelist()
def get_item_group_type(item):
	item_group = frappe.get_value('Item', item,'item_group')
	grp_type = frappe.get_value('Item Group', item_group,'type')
	print item, item_group, grp_type
	return grp_type

@frappe.whitelist()
def get_item_name(item):
	item_name =  frappe.get_value('Item', item,'item_name')
	return item_name

@frappe.whitelist()
def cancel_invoice(invoice_name):
	frappe.msgprint(_('cancel_invoice '), indicator='red', alert=True)
	frappe.msgprint(_(invoice_name), indicator='red', alert=True)
	frappe.delete_doc('Sales Invoice Item', invoice_name, force=True, ignore_permissions=True)
	frappe.delete_doc('Sales Invoice', invoice_name, force=True, ignore_permissions=True)
	return invoice_name

@frappe.whitelist()
def get_invoice(table):
	'''returns the active invoice linked to the given table'''
	invoice_name = frappe.get_value('Sales Invoice', dict(restaurant_table = table, docstatus=0))
	restaurant, menu_name = get_restaurant_and_menu_name(table)
	if invoice_name:
		invoice = frappe.get_doc('Sales Invoice', invoice_name)
	else:
		invoice = frappe.new_doc('Sales Invoice')
		invoice.naming_series = frappe.db.get_value('Restaurant', restaurant, 'invoice_series_prefix')
		invoice.is_pos = 1
		default_customer = frappe.db.get_value('Restaurant', restaurant, 'default_customer')
		if not default_customer:
			frappe.throw(_('Please set default customer in Restaurant Settings'))
		invoice.customer = default_customer

	invoice.taxes_and_charges = frappe.db.get_value('Restaurant', restaurant, 'default_tax_template')
	invoice.selling_price_list = frappe.db.get_value('Price List', dict(restaurant_menu=menu_name, enabled=1))

	return invoice

@frappe.whitelist()
def sync(table, ktx_key_posting_time, items):
	'''Sync the sales order related to the table'''

	invoice = get_invoice(table)
	items = json.loads(items)      
	invoice.items = []
	invoice.restaurant_table = table
	invoice.ktx_key_posting_time = ktx_key_posting_time
	invoice.service_type = "Dine In"
	invoice.is_pos = 1

	for d in items:
		invoice.append('items', dict(
			item_code = d.get('item'),
			qty = d.get('qty'),
			item_group = d.get('item_group'),
			item_group_type = get_item_group_type(d.get('item')),
            product_options = d.get('product_options'),
            sent_to_printer = d.get('sent_to_printer'),
            notes = d.get('notes')
        ))
    # frappe.msgprint(_('Update Invoice 2'), indicator='green', alert=True),
	invoice.save()
	return invoice.as_dict()

@frappe.whitelist()
def sync_move_items(new_table, ktx_key_posting_time, items):
	'''Sync the sales  order related  to the table'''
	invoice = get_invoice(new_table)
	items = json.loads(items)
	invoice.is_pos = 1
    
#	if not invoice.items:
	if not invoice.total_qty:
		invoice.service_type = "Dine In"
		invoice.restaurant_table = new_table
		invoice.ktx_key_posting_time = ktx_key_posting_time
		invoice.is_pos = 1
		invoice.items = []
    

	for d in items:
				#frappe.msgprint(_(d.get('item')), indicator='red', alert=True)
				invoice.append('items', dict(
					item_code = d.get('item'),
					qty = d.get('qty'),
					item_group = d.get('item_group'),
					item_group_type = get_item_group_type(d.get('item')),
					product_options = d.get('product_options'),
					sent_to_printer = d.get('sent_to_printer'),
					notes = d.get('notes')
				))
                
	invoice.save()
	return invoice.as_dict()

@frappe.whitelist()
def make_invoice(table, customer, mode_of_payment):
	'''Make table based on Sales Order'''
	restaurant, menu = get_restaurant_and_menu_name(table)
	invoice = get_invoice(table)
	invoice.customer = customer
	invoice.restaurant = restaurant
	invoice.calculate_taxes_and_totals()
	#invoice.append('payments', dict(mode_of_payment=mode_of_payment, amount=invoice.grand_total))  mohamed
	grand_total = invoice.rounded_total if (invoice.rounding_adjustment and invoice.rounded_total) else invoice.grand_total
	invoice.append('payments', dict(mode_of_payment=mode_of_payment, amount=grand_total))
	invoice.save()
	invoice.submit()

	frappe.msgprint(_('Invoice Created'), indicator='green', alert=True)

	return invoice.name

def item_query_restaurant(doctype='Item', txt='', searchfield='name', start=0, page_len=20, filters=None, as_dict=False):
	'''Return items that are selected in active menu of the restaurant'''
	restaurant, menu = get_restaurant_and_menu_name(filters['table'])
	items = frappe.db.get_all('Restaurant Menu Item', ['item'], dict(parent = menu))
	del filters['table']
	filters['name'] = ('in', [d.item for d in items])

	return item_query('Item', txt, searchfield, start, page_len, filters, as_dict)

def get_restaurant_and_menu_name(table):
	if not table:
		frappe.throw(_('Please select a table'))

	restaurant = frappe.db.get_value('Restaurant Table', table, 'restaurant')
	menu = frappe.db.get_value('Restaurant', restaurant, 'active_menu')

	if not menu:
		frappe.throw(_('Please set an active menu for Restaurant {0}').format(restaurant))

	return restaurant, menu


@frappe.whitelist() 
def ktx_print_via_printnode( doctype, docname, docevent):
	if frappe.flags.in_import or frappe.flags.in_patch:
		return
	if not frappe.db.exists(doctype, docname):
		enqueue('printnode_integration.events.print_via_printnode', enqueue_after_commit=False, doctype=doctype, docname=docname, docevent=docevent)

	doc = frappe.get_doc(doctype, docname)
	ignore_flags = True
	
	if not ignore_flags:
		if doc.flags.on_import or doc.flags.ignore_print:
			return

	if not frappe.db.exists("Print Node Action", {"dt": doc.doctype, "print_on": docevent}):
		return

	for d in frappe.get_list("Print Node Action", ["name", "ensure_single_print", "allow_inline_batch", "batch_field"], {"dt": doc.doctype, "print_on": docevent}):
		if docevent == "Update" and d.ensure_single_print and frappe.db.exists("Print Job", d.name):
			continue
		if not d.allow_inline_batch:
			api.print_via_printnode(d.name, doctype=doc.doctype, docname=doc.name)
		else:
			if '.' in d.batch_field:
				table_field = d.batch_field.split('.')[0]
				reference_list = doc.get(table_field)
			else:
				reference_list = [doc]
			inline_field = d.batch_field.split('.')[-1]
			api.batch_print_via_printnode(d.name, map(lambda d: frappe._dict(docname=d.get(inline_field)), reference_list)) 
           
      
      
