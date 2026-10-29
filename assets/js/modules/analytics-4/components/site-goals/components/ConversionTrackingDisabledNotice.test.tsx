/**
 * Site Goals conversion tracking disabled notice tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { seedSiteGoalsBreakdownValuesReport } from '@/js/modules/analytics-4/components/site-goals/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModules,
	provideUserCapabilities,
	render,
	waitFor,
} from '@tests/js/test-utils';
import ConversionTrackingDisabledNotice from './ConversionTrackingDisabledNotice';

describe( 'ConversionTrackingDisabledNotice', () => {
	let registry: WPDataRegistry;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'analyticsSiteGoalsConversionTrackingDisabledNotice'
	);

	const conversionTrackingEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/conversion-tracking'
	);

	const TITLE = 'Plugin conversion tracking is disabled';

	function provideState( {
		conversionTracking = false,
		leadBreakdownValues = [ '5' ],
	}: {
		conversionTracking?: boolean;
		leadBreakdownValues?: string[];
	} = {} ) {
		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: conversionTracking,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
			availableCustomDimensions: [
				'googlesitekit_event_provider',
				'googlesitekit_form_id',
			],
			detectedEvents: [ 'purchase', 'contact' ],
		} );
		seedSiteGoalsBreakdownValuesReport(
			registry,
			GOAL_TYPES.ECOMMERCE,
			[]
		);
		seedSiteGoalsBreakdownValuesReport(
			registry,
			GOAL_TYPES.LEAD,
			leadBreakdownValues
		);
	}

	function renderNotice() {
		return render(
			<ConversionTrackingDisabledNotice
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{ registry }
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	} );

	it( 'renders nothing while conversion tracking is on', () => {
		provideState( { conversionTracking: true } );

		const { queryByText } = renderNotice();

		expect( queryByText( TITLE ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing when the widgets have never shown breakdown tabs', () => {
		provideState( { leadBreakdownValues: [] } );

		const { queryByText } = renderNotice();

		expect( queryByText( TITLE ) ).not.toBeInTheDocument();
	} );

	it( 'renders the notice with the "Enable tracking" button for an admin', () => {
		provideState();

		const { getByText, getByRole, queryByRole, container } = renderNotice();

		expect( getByText( TITLE ) ).toBeInTheDocument();
		expect(
			getByText(
				/so the breakdown in this section has stopped updating\. Enable plugin conversion tracking to keep it up to date\./
			)
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Enable tracking' } )
		).toBeInTheDocument();
		// The notice cannot be dismissed.
		expect(
			queryByRole( 'button', { name: /Got it|Dismiss/ } )
		).toBeNull();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-conversion-tracking-disabled-notice'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the notice without a button for a view-only user', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );
		provideState();

		const { getByText, queryByRole } = renderNotice();

		expect( getByText( TITLE ) ).toBeInTheDocument();
		expect(
			getByText(
				/Ask a site admin to enable plugin conversion tracking to keep it up to date\./
			)
		).toBeInTheDocument();
		expect( queryByRole( 'button' ) ).toBeNull();
	} );

	it( 'switches conversion tracking on and hides the notice when "Enable tracking" is clicked', async () => {
		provideState();
		fetchMock.postOnce( conversionTrackingEndpoint, {
			body: { enabled: true },
			status: 200,
		} );

		const { getByRole, queryByText } = renderNotice();

		fireEvent.click( getByRole( 'button', { name: 'Enable tracking' } ) );

		await waitFor( () => {
			expect( queryByText( TITLE ) ).not.toBeInTheDocument();
		} );

		expect( fetchMock ).toHaveFetched( conversionTrackingEndpoint, {
			method: 'POST',
			body: { data: { settings: { enabled: true } } },
		} );
		expect(
			registry.select( CORE_SITE ).isConversionTrackingEnabled()
		).toBe( true );
	} );

	it( 'should keep the notice with a disabled button while saving', () => {
		provideState();
		freezeFetch( conversionTrackingEndpoint );

		const { getByRole, getByText } = renderNotice();

		fireEvent.click( getByRole( 'button', { name: 'Enable tracking' } ) );

		expect( getByText( TITLE ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Enable tracking' } )
		).toBeDisabled();
	} );

	it( 'resets the setting and keeps the notice when saving fails', async () => {
		provideState();
		fetchMock.postOnce( conversionTrackingEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole, getByText } = renderNotice();

		fireEvent.click( getByRole( 'button', { name: 'Enable tracking' } ) );

		await waitFor( () => {
			expect(
				getByRole( 'button', { name: 'Enable tracking' } )
			).not.toBeDisabled();
		} );

		expect( console ).toHaveErrored();
		expect( getByText( TITLE ) ).toBeInTheDocument();
		expect(
			registry.select( CORE_SITE ).isConversionTrackingEnabled()
		).toBe( false );
	} );
} );
