/**
 * KeyMetricsSetupCTAWidget component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Internal dependencies
 */
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from './constants';

describe( 'KeyMetricsSetupCTAWidget', () => {
	// The following would have been imports but are eventually required within the setup method
	// below. This allows us to set the global values needed before the modules within the
	// registry are setup.
	let KeyMetricsSetupCTAWidget;
	let getWidgetComponentProps;
	let act;
	let render;
	let createTestRegistry;
	let provideModules;
	let provideSiteInfo;
	let fireEvent;

	let registry;
	let Widget;
	let WidgetNull;

	async function setupTestWithDataAvailableValues(
		isSearchConsoleDataAvailable,
		isAnalytics4DataAvailable
	) {
		jest.resetModules();

		global._googlesitekitModulesData = {
			'data_available_search-console': isSearchConsoleDataAvailable,
			'data_available_analytics-4': isAnalytics4DataAvailable,
		};

		KeyMetricsSetupCTAWidget =
			require( './KeyMetricsSetupCTAWidget' ).default;

		( {
			act,
			render,
			createTestRegistry,
			provideModules,
			provideSiteInfo,
			fireEvent,
		} = require( '../../../../tests/js/test-utils' ) );

		( {
			getWidgetComponentProps,
		} = require( '../../googlesitekit/widgets/util' ) );

		( { Widget, WidgetNull } =
			getWidgetComponentProps( 'keyMetricsSetupCTA' ) );

		registry = createTestRegistry();

		provideSiteInfo( registry, { homeURL: 'http://example.com' } );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );
	}

	it( 'does not render when GA4 is not connected', async () => {
		setupTestWithDataAvailableValues( true, true );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when SC is in the gathering data state', async () => {
		setupTestWithDataAvailableValues( false, true );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when GA4 is in the gathering data state', async () => {
		setupTestWithDataAvailableValues( true, false );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does render the CTA when SC and GA4 are both connected', async () => {
		setupTestWithDataAvailableValues( true, true );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const { container, getByRole, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).toHaveTextContent(
			'Get metrics and suggestions tailored to your specific site goals'
		);
		const button = getByRole( 'button', { name: /get tailored metrics/i } );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-user-input'
		);
	} );

	it( 'does not render when dismissed', async () => {
		setupTestWithDataAvailableValues( true, true );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when dismissed and the tooltip is visible', async () => {
		setupTestWithDataAvailableValues( true, true );

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] ),
				status: 200,
			}
		);

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const { container, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<KeyMetricsSetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>
			</div>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).toHaveTextContent(
			'Get metrics and suggestions tailored to your specific site goals'
		);

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				container.querySelectorAll(
					'button.googlesitekit-cta-link'
				)[ 1 ]
			);
		} );

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).not.toBeInTheDocument();

		expect(
			document.querySelector( '.googlesitekit-tour-tooltip' )
		).toBeInTheDocument();
	} );
} );
