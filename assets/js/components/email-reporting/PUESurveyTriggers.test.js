/**
 * PUESurveyTriggers tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import PUESurveyTriggers from './PUESurveyTriggers';
import {
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA,
} from './SetUpEmailReportingOverlayNotification';

describe( 'PUESurveyTriggers', () => {
	const notification =
		DEFAULT_NOTIFICATIONS[ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ];

	let registry;

	function setup( { subscribed, clickedSetupCTA, overlaySeen } ) {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );

		// IMPORTANT: seed dismissed state BEFORE registering the
		// notification so `registerNotification`'s internal
		// `resolveSelect( CORE_USER ).getDismissedItems()` short-circuits.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems(
				clickedSetupCTA
					? [ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA ]
					: []
			);
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed,
			frequency: 'monthly',
		} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
				notification
			);

		// `markNotificationSeen` must be dispatched AFTER the
		// notification is registered — the action no-ops if the
		// notification is not yet in the datastore.
		if ( overlaySeen ) {
			registry
				.dispatch( CORE_NOTIFICATIONS )
				.markNotificationSeen(
					SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION
				);
		}
	}

	function renderComponent() {
		return render( <PUESurveyTriggers />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			features: [ 'proactiveUserEngagement' ],
		} );
	}

	function expectTriggerFetch( triggerID ) {
		return waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				surveyTriggerEndpoint,
				expect.objectContaining( {
					body: {
						data: { triggerID },
					},
				} )
			)
		);
	}

	afterEach( () => {
		fetchMock.reset();
	} );

	it( 'dispatches the view_pue survey trigger when the user is subscribed', async () => {
		setup( {
			subscribed: true,
			clickedSetupCTA: false,
			overlaySeen: false,
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( 'view_pue' );
	} );

	it( 'dispatches the view_pue_not_subscribed survey trigger when the user has clicked Set up but is not subscribed (priority over segment 2)', async () => {
		// Seed BOTH the setup-cta flag AND seen state to enforce the
		// priority ordering: segment 3 must win when both inputs
		// would otherwise satisfy segments 2 and 3.
		setup( {
			subscribed: false,
			clickedSetupCTA: true,
			overlaySeen: true,
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( 'view_pue_not_subscribed' );
	} );

	it( 'dispatches the view_pue_setup_cta survey trigger when the user has seen the overlay but has not clicked Set up', async () => {
		setup( {
			subscribed: false,
			clickedSetupCTA: false,
			overlaySeen: true,
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( 'view_pue_setup_cta' );
	} );

	it( 'does not dispatch any survey trigger when the user has never seen the overlay', async () => {
		setup( {
			subscribed: false,
			clickedSetupCTA: false,
			overlaySeen: false,
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );
} );
