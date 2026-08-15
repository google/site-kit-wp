/**
 * WooCommerce event provider tests.
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
 * Internal dependencies
 */

// The IIFE in `./woocommerce` runs at require time and synchronously calls
// `gtagEvent` for the `add_to_cart` and `purchase` events it finds on
// `window._googlesitekit.wcdata`. Tests must set up that global and a
// jQuery stub before requiring the file.

const gtagEventCalls = [];

function setupGlobals( {
	currency = 'USD',
	currencyMinorUnit = 2,
	addToCart = null,
	purchase = null,
	products = [],
	eventsToTrack = [ 'add_to_cart', 'purchase' ],
} = {} ) {
	gtagEventCalls.length = 0;

	global._googlesitekit = {
		...global._googlesitekit,
		wcdata: {
			currency,
			currency_minor_unit: currencyMinorUnit,
			products,
			add_to_cart: addToCart,
			purchase,
			eventsToTrack,
		},
		gtagEvent: jest.fn( ( name, data ) => {
			gtagEventCalls.push( { name, data } );
		} ),
	};

	// Minimal jQuery stub — the WC provider only uses `body.on` and `.each`
	// against the products DOM, neither of which needs to fire in unit tests.
	global.jQuery = jest.fn( () => ( {
		on: jest.fn(),
		each: jest.fn(),
		find: jest.fn( () => ( { attr: () => null } ) ),
	} ) );
	global.jQuery.fn = global.jQuery;
}

describe( 'WooCommerce event provider', () => {
	beforeEach( () => {
		jest.resetModules();
	} );

	afterEach( () => {
		delete global._googlesitekit.wcdata;
		delete global.jQuery;
	} );

	describe( 'add_to_cart value formatting', () => {
		it( 'should divide by 100 when currency uses 2 decimal places', () => {
			setupGlobals( {
				currency: 'USD',
				currencyMinorUnit: 2,
				addToCart: {
					id: 1,
					name: 'Test Product',
					price: 25075,
				},
			} );

			require( './woocommerce' );

			expect( gtagEventCalls ).toHaveLength( 1 );
			expect( gtagEventCalls[ 0 ].name ).toBe( 'add_to_cart' );
			expect( gtagEventCalls[ 0 ].data.value ).toBe( 250.75 );
			expect( gtagEventCalls[ 0 ].data.items[ 0 ].price ).toBe( 250.75 );
		} );

		it( 'should divide by 10000 when currency uses 4 decimal places', () => {
			setupGlobals( {
				currency: 'BHD',
				currencyMinorUnit: 4,
				addToCart: {
					id: 2,
					name: 'High Precision Product',
					price: 12345,
				},
			} );

			require( './woocommerce' );

			expect( gtagEventCalls ).toHaveLength( 1 );
			expect( gtagEventCalls[ 0 ].name ).toBe( 'add_to_cart' );
			expect( gtagEventCalls[ 0 ].data.value ).toBe( 1.2345 );
			expect( gtagEventCalls[ 0 ].data.items[ 0 ].price ).toBe( 1.2345 );
		} );

		it( 'should pass the value through when currency uses 0 decimal places', () => {
			setupGlobals( {
				currency: 'JPY',
				currencyMinorUnit: 0,
				addToCart: {
					id: 3,
					name: 'Yen Product',
					price: 12345,
				},
			} );

			require( './woocommerce' );

			expect( gtagEventCalls[ 0 ].data.value ).toBe( 12345 );
			expect( gtagEventCalls[ 0 ].data.items[ 0 ].price ).toBe( 12345 );
		} );

		it( 'should divide by 1000 when currency uses 3 decimal places', () => {
			setupGlobals( {
				currency: 'KWD',
				currencyMinorUnit: 3,
				addToCart: {
					id: 4,
					name: 'KWD Product',
					price: 250750,
				},
			} );

			require( './woocommerce' );

			expect( gtagEventCalls[ 0 ].data.value ).toBe( 250.75 );
		} );
	} );

	describe( 'purchase value formatting', () => {
		const purchaseFixture = {
			id: 99,
			totals: {
				currency_code: 'USD',
				total_price: 25075,
				shipping_total: 500,
				tax_total: 200,
			},
			items: [
				{
					id: 1,
					name: 'Test Product',
					price: 12345,
					quantity: 2,
				},
			],
		};

		it( 'should divide purchase value by 100 with 2 decimal places', () => {
			setupGlobals( {
				currency: 'USD',
				currencyMinorUnit: 2,
				purchase: purchaseFixture,
			} );

			require( './woocommerce' );

			expect( gtagEventCalls[ 0 ].name ).toBe( 'purchase' );
			expect( gtagEventCalls[ 0 ].data.value ).toBe( 250.75 );
			expect( gtagEventCalls[ 0 ].data.transaction_id ).toBe( 99 );
			expect( gtagEventCalls[ 0 ].data.items[ 0 ].price ).toBe( 123.45 );
		} );

		it( 'should divide purchase value by 10000 with 4 decimal places', () => {
			setupGlobals( {
				currency: 'BHD',
				currencyMinorUnit: 4,
				purchase: {
					...purchaseFixture,
					totals: {
						...purchaseFixture.totals,
						total_price: 1234500,
					},
					items: [
						{
							id: 1,
							name: 'Test Product',
							price: 12345,
							quantity: 2,
						},
					],
				},
			} );

			require( './woocommerce' );

			expect( gtagEventCalls[ 0 ].name ).toBe( 'purchase' );
			expect( gtagEventCalls[ 0 ].data.value ).toBe( 123.45 );
			expect( gtagEventCalls[ 0 ].data.items[ 0 ].price ).toBe( 1.2345 );
		} );

		it( 'should not fire purchase event when eventsToTrack excludes it', () => {
			setupGlobals( {
				currency: 'USD',
				currencyMinorUnit: 2,
				purchase: purchaseFixture,
				eventsToTrack: [ 'add_to_cart' ],
			} );

			require( './woocommerce' );

			expect( gtagEventCalls ).toHaveLength( 0 );
		} );
	} );

	describe( 'fallback behavior', () => {
		it( 'should default to 2 decimal places when currency_minor_unit is missing from wcdata', () => {
			gtagEventCalls.length = 0;
			global._googlesitekit = {
				...global._googlesitekit,
				wcdata: {
					currency: 'USD',
					products: [],
					add_to_cart: { id: 1, name: 'X', price: 10000 },
					purchase: null,
					eventsToTrack: [ 'add_to_cart', 'purchase' ],
				},
				gtagEvent: jest.fn( ( name, data ) => {
					gtagEventCalls.push( { name, data } );
				} ),
			};
			global.jQuery = jest.fn( () => ( {
				on: jest.fn(),
				each: jest.fn(),
				find: jest.fn( () => ( { attr: () => null } ) ),
			} ) );
			global.jQuery.fn = global.jQuery;

			require( './woocommerce' );

			expect( gtagEventCalls[ 0 ].data.value ).toBe( 100 );
		} );
	} );
} );
