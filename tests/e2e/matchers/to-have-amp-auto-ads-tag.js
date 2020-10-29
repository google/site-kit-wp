/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Asserts the URL at the given path contains an <amp-auto-ads> tag.
 *
 * @since n.e.x.t
 *
 * @param {string} path The URL path of the current site to check.
 * @return {Object} Matcher result.
 */
export async function toHaveAMPAutoAdsTag( path ) {
	const result = {};

	const page = await browser.newPage();
	await page.goto( createURL( path, 'amp' ) );

	try {
		await expect( page ).toMatchElement( 'amp-auto-ads' );
		result.pass = true;
		result.message = () => `Expected ${ path } not to contain an <amp-auto-ads> tag.`;
	} catch {
		result.pass = false;
		result.message = () => `Expected ${ path } to contain an <amp-auto-ads> tag.`;
	}

	await page.close();

	return result;
}
