/**
 * DashboardPopularKeywordsWidget Stories component.
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
import DashboardPopularKeywordsWidget from './DashboardPopularKeywordsWidget';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_SEARCH_CONSOLE } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	getSearchConsoleMockResponse,
	provideSearchConsoleMockReports,
} from '../../util/data-mock';
import { provideModules } from '../../../../../../tests/js/utils';
import { replaceValuesInSearchConsoleReportWithZeroData } from '../../../../../../.storybook/utils/zeroReports';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';

const WidgetWithComponentProps = withWidgetComponentProps(
	'searchConsolePopularKeywords'
)( DashboardPopularKeywordsWidget );

const reportOptions = [
	{
		startDate: '2020-07-29',
		endDate: '2020-08-25',
		dimensions: 'query',
		limit: 10,
	},
	{
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
	},
];

function Template( { viewContext } ) {
	return (
		<ViewContextProvider
			value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
		>
			<WidgetWithComponentProps />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReports( registry, reportOptions );
	},
};

export const ViewOnly = Template.bind( {} );
ViewOnly.storyName = 'View-Only';
ViewOnly.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReports( registry, reportOptions );
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReports( registry, reportOptions );

		reportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.startResolution( 'getReport', [ options ] );
		} );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		reportOptions.forEach( ( options ) => {
			const report = getSearchConsoleMockResponse( options );
			const zeroReport = replaceValuesInSearchConsoleReportWithZeroData(
				report,
				options
			);

			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetReport( zeroReport, { options } );
		} );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const firstReportOptions = reportOptions[ 0 ];
		const remainingReportOptions = reportOptions.slice( 1 );

		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveError( error, 'getReport', [ firstReportOptions ] );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.finishResolution( 'getReport', [ firstReportOptions ] );

		provideSearchConsoleMockReports( registry, remainingReportOptions );
	},
};

export default {
	title: 'Modules/SearchConsole/Widgets/DashboardPopularKeywordsWidget',
	component: DashboardPopularKeywordsWidget,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				// Activate the module.
				provideModules( registry, [
					{
						slug: 'search-console',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-08-26' );

				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetSettings( {
						propertyID: 'https://example.com/',
					} );

				args?.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
