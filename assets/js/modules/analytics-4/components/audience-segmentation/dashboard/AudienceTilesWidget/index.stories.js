/**
 * Audience Tiles Component Stories.
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
import {
	provideModules,
	provideModuleRegistrations,
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../googlesitekit/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { getPreviousDate } from '../../../../../../util';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	STRATEGY_ZIP,
} from '../../../../utils/data-mock';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import { Provider as ViewContextProvider } from '../../../../../../components/Root/ViewContextContext';
import AudienceTilesWidget from './';

function excludeAudienceFromReport( report, audienceResourceName ) {
	const newRows = report.rows.filter(
		( row ) => row.dimensionValues[ 0 ].value !== audienceResourceName
	);

	return {
		...report,
		rows: newRows,
	};
}

const totalPageviewsReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	metrics: [ { name: 'screenPageViews' } ],
};

const topCitiesReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
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
	limit: 4,
};

const topContentReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
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
	endDate: '2024-03-27',
	startDate: '2024-02-29',
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

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsAudienceTiles'
)( AudienceTilesWidget );

function Template( { args } ) {
	return <WidgetWithComponentProps { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
		'properties/12345/audiences/4', // Returning visitors
	],
};
Default.scenario = {};

export const DefaultWithMissingCustomDimension = Template.bind( {} );
DefaultWithMissingCustomDimension.storyName =
	'DefaultWithMissingCustomDimension';
DefaultWithMissingCustomDimension.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
		'properties/12345/audiences/4', // Returning visitors
	],
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [],
		} );
	},
};
DefaultWithMissingCustomDimension.scenario = {};

export const DefaultViewOnlyWithCustomDimensionError = Template.bind( {} );
DefaultViewOnlyWithCustomDimensionError.storyName =
	'DefaultViewOnlyWithCustomDimensionError';
DefaultViewOnlyWithCustomDimensionError.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
		'properties/12345/audiences/4', // Returning visitors
	],
	setupRegistry: ( registry ) => {
		const options = {
			...topContentReportOptions,
			dimensionFilters: {
				...topContentReportOptions.dimensionFilters,
				audienceResourceName: 'properties/12345/audiences/1',
			},
		};

		const error = {
			code: 400,
			message:
				'Field customEvent:googlesitekit_post_type is not a valid dimension. For a list of valid dimensions and metrics, see https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema ',
			status: 'INVALID_ARGUMENT',
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ options ] );
	},
	isAuthenticated: false,
};
DefaultViewOnlyWithCustomDimensionError.scenario = {};

export const DefaultWithZeroTile = Template.bind( {} );
DefaultWithZeroTile.storyName = 'DefaultWithZeroTile';
DefaultWithZeroTile.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
		'properties/12345/audiences/4', // Returning visitors
	],

	setupRegistry: ( registry ) => {
		const audienceResourceNames = [
			'properties/12345/audiences/1', // All Users
			'properties/12345/audiences/3', // New visitors
			'properties/12345/audiences/4', // Returning visitors
		];
		const reportOptions = {
			compareEndDate: '2024-02-28',
			compareStartDate: '2024-02-01',
			endDate: '2024-03-27',
			startDate: '2024-02-29',
			dimensions: [ { name: 'audienceResourceName' } ],
			dimensionFilters: {
				audienceResourceName: audienceResourceNames,
			},
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessionsPerUser' },
				{ name: 'screenPageViewsPerSession' },
				{ name: 'screenPageViews' },
			],
		};

		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport = excludeAudienceFromReport(
			report,
			audienceResourceNames[ 0 ]
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );

		const { startDate } = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const audienceDate = Number( startDate.replace( /-/g, '' ) );
		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					'properties/12345/audiences/1': dataAvailabilityDate,
					'properties/12345/audiences/3': audienceDate,
					'properties/12345/audiences/4': audienceDate,
				},
				customDimension: {},
				property: {},
			} );
	},
};
DefaultWithZeroTile.scenario = {};

export const TwoTiles = Template.bind( {} );
TwoTiles.storyName = 'Two Tiles';
TwoTiles.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
	],
};
TwoTiles.scenario = {};

export const TwoTilesWithMissingCustomDimension = Template.bind( {} );
TwoTilesWithMissingCustomDimension.storyName =
	'TwoTilesWithMissingCustomDimension';
TwoTilesWithMissingCustomDimension.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
	],
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [],
		} );
	},
};

export const TwoTilesViewOnlyWithCustomDimensionError = Template.bind( {} );
TwoTilesViewOnlyWithCustomDimensionError.storyName =
	'TwoTilesViewOnlyWithCustomDimensionError';
TwoTilesViewOnlyWithCustomDimensionError.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
	],
	setupRegistry: ( registry ) => {
		const options = {
			...topContentReportOptions,
			dimensionFilters: {
				...topContentReportOptions.dimensionFilters,
				audienceResourceName: 'properties/12345/audiences/1',
			},
		};

		const error = {
			code: 400,
			message:
				'Field customEvent:googlesitekit_post_type is not a valid dimension. For a list of valid dimensions and metrics, see https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema ',
			status: 'INVALID_ARGUMENT',
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ options ] );
	},
	isAuthenticated: false,
};
TwoTilesViewOnlyWithCustomDimensionError.scenario = {};

export const TwoTilesWithZeroTile = Template.bind( {} );
TwoTilesWithZeroTile.storyName = 'TwoTilesWithZeroTile';
TwoTilesWithZeroTile.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/4', // Returning visitors
	],

	setupRegistry: ( registry ) => {
		const audienceResourceNames = [
			'properties/12345/audiences/1', // All Users
			'properties/12345/audiences/4', // Returning visitors
		];
		const reportOptions = {
			compareEndDate: '2024-02-28',
			compareStartDate: '2024-02-01',
			endDate: '2024-03-27',
			startDate: '2024-02-29',
			dimensions: [ { name: 'audienceResourceName' } ],
			dimensionFilters: {
				audienceResourceName: audienceResourceNames,
			},
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessionsPerUser' },
				{ name: 'screenPageViewsPerSession' },
				{ name: 'screenPageViews' },
			],
		};

		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport = excludeAudienceFromReport(
			report,
			audienceResourceNames[ 0 ]
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );

		const { startDate } = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const audienceDate = Number( startDate.replace( /-/g, '' ) );
		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					'properties/12345/audiences/1': dataAvailabilityDate,
					'properties/12345/audiences/4': audienceDate,
				},
				customDimension: {},
				property: {},
			} );
	},
};
TwoTilesWithZeroTile.scenario = {};

export const ZeroTileWithPlaceholder = Template.bind( {} );
ZeroTileWithPlaceholder.storyName = 'ZeroTileWithPlaceholder';
ZeroTileWithPlaceholder.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
	],

	setupRegistry: ( registry ) => {
		const audienceResourceNames = [
			'properties/12345/audiences/1', // All Users
		];
		const reportOptions = {
			compareEndDate: '2024-02-28',
			compareStartDate: '2024-02-01',
			endDate: '2024-03-27',
			startDate: '2024-02-29',
			dimensions: [ { name: 'audienceResourceName' } ],
			dimensionFilters: {
				audienceResourceName: audienceResourceNames,
			},
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessionsPerUser' },
				{ name: 'screenPageViewsPerSession' },
				{ name: 'screenPageViews' },
			],
		};

		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport = excludeAudienceFromReport(
			report,
			audienceResourceNames[ 0 ]
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );

		const { startDate } = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					'properties/12345/audiences/1': dataAvailabilityDate,
				},
				customDimension: {},
				property: {},
			} );
	},
};
ZeroTileWithPlaceholder.scenario = {};

export const DefaultAudiencesPartialData = Template.bind( {} );
DefaultAudiencesPartialData.storyName = 'DefaultAudiencesPartialData';
DefaultAudiencesPartialData.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/2', // Purchasers
	],
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		const { startDate } = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					'properties/12345/audiences/1': dataAvailabilityDate,
					'properties/12345/audiences/2': dataAvailabilityDate,
				},
				customDimension: {},
				property: {
					12345: 20200101,
				},
			} );
	},
};
DefaultAudiencesPartialData.scenario = {};

export const SiteKitAudiencesPartialData = Template.bind( {} );
SiteKitAudiencesPartialData.storyName = 'SiteKitAudiencesPartialData';
SiteKitAudiencesPartialData.args = {
	configuredAudiences: [
		'properties/12345/audiences/3', // New visitors
		'properties/12345/audiences/4', // Returning visitors
	],
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		const { startDate } = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					'properties/12345/audiences/3': dataAvailabilityDate,
					'properties/12345/audiences/4': dataAvailabilityDate,
				},
				customDimension: {},
				property: {
					12345: 20200101,
				},
			} );

		availableAudiences
			.filter(
				( { audienceType } ) => audienceType === 'SITE_KIT_AUDIENCE'
			)
			.forEach( ( { audienceSlug } ) => {
				const dimensionFilters = {
					newVsReturning:
						audienceSlug === 'new-visitors' ? 'new' : 'returning',
				};

				provideAnalytics4MockReport( registry, {
					...topCitiesReportOptions,
					dimensionFilters,
				} );

				provideAnalytics4MockReport( registry, {
					...topContentReportOptions,
					dimensionFilters: {
						...topContentReportOptions.dimensionFilters,
						...dimensionFilters,
					},
				} );

				const pageTitlesReport = getAnalytics4MockResponse(
					topContentPageTitlesReportOptions,
					// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
					// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
					// page paths to page titles.
					{ dimensionCombinationStrategy: STRATEGY_ZIP }
				);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( pageTitlesReport, {
						options: {
							...topContentPageTitlesReportOptions,
							dimensionFilters: {
								...topContentPageTitlesReportOptions.dimensionFilters,
								...dimensionFilters,
							},
						},
					} );
			} );
	},
};
SiteKitAudiencesPartialData.scenario = {};

export const AllTilesErrored = Template.bind( {} );
AllTilesErrored.storyName = 'AllTilesErrored';
AllTilesErrored.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
	],
	setupRegistry: async ( registry ) => {
		const reportOptions = {
			compareEndDate: '2024-02-28',
			compareStartDate: '2024-02-01',
			endDate: '2024-03-27',
			startDate: '2024-02-29',
			dimensions: [ { name: 'audienceResourceName' } ],
			dimensionFilters: {
				audienceResourceName: [
					'properties/12345/audiences/1', // All Users
					'properties/12345/audiences/3', // New visitors
				],
			},
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessionsPerUser' },
				{ name: 'screenPageViewsPerSession' },
				{ name: 'screenPageViews' },
			],
		};

		const errorReport = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: 'Data Error',
			},
		};

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( errorReport, 'getReport', [ reportOptions ] );
	},
};
AllTilesErrored.scenario = {};

export const SingleTileErrored = Template.bind( {} );
SingleTileErrored.storyName = 'SingleTileErrored';
SingleTileErrored.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
	],
	setupRegistry: ( registry ) => {
		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const { startDate, endDate } = dates;

		const citiesReportOptions = {
			startDate,
			endDate,
			dimensions: [ 'city' ],
			dimensionFilters: {
				audienceResourceName: 'properties/12345/audiences/3',
			},
			metrics: [ { name: 'totalUsers' } ],
			orderby: [
				{
					metric: {
						metricName: 'totalUsers',
					},
					desc: true,
				},
			],
			limit: 4,
		};

		const errorReport = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: 'Data Error',
			},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( errorReport, 'getReport', [ citiesReportOptions ] );
	},
};
SingleTileErrored.scenario = {};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
	],
	setupRegistry: ( registry ) => {
		const reportOptions = {
			compareEndDate: '2024-02-28',
			compareStartDate: '2024-02-01',
			endDate: '2024-03-27',
			startDate: '2024-02-29',
			dimensions: [ { name: 'audienceResourceName' } ],
			dimensionFilters: {
				audienceResourceName: [
					'properties/12345/audiences/1', // All Users
					'properties/12345/audiences/3', // New visitors
				],
			},
			metrics: [
				{ name: 'totalUsers' },
				{ name: 'sessionsPerUser' },
				{ name: 'screenPageViewsPerSession' },
				{ name: 'screenPageViews' },
			],
		};

		// Start loading the report and do not resolve it so that tiles are displayed in loading state.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ reportOptions ] );
	},
};
Loading.decorators = [
	( Story ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<Story />
			</div>
		);
	},
];
Loading.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget',
	decorators: [
		(
			Story,
			{
				args: {
					grantedScopes,
					configuredAudiences,
					setupRegistry: setupRegistryFn,
					isAuthenticated = true,
				},
			}
		) => {
			const audiencesDimensionFilter = {
				audienceResourceName: configuredAudiences,
			};

			const reportOptions = {
				compareEndDate: '2024-02-28',
				compareStartDate: '2024-02-01',
				endDate: '2024-03-27',
				startDate: '2024-02-29',
				dimensions: [ { name: 'audienceResourceName' } ],
				dimensionFilters: audiencesDimensionFilter,
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessionsPerUser' },
					{ name: 'screenPageViewsPerSession' },
					{ name: 'screenPageViews' },
				],
			};
			const newVsReturningReportOptions = {
				compareEndDate: '2024-02-28',
				compareStartDate: '2024-02-01',
				endDate: '2024-03-27',
				startDate: '2024-02-29',
				dimensions: [ { name: 'newVsReturning' } ],
				dimensionFilters: {
					newVsReturning: [ 'new', 'returning' ],
				},
				metrics: [
					{ name: 'totalUsers' },
					{ name: 'sessionsPerUser' },
					{ name: 'screenPageViewsPerSession' },
					{ name: 'screenPageViews' },
				],
			};

			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry, {
					grantedScopes,
					authenticated: isAuthenticated,
				} );
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );
				provideModuleRegistrations( registry );
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

				registry
					.dispatch( CORE_USER )
					.setConfiguredAudiences( configuredAudiences );

				provideAnalytics4MockReport( registry, reportOptions );
				provideAnalytics4MockReport(
					registry,
					totalPageviewsReportOptions
				);

				availableAudiences.forEach( ( audience ) => {
					const dimensionFilters = {
						audienceResourceName: audience.name,
					};

					provideAnalytics4MockReport( registry, {
						...topCitiesReportOptions,
						dimensionFilters,
					} );

					provideAnalytics4MockReport( registry, {
						...topContentReportOptions,
						dimensionFilters: {
							...topContentReportOptions.dimensionFilters,
							...dimensionFilters,
						},
					} );

					const pageTitlesReport = getAnalytics4MockResponse(
						topContentPageTitlesReportOptions,
						// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
						// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
						// page paths to page titles.
						{ dimensionCombinationStrategy: STRATEGY_ZIP }
					);
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetReport( pageTitlesReport, {
							options: {
								...topContentPageTitlesReportOptions,
								dimensionFilters: {
									...topContentPageTitlesReportOptions.dimensionFilters,
									...dimensionFilters,
								},
							},
						} );
				} );

				const newVsReturningReport = getAnalytics4MockResponse(
					newVsReturningReportOptions
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( newVsReturningReport, {
						options: newVsReturningReportOptions,
					} );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableCustomDimensions: [ 'googlesitekit_post_type' ],
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				const { startDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				const audienceDate = Number( startDate.replace( /-/g, '' ) );

				const audienceResourceData = {};
				availableAudiences.forEach( ( audience ) => {
					audienceResourceData[ audience.name ] = audienceDate;
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: audienceResourceData,
						customDimension: {},
						property: {},
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						availableAudiences,
						availableAudiencesLastSyncedAt: Date.now() - 1000,
					} );

				setupRegistryFn?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<ViewContextProvider
						value={
							isAuthenticated
								? VIEW_CONTEXT_MAIN_DASHBOARD
								: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
						}
					>
						<Story />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
