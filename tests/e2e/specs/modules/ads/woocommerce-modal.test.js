/**
 * WooCommerce modal (WooCommerceRedirectModal) E2E tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { useRequestInterception } from '../../../utils';

describe( 'Ads WooCommerce Redirect Modal', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if (
				url.match(
					'/google-site-kit/v1/modules/search-console/data/searchanalytics'
				)
			) {
				request.respond( { status: 200, body: JSON.stringify( [] ) } );
			} else if (
				url.match(
					'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
				)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if (
				url.match( 'google-site-kit/v1/core/user/data/dismiss-prompt' )
			) {
				// Override the real dismissed prompts to avoid interference with the tests.
				// Otherwise the Ads Setup Banner will be dismissed already after the first test case
				// and it won't show up anymore.
				request.respond( {
					status: 200,
					body: JSON.stringify( {
						status: 200,
						body: {},
					} ),
				} );
			} else if (
				url.match( 'google-site-kit/v1/core/user/data/dismiss-item' )
			) {
				// Override the real dismissed item to avoid interference with the tests.
				// Otherwise the AccountLinkedViaGoogleForWooCommerceSubtleNotification notification
				// will be dismissed already after the first test case and it won't show up anymore.
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else {
				request.continue();
			}
		} );
	} );
} );
