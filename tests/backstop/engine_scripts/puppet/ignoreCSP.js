/**
 * IGNORE CSP HEADERS.
 *
 * Listen to all requests. If a request matches scenario.url
 * then fetch the request again manually, strip out CSP headers
 * and respond to the original request without CSP headers.
 * Allows `ignoreHTTPSErrors: true` BUT... requires `debugWindow: true`
 *
 * See: https://github.com/GoogleChrome/puppeteer/issues/1229#issuecomment-380133332.
 * This is the workaround until Page.setBypassCSP lands: https://github.com/GoogleChrome/puppeteer/pull/2324.
 *
 * Use this in an `onBefore` script:
 *
 * ```
 * module.exports = async function( page, scenario ) {
 *   require( './removeCSP' )( page, scenario );
 * }
 * ```
 *
 * @since 1.0.0
 *
 * @param {Request} request HTTP Request.
 * @return {void}
 */

const fetch = require( 'node-fetch' );
const https = require( 'https' );
const agent = new https.Agent( {
	rejectUnauthorized: false,
} );

module.exports = async function ( page, scenario ) {
	const intercept = async ( request, targetURL ) => {
		const requestURL = request.url();

		// FIND TARGET URL REQUEST
		if ( requestURL === targetURL ) {
			const cookiesList = await page.cookies( requestURL );
			const cookies = cookiesList
				.map( ( cookie ) => `${ cookie.name }=${ cookie.value }` )
				.join( '; ' );
			const headers = Object.assign( request.headers(), {
				cookie: cookies,
			} );
			const options = {
				headers,
				body: request.postData(),
				method: request.method(),
				follow: 20,
				agent,
			};

			const result = await fetch( requestURL, options );

			const buffer = await result.buffer();
			const cleanedHeaders = result.headers._headers || {};
			cleanedHeaders[ 'content-security-policy' ] = '';
			await request.respond( {
				body: buffer,
				headers: cleanedHeaders,
				status: result.status,
			} );
		} else {
			request.continue();
		}
	};

	await page.setRequestInterception( true );
	page.on( 'request', ( req ) => {
		intercept( req, scenario.url );
	} );
};
