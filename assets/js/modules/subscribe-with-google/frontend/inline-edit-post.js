// Extend inline edit post functionality.
const originalMethod = global.inlineEditPost.edit;
global.inlineEditPost.edit = function( id ) {
	// Call original method.
	originalMethod.apply( this, arguments );

	// Require post ID.
	// eslint-disable-next-line sitekit/acronym-case
	const postID = this.getId( id );
	if ( ! postID ) {
		return;
	}

	// Require product.
	const productEl = document.querySelector( '#swg-product-for-post-' + postID );
	if ( ! productEl ) {
		return;
	}
	const product = productEl.innerText;

	// Require dropdown.
	const selectEl = document.querySelector( 'select#SubscribeWithGoogle_product' );
	if ( ! selectEl ) {
		return;
	}

	// Update dropdown.
	selectEl.value = product;
};
