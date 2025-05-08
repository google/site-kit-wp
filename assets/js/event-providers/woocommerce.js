/**
 * Site Kit by Google, Copyright 2024 Google LLC
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

( ( jQuery ) => {
	if ( ! jQuery ) {
		return;
	}

	const currency = global._googlesitekit.wcdata.currency;

	if ( global._googlesitekit.wcdata.add_to_cart ) {
		const { price } = global._googlesitekit.wcdata.add_to_cart;

		const eventData = formatEventData(
			price,
			currency,
			global._googlesitekit.wcdata.add_to_cart
		);

		global._googlesitekit?.gtagEvent?.( 'add_to_cart', eventData );
	}

	if ( global._googlesitekit.wcdata.purchase ) {
		const { id, totals, items } = global._googlesitekit.wcdata.purchase;

		const eventData = formatEventData(
			totals.total_price,
			totals.currency_code,
			items,
			id,
			totals.shipping_total,
			totals.tax_total
		);

		global._googlesitekit?.gtagEvent?.( 'purchase', eventData );
	}

	const body = jQuery( 'body' );

	// eslint-disable-next-line camelcase
	body.on( 'added_to_cart', ( event, fragments, cart_hash, $button ) => {
		const productID = parseInt( $button.data( 'product_id' ), 10 );
		const productData =
			global._googlesitekit.wcdata.products?.find(
				( product ) => product?.id === productID
			) || {};
		const { price } = productData;

		const eventData = formatEventData( price, currency, productData );
		global._googlesitekit?.gtagEvent?.( 'add_to_cart', eventData );
	} );

	document
		.querySelectorAll(
			'.products-block-post-template .product, .wc-block-product-template .product'
		)
		?.forEach( ( productCard ) => {
			// Get the Product ID from a child node containing the relevant attribute.
			const productID = parseInt(
				productCard
					.querySelector( '[data-product_id]' )
					?.getAttribute( 'data-product_id' ),
				10
			);

			if ( ! productID ) {
				return;
			}

			productCard.addEventListener( 'click', ( event ) => {
				const target = event.target;
				const button = target.closest(
					'.wc-block-components-product-button [data-product_id]'
				);

				const isAddToCartButton =
					button &&
					button.classList.contains( 'add_to_cart_button' ) &&
					! button.classList.contains( 'product_type_variable' );

				if ( isAddToCartButton ) {
					const productData =
						global._googlesitekit.wcdata.products?.find(
							( product ) => product?.id === productID
						) || {};
					const { price } = productData;

					const eventData = formatEventData(
						price,
						currency,
						productData
					);
					global._googlesitekit?.gtagEvent?.(
						'add_to_cart',
						eventData
					);
				}
			} );
		} );
} )( global.jQuery );

function formatEventData(
	value,
	currency,
	products,
	transactionID = null,
	shipping = null,
	tax = null
) {
	const formattedData = {
		value,
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

	if ( products && products.length ) {
		for ( const product of products ) {
			formattedData.items.push( formatProductData( product ) );
		}
	}

	if ( products && products.id ) {
		formattedData.items = [ formatProductData( products ) ];
	}

	return formattedData;
}

function formatProductData( product ) {
	const { id, name, price, variation, quantity, categories } = product;

	const mappedItem = {
		item_id: id,
		item_name: name,
		price,
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
