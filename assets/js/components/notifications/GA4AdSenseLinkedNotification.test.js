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
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SETTINGS,
} from '../../googlesitekit/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

const GA4_ADSENSE_LINKED_NOTIFICATION =
	'top-earning-pages-success-notification';

// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'GA4AdSenseLinkedNotification', () => {
	let registry;

	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);
	const analyticsReport = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const NotificationWithComponentProps = withNotificationComponentProps(
		GA4_ADSENSE_LINKED_NOTIFICATION
	)( GA4AdSenseLinkedNotification );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'does not render if AdSense module is not active', async () => {
		muteFetch( analyticsReport );

		fetchMock.postOnce( fetchDismissItem, {
			body: JSON.stringify( [ GA4_ADSENSE_LINKED_NOTIFICATION ] ),
			status: 200,
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
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does not render if AdSense and Analytics are not linked', async () => {
		muteFetch( analyticsReport );

		fetchMock.postOnce( fetchDismissItem, {
			body: JSON.stringify( [ GA4_ADSENSE_LINKED_NOTIFICATION ] ),
			status: 200,
		} );

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
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does not render if report has data, and it is not already dismissed', async () => {
		muteFetch( analyticsReport );

		fetchMock.postOnce( fetchDismissItem, {
			body: JSON.stringify( [ GA4_ADSENSE_LINKED_NOTIFICATION ] ),
			status: 200,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does not render if already dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ GA4_ADSENSE_LINKED_NOTIFICATION ] );

		const { container, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched(
			'/google-site-kit/v1/modules/analytics-4/data'
		);

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does not render when not on the main or entity dashboard', async () => {
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

		fetchMock.getOnce( analyticsReport, {
			body: {
				rowCount: null,
			},
			status: 200,
		} );

		const { container, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);
		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched(
			'/google-site-kit/v1/modules/analytics-4/data'
		);

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'renders when both Analytics and AdSense modules are active and linked', async () => {
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

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Your AdSense and Analytics accounts are linked'
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'renders when report has no data and it was not previously dismissed', async () => {
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

		fetchMock.getOnce( analyticsReport, {
			body: {
				rowCount: null,
			},
			status: 200,
		} );

		const { container, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Your AdSense and Analytics accounts are linked'
		);
	} );
} );
