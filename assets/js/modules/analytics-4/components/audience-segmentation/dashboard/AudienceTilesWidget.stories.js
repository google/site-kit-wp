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
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	STRATEGY_ZIP,
} from '../../../utils/data-mock';
import {
	audiences as audiencesFixture,
	availableAudiences,
} from './../../../datastore/__fixtures__';
import AudienceTilesWidget from './AudienceTilesWidget';

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
	'analyticsAudienceTiles' // analyticsAudienceTiles
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

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTilesWidget',
	decorators: [
		( Story, { args: { grantedScopes, configuredAudiences } } ) => {
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
				provideModuleRegistrations( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
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
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
