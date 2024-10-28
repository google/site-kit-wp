/**
 * AudienceTilesWidget component tests.
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
 * Internal dependencies
 */
import AudienceTilesWidget from '.';
import {
	act,
	render,
	waitFor,
} from '../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
	waitForDefaultTimeouts,
	waitForTimeouts,
} from '../../../../../../../../tests/js/utils';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { getPreviousDate } from '../../../../../../util';
import {
	ERROR_REASON_BAD_REQUEST,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../../../../../../util/errors';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import { getAnalytics4MockResponse } from '../../../../utils/data-mock';

/**
 * Generates mock response for audience tiles component.
 *
 * @since 1.135.0
 *
 * @param {Object}        registry                               Data registry object.
 * @param {Array<string>} configuredAudiences                    Array of audience resource names.
 * @param {Object}        [options]                              Options object.
 * @param {boolean}       [options.isSiteKitAudiencePartialData] Whether the mock response should include partial data for Site Kit audiences. Defaults to false.
 */
function provideAudienceTilesMockReport(
	registry,
	configuredAudiences,
	{ isSiteKitAudiencePartialData = false } = {}
) {
	const dates = registry.select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
		compare: true,
	} );

	const { startDate, endDate } = dates;

	const userCountReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
	};

	const userCountReportData = getAnalytics4MockResponse(
		userCountReportOptions
	);

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( userCountReportData, {
			options: userCountReportOptions,
		} );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ userCountReportOptions ] );

	const reportOptions = {
		dimensions: isSiteKitAudiencePartialData
			? [ { name: 'newVsReturning' } ]
			: [ { name: 'audienceResourceName' } ],
		metrics: [
			{ name: 'totalUsers' },
			{ name: 'sessionsPerUser' },
			{ name: 'screenPageViewsPerSession' },
			{ name: 'screenPageViews' },
		],
	};

	const options = {
		...dates,
		...reportOptions,
		dimensionFilters: isSiteKitAudiencePartialData
			? {
					newVsReturning: [ 'new', 'returning' ],
			  }
			: {
					audienceResourceName: configuredAudiences,
			  },
	};

	const reportData = getAnalytics4MockResponse( options );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( reportData, {
		options,
	} );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ options ] );

	const totalPageviewsReportOptions = {
		startDate,
		endDate,
		metrics: [ { name: 'screenPageViews' } ],
	};

	const totalPageviewsReportData = getAnalytics4MockResponse( options );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( totalPageviewsReportData, {
			options: totalPageviewsReportOptions,
		} );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ totalPageviewsReportOptions ] );

	const topCitiesReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'city' ],
		metrics: [ { name: 'totalUsers' } ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 3,
	};

	const topContentReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		dimensionFilters: {
			'customEvent:googlesitekit_post_type': {
				filterType: 'stringFilter',
				matchType: 'EXACT',
				value: 'post',
			},
		},
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 3,
	};

	const topContentPageTitlesReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		dimensionFilters: {
			'customEvent:googlesitekit_post_type': {
				filterType: 'stringFilter',
				matchType: 'EXACT',
				value: 'post',
			},
		},
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
	};

	[
		topCitiesReportOptions,
		topContentReportOptions,
		topContentPageTitlesReportOptions,
	].forEach( ( value ) => {
		configuredAudiences.forEach( ( audienceResourceName ) => {
			const dimensionFilters = isSiteKitAudiencePartialData
				? {
						newVsReturning:
							audienceResourceName ===
							'properties/12345/audiences/3'
								? 'new'
								: 'returning',
				  }
				: {
						audienceResourceName,
				  };

			const individualReportOptions = {
				...value,
				dimensionFilters: {
					...value.dimensionFilters,
					...dimensionFilters,
				},
			};

			const individualReportData = getAnalytics4MockResponse(
				individualReportOptions
			);

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( individualReportData, {
					options: individualReportOptions,
				} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ individualReportOptions ] );
		} );
	} );
}

describe( 'AudienceTilesWidget', () => {
	let registry;

	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAudienceTiles'
	)( AudienceTilesWidget );

	beforeEach( () => {
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

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID: '12345' }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: availableAudiences.reduce( ( acc, { name } ) => {
					acc[ name ] = 20201220;
					return acc;
				}, {} ),
				customDimension: {
					googlesitekit_post_type: 20201220,
				},
				property: {
					12345: 20201218,
				},
			} );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/data-available'
			)
		);
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render loading tiles when audiences are not syncing', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		} );

		freezeFetch( syncAvailableAudiencesEndpoint );

		await act( async () => {
			// Render the component and wait for the registry updates
			const { container, waitForRegistry } = render(
				<WidgetWithComponentProps />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( container ).toMatchSnapshot();
		} );
	} );

	it( 'should render when configured audience is matching available audiences', async () => {
		const configuredAudiences = [ 'properties/12345/audiences/1' ];

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableAudiencesLastSyncedAt: ( Date.now() - 1000 ) / 1000,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences,
			isAudienceSegmentationWidgetHidden: false,
		} );

		provideAudienceTilesMockReport( registry, configuredAudiences );

		const { container, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();
		await act( waitForDefaultTimeouts );

		await waitFor( () => {
			expect( container ).toMatchSnapshot();
		} );

		// expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );
		// expect( mockTrackEvent ).toHaveBeenCalledWith( {} );
	} );

	it( 'should render when all configured audiences are matching available audiences', async () => {
		const configuredAudiences = [
			'properties/12345/audiences/1',
			'properties/12345/audiences/2',
		];

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableAudiencesLastSyncedAt: ( Date.now() - 1000 ) / 1000,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences,
			isAudienceSegmentationWidgetHidden: false,
		} );

		provideAudienceTilesMockReport( registry, configuredAudiences );

		const { container, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();
		await act( waitForDefaultTimeouts );

		await waitFor( () => {
			expect( container ).toMatchSnapshot();
		} );
	} );

	it( 'should not render audiences that are not available (archived)', async () => {
		const configuredAudiences = [
			'properties/12345/audiences/1', // Available.
			'properties/12345/audiences/9', // Not available (archived).
		];
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableAudiencesLastSyncedAt: ( Date.now() - 1000 ) / 1000,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences,
			isAudienceSegmentationWidgetHidden: false,
		} );

		provideAudienceTilesMockReport( registry, configuredAudiences );

		const { container, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();
		await act( waitForDefaultTimeouts );

		await waitFor( () => {
			// Only the available audience should be rendered, the archived one should be filtered out.
			expect(
				container.querySelectorAll(
					'.googlesitekit-audience-segmentation-tile'
				).length
			).toBe( 1 );
			expect( container ).toMatchSnapshot();
		} );
	} );

	it( 'should render correctly when there is partial data for Site Kit audiences', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableAudiencesLastSyncedAt: ( Date.now() - 1000 ) / 1000,
		} );

		const configuredAudiences = [
			'properties/12345/audiences/3', // New visitors
			'properties/12345/audiences/4', // Returning visitors
		];

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const dataAvailabilityDate = Number(
			getPreviousDate( dates.startDate, -1 ).replace( /-/g, '' )
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					'properties/12345/audiences/3': dataAvailabilityDate,
					'properties/12345/audiences/4': dataAvailabilityDate,
				},
				customDimension: {},
				property: {
					12345: 20201218,
				},
			} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences,
			isAudienceSegmentationWidgetHidden: false,
		} );

		provideAudienceTilesMockReport( registry, configuredAudiences, {
			isSiteKitAudiencePartialData: true,
		} );

		const { container, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await act( waitForRegistry );

		const [ siteKitAudiences ] = registry
			.select( MODULES_ANALYTICS_4 )
			.getConfigurableSiteKitAndOtherAudiences();

		const isSiteKitAudiencePartialData = registry
			.select( MODULES_ANALYTICS_4 )
			.hasAudiencePartialData( siteKitAudiences );

		await waitFor( () => {
			expect( isSiteKitAudiencePartialData ).toBe( true );
		} );

		expect( container ).toMatchSnapshot();

		// Verify the tile is not in a loading state.
		expect(
			container.querySelector(
				'.googlesitekit-audience-segmentation-tile-loading'
			)
		).not.toBeInTheDocument();
		// Verify the partial data badge is not rendered.
		expect(
			container.querySelector(
				'.googlesitekit-audience-segmentation-tile--partial-data'
			)
		).not.toBeInTheDocument();
		// Verify the zero data tile is not rendered.
		expect(
			container.querySelector(
				'.googlesitekit-audience-segmentation-tile__zero-data-container'
			)
		).not.toBeInTheDocument();
		// Verify the tile is rendered.
		expect(
			container.querySelector(
				'.googlesitekit-audience-segmentation-tile'
			)
		).toBeInTheDocument();
		// Verify the metrics are rendered.
		expect(
			container.querySelector(
				'.googlesitekit-audience-segmentation-tile__metrics'
			)
		).toBeInTheDocument();

		await act( () => waitForTimeouts( 100 ) );
	} );

	it( 'should show the "no audiences" banner when there is no matching audience', async () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			body: availableAudiences,
			status: 200,
		} );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container, getByText, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText( /You don’t have any visitor groups selected./ )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should show the "insufficient permissions" variant of the error banner when there is an insufficient permissions error while syncing available audiences', async () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			body: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
				},
			},
			status: 403,
		} );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { getByRole, getByText, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Verify the error is "Insufficient permissions" variant.
		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();

		// Verify the "Get help" link is displayed.
		expect(
			getByRole( 'link', { name: /get help/i } )
		).toBeInTheDocument();
	} );

	it( 'should show the catch-all variant of the error banner when there is a generic error while syncing available audiences', async () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			body: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: ERROR_REASON_BAD_REQUEST,
				},
			},
			status: 403,
		} );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { getByRole, getByText, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Verify the error is "catch-all" variant.
		expect(
			getByText( /Your visitor groups data loading failed/ )
		).toBeInTheDocument();

		// Ensure the retry button is shown.
		expect( getByRole( 'button', { name: /Retry/i } ) ).toBeInTheDocument();
	} );
} );
