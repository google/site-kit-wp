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
import SetUpEmailReportingOverlayNotification, {
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
} from './SetUpEmailReportingOverlayNotification';
import {
	createTestRegistry,
	render,
	fireEvent,
	act,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import Notifications from '@/js/components/notifications/Notifications';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from './constants';

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
		it( 'returns false when proactive user engagement is already subscribed', async () => {
			const registry = createTestRegistry();
			registry
				.dispatch( CORE_USER )
				.receiveGetProactiveUserEngagementSettings( {
					subscribed: true,
				} );

			const result = await notification.checkRequirements( {
				select: registry.select,
				resolveSelect: registry.resolveSelect,
			} );

			expect( result ).toBe( false );
		} );

		it( 'returns true when proactive user engagement is not yet subscribed', async () => {
			const registry = createTestRegistry();
			registry
				.dispatch( CORE_USER )
				.receiveGetProactiveUserEngagementSettings( {
					subscribed: false,
				} );

			const result = await notification.checkRequirements( {
				select: registry.select,
				resolveSelect: registry.resolveSelect,
			} );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'rendering', () => {
		let registry;

		beforeEach( () => {
			registry = createTestRegistry();
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
			registry
				.dispatch( CORE_USER )
				.receiveGetProactiveUserEngagementSettings( {
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
