/**
 * Utility for resetting Site Kit.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * WordPress dependencies
 */
import { clearLocalStorage, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	clearSessionStorage,
	pageWait,
	wpApiFetch,
} from '../utils';

/**
 * Resets Site Kit using a utility plugin.
 */
export async function resetSiteKit() {
	if ( ! page.url().includes( '/wp-admin' ) ) {
		await visitAdminPage( '/' );
	}

	await Promise.all( [
		wpApiFetch( {
			path: 'google-site-kit/v1/core/site/data/reset',
			method: 'post',
		} ),
		clearLocalStorage(),
		clearSessionStorage(),
		page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/core/site/data/reset' ) ),
	] );

	// Prevent "Cannot log after tests are done." errors.
	if ( '1' === process.env.DEBUG_REST ) {
		await pageWait();
	}
}
