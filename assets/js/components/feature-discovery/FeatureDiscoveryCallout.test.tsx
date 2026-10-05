/**
 * FeatureDiscoveryCallout component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { mockSurveyEndpoints } from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import { FEATURE_DISCOVERY_CALLOUT_NOTIFICATION } from './FeatureDiscoveryCallout';

const fetchDismissItem = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismiss-item'
);
const fetchGetDismissedItems = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);

describe( 'FeatureDiscoveryCallout', () => {
	const notification =
		DEFAULT_NOTIFICATIONS[ FEATURE_DISCOVERY_CALLOUT_NOTIFICATION ];

	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {
			[ PERMISSION_MANAGE_OPTIONS ]: true,
		} );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				FEATURE_DISCOVERY_CALLOUT_NOTIFICATION,
				notification
			);
	} );

	afterEach( () => {
		fetchMock.reset();
		document
			.querySelectorAll( '.googlesitekit-add-features-button' )
			.forEach( ( element ) => element.remove() );
	} );

	function renderNotifications() {
		return render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				features: [ 'featureDiscoveryHub' ],
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
	}

	it( 'renders the callout content', async () => {
		mockSurveyEndpoints();

		const { container, getByText, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		expect(
			getByText( 'Unlock more Site Kit features' )
		).toBeInTheDocument();
		expect(
			getByText(
				'Discover new ways to earn revenue, understand your visitors, and improve your visibility in Search, all in one place.'
			)
		).toBeInTheDocument();
		expect( getByText( 'Got it' ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-feature-discovery-callout svg'
			)
		).toBeInTheDocument();
	} );

	it( 'anchors the callout to the Add features button when present', async () => {
		mockSurveyEndpoints();

		const addFeaturesButton = document.createElement( 'button' );
		addFeaturesButton.className = 'googlesitekit-add-features-button';
		document.body.appendChild( addFeaturesButton );

		const { container, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-popper-root' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-overlay-card--anchored' )
		).toBeInTheDocument();

		addFeaturesButton.remove();
	} );

	it( 'dismisses the notification when the Got it button is clicked', async () => {
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [ FEATURE_DISCOVERY_CALLOUT_NOTIFICATION ],
		} );
		mockSurveyEndpoints();

		const { getByRole, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /got it/i } ) );
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				fetchDismissItem,
				expect.objectContaining( {
					body: {
						data: {
							slug: FEATURE_DISCOVERY_CALLOUT_NOTIFICATION,
							expiration: 0,
						},
					},
				} )
			)
		);
	} );

	it( 'does not render once dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				FEATURE_DISCOVERY_CALLOUT_NOTIFICATION,
			] );

		const { queryByText, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		expect(
			queryByText( 'Unlock more Site Kit features' )
		).not.toBeInTheDocument();
	} );
} );
