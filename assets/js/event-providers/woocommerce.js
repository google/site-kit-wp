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

/* eslint-disable */
( ( jQuery ) => {
	if ( ! jQuery ) {
		return;
	}
	console.log(
		global.wc.add_to_cart,
		'single product add to cart, invoke event when property not null'
	);

	const body = jQuery( 'body' );

	body.on( 'added_to_cart', ( event, fragments, cart_hash, $button ) => {
		global._googlesitekit?.gtagEvent?.( 'add_to_cart' );
		const productId = $button.data( 'product_id' );

		console.log( global.wc, productId );
		console.log(
			global.wc.products.find( ( product ) => product.id === productId )
		);
	} );

	body.on( 'checkout_place_order_success', () => {
		global._googlesitekit?.gtagEvent?.( 'purchase' );
	} );

	document
		.querySelectorAll(
			'.products-block-post-template .product, .wc-block-product-template .product'
		)
		?.forEach( ( productCard ) => {
			// Get the Product ID from a child node containing the relevant attribute
			const productId = productCard
				.querySelector( '[data-product_id]' )
				?.getAttribute( 'data-product_id' );

			if ( ! productId ) {
				return;
			}

			productCard.addEventListener( 'click', ( event ) => {
				const target = event.target;
				// `product-view-link` has no serilized HTML identifier/selector, so we look for the parent block element.
				const viewLink = target.closest(
					'.wc-block-components-product-image a'
				);

				// Catch the enclosing product button.
				const button = target.closest(
					'.wc-block-components-product-button [data-product_id]'
				);

				const isAddToCartButton =
					button &&
					button.classList.contains( 'add_to_cart_button' ) &&
					! button.classList.contains( 'product_type_variable' );

				if ( isAddToCartButton ) {
					console.log( 'add_to_cart from block' );
				}
			} );
		} );
} )( global.jQuery );
