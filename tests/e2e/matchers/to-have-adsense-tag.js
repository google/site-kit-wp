/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Jest matcher for asserting the URL at the given path contains an Adsense tag.
 *
 * @param {string} path The URL path of the current site to check.
 */
export async function toHaveAdsenseTag( path ) {
	const result = {};
	const page = await browser.newPage();
	await page.goto( createURL( path ) );

	try {
		await expect( page ).toMatchElement( 'script[src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]' );
		result.pass = true;
		result.message = () => `Expected ${ path } not to contain an Adsense tag.`;
	} catch {
		result.pass = false;
		result.message = () => `Expected ${ path } to contain an Adsense tag.`;
	}

	await page.close();

	return result;
}
