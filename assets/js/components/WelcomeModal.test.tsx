/**
 * WelcomeModal component tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from 'tests/js/test-utils';
import {
	freezeFetch,
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
} from 'tests/js/utils';
import { provideGatheringDataState } from 'tests/js/gathering-data-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
	WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { getWelcomeTour } from '@/js/feature-tours/welcome';
import { useWelcomeTour } from '@/js/feature-tours/hooks/useWelcomeTour';
import WelcomeModal from './WelcomeModal';
import { type WPDataRegistry } from '@/js/googlesitekit-data';
import * as tracking from '@/js/util/tracking';
import { setItem } from '@/js/googlesitekit/api/cache';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const mockWelcomeTour = getWelcomeTour( {
	isViewOnly: false,
	canAuthenticate: true,
	isAnalyticsConnected: false,
	isActivateAnalyticsNotificationPresent: false,
	windowHeight: global.innerHeight,
} );

jest.mock( '@/js/feature-tours/hooks/useWelcomeTour' );

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: () => ( {
		isIntersecting: true,
		intersectionRatio: 1,
	} ),
} ) );

describe( 'WelcomeModal', () => {
	let registry: WPDataRegistry;

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	function provideDataAvailableVariantData() {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	}

	function provideGatheringDataVariantData() {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
		} );

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	}

	function provideDataGatheringCompleteVariantData() {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
			] );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: true,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );

		jest.mocked( useWelcomeTour ).mockReturnValue( mockWelcomeTour );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should show the data available variant when Analytics is connected and not gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Initial setup complete! Take a look at the special features Site Kit added to your dashboard based on your site goals'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Start tour' } )
		).toBeInTheDocument();
	} );

	it( 'should show the data available variant when Analytics is not connected and Search Console is not gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Initial setup complete! Take a look at the special features Site Kit added to your dashboard based on your site goals'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Start tour' } )
		).toBeInTheDocument();
	} );

	describe.each( [ 'Start tour', 'Maybe later', 'Close' ] )(
		'when the "%s" button is clicked for the data available variant',
		( buttonText ) => {
			beforeEach( () => {
				provideDataAvailableVariantData();

				// Model the responses for the two POST requests to `dismiss-item`.
				fetchMock.postOnce( dismissItemEndpoint, {
					body: [ WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG ],
					status: 200,
				} );

				fetchMock.postOnce( dismissItemEndpoint, {
					body: [
						WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
						WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
					],
					status: 200,
				} );
			} );

			it( 'should close the modal', async () => {
				const { container, getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					// Wait for the dismissal to complete.
					expect( fetchMock ).toHaveFetchedTimes( 2 );
				} );

				expect( container ).toBeEmptyDOMElement();
			} );

			it( 'should dismiss the items for both the with-tour and gathering data variants', async () => {
				const { getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					expect( fetchMock ).toHaveFetchedTimes( 2 );
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
							expiration: 0,
						},
					},
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
							expiration: 0,
						},
					},
				} );
			} );
		}
	);

	it.each( [ 'Maybe later', 'Close' ] )(
		'should show a tooltip when the data available variant is closed by the "%s" button',
		async ( buttonText ) => {
			provideDataAvailableVariantData();

			// Model the responses for the two POST requests to `dismiss-item`.
			fetchMock.postOnce( dismissItemEndpoint, {
				body: [ WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG ],
				status: 200,
			} );

			fetchMock.postOnce( dismissItemEndpoint, {
				body: [
					WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
					WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
				],
				status: 200,
			} );

			const { getByRole, waitForRegistry } = render(
				<WelcomeModal />,
				{
					registry,
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
			) as any;

			await waitForRegistry();

			const closeButton = getByRole( 'button', { name: buttonText } );
			fireEvent.click( closeButton );

			await waitFor( () => {
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			const tooltipState = registry
				.select( CORE_UI )
				.getValue( 'admin-screen-tooltip' );

			expect( tooltipState ).toMatchObject( {
				isTooltipVisible: true,
				tooltipSlug: 'welcome-modal',
				title: 'You can always take the dashboard tour from the help menu',
				dismissLabel: 'Got it',
			} );
		}
	);

	it( 'should not show a tooltip when the data available variant is closed by the "Start tour" button', async () => {
		provideDataAvailableVariantData();

		// Model the responses for the two POST requests to `dismiss-item`.
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG ],
			status: 200,
		} );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [
				WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
			],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render( <WelcomeModal />, {
			registry,
		} );

		await waitForRegistry();

		const closeButton = getByRole( 'button', { name: 'Start tour' } );
		fireEvent.click( closeButton );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		const tooltipState = registry
			.select( CORE_UI )
			.getValue( 'admin-screen-tooltip' );

		expect( tooltipState ).toBeUndefined();
	} );

	it( 'should trigger the dashboard tour when the "Start tour" button is clicked', async () => {
		provideDataAvailableVariantData();

		// Model the responses for the two POST requests to `dismiss-item`.
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG ],
			status: 200,
		} );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [
				WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
			],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render( <WelcomeModal />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: 'Start tour' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		expect( registry.select( CORE_USER ).getCurrentTour() ).toEqual(
			mockWelcomeTour
		);
	} );

	it( 'should show the gathering data variant when Analytics is connected and gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

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

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				/Site Kit is gathering data and soon metrics for your site will show on your dashboard/
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Get started' } )
		).toBeInTheDocument();
	} );

	it( 'should show the gathering data variant when Analytics is not connected and Search Console is gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				/Site Kit is gathering data and soon metrics for your site will show on your dashboard/
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Get started' } )
		).toBeInTheDocument();
	} );

	describe.each( [ 'Get started', 'Close' ] )(
		'when the "%s" button is clicked for the gathering data variant',
		( buttonText ) => {
			beforeEach( () => {
				provideGatheringDataVariantData();

				fetchMock.postOnce( dismissItemEndpoint, {
					body: [ WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG ],
					status: 200,
				} );
			} );

			// eslint-disable-next-line jest/no-identical-title -- The nested describe block distinguishes the test titles.
			it( 'should close the modal', async () => {
				const { container, getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const closeButton = getByRole( 'button', {
					name: buttonText,
				} );
				fireEvent.click( closeButton );

				await waitFor( () => {
					// Wait for the dismissal to complete.
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				} );

				expect( container ).toBeEmptyDOMElement();
			} );

			it( 'should dismiss the item for the gathering data variant', async () => {
				const { getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
							expiration: 0,
						},
					},
				} );
			} );

			it( 'should not show a tooltip', async () => {
				const { getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				} );

				const tooltipState = registry
					.select( CORE_UI )
					.getValue( 'admin-screen-tooltip' );

				expect( tooltipState ).toBeUndefined();
			} );
		}
	);

	it( 'should show the data gathering complete variant when Analytics is connected and not gathering data, and the gathering data variant has been dismissed', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
			] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Take this quick tour to see the most important parts of your dashboard. It will show you where to look to track your site’s success as you get more visitors.'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Start tour' } )
		).toBeInTheDocument();
	} );

	it( 'should show the data gathering complete variant when Analytics is not connected and Search Console is not gathering data, and the gathering data variant has been dismissed', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
			] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Take this quick tour to see the most important parts of your dashboard. It will show you where to look to track your site’s success as you get more visitors.'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Start tour' } )
		).toBeInTheDocument();
	} );

	describe.each( [ 'Start tour', 'Maybe later', 'Close' ] )(
		'when the "%s" button is clicked for the data gathering complete variant',
		( buttonText ) => {
			beforeEach( () => {
				provideDataGatheringCompleteVariantData();

				fetchMock.postOnce( dismissItemEndpoint, {
					body: [ WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG ],
					status: 200,
				} );
			} );

			// eslint-disable-next-line jest/no-identical-title -- The nested describe block distinguishes the test titles.
			it( 'should close the modal', async () => {
				const { container, getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					// Wait for the dismissal to complete.
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				} );

				expect( container ).toBeEmptyDOMElement();
			} );

			it( 'should dismiss the item for the with-tour variants', async () => {
				const { getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
							expiration: 0,
						},
					},
				} );
			} );
		}
	);

	it.each( [ 'Maybe later', 'Close' ] )(
		'should show a tooltip when the data gathering complete variant is closed by the "%s" button',
		async ( buttonText ) => {
			provideDataGatheringCompleteVariantData();

			fetchMock.postOnce( dismissItemEndpoint, {
				body: [ WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG ],
				status: 200,
			} );

			const { getByRole, waitForRegistry } = render(
				<WelcomeModal />,
				{
					registry,
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
			) as any;

			await waitForRegistry();

			const closeButton = getByRole( 'button', { name: buttonText } );
			fireEvent.click( closeButton );

			await waitFor( () => {
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			const tooltipState = registry
				.select( CORE_UI )
				.getValue( 'admin-screen-tooltip' );

			expect( tooltipState ).toMatchObject( {
				isTooltipVisible: true,
				tooltipSlug: 'welcome-modal',
				title: 'You can always take the dashboard tour from the help menu',
				dismissLabel: 'Got it',
			} );
		}
	);

	it( 'should not show a tooltip when the data gathering complete variant is closed by the "Start tour" button', async () => {
		provideDataGatheringCompleteVariantData();

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render( <WelcomeModal />, {
			registry,
		} );

		await waitForRegistry();

		const closeButton = getByRole( 'button', { name: 'Start tour' } );
		fireEvent.click( closeButton );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );

		const tooltipState = registry
			.select( CORE_UI )
			.getValue( 'admin-screen-tooltip' );

		expect( tooltipState ).toBeUndefined();
	} );

	describe.each( [
		{
			variant: 'data available',
			expectedLabel: 'default',
			provideData: provideDataAvailableVariantData,
			confirmationButton: 'Start tour',
			dismissalButtons: [ 'Maybe later', 'Close' ],
		},
		{
			variant: 'gathering data',
			expectedLabel: 'gathering_data',
			provideData: provideGatheringDataVariantData,
			confirmationButton: 'Get started',
			dismissalButtons: [ 'Close' ],
		},
		{
			variant: 'data gathering complete',
			expectedLabel: 'data_available',
			provideData: provideDataGatheringCompleteVariantData,
			confirmationButton: 'Start tour',
			dismissalButtons: [ 'Maybe later', 'Close' ],
		},
	] )(
		'when the $variant variant of the welcome modal is shown',
		( {
			expectedLabel,
			provideData,
			confirmationButton,
			dismissalButtons,
		} ) => {
			beforeEach( () => {
				provideData();
				freezeFetch( dismissItemEndpoint );
			} );

			it( 'should track the `setup_flow_v3_complete_site_setup` and `setup_flow_v3_complete_user_setup` events only once', async () => {
				await setItem( 'start_site_setup', true );
				await setItem( 'start_user_setup', true );

				const { waitForRegistry } = render( <WelcomeModal />, {
					registry,
					viewContext: 'test-context',
				} );

				await waitForRegistry();

				// The `view_notice` event is also tracked on view.
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 3 );
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'test-context_setup',
					'setup_flow_v3_complete_site_setup'
				);
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'test-context_setup',
					'setup_flow_v3_complete_user_setup'
				);

				mockTrackEvent.mockClear();

				render( <WelcomeModal />, {
					registry,
					viewContext: 'test-context',
				} );

				// Only the `view_notice` event should be tracked the second time the modal is shown.
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'test-context_welcome-modal',
					'view_notice',
					expectedLabel
				);
			} );

			it( 'should track the `view_notice` event with the correct label', async () => {
				const { waitForRegistry } = render( <WelcomeModal />, {
					registry,
					viewContext: 'test-context',
				} );

				await waitForRegistry();

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'test-context_welcome-modal',
					'view_notice',
					expectedLabel
				);
			} );

			it( `should track the \`confirm_notice\` event when the \`${ confirmationButton }\` button is clicked`, async () => {
				const { getByRole, waitForRegistry } = render(
					<WelcomeModal />,
					{
						registry,
						viewContext: 'test-context',
					}
				);

				await waitForRegistry();

				mockTrackEvent.mockClear();

				fireEvent.click(
					getByRole( 'button', {
						name: confirmationButton,
					} )
				);

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'test-context_welcome-modal',
					'confirm_notice',
					expectedLabel
				);
			} );

			it.each( dismissalButtons )(
				'should track the `dismiss_notice` event when the `%s` button is clicked',
				async ( button ) => {
					const { getByRole, waitForRegistry } = render(
						<WelcomeModal />,
						{
							registry,
							viewContext: 'test-context',
						}
					);

					await waitForRegistry();

					mockTrackEvent.mockClear();

					fireEvent.click(
						getByRole( 'button', {
							name: button,
						} )
					);

					expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
					expect( mockTrackEvent ).toHaveBeenCalledWith(
						'test-context_welcome-modal',
						'dismiss_notice',
						expectedLabel
					);
				}
			);
		}
	);
} );
