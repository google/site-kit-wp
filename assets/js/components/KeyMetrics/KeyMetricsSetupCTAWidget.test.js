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
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from '@/js/components/KeyMetrics/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	fireEvent,
	muteFetch,
	provideGatheringDataState,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import KeyMetricsSetupCTAWidget from './KeyMetricsSetupCTAWidget';

jest.mock( 'react-use' );
mockUseIntersection.mockImplementation( () => ( {
	intersectionRatio: 1,
} ) );

describe( 'KeyMetricsSetupCTAWidget', () => {
	let registry;
	let oldLocation;
	const locationAssignMock = jest.fn();

	beforeAll( () => {
		oldLocation = global.location;
		delete global.location;
		global.location = Object.defineProperties(
			{},
			{
				assign: {
					configurable: true,
					value: locationAssignMock,
				},
			}
		);
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

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
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );
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
			}
		);
		await waitForRegistry();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when SC is in the gathering data state', async () => {
		mockSurveyEndpoints();

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
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
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		// The provideGatheringDataState() helper cannot handle the true case for Analytics 4, due to its dependence on additional state
		// that may vary between test scenarios. Therefore, we must manually set the state here. First, we set user authentication to false
		// to ensure "gathering data" can return true for the Analytics 4 module.
		provideUserAuthentication( registry, { authenticated: false } );

		// Then provide an empty report to ensure "gathering data" is true for Analytics 4.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{},
			{
				options: registry
					.select( MODULES_ANALYTICS_4 )
					.getSampleReportArgs(),
			}
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
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
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
			}
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-banner__title' )
		).toHaveTextContent(
			'Get personalized suggestions for user interaction metrics based on your goals'
		);
		const button = getByRole( 'button', { name: /get tailored metrics/i } );
		expect( button ).toBeInTheDocument();

		// Should also trigger a survey view.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				surveyTriggerEndpoint,
				expect.objectContaining( {
					body: {
						data: { triggerID: 'view_kmw_setup_cta' },
					},
				} )
			)
		);
	} );

	it( 'dismisses the item for this user when "Get tailored metrics" is clicked', async () => {
		mockSurveyEndpoints();

		const dismissItemEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-item'
		);
		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] ),
			status: 200,
		} );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
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

		const { getByRole, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		const button = getByRole( 'button', { name: /get tailored metrics/i } );
		fireEvent.click( button );

		// Item should be dismissed when either button is clicked.
		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );
	} );

	it( 'dismisses the item for this user when "Maybe later" is clicked', async () => {
		mockSurveyEndpoints();

		const dismissItemEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-item'
		);
		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] ),
			status: 200,
		} );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
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

		const { getByRole, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		const button = getByRole( 'button', { name: /maybe later/i } );
		fireEvent.click( button );

		// Item should be dismissed when the "Maybe later" button is clicked.
		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );
	} );

	it( 'dismisses the item for this user when "Select your own metrics" is clicked', async () => {
		mockSurveyEndpoints();

		const dismissItemEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-item'
		);
		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] ),
			status: 200,
		} );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
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

		const { getByRole, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		const button = getByRole( 'button', {
			name: /select your own metrics/i,
		} );
		fireEvent.click( button );

		// Item should be dismissed when the "Select your own metrics" link
		// is clicked.
		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );
	} );
} );
