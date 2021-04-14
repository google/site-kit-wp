describe( 'inline edit post', () => {
	const ARG = {};
	const ORIGINAL_EDIT_FN = jest.fn();
	const POST_ID = 7;
	const PRODUCT = 'premium';
	const PRODUCTS = [ 'basic', PRODUCT ];

	// This is set just once, since the `inline-edit-post`
	// script's top-level code executes just once.
	global.inlineEditPost = { edit: ORIGINAL_EDIT_FN };

	// Note: Calling `require` twice does not
	// run the script's top-level code twice.
	require( '../inline-edit-post' );

	let productEl;
	let selectEl;

	beforeEach( () => {
		ORIGINAL_EDIT_FN.mockReset();

		// eslint-disable-next-line sitekit/acronym-case
		global.inlineEditPost.getId = jest.fn().mockReturnValue( POST_ID );

		productEl = document.createElement( 'div' );
		productEl.id = 'swg-product-for-post-' + POST_ID;
		productEl.innerText = PRODUCT;
		document.body.append( productEl );

		selectEl = document.createElement( 'select' );
		selectEl.id = 'SubscribeWithGoogle_product';
		for ( const product of PRODUCTS ) {
			const optionEl = document.createElement( 'option' );
			optionEl.innerText = product;
			optionEl.value = product;
			selectEl.options.add( optionEl );
		}
		document.body.appendChild( selectEl );
	} );

	afterEach( () => {
		productEl.remove();
		selectEl.remove();
	} );

	it( 'calls original fn', () => {
		global.inlineEditPost.edit( ARG );

		expect( ORIGINAL_EDIT_FN ).toHaveBeenCalledWith( ARG );
	} );

	it( 'calls getId fn', () => {
		global.inlineEditPost.edit( ARG );

		expect( global.inlineEditPost.getId ).toHaveBeenCalledWith( ARG );
	} );

	it( 'updates select value', () => {
		expect( selectEl ).toHaveValue( PRODUCTS[ 0 ] );

		global.inlineEditPost.edit( ARG );

		expect( selectEl ).toHaveValue( PRODUCT );
	} );

	it( 'bails if post ID is missing', () => {
		// eslint-disable-next-line sitekit/acronym-case
		global.inlineEditPost.getId.mockReturnValue( null );

		global.inlineEditPost.edit( ARG );

		expect( selectEl ).not.toHaveValue( PRODUCT );
	} );

	it( 'bails if product element is missing', () => {
		productEl.remove();

		global.inlineEditPost.edit( ARG );

		expect( selectEl ).not.toHaveValue( PRODUCT );
	} );

	it( 'bails if select element is missing', () => {
		selectEl.remove();

		global.inlineEditPost.edit( ARG );

		expect( selectEl ).not.toHaveValue( PRODUCT );
	} );
} );
