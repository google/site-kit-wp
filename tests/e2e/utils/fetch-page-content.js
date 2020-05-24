/**
 * External dependencies
 *
 */
import fetch from 'node-fetch';

/**
 * Helper to prepare the cookies to be passed to node-fetch
 *
 * @param {Array} cookies Array of cookies returned from page.getCookes().
 *
 * @return {string} The cookie string.
 */
export function prepareCookiesForHeader( cookies ) {
	let parsedCookies = '';
	cookies.forEach( ( cookie ) => {
		parsedCookies += `${ cookie.name }=${ cookie.value }; `;
	} );
	return parsedCookies;
}

/**
 * Fetch markup for any given URL.
 *
 * @param {string} path   Page URI to retrieve the content for.
 * @param {Array} cookies Array of cookies as retrieved via page.cookies().
 */
export async function fetchPageContent( path, cookies = [] ) {
	let success, payload;
	try {
		const response = await fetch( path, { headers: { cookie: prepareCookiesForHeader( cookies ) } } );
		if ( 200 !== response.status ) {
			throw new Error( `fetch() error: ${ path } returned a status of ${ response.status }` );
		} else {
			success = true;
			payload = await response.text();
		}
	} catch ( error ) {
		success = false;
		payload = error.message;
	}
	return { success, payload };
}
