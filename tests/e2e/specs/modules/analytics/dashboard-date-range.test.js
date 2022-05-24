/**
 * Dashboard date range e2e tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { activatePlugin } from '@wordpress/e2e-test-utils';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	setSiteVerification,
	setSearchConsoleProperty,
	setupAnalytics,
	useRequestInterception,
} from '../../../utils';
import { getAnalyticsMockResponse } from '../../../../../assets/js/modules/analytics/util/data-mock';

describe( 'date range filtering on dashboard views', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
		await setupAnalytics();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();

			if ( url.match( 'notifications' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else if ( url.match( 'google-site-kit/v1/modules/analytics' ) ) {
				const query = getQueryArgs( url );
				// @TODO The total sessions can be the same even if different dates are selected,
				// so we need another way for this test to establish whether the feature works.
				// For now, we will force a new mock report to be generated if the url is different.
				query.url = url;
				const response = getAnalyticsMockResponse( query );
				response[ 0 ].data.rows[ 0 ].dimensions = [ '/' ]; // needed for valid isValidDimensionFilters

				request.respond( {
					status: 200,
					body: JSON.stringify( response ),
				} );
			} else {
				request.continue();
			}
		} );
	} );
} );
