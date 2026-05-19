/**
 * Site Kit by Google, Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface WCProduct {
	id?: number;
	name?: string;
	price?: string | number;
	variation?: string;
	quantity?: number;
	categories?: Array< { name: string } >;
	[ key: string ]: unknown;
}

/* eslint-disable camelcase */
interface WCPurchase {
	id?: string | number;
	totals?: {
		total_price?: string | number;
		currency_code?: string;
		shipping_total?: number;
		tax_total?: number;
	};
	items?: WCProduct[];
	user_data?: unknown;
}

interface WCData {
	currency?: string;
	products?: WCProduct[];
	purchase?: WCPurchase;
	add_to_cart?: WCProduct;
	eventsToTrack?: string[];
}

interface WCEventData {
	value: number;
	currency: string | undefined;
	items: Record< string, unknown >[];
	transaction_id?: string | number;
	shipping?: number;
	tax?: number;
	user_data?: unknown;
}
/* eslint-enable camelcase */

( ( jQuery: typeof global.jQuery ) => {
	if ( ! jQuery ) {
		return;
	}

	const {
		currency: globalCurrency,
		products: globalProducts,
		purchase,
		add_to_cart: addToCart,
		eventsToTrack,
	} = ( global._googlesitekit?.wcdata as WCData | undefined ) || {};
	const canTrackAddToCart = eventsToTrack?.includes( 'add_to_cart' );
	const canTrackPurchase = eventsToTrack?.includes( 'purchase' );

	if ( addToCart && canTrackAddToCart ) {
		const { price } = addToCart;

		const eventData = formatEventData( price, globalCurrency, addToCart );

		global._googlesitekit?.gtagEvent?.( 'add_to_cart', eventData );
	}

	if ( purchase && canTrackPurchase ) {
		const { id, totals, items, user_data: userData } = purchase;

		const eventData = formatEventData(
			totals?.total_price,
			totals?.currency_code,
			items,
			id,
			totals?.shipping_total,
			totals?.tax_total
		);

		// User data is already normalized from WooCommerce.php.
		if ( global._googlesitekit?.gtagUserData && userData ) {
			eventData.user_data = userData;
		}

		global._googlesitekit?.gtagEvent?.( 'purchase', eventData );
	}

	const $body = jQuery( 'body' );

	if ( canTrackAddToCart ) {
		$body.on( 'added_to_cart', ( ...handlerArgs: unknown[] ) => {
			const $button = handlerArgs[ 3 ] as
				| {
						jquery?: string;
						data( name: string ): unknown;
				  }
				| undefined;
			// Return early if $button is not a valid jQuery element instance.
			// This can happen when WooCommerce is customized by themes or third-party integrations.
			if ( ! $button?.jquery ) {
				return;
			}

			const productID = parseInt(
				String( $button.data( 'product_id' ) ),
				10
			);

			if ( ! productID ) {
				return;
			}

			const productData: WCProduct =
				globalProducts?.find(
					( product ) => product?.id === productID
				) || {};
			const { price } = productData;

			const eventData = formatEventData(
				price,
				globalCurrency,
				productData
			);
			global._googlesitekit?.gtagEvent?.( 'add_to_cart', eventData );
		} );

		jQuery(
			'.products-block-post-template .product, .wc-block-product-template .product'
		).each( function ( this: unknown ) {
			const $productCard = jQuery( this );
			const productID = parseInt(
				String(
					$productCard
						.find( '[data-product_id]' )
						.attr( 'data-product_id' ) || ''
				),
				10
			);

			if ( ! productID ) {
				return;
			}

			$productCard.on( 'click', ( ...clickArgs: unknown[] ) => {
				const event = clickArgs[ 0 ] as { target: unknown };
				const $target = jQuery( event.target );
				const $button = $target.closest(
					'.wc-block-components-product-button [data-product_id]'
				);

				const isAddToCartButton =
					$button.length &&
					$button.hasClass( 'add_to_cart_button' ) &&
					! $button.hasClass( 'product_type_variable' );

				if ( ! isAddToCartButton ) {
					return;
				}

				const productData: WCProduct =
					globalProducts?.find(
						( product ) => product?.id === productID
					) || {};
				const { price } = productData;

				const eventData = formatEventData(
					price,
					globalCurrency,
					productData
				);

				global._googlesitekit?.gtagEvent?.( 'add_to_cart', eventData );
			} );
		} );
	}

	function formatEventData(
		value: string | number | undefined,
		currency: string | undefined,
		products: WCProduct | WCProduct[] | undefined,
		transactionID: string | number | null | undefined = null,
		shipping: number | null | undefined = null,
		tax: number | null | undefined = null
	) {
		const formattedData: WCEventData = {
			value: formatPrice( value ),
			currency,
			items: [],
		};

		if ( transactionID ) {
			formattedData.transaction_id = transactionID;
		}

		// Shipping can be 0, if only check if shipping is not empty value
		// this will be omitted.
		if ( typeof shipping === 'number' ) {
			formattedData.shipping = shipping;
		}

		// Tax can be 0, if only check if shipping is not empty value
		// this will be omitted.
		if ( typeof tax === 'number' ) {
			formattedData.tax = tax;
		}

		if ( Array.isArray( products ) && products.length ) {
			for ( const product of products ) {
				formattedData.items.push( formatProductData( product ) );
			}
		} else if ( products && ! Array.isArray( products ) && products.id ) {
			formattedData.items = [ formatProductData( products ) ];
		}

		return formattedData;
	}

	function formatProductData(
		product: WCProduct
	): Record< string, unknown > {
		const { id, name, price, variation, quantity, categories } = product;

		const mappedItem: Record< string, unknown > = {
			item_id: id,
			item_name: name,
			price: formatPrice( price ),
		};

		if ( quantity ) {
			mappedItem.quantity = quantity;
		}

		if ( variation ) {
			mappedItem.item_variant = variation;
		}

		if ( categories && categories?.length ) {
			let categoryIndex = 1;
			for ( const category of categories ) {
				mappedItem[
					categoryIndex > 1
						? `item_category${ categoryIndex }`
						: 'item_category'
				] = category.name;

				categoryIndex++;
			}
		}

		return mappedItem;
	}

	/**
	 * Returns the price of a product formatted with decimal places if necessary.
	 *
	 * @since 1.158.0
	 *
	 * @param {string} price                 The price to parse.
	 * @param {number} [currencyMinorUnit=2] The number decimals to show in the currency.
	 * @return {number} The price of the product with decimals.
	 */
	function formatPrice(
		price: string | number | undefined,
		currencyMinorUnit = 2
	) {
		return parseInt( String( price ?? '0' ), 10 ) / 10 ** currencyMinorUnit;
	}
} )( global.jQuery );
