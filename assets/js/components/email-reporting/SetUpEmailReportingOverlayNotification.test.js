/**
 * SetUpEmailReportingOverlayNotification component tests.
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
import { waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Notifications from '@/js/components/notifications/Notifications';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../tests/js/test-utils';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from './constants';
import SetUpEmailReportingOverlayNotification, {
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
} from './SetUpEmailReportingOverlayNotification';

const fetchDismissItem = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismiss-item'
);
const fetchGetDismissedItems = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);

const mockShowTooltip = jest.fn();

jest.mock( '@/js/components/AdminScreenTooltip', () => ( {
	useShowTooltip: jest.fn( () => mockShowTooltip ),
} ) );

jest.mock( '@/js/hooks/useActivateModuleCallback', () =>
	jest.fn( () => jest.fn() )
);

describe( 'SetUpEmailReportingOverlayNotification', () => {
	const notification =
		DEFAULT_NOTIFICATIONS[ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ];
	const NotificationComponent = withNotificationComponentProps(
		SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION
	)( SetUpEmailReportingOverlayNotification );

	afterEach( () => {
		fetchMock.reset();
		mockShowTooltip.mockClear();
	} );

	describe( 'checkRequirements', () => {
		it( 'returns false when user is already subscribed', async () => {
			const registry = createTestRegistry();
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: true,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: true,
			} );

			const result = await notification.checkRequirements( {
				select: registry.select,
				resolveSelect: registry.resolveSelect,
			} );

			expect( result ).toBe( false );
		} );

		it( 'returns true when user is not subscribed (authenticated users always have access)', async () => {
			const registry = createTestRegistry();
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: true,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
			} );

			const result = await notification.checkRequirements( {
				select: registry.select,
				resolveSelect: registry.resolveSelect,
			} );

			expect( result ).toBe( true );
		} );

		it( 'returns false when email reporting is disabled at site level', async () => {
			const registry = createTestRegistry();
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: false,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
			} );

			const result = await notification.checkRequirements( {
				select: registry.select,
				resolveSelect: registry.resolveSelect,
			} );

			expect( result ).toBe( false );
		} );

		describe( 'view-only users', () => {
			const shareableModules = [
				{
					slug: 'analytics-4',
					name: 'Analytics',
					shareable: true,
				},
				{
					slug: 'search-console',
					name: 'Search Console',
					shareable: true,
				},
			];

			function setupViewableModules(
				registry,
				viewableModuleSlugs = []
			) {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( shareableModules );

				const capabilities = {
					googlesitekit_view_dashboard: true,
					'googlesitekit_read_shared_module_data::["analytics-4"]':
						viewableModuleSlugs.includes( 'analytics-4' ),
					'googlesitekit_read_shared_module_data::["search-console"]':
						viewableModuleSlugs.includes( 'search-console' ),
				};
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities );
			}

			it( 'returns true when view-only user can view Analytics', async () => {
				const registry = createTestRegistry();
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
					} );
				setupViewableModules( registry, [ 'analytics-4' ] );

				const result = await notification.checkRequirements(
					{
						select: registry.select,
						resolveSelect: registry.resolveSelect,
					},
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				);

				expect( result ).toBe( true );
			} );

			it( 'returns true when view-only user can view Search Console', async () => {
				const registry = createTestRegistry();
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
					} );
				setupViewableModules( registry, [ 'search-console' ] );

				const result = await notification.checkRequirements(
					{
						select: registry.select,
						resolveSelect: registry.resolveSelect,
					},
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				);

				expect( result ).toBe( true );
			} );

			it( 'returns false when view-only user cannot view Analytics or Search Console', async () => {
				const registry = createTestRegistry();
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
					} );
				setupViewableModules( registry, [] );

				const result = await notification.checkRequirements(
					{
						select: registry.select,
						resolveSelect: registry.resolveSelect,
					},
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				);

				expect( result ).toBe( false );
			} );
		} );
	} );

	describe( 'rendering', () => {
		let registry;

		beforeEach( () => {
			registry = createTestRegistry();
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: true,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
			} );
			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification(
					SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
					notification
				);
		} );

		it( 'shows the tooltip when the dismiss button is clicked', async () => {
			fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
			fetchMock.postOnce( fetchDismissItem, {
				body: [ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ],
			} );

			const { getByRole, waitForRegistry } = render(
				<Notifications
					areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
					groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					features: [ 'proactiveUserEngagement' ],
				}
			);

			await waitForRegistry();

			act( () => {
				fireEvent.click(
					getByRole( 'button', { name: /maybe later/i } )
				);
			} );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( fetchDismissItem )
			);

			await waitFor( () =>
				expect( mockShowTooltip ).toHaveBeenCalledTimes( 1 )
			);
		} );

		it( 'dismisses the notification and shows the tooltip when the selection panel is closed', async () => {
			fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
			fetchMock.postOnce( fetchDismissItem, {
				body: [ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ],
			} );

			render( <NotificationComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'proactiveUserEngagement' ],
			} );

			act( () => {
				registry
					.dispatch( CORE_UI )
					.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
			} );

			act( () => {
				registry
					.dispatch( CORE_UI )
					.setValue(
						USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
						false
					);
			} );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( fetchDismissItem )
			);

			await waitFor( () =>
				expect( mockShowTooltip ).toHaveBeenCalledTimes( 1 )
			);
		} );
	} );
} );
