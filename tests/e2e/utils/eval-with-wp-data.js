/**
 * Internal dependencies
 */
import { getWPVersion } from './get-wp-version';

/**
 * Evaluates a function if wp.data is available.
 *
 * @param {Function} callback Function to call in browser context, if wp.data is available.
 * @param {...*} args Arguments to pass to the callback in browser context.
 */
export async function evalWithWPData( callback, ...args ) {
	const { major } = await getWPVersion();

	if ( major < 5 ) {
		return;
	}

	await page.waitForFunction( () => window.wp !== undefined );
	await page.waitForFunction( () => window.wp.data !== undefined );

	return await page.evaluate( callback, ...args );
}
