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
} from '../../../tests/js/test-utils';
import {
	provideModules,
	provideUserAuthentication,
} from '../../../tests/js/utils';
import { provideGatheringDataState } from '../../../tests/js/gathering-data-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import WelcomeModal from './WelcomeModal';

const WITH_TOUR_DISMISSED_ITEM_SLUG = 'welcome-modal-with-tour';
const GATHERING_DATA_DISMISSED_ITEM_SLUG = 'welcome-modal-gathering-data';

describe( 'WelcomeModal', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

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

				// Model the responses for the two POST requests to `dismiss-item`.
				fetchMock.postOnce( dismissItemEndpoint, {
					body: [ WITH_TOUR_DISMISSED_ITEM_SLUG ],
					status: 200,
				} );

				fetchMock.postOnce( dismissItemEndpoint, {
					body: [
						WITH_TOUR_DISMISSED_ITEM_SLUG,
						GATHERING_DATA_DISMISSED_ITEM_SLUG,
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
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
				) as any;

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
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
				) as any;

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					expect( fetchMock ).toHaveFetchedTimes( 2 );
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: WITH_TOUR_DISMISSED_ITEM_SLUG,
							expiration: 0,
						},
					},
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: GATHERING_DATA_DISMISSED_ITEM_SLUG,
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

			// Model the responses for the two POST requests to `dismiss-item`.
			fetchMock.postOnce( dismissItemEndpoint, {
				body: [ WITH_TOUR_DISMISSED_ITEM_SLUG ],
				status: 200,
			} );

			fetchMock.postOnce( dismissItemEndpoint, {
				body: [
					WITH_TOUR_DISMISSED_ITEM_SLUG,
					GATHERING_DATA_DISMISSED_ITEM_SLUG,
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
				tooltipSlug: 'dashboard-tour',
				title: 'You can always take the dashboard tour from the help menu',
				dismissLabel: 'Got it',
			} );
		}
	);

	it( 'should not show a tooltip when the data available variant is closed by the "Start tour" button', async () => {
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

		// Model the responses for the two POST requests to `dismiss-item`.
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ WITH_TOUR_DISMISSED_ITEM_SLUG ],
			status: 200,
		} );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [
				WITH_TOUR_DISMISSED_ITEM_SLUG,
				GATHERING_DATA_DISMISSED_ITEM_SLUG,
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

	it( 'should not show the data available variant when it has been dismissed', async () => {
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
			.receiveGetDismissedItems( [ WITH_TOUR_DISMISSED_ITEM_SLUG ] );

		const { container, waitForRegistry } = render( <WelcomeModal />, {
			registry,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		} ) as any;

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

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

				fetchMock.postOnce( dismissItemEndpoint, {
					body: [ GATHERING_DATA_DISMISSED_ITEM_SLUG ],
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
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
				) as any;

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
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
				) as any;

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: GATHERING_DATA_DISMISSED_ITEM_SLUG,
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

				expect( tooltipState ).toBeUndefined();
			} );
		}
	);

	it( 'should not show the gathering data variant when it has been dismissed', async () => {
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
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ GATHERING_DATA_DISMISSED_ITEM_SLUG ] );

		const { container, waitForRegistry } = render( <WelcomeModal />, {
			registry,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		} ) as any;

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

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
			.receiveGetDismissedItems( [ GATHERING_DATA_DISMISSED_ITEM_SLUG ] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

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
			.receiveGetDismissedItems( [ GATHERING_DATA_DISMISSED_ITEM_SLUG ] );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

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
						GATHERING_DATA_DISMISSED_ITEM_SLUG,
					] );

				fetchMock.postOnce( dismissItemEndpoint, {
					body: [ WITH_TOUR_DISMISSED_ITEM_SLUG ],
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
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
				) as any;

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
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
				) as any;

				await waitForRegistry();

				const closeButton = getByRole( 'button', { name: buttonText } );
				fireEvent.click( closeButton );

				await waitFor( () => {
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				} );

				expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
					body: {
						data: {
							slug: WITH_TOUR_DISMISSED_ITEM_SLUG,
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
					GATHERING_DATA_DISMISSED_ITEM_SLUG,
				] );

			fetchMock.postOnce( dismissItemEndpoint, {
				body: [ WITH_TOUR_DISMISSED_ITEM_SLUG ],
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
				tooltipSlug: 'dashboard-tour',
				title: 'You can always take the dashboard tour from the help menu',
				dismissLabel: 'Got it',
			} );
		}
	);

	it( 'should not show a tooltip when the data gathering complete variant is closed by the "Start tour" button', async () => {
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
			.receiveGetDismissedItems( [ GATHERING_DATA_DISMISSED_ITEM_SLUG ] );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ WITH_TOUR_DISMISSED_ITEM_SLUG ],
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

	it( 'should not show the data gathering complete variant when it has been dismissed', async () => {
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
				GATHERING_DATA_DISMISSED_ITEM_SLUG,
				WITH_TOUR_DISMISSED_ITEM_SLUG,
			] );

		const { container, waitForRegistry } = render( <WelcomeModal />, {
			registry,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		} ) as any;

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );
} );
