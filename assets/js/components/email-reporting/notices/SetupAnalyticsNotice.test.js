/**
 * SetupAnalyticsNotice component tests.
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
import { waitFor, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	render,
	fireEvent,
	provideModules,
	provideUserCapabilities,
	provideUserAuthentication,
	provideModuleRegistrations,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { mockLocation } from '../../../../../tests/js/mock-browser-utils';
import SetupAnalyticsNotice, {
	EMAIL_REPORTING_SETUP_ANALYTICS_NOTICE_DISMISSED_ITEM,
} from './SetupAnalyticsNotice';

describe( 'SetupAnalyticsNotice', () => {
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
				disconnectedAt: false,
			},
		] );
		provideModuleRegistrations( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
	} );

	it( 'renders the notice when email reporting is enabled, analytics is disconnected and was never connected before and notice is not dismissed', () => {
		const { getByText } = render( <SetupAnalyticsNotice />, {
			registry,
		} );

		// Title and description should be present.
		expect(
			getByText( /Understand how visitors interact with your content/i )
		).toBeInTheDocument();
		expect(
			getByText(
				/Get visitor insights in your email report by connecting Analytics./i
			)
		).toBeInTheDocument();
	} );

	it( 'renders the "Connect Analytics" button and activates the module on click', async () => {
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

		const { getByRole } = render( <SetupAnalyticsNotice />, {
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

	it( 'dismisses the notice when "Maybe later" is clicked', async () => {
		// Create a fresh registry without module registrations to avoid
		// async resolver state updates that cause act() warnings.
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

		// Note: Intentionally not calling `provideModuleRegistrations` here
		// to prevent the Analytics 4 store resolver from running.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry
			.dispatch( CORE_SITE )
			.receiveGetWasAnalytics4Connected( { wasConnected: false } );

		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [ EMAIL_REPORTING_SETUP_ANALYTICS_NOTICE_DISMISSED_ITEM ],
		} );

		const { getByRole } = render( <SetupAnalyticsNotice />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /maybe later/i } ) );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( fetchDismissItem )
		);
	} );

	it( 'does not render when analytics is active', () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				disconnectedAt: false,
			},
		] );
		const { container } = render( <SetupAnalyticsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when analytics is disconnected but was connected before', () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
				disconnectedAt: 1735660800,
			},
		] );

		const { container } = render( <SetupAnalyticsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows spinner and disabled state while the activation is in progress', async () => {
		const moduleActivationEndpoint = RegExp(
			'google-site-kit/v1/core/modules/data/activation'
		);

		const userAuthenticationEndpoint = RegExp(
			'^/google-site-kit/v1/core/user/data/authentication'
		);

		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		// Use a never-resolving promise to keep the activation in progress.
		fetchMock.postOnce( moduleActivationEndpoint, new Promise( () => {} ) );

		const { getByRole } = render( <SetupAnalyticsNotice />, {
			registry,
		} );

		const ctaButton = getByRole( 'button', {
			name: /connect analytics/i,
		} );

		fireEvent.click( ctaButton );

		// Wait for the spinner to appear.
		await waitFor( () => {
			expect( ctaButton ).toHaveAttribute( 'disabled' );
		} );

		// Verify the button contains the spinner (via the CSS class).
		expect( ctaButton ).toHaveClass(
			'googlesitekit-notice__cta--spinner__running'
		);
	} );

	it( 'shows "Complete setup" CTA and skips activation when Analytics is active but not connected', async () => {
		// Create a fresh registry with Analytics active but not connected.
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry
			.dispatch( CORE_SITE )
			.receiveGetWasAnalytics4Connected( { wasConnected: false } );

		const moduleActivationEndpoint = RegExp(
			'google-site-kit/v1/core/modules/data/activation'
		);

		const { getByRole } = render( <SetupAnalyticsNotice />, {
			registry,
		} );

		// Verify the CTA label is "Complete setup".
		const ctaButton = getByRole( 'button', {
			name: /complete setup/i,
		} );

		expect( ctaButton ).toBeInTheDocument();

		await act( async () => {
			fireEvent.click( ctaButton );
			await waitForDefaultTimeouts();
		} );

		// Verify that the activation endpoint was NOT called.
		expect( fetchMock ).not.toHaveFetched( moduleActivationEndpoint );
	} );

	it( 'shows external link indicator on the "Learn more" link', () => {
		const { container } = render( <SetupAnalyticsNotice />, {
			registry,
		} );

		// Find the link by looking for the external icon SVG.
		const externalIcon = container.querySelector(
			'.googlesitekit-cta-link svg'
		);
		expect( externalIcon ).toBeInTheDocument();
	} );
} );
