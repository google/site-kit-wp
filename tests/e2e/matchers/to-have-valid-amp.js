/**
 * External dependencies
 */
import amphtmlValidator from 'amphtml-validator';
import fetch from 'node-fetch';

export async function toHaveValidAMP( path = '/' ) {
	const result = {};
	try {
		const html = await fetch( 'http://localhost:9002' + path, { credentials: 'omit' } ).then( ( res ) => res.text() );
		const scanStatus = '';
		await amphtmlValidator.getInstance().then( ( validator ) => {
			const { status } = validator.validateString( html );
			result.pass = ( 'PASS' === status );
			result.message = `AMP Status: ${ status }`;
		} );
		result.message = () => `AMP Status: ${ scanStatus }`;
	} catch ( error ) {
		result.pass = false;
		result.message = () => error.message;
	}

	return result;
}
