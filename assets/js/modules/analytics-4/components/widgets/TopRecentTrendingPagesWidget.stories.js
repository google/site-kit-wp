/**
 * TopRecentTrendingPagesWidget Component Stories.
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
 * Internal dependencies
 */
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES } from '../../../../googlesitekit/datastore/user/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import TopRecentTrendingPagesWidget, {
	getDateRange,
	getReportOptions,
} from './TopRecentTrendingPagesWidget';
import { provideCustomDimensionError } from '../../utils/custom-dimensions';
import {
	STRATEGY_ZIP,
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../.storybook/utils/zeroReports';

const KM_WIDGET_DEF =
	KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ];

const WidgetWithComponentProps = withWidgetComponentProps(
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES
)( TopRecentTrendingPagesWidget );

const selectPageTitlesReportOptions = ( select ) => ( {
	...getDateRange( select ),
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
} );

function Template( { setupRegistry, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

const propertyID = '12345';

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		const { select, dispatch } = registry;
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				...KM_WIDGET_DEF.requiredCustomDimensions,
			],
		} );

		const reportOptions = getReportOptions( select );
		const pageTitlesReportOptions = selectPageTitlesReportOptions( select );
		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
			// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
			// page paths to page titles.
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( pageTitlesReport, {
			options: pageTitlesReportOptions,
		} );

		provideAnalytics4MockReport( registry, reportOptions );
	},
};
Ready.parameters = {
	features: [ 'keyMetrics' ],
};
Ready.scenario = {
	label: 'KeyMetrics/TopRecentTrendingPagesWidget/Ready',
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { select, dispatch } ) => {
		const reportOptions = getReportOptions( select );
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				...KM_WIDGET_DEF.requiredCustomDimensions,
			],
		} );

		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions,
		] );
	},
};
Loading.parameters = {
	features: [ 'keyMetrics' ],
};
Loading.scenario = {
	label: 'KeyMetrics/TopRecentTrendingPagesWidget/Loading',
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { select, dispatch } ) => {
		const reportOptions = getReportOptions( select );
		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				...KM_WIDGET_DEF.requiredCustomDimensions,
			],
		} );
	},
};
ZeroData.scenario = {
	label: 'KeyMetrics/TopRecentTrendingPagesWidget/ZeroData',
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				...KM_WIDGET_DEF.requiredCustomDimensions,
			],
		} );

		dispatch( MODULES_ANALYTICS_4 ).receiveIsCustomDimensionGatheringData(
			KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]
				.requiredCustomDimensions?.[ 0 ],
			true
		);
	},
};
GatheringData.scenario = {
	label: 'KeyMetrics/TopRecentTrendingPagesWidget/GatheringData',
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( { select, dispatch } ) => {
		const reportOptions = getReportOptions( select );
		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'test-error-reason',
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveError(
			errorObject,
			'getReport',
			[ reportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions,
		] );

		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				...KM_WIDGET_DEF.requiredCustomDimensions,
			],
		} );
	},
};
Error.scenario = {
	label: 'KeyMetrics/TopRecentTrendingPagesWidget/Error',
	delay: 250,
};

export const ErrorMissingCustomDimensions = Template.bind( {} );
ErrorMissingCustomDimensions.storyName = 'Error - Missing custom dimensions';
ErrorMissingCustomDimensions.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );
	},
};
ErrorMissingCustomDimensions.parameters = {
	features: [ 'keyMetrics' ],
};

export const ErrorCustomDimensionsInsufficientPermissions = Template.bind( {} );
ErrorCustomDimensionsInsufficientPermissions.storyName =
	'Error - Custom dimensions creation - Insufficient Permissions';
ErrorCustomDimensionsInsufficientPermissions.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				...KM_WIDGET_DEF.requiredCustomDimensions,
			],
		} );

		provideCustomDimensionError( registry, {
			customDimension: KM_WIDGET_DEF.requiredCustomDimensions,
			error,
		} );
	},
};
ErrorCustomDimensionsInsufficientPermissions.parameters = {
	features: [ 'keyMetrics' ],
};

export const ErrorCustomDimensionsGeneric = Template.bind( {} );
ErrorCustomDimensionsGeneric.storyName =
	'Error - Custom dimensions creation - Generic';
ErrorCustomDimensionsGeneric.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: 'test-error-reason',
			},
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [
				...KM_WIDGET_DEF.requiredCustomDimensions,
			],
		} );

		provideCustomDimensionError( registry, {
			customDimension: KM_WIDGET_DEF.requiredCustomDimensions[ 0 ],
			error,
		} );
	},
};
ErrorCustomDimensionsGeneric.parameters = {
	features: [ 'keyMetrics' ],
};

export default {
	title: 'Key Metrics/TopRecentTrendingPagesWidget',
	component: TopRecentTrendingPagesWidget,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
					{
						createTime: '2014-10-02T15:01:23Z',
					},
					{ propertyID }
				);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						KEY_METRICS_WIDGETS[
							KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES
						].requiredCustomDimensions?.[ 0 ],
						false
					);

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

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
