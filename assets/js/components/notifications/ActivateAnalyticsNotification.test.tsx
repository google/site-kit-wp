/**
 * ActivateAnalyticsNotification component tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';
import { mocked } from 'jest-mock';

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	provideGatheringDataState,
	provideUserAuthentication,
	provideModules,
	fireEvent,
} from '../../../../tests/js/test-utils';
import { dismissPromptEndpoint } from '../../../../tests/js/mock-dismiss-prompt-endpoints';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { WEEK_IN_SECONDS } from '@/js/util';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import ActivateAnalyticsNotification from './ActivateAnalyticsNotification';

jest.mock( '@/js/hooks/useActivateModuleCallback' );

const ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG = 'activate-analytics-cta';

describe( 'ActivateAnalyticsNotification', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const ActivateAnalyticsNotificationComponent =
		withNotificationComponentProps( ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG )(
			ActivateAnalyticsNotification
		);

	const notification =
		DEFAULT_NOTIFICATIONS[ ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG ];

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG,
				notification
			);
	} );

	it( 'should render correctly', async () => {
		provideModules( registry );

		const { container, getByRole, getByText, waitForRegistry } = render(
			<ActivateAnalyticsNotificationComponent />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText( 'Understand how visitors interact with your content' )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: 'Set up Analytics',
			} )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: 'Maybe later',
			} )
		).toBeInTheDocument();
	} );

	it( 'should render with a "Don’t show again" button when the notification has been dismissed twice', async () => {
		provideModules( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG ]: {
				expires: 0,
				count: 2,
			},
		} );

		const { container, getByRole, waitForRegistry } = render(
			<ActivateAnalyticsNotificationComponent />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByRole( 'button', {
				name: 'Don’t show again',
			} )
		).toBeInTheDocument();
	} );

	it( 'should activate the Analytics module and dismiss the notification when the "Set up Analytics" button is clicked', async () => {
		provideModules( registry );

		const activateAnalyticsMock = jest.fn();

		mocked( useActivateModuleCallback ).mockImplementation(
			() => activateAnalyticsMock
		);

		fetchMock.postOnce( dismissPromptEndpoint, {
			body: {
				[ ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG ]: {
					expires: 0,
					count: 1,
				},
			},
		} );

		const { getByRole, waitForRegistry } = render(
			<ActivateAnalyticsNotificationComponent />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		fireEvent.click(
			getByRole( 'button', {
				name: /Set up Analytics/i,
			} )
		);

		await waitForRegistry();

		expect( activateAnalyticsMock ).toHaveBeenCalledTimes( 1 );

		expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
			body: {
				data: {
					slug: ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG,
					expiration: 0,
				},
			},
			method: 'POST',
		} );
	} );

	it( 'should dismiss the notification with the correct expiration time when the "Maybe later" button is clicked', async () => {
		provideModules( registry );

		fetchMock.postOnce( dismissPromptEndpoint, {
			body: {
				[ ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG ]: {
					expires: 2 * WEEK_IN_SECONDS,
					count: 1,
				},
			},
		} );

		const { getByRole, waitForRegistry } = render(
			<ActivateAnalyticsNotificationComponent />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		fireEvent.click(
			getByRole( 'button', {
				name: 'Maybe later',
			} )
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
			body: {
				data: {
					slug: ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG,
					expiration: 2 * WEEK_IN_SECONDS,
				},
			},
			method: 'POST',
		} );
	} );

	it( 'should dismiss the notification permanently when the "Don’t show again" button is clicked', async () => {
		provideModules( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG ]: {
				expires: 0,
				count: 2,
			},
		} );

		fetchMock.postOnce( dismissPromptEndpoint, {
			body: {
				[ ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG ]: {
					expires: 2 * WEEK_IN_SECONDS,
					count: 3,
				},
			},
		} );

		const { getByRole, waitForRegistry } = render(
			<ActivateAnalyticsNotificationComponent />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		fireEvent.click(
			getByRole( 'button', {
				name: 'Don’t show again',
			} )
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
			body: {
				data: {
					slug: ACTIVATE_ANALYTICS_CTA_WIDGET_SLUG,
					expiration: 0,
				},
			},
			method: 'POST',
		} );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when Analytics is not active, the user can activate it and Search Console is not gathering data', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
				},
			] );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveIsDataAvailableOnLoad( true );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when Analytics is active', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
				},
			] );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveIsDataAvailableOnLoad( true );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the user cannot activate Analytics', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
					// Provide an inactive dependency to simulate the case where the user can't activate it.
					dependencies: [ MODULE_SLUG_SEARCH_CONSOLE ],
				},
				{
					slug: MODULE_SLUG_SEARCH_CONSOLE,
					active: false,
				},
			] );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveIsDataAvailableOnLoad( true );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when Search Console is gathering data', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
				},
			] );
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
			} );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );
	} );
} );
