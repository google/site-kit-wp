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
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PUESurveyTriggers from './PUESurveyTriggers';
import { SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION } from './SetUpEmailReportingOverlayNotification';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../tests/js/mock-survey-endpoints';

const fetchGetDismissedItems = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);

describe( 'PUESurveyTriggers', () => {
	const notification =
		DEFAULT_NOTIFICATIONS[ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ];

	let registry;

	function setup( { subscribed, dismissedCTA } ) {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );

		// IMPORTANT: seed dismissed state BEFORE registering the
		// notification so that `registerNotification`'s internal
		// `resolveSelect( CORE_USER ).getDismissedItems()` short-circuits.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems(
				dismissedCTA
					? [ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ]
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
		setup( { subscribed: true, dismissedCTA: false } );
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( 'view_pue' );
	} );

	it( 'dispatches the view_pue_not_subscribed survey trigger when the user has seen the setup CTA but is not subscribed', async () => {
		setup( { subscribed: false, dismissedCTA: true } );
		fetchMock.getOnce( fetchGetDismissedItems, {
			body: [ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ],
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( 'view_pue_not_subscribed' );
	} );

	it( 'does not dispatch any survey trigger when the user is not subscribed and has not seen the setup CTA', async () => {
		setup( { subscribed: false, dismissedCTA: false } );
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );
} );
