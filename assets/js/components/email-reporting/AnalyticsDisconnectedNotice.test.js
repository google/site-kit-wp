/**
 * AnalyticsDisconnectedNotice component tests.
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
import AnalyticsDisconnectedNotice, {
	EMAIL_REPORTING_ANALYTICS_DISCONNECTED_NOTICE_DISMISSED_ITEM,
} from './AnalyticsDisconnectedNotice';
import {
	createTestRegistry,
	render,
	fireEvent,
	provideModules,
	provideUserCapabilities,
	provideUserAuthentication,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';

describe( 'AnalyticsDisconnectedNotice', () => {
	mockLocation();
	let registry;

	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);
	const fetchGetDismissedItems = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_SITE ).receiveGetWasAnalytics4Connected( true );
	} );

	it( 'renders the notice when email reporting is enabled, analytics is disconnected but was once connected and notice is not dismissed', () => {
		const { getByText } = render( <AnalyticsDisconnectedNotice />, {
			registry,
		} );

		// Title and description should be present.
		expect( getByText( /Analytics is disconnected/i ) ).toBeInTheDocument();
		expect(
			getByText(
				/Email reports won’t include Analytics data and metrics/i
			)
		).toBeInTheDocument();
	} );

	it( 'renders the "Reconnect Analytics" button and activates the module on click', async () => {
		const moduleActivationEndpoint = RegExp(
			'google-site-kit/v1/core/modules/data/activation'
		);

		const userAuthenticationEndpoint = RegExp(
			'^/google-site-kit/v1/core/user/data/authentication'
		);

		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );

		const { getByRole } = render( <AnalyticsDisconnectedNotice />, {
			registry,
		} );

		fireEvent.click(
			getByRole( 'button', {
				name: /connect analytics/i,
			} )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( moduleActivationEndpoint )
		);
	} );

	it( 'dismisses the notice when "Got it" is clicked', async () => {
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [
				EMAIL_REPORTING_ANALYTICS_DISCONNECTED_NOTICE_DISMISSED_ITEM,
			],
		} );

		const { getByRole } = render( <AnalyticsDisconnectedNotice />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /got it/i } ) );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( fetchDismissItem )
		);
	} );

	it( 'does not render when email reporting is disabled', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );

		const { container } = render( <AnalyticsDisconnectedNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when notice is dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				EMAIL_REPORTING_ANALYTICS_DISCONNECTED_NOTICE_DISMISSED_ITEM,
			] );

		const { container } = render( <AnalyticsDisconnectedNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
