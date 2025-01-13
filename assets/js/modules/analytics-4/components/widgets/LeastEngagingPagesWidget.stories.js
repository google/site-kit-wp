/**
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	STRATEGY_ZIP,
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../.storybook/utils/zeroReports';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';
import LeastEngagingPagesWidget from './LeastEngagingPagesWidget';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';

const pageViewsReportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'pagePath' ],
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [
		{
			metric: { metricName: 'screenPageViews' },
			desc: true,
		},
	],
};

const pageTitlesReportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensionFilters: {
		pagePath: new Array( 3 )
			.fill( '' )
			.map( ( _, i ) => `/test-post-${ i + 1 }/` )
			.sort(),
	},
	dimensions: [ 'pagePath', 'pageTitle' ],
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
	limit: 15,
};

const WidgetWithComponentProps = withWidgetComponentProps( 'test' )(
	LeastEngagingPagesWidget
);

function Template( { setupRegistry, viewContext, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<WidgetWithComponentProps { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
			// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
			// page paths to page titles.
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );

		const pageViewsReport = getAnalytics4MockResponse(
			pageViewsReportOptions
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageViewsReport, {
				options: pageViewsReportOptions,
			} );

		const medianIndex = parseInt( pageViewsReport?.rowCount / 2, 10 );
		const medianPageViews =
			parseInt(
				pageViewsReport?.rows?.[ medianIndex ]?.metricValues?.[ 0 ]
					?.value,
				10
			) || 0;

		const reportOptions = {
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			dimensions: [ 'pagePath' ],
			metrics: [ 'bounceRate', 'screenPageViews' ],
			orderby: [
				{
					metric: { metricName: 'bounceRate' },
					desc: true,
				},
				{
					metric: { metricName: 'screenPageViews' },
					desc: true,
				},
			],
			metricFilters: {
				screenPageViews: {
					operation: 'GREATER_THAN_OR_EQUAL',
					value: { int64Value: medianPageViews },
				},
			},
			limit: 3,
		};

		provideAnalytics4MockReport( registry, reportOptions );
	},
};
Ready.scenario = {
	label: 'KeyMetrics/LeastEngagingPagesWidget/Ready',
	delay: 250,
};

export const ReadyViewOnly = Template.bind( {} );
ReadyViewOnly.storyName = 'Ready View Only';
ReadyViewOnly.args = {
	setupRegistry: ( registry ) => {
		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );

		const pageViewsReport = getAnalytics4MockResponse(
			pageViewsReportOptions
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageViewsReport, {
				options: pageViewsReportOptions,
			} );

		const medianIndex = parseInt( pageViewsReport?.rowCount / 2, 10 );
		const medianPageViews =
			parseInt(
				pageViewsReport?.rows?.[ medianIndex ]?.metricValues?.[ 0 ]
					?.value,
				10
			) || 0;

		const reportOptions = {
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			dimensions: [ 'pagePath' ],
			metrics: [ 'bounceRate', 'screenPageViews' ],
			orderby: [
				{
					metric: { metricName: 'bounceRate' },
					desc: true,
				},
				{
					metric: { metricName: 'screenPageViews' },
					desc: true,
				},
			],
			metricFilters: {
				screenPageViews: {
					operation: 'GREATER_THAN_OR_EQUAL',
					value: { int64Value: medianPageViews },
				},
			},
			limit: 3,
		};

		provideAnalytics4MockReport( registry, reportOptions );
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ReadyViewOnly.scenario = {
	label: 'KeyMetrics/LeastEngagingPagesWidget/ReadyViewOnly',
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			pageViewsReportOptions,
		] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch } ) => {
		const pageViewsReport = getAnalytics4MockResponse(
			pageViewsReportOptions
		);

		const zeroPageViewsReport =
			replaceValuesInAnalytics4ReportWithZeroData( pageViewsReport );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( pageViewsReport, {
			options: pageViewsReportOptions,
		} );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroPageViewsReport, {
			options: pageViewsReportOptions,
		} );

		const reportOptions = {
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			dimensions: [ 'pagePath' ],
			metrics: [ 'bounceRate', 'screenPageViews' ],
			orderby: [
				{
					metric: { metricName: 'bounceRate' },
					desc: true,
				},
				{
					metric: { metricName: 'screenPageViews' },
					desc: true,
				},
			],
			metricFilters: {
				screenPageViews: {
					operation: 'GREATER_THAN_OR_EQUAL',
					value: { int64Value: 0 },
				},
			},
			limit: 3,
		};
		const report = getAnalytics4MockResponse( reportOptions );

		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( { dispatch } ) => {
		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveError(
			errorObject,
			'getReport',
			[ pageViewsReportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			pageViewsReportOptions,
		] );
	},
};

export const InsufficientPermissions = Template.bind( {} );
InsufficientPermissions.storyName = 'Insufficient Permissions';
InsufficientPermissions.args = {
	setupRegistry: ( { dispatch } ) => {
		const errorObject = {
			code: 403,
			message: 'Test error message. ',
			data: {
				status: 403,
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveError(
			errorObject,
			'getReport',
			[ pageViewsReportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			pageViewsReportOptions,
		] );
	},
};

export default {
	title: 'Key Metrics/LeastEngagingPagesWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				const [ accountID, propertyID, webDataStreamID ] = [
					'12345',
					'34567',
					'56789',
				];

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( webDataStreamID );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideKeyMetrics( registry );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
