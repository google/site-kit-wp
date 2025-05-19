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
 * External dependencies
 */
import faker from 'faker';
import { capitalize } from 'lodash';

/**
 * Internal dependencies
 */
import {
	CORE_USER,
	KM_ANALYTICS_POPULAR_PRODUCTS,
} from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { STRATEGY_ZIP, getAnalytics4MockResponse } from '../../utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../tests/js/utils/zeroReports';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';
import PopularProductsWidget from './PopularProductsWidget';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { provideCustomDimensionError } from '../../utils/custom-dimensions';

const accountID = '12345';
const propertyID = '34567';
const webDataStreamID = '67890';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'pagePath' ],
	dimensionFilters: {
		'customEvent:googlesitekit_post_type': {
			filterType: 'stringFilter',
			matchType: 'EXACT',
			value: 'product',
		},
	},
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [
		{
			metric: { metricName: 'screenPageViews' },
			desc: true,
		},
	],
	limit: 3,
	keepEmptyRows: false,
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

const WidgetWithComponentProps = withWidgetComponentProps(
	KM_ANALYTICS_POPULAR_PRODUCTS
)( PopularProductsWidget );

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

		pageTitlesReport.rows = pageTitlesReport.rows.map( ( row ) => ( {
			...row,
			dimensionValues: row.dimensionValues.map( ( dimensionValue, i ) =>
				i === 1
					? { value: capitalize( faker.lorem.words( 10 ) ) }
					: dimensionValue
			),
		} ) );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );

		const report = getAnalytics4MockResponse( reportOptions );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( report, {
			options: reportOptions,
		} );
	},
};
Ready.scenario = {};

export const ReadyViewOnly = Template.bind( {} );
ReadyViewOnly.storyName = 'Ready View Only';
ReadyViewOnly.args = {
	setupRegistry: ( registry ) => {
		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
			// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
			// page paths to page titles.
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);

		pageTitlesReport.rows = pageTitlesReport.rows.map( ( row ) => ( {
			...row,
			dimensionValues: row.dimensionValues.map( ( dimensionValue, i ) =>
				i === 1
					? { value: capitalize( faker.lorem.words( 10 ) ) }
					: dimensionValue
			),
		} ) );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );

		const report = getAnalytics4MockResponse( reportOptions );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( report, {
			options: reportOptions,
		} );
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ReadyViewOnly.scenario = {};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ reportOptions ] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );
	},
};

export const NoProductPostType = Template.bind( {} );
NoProductPostType.storyName = 'No Product Post Type';
NoProductPostType.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, {
			productPostType: null,
		} );
		provideKeyMetrics( registry, {
			widgetSlugs: [ KM_ANALYTICS_POPULAR_PRODUCTS ],
		} );

		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
		} );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( errorObject, 'getReport', [ reportOptions ] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ reportOptions ] );
	},
};

export const ErrorMissingCustomDimensions = Template.bind( {} );
ErrorMissingCustomDimensions.storyName = 'Error - Missing custom dimensions';
ErrorMissingCustomDimensions.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			accountID,
			propertyID,
			webDataStreamID,
			availableCustomDimensions: [],
		} );
	},
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

		provideCustomDimensionError( registry, {
			customDimension:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_PRODUCTS ]
					.requiredCustomDimensions[ 0 ],
			error,
		} );
	},
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

		provideCustomDimensionError( registry, {
			customDimension:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_PRODUCTS ]
					.requiredCustomDimensions[ 0 ],
			error,
		} );
	},
};

export const InsufficientPermissions = Template.bind( {} );
InsufficientPermissions.storyName = 'Insufficient Permissions';
InsufficientPermissions.args = {
	setupRegistry: ( registry ) => {
		const errorObject = {
			code: 403,
			message: 'Test error message. ',
			data: {
				status: 403,
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( errorObject, 'getReport', [ reportOptions ] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ reportOptions ] );
	},
};

export default {
	title: 'Key Metrics/PopularProductsWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );
				provideSiteInfo( registry );
				provideKeyMetrics( registry );
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					accountID,
					propertyID,
					webDataStreamID,
					availableCustomDimensions:
						KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_PRODUCTS ]
							.requiredCustomDimensions,
				} );
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
						KEY_METRICS_WIDGETS[ KM_ANALYTICS_POPULAR_PRODUCTS ]
							.requiredCustomDimensions[ 0 ],
						false
					);

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
