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

( ( jQuery ) => {
	if ( ! jQuery ) {
		return;
	}

	type WcProduct = {
		id?: number;
		name?: string;
		price?: string;
		variation?: string;
		quantity?: number;
		categories?: Array< { name: string } >;
	};
	type WcPurchase = {
		id?: string;
		/* eslint-disable camelcase */
		totals: {
			total_price: string;
			currency_code: string;
			shipping_total?: number;
			tax_total?: number;
		};
		/* eslint-enable camelcase */
		items?: WcProduct[];
		// eslint-disable-next-line camelcase
		user_data?: unknown;
	};
	type WcData = {
		currency?: string;
		products?: WcProduct[];
		purchase?: WcPurchase;
		// eslint-disable-next-line camelcase
		add_to_cart?: WcProduct;
		eventsToTrack?: string[];
	};

	const {
		currency: globalCurrency,
		products: globalProducts,
		purchase,
		add_to_cart: addToCart,
		eventsToTrack,
	} = ( global._googlesitekit?.wcdata ?? {} ) as WcData;
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
			totals.total_price,
			totals.currency_code,
			items,
			id ?? null,
			totals.shipping_total ?? null,
			totals.tax_total ?? null
		);

		// User data is already normalized from WooCommerce.php.
		if ( global._googlesitekit?.gtagUserData && userData ) {
			eventData.user_data = userData;
		}

		global._googlesitekit?.gtagEvent?.( 'purchase', eventData );
	}

	const $body = jQuery( 'body' );

	if ( canTrackAddToCart ) {
		$body.on(
			'added_to_cart',
			(
				_event: unknown,
				_fragments: unknown,
				_cartHash: unknown,
				$button:
					| { jquery?: string; data: ( key: string ) => unknown }
					| null
					| undefined
			) => {
				// Return early if $button is not a valid jQuery element instance.
				// This can happen when WooCommerce is customized by themes or third-party integrations.
				if ( ! $button?.jquery ) {
					return;
				}

				const productID = parseInt(
					$button.data( 'product_id' ) as string,
					10
				);

				if ( ! productID ) {
					return;
				}

				const productData =
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
			}
		);

		jQuery(
			'.products-block-post-template .product, .wc-block-product-template .product'
			// eslint-disable-next-line sitekit/acronym-case
		).each( function ( this: HTMLElement ) {
			const $productCard = jQuery( this );
			const productID = parseInt(
				$productCard
					.find( '[data-product_id]' )
					.attr( 'data-product_id' ),
				10
			);

			if ( ! productID ) {
				return;
			}

			$productCard.on( 'click', ( event: Event ) => {
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

				const productData =
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
		value: string | undefined,
		currency: string | undefined,
		products: WcProduct | WcProduct[] | undefined,
		transactionID: string | null = null,
		shipping: number | null = null,
		tax: number | null = null
	): Record< string, unknown > {
		const items: unknown[] = [];
		const formattedData: Record< string, unknown > = {
			value: formatPrice( value ),
			currency,
			items,
			googlesitekit_event_provider: 'woocommerce',
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

		if ( Array.isArray( products ) ) {
			for ( const product of products ) {
				items.push( formatProductData( product ) );
			}
		} else if ( products?.id ) {
			formattedData.items = [ formatProductData( products ) ];
		}

		return formattedData;
	}

	function formatProductData(
		product: WcProduct
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
		price: string | undefined,
		currencyMinorUnit = 2
	): number {
		return parseInt( price ?? '', 10 ) / 10 ** currencyMinorUnit;
	}
} )( global.jQuery );
