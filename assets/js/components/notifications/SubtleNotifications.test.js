/**
 * SubtleNotifications component tests.
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
import SubtleNotifications from './SubtleNotifications';
import {
	render,
	createTestRegistry,
	provideModules,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

describe( 'GA4AdSenseLinkedNotification', () => {
	let registry;

	const analyticsReport = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
	} );

	it( 'does not render GA4AdSenseLinkedNotification if AdSense module is not active', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: true,
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
			{
				active: false,
				connected: false,
				slug: 'adsense',
			},
		] );

		const { container, waitForRegistry } = render(
			<SubtleNotifications />,
			{
				registry,
				features: [ 'ga4AdSenseIntegration' ],
			}
		);
		await waitForRegistry();

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does not render GA4AdSenseLinkedNotification if AdSense and Analytics are not linked', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: false,
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
			{
				active: true,
				connected: true,
				slug: 'adsense',
			},
		] );

		const { container, waitForRegistry } = render(
			<SubtleNotifications />,
			{
				registry,
				features: [ 'ga4AdSenseIntegration' ],
			}
		);
		await waitForRegistry();

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'renders GA4AdSenseLinkedNotification when both Analytics and AdSense modules are active', async () => {
		fetchMock.getOnce( analyticsReport, {
			body: {
				rowCount: null,
			},
			status: 200,
		} );

		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
			{
				active: true,
				connected: true,
				slug: 'adsense',
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: true,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<SubtleNotifications />,
			{
				registry,
				features: [ 'ga4AdSenseIntegration' ],
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Your AdSense and Analytics accounts are linked'
		);
		expect( container ).toMatchSnapshot();
	} );
} );
