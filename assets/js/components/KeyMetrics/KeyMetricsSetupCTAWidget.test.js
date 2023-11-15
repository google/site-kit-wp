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
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import KeyMetricsSetupCTAWidget from './KeyMetricsSetupCTAWidget';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from './constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { getWidgetComponentProps } from '../../googlesitekit/widgets/util';
import {
	act,
	render,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	muteFetch,
	provideGatheringDataState,
	provideUserAuthentication,
	getAnalytics4HasZeroDataReportOptions,
	fireEvent,
	waitFor,
} from '../../../../tests/js/test-utils';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../tests/js/mock-survey-endpoints';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER } from '../../modules/analytics-4/constants';

jest.mock( 'react-use' );
mockUseIntersection.mockImplementation( () => ( {
	intersectionRatio: 1,
} ) );

describe( 'KeyMetricsSetupCTAWidget', () => {
	let registry;

	const { Widget, WidgetNull } =
		getWidgetComponentProps( 'keyMetricsSetupCTA' );

	beforeEach( async () => {
		registry = createTestRegistry();

		provideSiteInfo( registry, { homeURL: 'http://example.com' } );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/data-available'
			)
		);

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);
	} );

	it( 'does not render when GA4 is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		provideGatheringDataState( registry, { 'search-console': false } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'keyMetrics' ],
			}
		);
		await waitForRegistry();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when SC is in the gathering data state', async () => {
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

		provideGatheringDataState( registry, {
			'search-console': true,
			'analytics-4': false,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'keyMetrics' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when GA4 is in the gathering data state', async () => {
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

		provideGatheringDataState( registry, {
			'search-console': false,
		} );

		// The provideGatheringDataState() helper cannot handle the true case for Analytics 4, due to its dependence on additional state
		// that may vary between test scenarios. Therefore, we must manually set the state here. First, we set user authentication to false
		// to ensure "gathering data" can return true for the Analytics 4 module.
		provideUserAuthentication( registry, { authenticated: false } );

		// Then provide an empty report to ensure "gathering data" is true for Analytics 4.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{},
				{ options: getAnalytics4HasZeroDataReportOptions( registry ) }
			);
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'keyMetrics' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does render the CTA when SC and GA4 are both connected', async () => {
		mockSurveyEndpoints();

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
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		const { container, getByRole, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'keyMetrics' ],
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

		// Should also trigger a survey view.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: { triggerID: 'view_kmw_setup_cta' },
				},
			} )
		);
	} );

	it( 'does not render when dismissed', async () => {
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
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

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
				features: [ 'keyMetrics' ],
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when dismissed and the tooltip is visible', async () => {
		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] ),
				status: 200,
			}
		);

		mockSurveyEndpoints();

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
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

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
				features: [ 'keyMetrics' ],
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

	it( 'should set the `HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER` state to true when the Key Metrics Setup CTA is rendered', async () => {
		mockSurveyEndpoints();

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
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'keyMetrics' ],
			}
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).toHaveTextContent(
			'Get metrics and suggestions tailored to your specific site goals'
		);

		expect(
			registry
				.select( CORE_UI )
				.getValue( HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER )
		).toBe( true );
	} );

	it( 'should maintain `HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER` state as true upon dismissal of the Key Metrics Setup CTA', async () => {
		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] ),
				status: 200,
			}
		);

		mockSurveyEndpoints();

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
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

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
				features: [ 'keyMetrics' ],
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).toHaveTextContent(
			'Get metrics and suggestions tailored to your specific site goals'
		);

		// Verify the `HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER` state is set before clicking the dismiss button.
		expect(
			registry
				.select( CORE_UI )
				.getValue( HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER )
		).toBe( true );

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

		// Verify the `HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER` state is maintained after clicking the dismiss button.
		expect(
			registry
				.select( CORE_UI )
				.getValue( HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER )
		).toBe( true );
	} );
} );
