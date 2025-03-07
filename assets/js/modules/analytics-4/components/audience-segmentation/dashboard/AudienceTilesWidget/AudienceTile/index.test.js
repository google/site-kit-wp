/**
 * AudienceTile component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { getByText as domGetByText } from '@testing-library/dom';

/**
 * Internal dependencies
 */
import AudienceTile from '.';
import {
	act,
	fireEvent,
	render,
} from '../../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	waitForDefaultTimeouts,
	waitForTimeouts,
} from '../../../../../../../../../tests/js/utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../../../googlesitekit/constants';
import { CORE_SITE } from '../../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../../../googlesitekit/widgets/util';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../../util/errors';
import * as tracking from '../../../../../../../util/tracking';
import {
	MODULES_ANALYTICS_4,
	DATE_RANGE_OFFSET,
} from '../../../../../datastore/constants';
import { provideCustomDimensionError } from '../../../../../utils/custom-dimensions';
import { getAnalytics4MockResponse } from '../../../../../utils/data-mock';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../../../../../../../tests/js/viewport-width-utils';
import { getPreviousDate } from '../../../../../../../util';
import { availableAudiences } from '../../../../../datastore/__fixtures__';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceTile', () => {
	let registry, originalViewportWidth;

	const WidgetWithComponentProps =
		withWidgetComponentProps( 'audienceTile' )( AudienceTile );

	const audienceResourceName = 'properties/12345/audiences/12345';
	const props = {
		audienceResourceName,
		audienceSlug: 'new-visitors',
		title: 'New visitors',
		infoTooltip: 'This is a tooltip',
		loaded: true,
		visitors: {
			metricValue: 24200,
			currentValue: 24200,
			previousValue: 20424,
		},
		visitsPerVisitor: {
			metricValue: 3,
			currentValue: 3,
			previousValue: 2,
		},
		pagesPerVisit: {
			metricValue: 2,
			currentValue: 2,
			previousValue: 3,
		},
		pageviews: {
			metricValue: 1565,
			currentValue: 1565,
			previousValue: 1504,
		},
		percentageOfTotalPageViews: 0.333,
		topCities: {
			dimensionValues: [
				{
					value: 'Dublin',
				},
				{
					value: 'London',
				},
				{
					value: 'New York',
				},
			],
			metricValues: [
				{
					value: 0.388,
				},
				{
					value: 0.126,
				},
				{
					value: 0.094,
				},
			],
			total: 0.608,
		},
		topContent: {
			dimensionValues: [
				{
					value: '/en/test-post-1/',
				},
				{
					value: '/en/test-post-2/',
				},
				{
					value: '/en/test-post-3/',
				},
			],
			metricValues: [
				{
					value: 847,
				},
				{
					value: 596,
				},
				{
					value: 325,
				},
			],
			total: 1768,
		},
		topContentTitles: {
			'/en/test-post-1/': 'Test Post 1',
		},
		isZeroData: false,
		isPartialData: false,
	};

	beforeEach( () => {
		originalViewportWidth = getViewportWidth();

		// Ensure the viewport is wide enough to render the tooltips.
		setViewportWidth( 1024 );

		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: false,
			intersectionRatio: 0,
		} ) );

		registry = createTestRegistry();
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableCustomDimensions: [],
			availableAudiencesLastSyncedAt: ( Date.now() - 1000 ) / 1000,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences,
		} );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const options = {
			...dates,
			dimensions: [ 'date' ],
			metrics: [
				{
					name: 'totalUsers',
				},
			],
		};
		const reportData = getAnalytics4MockResponse( options );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( reportData, {
			options,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					[ audienceResourceName ]: 20201220,
				},
				customDimension: {},
				property: {
					12345: 20201218,
				},
			} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
		setViewportWidth( originalViewportWidth );
	} );

	it( 'should render the AudienceTile component', () => {
		const { container } = render(
			<WidgetWithComponentProps { ...props } />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should track an event when the tooltip is viewed', async () => {
		const { container } = render(
			<WidgetWithComponentProps { ...props } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.mouseOver(
			container.querySelector( '.googlesitekit-info-tooltip' )
		);

		// Wait for the tooltip to appear, its delay is 100ms.
		await act( () => waitForTimeouts( 100 ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_audiences-tile',
			'view_tile_tooltip',
			'new-visitors'
		);
	} );

	describe( 'Top content metric', () => {
		it( 'should track an event when the create custom dimension CTA is viewed', () => {
			const { getByRole, rerender } = render(
				<WidgetWithComponentProps { ...props } />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect(
				getByRole( 'button', { name: /update/i } )
			).toBeInTheDocument();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps { ...props } /> );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-top-content-cta',
				'view_cta'
			);
		} );

		it( 'should track an event when the create custom dimension CTA is clicked', async () => {
			const { getByRole } = render(
				<WidgetWithComponentProps { ...props } />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /update/i } ) );

				// Allow the `trackEvent()` promise to resolve.
				await waitForDefaultTimeouts();
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-top-content-cta',
				'create_custom_dimension'
			);
		} );
	} );

	describe( 'Partial data badge', () => {
		beforeEach( () => {
			const referenceDate = registry
				.select( CORE_USER )
				.getReferenceDate();

			const dataAvailabilityDate = Number(
				getPreviousDate( referenceDate, 1 ).replace( /-/g, '' )
			);

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setResourceDataAvailabilityDate(
					audienceResourceName,
					'audience',
					dataAvailabilityDate
				);

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setResourceDataAvailabilityDate(
					'googlesitekit_post_type',
					'customDimension',
					dataAvailabilityDate
				);
		} );

		it( 'should render a partial data badge for the audience when the audience is in the partial data state', () => {
			const { container, getByText } = render(
				<WidgetWithComponentProps { ...props } isPartialData />,
				{
					registry,
				}
			);

			expect( getByText( 'Partial data' ) ).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render a partial data badge for the "Top content" metric area when the custom dimension is in the partial data state and the audience is not', () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setResourceDataAvailabilityDate(
					audienceResourceName,
					'audience',
					20201220
				);

			const { container } = render(
				<WidgetWithComponentProps { ...props } isPartialData />,
				{
					registry,
				}
			);

			expect(
				domGetByText(
					container.querySelector(
						'.googlesitekit-audience-segmentation-tile-metric--top-content'
					),
					'Partial data'
				)
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( "should track an event when the partial data badge for the audience's tooltip is viewed", async () => {
			const { container } = render(
				<WidgetWithComponentProps { ...props } isPartialData />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			fireEvent.mouseOver(
				container.querySelector(
					'.googlesitekit-audience-segmentation-partial-data-badge .googlesitekit-info-tooltip'
				)
			);

			// Wait for the tooltip to appear, its delay is 100ms.
			await act( () => waitForTimeouts( 100 ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-tile',
				'view_tile_partial_data_tooltip',
				'new-visitors'
			);
		} );

		it( "should track an event when the partial data badge for the 'Top content' metric area's tooltip is viewed", async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setResourceDataAvailabilityDate(
					audienceResourceName,
					'audience',
					20201220
				);

			const { container } = render(
				<WidgetWithComponentProps { ...props } isPartialData />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			fireEvent.mouseOver(
				container.querySelector(
					'.googlesitekit-audience-segmentation-tile-metric--top-content .googlesitekit-info-tooltip'
				)
			);

			// Wait for the tooltip to appear, its delay is 100ms.
			await act( () => waitForTimeouts( 100 ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-tile',
				'view_top_content_partial_data_tooltip',
				'new-visitors'
			);
		} );

		it( 'should not display partial data badge for tile or top content metrics when property is in partial state', () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			const { container } = render(
				<WidgetWithComponentProps { ...props } isPartialData />,
				{
					registry,
				}
			);

			expect(
				container.querySelector(
					'.googlesitekit-audience-segmentation-partial-data-badge'
				)
			).toBeNull();
		} );
	} );

	describe( 'with zero data, in the partial data state', () => {
		let container, getByRole, getByText, rerender;

		beforeEach( () => {
			( { container, getByRole, getByText, rerender } = render(
				<WidgetWithComponentProps
					{ ...props }
					isPartialData
					isZeroData
					isTileHideable
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			) );
		} );

		it( 'should render the zero data tile', () => {
			expect(
				getByText( 'Site Kit is collecting data for this group.' )
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should track an event when the tile is viewed', () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender(
				<WidgetWithComponentProps
					{ ...props }
					isPartialData
					isZeroData
					isTileHideable
				/>
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-tile',
				'view_tile_collecting_data',
				'new-visitors'
			);
		} );

		it( 'should track an event when the "Temporarily hide" button is clicked', async () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /temporarily hide/i } )
				);

				// Allow the `trackEvent()` promise to resolve.
				await waitForDefaultTimeouts();
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-tile',
				'temporarily_hide',
				'new-visitors'
			);
		} );

		it( 'should track an event when the tooltip is viewed', async () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			fireEvent.mouseOver(
				container.querySelector( '.googlesitekit-info-tooltip' )
			);

			// Wait for the tooltip to appear, its delay is 100ms.
			await act( () => waitForTimeouts( 100 ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-tile',
				'view_tile_tooltip',
				'new-visitors'
			);
		} );
	} );

	describe( 'AudienceErrorModal', () => {
		let getByRole, getByText;

		describe( 'OAuth error modal', () => {
			beforeEach( async () => {
				provideSiteInfo( registry, {
					setupErrorCode: 'access_denied',
				} );

				provideUserAuthentication( registry, {
					grantedScopes: [],
				} );

				( { getByRole, getByText } = render(
					<WidgetWithComponentProps { ...props } />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				) );

				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /update/i } )
					);

					// Allow the `trackEvent()` promise to resolve so the custom dimension creation logic can be executed.
					await waitForDefaultTimeouts();
				} );
			} );

			it( 'should show the modal when the required scopes are not granted', () => {
				// Verify the error is an OAuth error variant.
				expect(
					getByText( /Analytics update failed/i )
				).toBeInTheDocument();

				// Verify the "Get help" link is displayed.
				expect( getByText( /get help/i ) ).toBeInTheDocument();

				expect(
					getByRole( 'link', { name: /get help/i } )
				).toHaveAttribute(
					'href',
					registry
						.select( CORE_SITE )
						.getErrorTroubleshootingLinkURL( {
							code: 'access_denied',
						} )
				);

				// Verify the "Retry" button is displayed.
				expect(
					getByRole( 'button', { name: /retry/i } )
				).toBeInTheDocument();

				// Verify the "Cancel" button is displayed.
				expect(
					getByRole( 'button', { name: /cancel/i } )
				).toBeInTheDocument();
			} );

			it( 'should track an event when the Retry button is clicked', async () => {
				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /retry/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-top-content-cta',
					'auth_error_retry'
				);
			} );

			it( 'should track an event when the Cancel button is clicked', async () => {
				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /cancel/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-top-content-cta',
					'auth_error_cancel'
				);
			} );
		} );

		describe( 'insufficient permissions modal', () => {
			beforeEach( async () => {
				const error = {
					code: 'test_error',
					message: 'Error message.',
					data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
				};

				provideCustomDimensionError( registry, {
					customDimension: 'googlesitekit_post_type',
					error,
				} );

				( { getByRole, getByText } = render(
					<WidgetWithComponentProps { ...props } />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				) );

				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /update/i } )
					);

					// Allow the `trackEvent()` promise to resolve so the custom dimension creation logic can be executed.
					await waitForDefaultTimeouts();
				} );
			} );

			it( 'should show the insufficient permission error modal when the user does not have the required permissions', () => {
				// Verify the error is "Insufficient permissions" variant.
				expect(
					getByText( /Insufficient permissions/i )
				).toBeInTheDocument();

				// Verify the "Get help" link is displayed.
				expect( getByText( /get help/i ) ).toBeInTheDocument();

				// Verify the "Request access" button is displayed.
				expect(
					getByRole( 'button', { name: /request access/i } )
				).toBeInTheDocument();

				// Verify the "Cancel" button is displayed.
				expect(
					getByRole( 'button', { name: /cancel/i } )
				).toBeInTheDocument();
			} );

			it( 'should track an event when the "Request access" button is clicked', async () => {
				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /request access/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-top-content-cta',
					'insufficient_permissions_error_request_access'
				);
			} );

			it( 'should track an event when the Cancel button is clicked', async () => {
				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /cancel/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-top-content-cta',
					'insufficient_permissions_error_cancel'
				);
			} );
		} );

		describe( 'generic error modal', () => {
			beforeEach( async () => {
				const error = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				provideCustomDimensionError( registry, {
					customDimension: 'googlesitekit_post_type',
					error,
				} );

				( { getByRole, getByText } = render(
					<WidgetWithComponentProps { ...props } />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				) );

				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /update/i } )
					);

					// Allow the `trackEvent()` promise to resolve so the custom dimension creation logic can be executed.
					await waitForDefaultTimeouts();
				} );
			} );

			it( 'should show the generic error modal when an internal server error occurs', () => {
				// Verify the error is a generic error variant.
				expect(
					getByText( /Failed to enable metric/i )
				).toBeInTheDocument();

				// Verify the "Retry" button is displayed.
				expect(
					getByRole( 'button', { name: /retry/i } )
				).toBeInTheDocument();
			} );

			it( 'should track an event when the Retry button is clicked', async () => {
				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /retry/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-top-content-cta',
					'setup_error_retry'
				);
			} );

			it( 'should track an event when the Cancel button is clicked', async () => {
				await act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /cancel/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-top-content-cta',
					'setup_error_cancel'
				);
			} );
		} );
	} );
} );
