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
import GA4AdSenseLinkedNotification from './GA4AdSenseLinkedNotification';
import {
	render,
	createTestRegistry,
	provideModules,
	muteFetch,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY } from '../../modules/analytics-4/datastore/constants';

describe( 'GA4AdSenseLinkedNotification', () => {
	let registry;

	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);
	const analyticsReport = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
	} );

	it( 'does not render if report has data, and it is not already dismissed', async () => {
		muteFetch( analyticsReport );

		fetchMock.postOnce( fetchDismissItem, {
			body: JSON.stringify( [
				GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY,
			] ),
			status: 200,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<GA4AdSenseLinkedNotification />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does not render if already dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY,
			] );

		const { container, waitForRegistry } = render(
			<GA4AdSenseLinkedNotification />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched(
			'/google-site-kit/v1/modules/analytics-4/data'
		);

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'renders when report has no data and it was not previously dismissed', async () => {
		fetchMock.getOnce( analyticsReport, {
			body: {
				rowCount: null,
			},
			status: 200,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<GA4AdSenseLinkedNotification />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Your AdSense and Analytics accounts are linked'
		);
	} );
} );
