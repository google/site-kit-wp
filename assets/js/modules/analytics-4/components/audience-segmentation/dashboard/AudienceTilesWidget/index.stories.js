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
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { getPreviousDate } from '../../../../../../util';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	STRATEGY_ZIP,
} from '../../../../utils/data-mock';
import {
	audiences as audiencesFixture,
	availableAudiences,
} from '../../../../datastore/__fixtures__';
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
	limit: 3,
};

const topContentReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	dimensions: [ 'pagePath' ],
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
	limit: 3,
};

const topContentPageTitlesReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	dimensions: [ 'pagePath', 'pageTitle' ],
	metrics: [ { name: 'screenPageViews' } ],
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
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget/Default',
};

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
DefaultWithMissingCustomDimension.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget/DefaultWithMissingCustomDimension',
};

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
			audienceResourceNames[ 2 ]
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
					'properties/12345/audiences/1': audienceDate,
					'properties/12345/audiences/3': audienceDate,
					'properties/12345/audiences/4': dataAvailabilityDate,
				},
				customDimension: {},
				property: {},
			} );
	},
};
DefaultWithZeroTile.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget/DefaultWithZeroTile',
};

export const TwoTiles = Template.bind( {} );
TwoTiles.storyName = 'Two Tiles';
TwoTiles.args = {
	configuredAudiences: [
		'properties/12345/audiences/1', // All Users
		'properties/12345/audiences/3', // New visitors
	],
};
TwoTiles.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget/TwoTiles',
};

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
			audienceResourceNames[ 1 ]
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
					'properties/12345/audiences/1': audienceDate,
					'properties/12345/audiences/4': dataAvailabilityDate,
				},
				customDimension: {},
				property: {},
			} );
	},
};
TwoTilesWithZeroTile.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget/TwoTilesWithZeroTile',
};

export const ZeroTileWithPlaceholder = Template.bind( {} );
ZeroTileWithPlaceholder.storyName = 'ZeroTileWithPlaceholder';
ZeroTileWithPlaceholder.args = {
	configuredAudiences: [
		'properties/12345/audiences/4', // Returning visitors
	],

	setupRegistry: ( registry ) => {
		const audienceResourceNames = [
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
		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					'properties/12345/audiences/4': dataAvailabilityDate,
				},
				customDimension: {},
				property: {},
			} );
	},
};
ZeroTileWithPlaceholder.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget/ZeroTileWithPlaceholder',
};

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

			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry, {
					grantedScopes,
				} );
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );
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

				audiencesFixture.forEach( ( audience ) => {
					provideAnalytics4MockReport( registry, {
						...topCitiesReportOptions,
						dimensionFilters: {
							audienceResourceName: audience.name,
						},
					} );
				} );

				audiencesFixture.forEach( ( audience ) => {
					provideAnalytics4MockReport( registry, {
						...topContentReportOptions,
						dimensionFilters: {
							audienceResourceName: audience.name,
						},
					} );
				} );

				audiencesFixture.forEach( ( audience ) => {
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
									audienceResourceName: audience.name,
								},
							},
						} );
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
				audiencesFixture.forEach( ( audience ) => {
					audienceResourceData[ audience.name ] = audienceDate;
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: audienceResourceData,
						customDimension: {},
						property: {},
					} );

				setupRegistryFn?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
