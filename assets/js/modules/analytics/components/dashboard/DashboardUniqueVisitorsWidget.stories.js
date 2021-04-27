/**
 * DashboardUniqueVisitorsWidget Component Stories.
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
import { CORE_WIDGETS, WIDGET_WIDTHS, WIDGET_AREA_STYLES } from '../../../../googlesitekit/widgets/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { accountsPropertiesProfiles } from '../../datastore/__fixtures__';
import { STORE_NAME } from '../../datastore/constants';
import { provideModules, provideSiteInfo } from '../../../../../../tests/js/utils';
import { getAnalyticsMockResponse } from '../../util/data-mock';
import WidgetAreaRenderer from '../../../../googlesitekit/widgets/components/WidgetAreaRenderer';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardUniqueVisitorsWidget from './DashboardSearchVisitorsWidget';

const areaName = 'moduleAnalyticsMain';
const widgetSlug = 'analyticsUniqueVisitors';
const currentEntityURL = 'https://www.example.com/example-page/';
const options = {
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
};
const optionsEntityURL = {
	...options,
	url: currentEntityURL,
};
const optionsCompare = {
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
};
const optionsCompareEntityURL = {
	...optionsCompare,
	url: currentEntityURL,
};

export const Loaded = () => null;
Loaded.storyName = 'Loaded';
Loaded.decorators = [
	( Story ) => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompare ), { options: optionsCompare } );
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( options ), { options } );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export const Loading = () => null;
Loading.storyName = 'Loading';
Loading.decorators = [
	( Story ) => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompare ), { options: optionsCompare } );
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( options ), { options } );
			dispatch( STORE_NAME ).startResolution( 'getReport', [ options ] );
			dispatch( STORE_NAME ).startResolution( 'getReport', [ optionsCompare ] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export const DataUnavailable = () => null;
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.decorators = [
	( Story ) => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetReport( [], { options } );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export const Error = () => null;
Error.storyName = 'Error';
Error.decorators = [
	( Story ) => {
		const setupRegistry = ( { dispatch } ) => {
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};
			dispatch( STORE_NAME ).receiveError( error, 'getReport', [ options ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ options ] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export const LoadedEntityURL = () => null;
LoadedEntityURL.storyName = 'Loaded with entity URL set';
LoadedEntityURL.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;

			provideSiteInfo( registry, { currentEntityURL } );
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompareEntityURL ), { options: optionsCompareEntityURL } );
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsEntityURL ), { options: optionsEntityURL } );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export const LoadingEntityURL = () => null;
LoadingEntityURL.storyName = 'Loading with entity URL set';
LoadingEntityURL.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;

			provideSiteInfo( registry, { currentEntityURL } );
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsCompareEntityURL ), { options: optionsCompareEntityURL } );
			dispatch( STORE_NAME ).receiveGetReport( getAnalyticsMockResponse( optionsEntityURL ), { options: optionsEntityURL } );
			dispatch( STORE_NAME ).startResolution( 'getReport', [ optionsEntityURL ] );
			dispatch( STORE_NAME ).startResolution( 'getReport', [ optionsCompareEntityURL ] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export const DataUnavailableEntityURL = () => null;
DataUnavailableEntityURL.storyName = 'Data Unavailable with entity URL set';
DataUnavailableEntityURL.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;

			provideSiteInfo( registry, { currentEntityURL } );
			dispatch( STORE_NAME ).receiveGetReport( [], { options: optionsEntityURL } );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export const ErrorEntityURL = () => null;
ErrorEntityURL.storyName = 'Error with entity URL set';
ErrorEntityURL.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const { dispatch } = registry;
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};

			provideSiteInfo( registry, { currentEntityURL } );
			dispatch( STORE_NAME ).receiveError( error, 'getReport', [ optionsEntityURL ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ optionsEntityURL ] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<WidgetAreaRenderer slug={ areaName }>
					<Story />
				</WidgetAreaRenderer>
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Analytics/Widgets/DashboardSearchVisitorsWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				const { dispatch } = registry;

				const [ property ] = accountsPropertiesProfiles.properties;
				registry.dispatch( STORE_NAME ).receiveGetSettings( {
					// eslint-disable-next-line sitekit/acronym-case
					accountID: property.accountId,
					// eslint-disable-next-line sitekit/acronym-case
					internalWebPropertyID: property.internalWebPropertyId,
					// eslint-disable-next-line sitekit/acronym-case
					profileID: property.defaultProfileId,
				} );

				dispatch( CORE_WIDGETS ).registerWidgetArea( areaName, {
					title: 'Overview',
					style: WIDGET_AREA_STYLES.BOXES,
				} );
				dispatch( CORE_WIDGETS ).registerWidget( widgetSlug, {
					Component: DashboardUniqueVisitorsWidget,
					width: WIDGET_WIDTHS.FULL,
				} );
				dispatch( CORE_WIDGETS ).assignWidget( widgetSlug, areaName );
				dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideModules( registry, [ {
					active: true,
					connected: true,
					slug: 'analytics',
				} ] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
