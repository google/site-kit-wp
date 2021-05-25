/**
 * DashboardSearchVisitorsWidget Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { STORE_NAME } from '../../datastore/constants';
import { provideModules, provideSiteInfo } from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { provideAnalyticsMockReport } from '../../util/data-mock';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardSearchVisitorsWidget from './DashboardSearchVisitorsWidget';

const reportOptions = [
	{
		compareStartDate: '2020-07-14',
		compareEndDate: '2020-08-10',
		startDate: '2020-08-11',
		endDate: '2020-09-07',
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
		dimensions: [ 'ga:channelGrouping' ],
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
	},
	{
		startDate: '2020-08-11',
		endDate: '2020-09-07',
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
		dimensions: [ 'ga:date', 'ga:channelGrouping' ],
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Users',
			},
		],
	},
];
const currentEntityURL = 'https://www.example.com/example-page/';
const reportOptionsWithEntity = reportOptions.map( ( options ) => {
	return {
		...options,
		url: currentEntityURL,
	};
} );

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )( DashboardSearchVisitorsWidget );

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		for ( const options of reportOptions ) {
			provideAnalyticsMockReport( registry, options );
		}
	},
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ reportOptions[ 0 ] ] );
	},
};

export const DataUnavailable = Template.bind( {} );
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.args = {
	setupRegistry: ( registry ) => {
		const options = reportOptions[ 0 ];
		registry.dispatch( STORE_NAME ).receiveGetReport( [], { options } );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};
		const options = reportOptions[ 0 ];
		registry.dispatch( STORE_NAME ).receiveError( error, 'getReport', [ options ] );
		registry.dispatch( STORE_NAME ).finishResolution( 'getReport', [ options ] );
	},
};

export const LoadedEntityURL = Template.bind( {} );
LoadedEntityURL.storyName = 'Ready with entity URL set';
LoadedEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		for ( const options of reportOptionsWithEntity ) {
			provideAnalyticsMockReport( registry, options );
		}
	},
};

export const LoadingEntityURL = Template.bind( {} );
LoadingEntityURL.storyName = 'Loading with entity URL set';
LoadingEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		registry.dispatch( STORE_NAME ).startResolution( 'getReport', [ reportOptionsWithEntity[ 0 ] ] );
	},
};

export const DataUnavailableEntityURL = Template.bind( {} );
DataUnavailableEntityURL.storyName = 'Data Unavailable with entity URL set';
DataUnavailableEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		registry.dispatch( STORE_NAME ).receiveGetReport( [], { options: reportOptionsWithEntity[ 0 ] } );
	},
};

export const ErrorEntityURL = Template.bind( {} );
ErrorEntityURL.storyName = 'Error with entity URL set';
ErrorEntityURL.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test_error',
			message: 'Error with entity URL set.',
			data: {},
		};

		provideSiteInfo( registry, { currentEntityURL } );
		const options = reportOptionsWithEntity[ 0 ];
		registry.dispatch( STORE_NAME ).receiveError( error, 'getReport', [ options ] );
		registry.dispatch( STORE_NAME ).finishResolution( 'getReport', [ options ] );
	},
};

export default {
	title: 'Modules/Analytics/Widgets/DashboardSearchVisitorsWidget',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideModules( registry, [ {
					active: true,
					connected: true,
					slug: 'analytics',
				} ] );

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
