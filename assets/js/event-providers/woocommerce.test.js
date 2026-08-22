/**
 * WooCommerce event provider script tests.
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
 * Creates a product, shaped the way `get_formatted_product()` writes it into
 * the page.
 *
 * @since n.e.x.t
 *
 * @param {number} price The price in minor units, such as 1234 for 12.34.
 * @return {Object} A product for `window._googlesitekit.wcdata`.
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
 * Creates an order holding a single product, shaped the way
 * `get_formatted_order()` writes it into the order-received page.
 *
 * @since n.e.x.t
 *
 * @param {number} price    The order total and the price of its one product, both in minor units.
 * @param {number} shipping The shipping total in minor units.
 * @param {number} tax      The tax total in minor units.
 * @return {Object} An order for `window._googlesitekit.wcdata`.
 */
function createOrder( price, shipping = 0, tax = 0 ) {
	return {
		id: 99,
		affiliation: 'Test Store',
		totals: {
			currency_code: 'USD',
			tax_total: tax,
			shipping_total: shipping,
			total_price: price,
		},
		items: [ createProduct( price ) ],
	};
}

/**
 * Runs the event provider script over one set of page data.
 *
 * The script reads `global._googlesitekit` as it loads, and only then, so each
 * case has to import the module again.
 *
 * @since n.e.x.t
 *
 * @param {Object} wcdata     The page data, as `window._googlesitekit.wcdata`.
 * @param {Object} [handlers] An object that receives every handler the script binds to `body`, keyed by event name.
 * @return {Function} The `gtagEvent` mock, holding one call per event the script sent.
 */
async function loadEventScript( wcdata, handlers = {} ) {
	const gtagEvent = jest.fn();

	// The script does nothing when `jQuery` is missing, so this fake has to exist
	// before the import below.
	global.jQuery = () => ( {
		on: ( eventName, handler ) => {
			handlers[ eventName ] = handler;
		},
		each: jest.fn(),
	} );
	global._googlesitekit = { gtagEvent, wcdata };

	await import( './woocommerce' );

	return gtagEvent;
}

describe( 'WooCommerce event provider', () => {
	afterEach( () => {
		delete global.jQuery;
		delete global._googlesitekit;
		jest.resetModules();
	} );

	// Each row is the store's decimal places, the price the page holds in minor
	// units, and the value the script should send.
	const decimalPlaceCases = [
		[ 'four decimal places', 4, 123456, 12.3456 ],
		[ 'zero decimal places', 0, 1234, 1234 ],
		[ 'two decimal places, the WooCommerce default', 2, 4999, 49.99 ],
	];

	it.each( decimalPlaceCases )(
		'should send the `add_to_cart` value and item price for a store set to %s',
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
		'should send the `purchase` value and item price for a store set to %s',
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

	// Each row is the store's decimal places, the shipping and tax in minor
	// units, and the amounts the script should send.
	const shippingAndTaxCases = [
		[ 'shipping and tax', 2, 500, 250, 5, 2.5 ],
		[ 'zero decimal places', 0, 5, 3, 5, 3 ],
	];

	it.each( shippingAndTaxCases )(
		'should send the `purchase` shipping and tax for a store set to %s',
		async (
			_caseName,
			currencyMinorUnit,
			shippingMinor,
			taxMinor,
			expectedShipping,
			expectedTax
		) => {
			const gtagEvent = await loadEventScript( {
				currency: 'USD',
				currencyMinorUnit,
				eventsToTrack: [ 'add_to_cart', 'purchase' ],
				purchase: createOrder( 5000, shippingMinor, taxMinor ),
			} );

			expect( gtagEvent ).toHaveBeenCalledWith(
				'purchase',
				expect.objectContaining( {
					shipping: expectedShipping,
					tax: expectedTax,
				} )
			);
			expect( gtagEvent ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'should fall back to two decimal places when the page data has no `currencyMinorUnit`', async () => {
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

	it( "should send the `add_to_cart` value at the store's decimal places when jQuery reports `added_to_cart`", async () => {
		const handlers = {};
		const gtagEvent = await loadEventScript(
			{
				currency: 'USD',
				currencyMinorUnit: 4,
				eventsToTrack: [ 'add_to_cart', 'purchase' ],
				products: [ createProduct( 123456 ) ],
			},
			handlers
		);

		expect( gtagEvent ).not.toHaveBeenCalled();

		handlers.added_to_cart( {}, {}, '', {
			jquery: '3.7.1',
			data: () => 42,
		} );

		expect( gtagEvent ).toHaveBeenCalledWith( 'add_to_cart', {
			value: 12.3456,
			currency: 'USD',
			items: [
				{
					item_id: 42,
					item_name: 'Site Kit T-Shirt',
					item_category: 'Clothing',
					price: 12.3456,
					quantity: 1,
				},
			],
			googlesitekit_event_provider: 'woocommerce',
		} );
		expect( gtagEvent ).toHaveBeenCalledTimes( 1 );
	} );
} );
