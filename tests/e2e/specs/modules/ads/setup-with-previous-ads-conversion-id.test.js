/**
 * Ads setup with previously saved Ads conversion ID e2e tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setupSiteKit,
	setupAnalytics4,
	enableFeature,
	useRequestInterception,
	step,
} from '../../../utils';
import * as fixtures from '../../../../../assets/js/modules/analytics-4/datastore/__fixtures__';

describe( 'Ads setup with Conversion Tracking ID present', () => {
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
				request
					.url()
					.match( 'analytics-4/data/enhanced-measurement-settings' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify(
						fixtures.defaultEnhancedMeasurementSettings
					),
				} );
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await enableFeature( 'adsModule' );
		await setupSiteKit();
		await setupAnalytics4( {
			adsConversionID: 'AW-12345',
		} );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'migrates the Conversion Tracking ID field from GA4 to the Ads module', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

		await page.waitForSelector(
			'#googlesitekit-settings-module__header--analytics-4'
		);
		await expect( page ).toClick(
			'#googlesitekit-settings-module__header--analytics-4'
		);

		await page.waitForSelector(
			'.googlesitekit-settings-analytics-ads-conversion-id-notice'
		);
		await expect( page ).toMatchElement(
			'.googlesitekit-settings-analytics-ads-conversion-id-notice',
			{
				text: /ads Conversion tracking id has been moved to/i,
			}
		);

		await step(
			'confirm Ads Conversion Tracking ID is migrated to the Ads module',
			async () => {
				await expect( page ).toClick(
					'#googlesitekit-settings-module__header--ads'
				);
				await page.waitForSelector(
					'.googlesitekit-settings-module__edit-button'
				);

				await expect( page ).toMatchElement(
					'.googlesitekit-settings-module__meta-item-data',
					{
						text: /AW-12345/,
					}
				);
			}
		);

		// Verify the Ads tag is present on the output of the WordPress website.
		await expect( '/' ).toHaveAdsTag();
	} );
} );
