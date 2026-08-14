/**
 * WooCommerce conversion event provider tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Builds a product in the shape `get_formatted_product()` writes into the page.
 *
 * @since n.e.x.t
 *
 * @param {number} price The price in minor units, such as `1234` for 12.34.
 * @return {Object} A product, shaped the way `get_formatted_product()` shapes one.
 */
function createProduct( price ) {
	return {
		id: 42,
		name: 'Site Kit T-Shirt',
		categories: [ { name: 'Clothing' } ],
		price,
		quantity: 1,
	};
}

/**
 * Builds an order in the shape `get_formatted_order()` writes into the order-received page.
 *
 * @since n.e.x.t
 *
 * @param {number} price The order total and its one item's price, both in minor units.
 * @return {Object} An order, shaped the way `get_formatted_order()` shapes one.
 */
function createOrder( price ) {
	return {
		id: 99,
		affiliation: 'Test Store',
		totals: {
			currency_code: 'USD',
			tax_total: 0,
			shipping_total: 0,
			total_price: price,
		},
		items: [ createProduct( price ) ],
	};
}

/**
 * Loads the WooCommerce event provider script and returns the mock that caught
 * its events.
 *
 * The script reads `global._googlesitekit` once, as it loads, so every case
 * imports the module again.
 *
 * @since n.e.x.t
 *
 * @param {Object} wcdata The page data, as `window._googlesitekit.wcdata`.
 * @return {Function} The `gtagEvent` mock, with one call per event the script sent.
 */
async function loadEventScript( wcdata ) {
	const gtagEvent = jest.fn();

	// The script returns at once when `jQuery` is missing, so every case needs this fake.
	global.jQuery = () => ( { on: jest.fn(), each: jest.fn() } );
	global._googlesitekit = { gtagEvent, wcdata };

	await import( './woocommerce' );

	return gtagEvent;
}

describe( 'WooCommerce conversion event provider', () => {
	afterEach( () => {
		delete global.jQuery;
		delete global._googlesitekit;
		jest.resetModules();
	} );

	// `price` is what the page holds, already multiplied into minor units.
	const decimalPlaceCases = [
		[ 'four decimals', 4, 123456, 12.3456 ],
		[ 'no decimals', 0, 1234, 1234 ],
		[ 'two decimals, the WooCommerce default', 2, 4999, 49.99 ],
	];

	it.each( decimalPlaceCases )(
		'should send an `add_to_cart` value and item price when the store keeps prices to %s',
		async ( _caseName, currencyMinorUnit, price, expectedPrice ) => {
			const gtagEvent = await loadEventScript( {
				currency: 'USD',
				currencyMinorUnit,
				eventsToTrack: [ 'add_to_cart', 'purchase' ],
				add_to_cart: createProduct( price ),
			} );

			expect( gtagEvent ).toHaveBeenCalledWith( 'add_to_cart', {
				value: expectedPrice,
				currency: 'USD',
				items: [
					{
						item_id: 42,
						item_name: 'Site Kit T-Shirt',
						item_category: 'Clothing',
						price: expectedPrice,
						quantity: 1,
					},
				],
				googlesitekit_event_provider: 'woocommerce',
			} );
			expect( gtagEvent ).toHaveBeenCalledTimes( 1 );
		}
	);

	it.each( decimalPlaceCases )(
		'should send a `purchase` value and item price when the store keeps prices to %s',
		async ( _caseName, currencyMinorUnit, price, expectedPrice ) => {
			const gtagEvent = await loadEventScript( {
				currency: 'USD',
				currencyMinorUnit,
				eventsToTrack: [ 'add_to_cart', 'purchase' ],
				purchase: createOrder( price ),
			} );

			expect( gtagEvent ).toHaveBeenCalledWith( 'purchase', {
				value: expectedPrice,
				currency: 'USD',
				transaction_id: 99,
				shipping: 0,
				tax: 0,
				items: [
					{
						item_id: 42,
						item_name: 'Site Kit T-Shirt',
						item_category: 'Clothing',
						price: expectedPrice,
						quantity: 1,
					},
				],
				googlesitekit_event_provider: 'woocommerce',
			} );
			expect( gtagEvent ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'should send an `add_to_cart` value at two decimals when the page sends no `currencyMinorUnit`', async () => {
		const gtagEvent = await loadEventScript( {
			currency: 'USD',
			eventsToTrack: [ 'add_to_cart', 'purchase' ],
			add_to_cart: createProduct( 4999 ),
		} );

		expect( gtagEvent ).toHaveBeenCalledWith(
			'add_to_cart',
			expect.objectContaining( { value: 49.99 } )
		);
		expect( gtagEvent ).toHaveBeenCalledTimes( 1 );
	} );
} );
