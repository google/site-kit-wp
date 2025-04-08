/**
 * AdBlockerWarningWidget Component Stories.
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
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import DashboardTopEarningPagesWidgetGA4 from './DashboardTopEarningPagesWidgetGA4';
import {
	STRATEGY_ZIP,
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../../analytics-4/utils/data-mock';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../storybook/utils/zeroReports';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';

const adSenseAccountID = 'pub-1234567890';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'pagePath', 'adSourceName' ],
	metrics: [ { name: 'totalAdRevenue' } ],
	dimensionFilters: {
		adSourceName: `Google AdSense account (${ adSenseAccountID })`,
	},
	orderby: [ { metric: { metricName: 'totalAdRevenue' }, desc: true } ],
	limit: 5,
};

const pageTitlesReportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensionFilters: {
		pagePath: new Array( 5 )
			.fill( '' )
			.map( ( _, i ) => `/test-post-${ i + 1 }/` )
			.sort(),
	},
	dimensions: [ 'pagePath', 'pageTitle' ],
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
	limit: 25,
};

const WidgetWithComponentProps = withWidgetComponentProps(
	'adsenseTopEarningPagesGA4'
)( DashboardTopEarningPagesWidgetGA4 );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.args = {
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

		provideAnalytics4MockReport( registry, reportOptions );
	},
};
Default.storyName = 'Default';

export const ViewOnlyDashboard = Template.bind( {} );
ViewOnlyDashboard.args = {
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

		provideAnalytics4MockReport( registry, reportOptions );
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ViewOnlyDashboard.storyName = 'ViewOnlyDashboard';

export const Loading = Template.bind( {} );
Loading.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ reportOptions ] );
	},
};
Loading.storyName = 'Loading';

export const DataUnavailable = Template.bind( {} );
DataUnavailable.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{},
			{
				options: pageTitlesReportOptions,
			}
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
	},
};
DataUnavailable.storyName = 'Data Unavailable';

export const ZeroData = Template.bind( {} );
ZeroData.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{},
			{
				options: pageTitlesReportOptions,
			}
		);

		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( zeroReport, { options: reportOptions } );
	},
};
ZeroData.storyName = 'Zero Data';

export const AdSenseNotLinked = Template.bind( {} );
AdSenseNotLinked.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( false );
	},
};
AdSenseNotLinked.storyName = 'AdSense Not Linked';

export const AdBlockerActive = Template.bind( {} );
AdBlockerActive.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );
	},
};
AdBlockerActive.storyName = 'Ad Blocker Active';

export const Error = Template.bind( {} );
Error.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ reportOptions ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ reportOptions ] );
	},
};
Error.storyName = 'Error';

export default {
	title: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				provideModuleRegistrations( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdSenseLinked( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				registry
					.dispatch( MODULES_ADSENSE )
					.setAccountID( adSenseAccountID );

				args?.setupRegistry( registry );
			};

			return (
				<ViewContextProvider
					value={ args?.viewContext ?? VIEW_CONTEXT_MAIN_DASHBOARD }
				>
					<WithRegistrySetup func={ setupRegistry }>
						<Story />
					</WithRegistrySetup>
				</ViewContextProvider>
			);
		},
	],
};
