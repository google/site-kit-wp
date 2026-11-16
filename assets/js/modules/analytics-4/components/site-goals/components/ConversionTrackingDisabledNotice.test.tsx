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
import { provideSiteGoalsBreakdownInUse } from '@/js/modules/analytics-4/components/site-goals/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModules,
	provideSiteInfo,
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
		provideSiteGoalsBreakdownInUse( registry, leadBreakdownValues );
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
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	} );

	it( 'should render nothing while conversion tracking is on', () => {
		provideState( { conversionTracking: true } );

		const { container } = renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when the widgets have never shown breakdown tabs', () => {
		provideState( { leadBreakdownValues: [] } );

		const { container } = renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the notice with the "Enable tracking" button for an admin', () => {
		provideState();

		const { getByText, getByRole, queryByRole, container } = renderNotice();

		expect(
			getByText( 'Plugin conversion tracking is disabled' )
		).toBeInTheDocument();
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

	it( 'should render the notice without a button for a view-only user', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );
		provideState();

		const { getByText, queryByRole } = renderNotice();

		expect(
			getByText( 'Plugin conversion tracking is disabled' )
		).toBeInTheDocument();
		expect(
			getByText(
				/Ask a site admin to enable plugin conversion tracking to keep it up to date\./
			)
		).toBeInTheDocument();
		expect( queryByRole( 'button' ) ).toBeNull();
	} );

	it( 'should switch conversion tracking on and hide the notice when "Enable tracking" is clicked', async () => {
		provideState();
		fetchMock.postOnce( conversionTrackingEndpoint, {
			body: { enabled: true },
			status: 200,
		} );

		const { getByRole, queryByText } = renderNotice();

		fireEvent.click( getByRole( 'button', { name: 'Enable tracking' } ) );

		await waitFor( () => {
			expect(
				queryByText( 'Plugin conversion tracking is disabled' )
			).not.toBeInTheDocument();
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

		expect(
			getByText( 'Plugin conversion tracking is disabled' )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Enable tracking' } )
		).toBeDisabled();
	} );

	it( 'should reset the setting and show an error notice with a help link and a Retry button when saving fails', async () => {
		provideState();
		fetchMock.postOnce( conversionTrackingEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole, findByText, getByText, queryByText } =
			renderNotice();

		fireEvent.click( getByRole( 'button', { name: 'Enable tracking' } ) );

		expect(
			await findByText( 'Enabling plugin conversion tracking failed' )
		).toBeInTheDocument();
		expect( console ).toHaveErrored();
		expect(
			getByText(
				/There was a problem enabling plugin conversion tracking\./
			)
		).toBeInTheDocument();
		expect( getByRole( 'link', { name: /get help/i } ) ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?error_id=internal_server_error'
		);
		expect( getByRole( 'button', { name: 'Retry' } ) ).not.toBeDisabled();
		expect(
			queryByText( 'Plugin conversion tracking is disabled' )
		).not.toBeInTheDocument();
		expect(
			registry.select( CORE_SITE ).isConversionTrackingEnabled()
		).toBe( false );
	} );

	it( 'should switch conversion tracking on and hide the notice when Retry succeeds', async () => {
		provideState();
		fetchMock.postOnce( conversionTrackingEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole, findByRole, queryByText } = renderNotice();

		fireEvent.click( getByRole( 'button', { name: 'Enable tracking' } ) );

		const retryButton = await findByRole( 'button', { name: 'Retry' } );
		expect( console ).toHaveErrored();

		fetchMock.postOnce( conversionTrackingEndpoint, {
			body: { enabled: true },
			status: 200,
		} );

		fireEvent.click( retryButton );

		await waitFor( () => {
			expect(
				queryByText( 'Enabling plugin conversion tracking failed' )
			).not.toBeInTheDocument();
		} );

		expect(
			queryByText( 'Plugin conversion tracking is disabled' )
		).not.toBeInTheDocument();
		expect(
			registry.select( CORE_SITE ).isConversionTrackingEnabled()
		).toBe( true );
	} );
} );
