// const replace = require( 'replace-in-file' );

// const regex = new RegExp( '/.*\\/.*/', 'gm' );

// const options = {
// 	files: './assets/js/**',
// 	from: /\/.*\\.*\//gm,
// 	to: ( match ) => {
// 		let words = match.slice( 1, -1 ).split( '\\/' );

// 		const result = `new RegExp('${ words.join( '/' ) }')`;
// 		return result;
// 	},
// };

// replace( options )
// 	.then( ( results ) => {
// 		console.log( 'Replacement results:', results );
// 	} )
// 	.catch( ( error ) => {
// 		console.error( 'Error occurred:', error );
// 	} );
