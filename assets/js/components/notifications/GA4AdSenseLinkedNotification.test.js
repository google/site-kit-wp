/**
 * GA4AdSenseLinkedNotification component tests.
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModules,
} from '../../../../tests/js/test-utils';
import { getAnalytics4MockResponse } from '../../modules/analytics-4/utils/data-mock';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import getMultiDimensionalObjectFromParams from '../../../../tests/e2e/utils/get-multi-dimensional-object-from-params';
import { withConnected } from '../../googlesitekit/modules/datastore/__fixtures__';

const GA4_ADSENSE_LINKED_NOTIFICATION =
	'top-earning-pages-success-notification';

describe( 'GA4AdSenseLinkedNotification', () => {
	let registry;

	const analyticsReport = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const notification =
		DEFAULT_NOTIFICATIONS[ GA4_ADSENSE_LINKED_NOTIFICATION ];

	beforeEach( () => {
		registry = createTestRegistry();
		// All the below conditions will trigger a successful notification.
		// So each individual failing test case further below will overwrite one
		// of the success criteria.
		provideModules( registry, withConnected( 'analytics-4', 'adsense' ) );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				GA4_ADSENSE_LINKED_NOTIFICATION,
				notification
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: true,
		} );
		// Mock report call for AdSense GA4 data.
		fetchMock.getOnce( analyticsReport, {
			body: {
				rowCount: null,
			},
			status: 200,
		} );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active if AdSense module is not connected', async () => {
			provideModules( registry, [
				{ active: true, connected: true, slug: 'analytics-4' },
				{
					active: true,
					connected: false,
					slug: 'adsense',
				},
			] );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active if AdSense and Analytics are not linked', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				adSenseLinked: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active if report has data', async () => {
			fetchMock.reset();
			fetchMock.getOnce( analyticsReport, function ( req ) {
				const paramsObject = Object.fromEntries(
					new URL( req, 'http://example.com' ).searchParams.entries()
				);
				const multiDimensionalObjectParams =
					getMultiDimensionalObjectFromParams( paramsObject );
				return {
					status: 200,
					body: getAnalytics4MockResponse(
						multiDimensionalObjectParams
					),
				};
			} );
			fetchMock.postOnce( fetchDismissItem, {
				status: 200,
				body: [],
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );
} );
