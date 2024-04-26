addEventListener( 'DOMContentLoaded', () => {
	const array = [ 'test one', 'test two' ];

	document.addEventListener( 'click', () => {
		for ( const item in array ) {
			// eslint-disable-next-line no-console
			console.log( item );
		}
	} );
} );
