/**
 * GoalDriverTiles component stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import CitiesGoalDriver from './CitiesGoalDriver';
import CountriesGoalDriver from './CountriesGoalDriver';
import DeviceTypeGoalDriver from './DeviceTypeGoalDriver';
import GoalDriverTiles from './GoalDriverTiles';
import { getGoalDriverTitle } from './registry';
import TopPagesGoalDriver from './TopPagesGoalDriver';
import TopTrafficChannelsGoalDriver from './TopTrafficChannelsGoalDriver';
import TopTrafficChannelsRateGoalDriver from './TopTrafficChannelsRateGoalDriver';
import { GoalDriverTilesDriver, GoalType } from './types';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';

const RETRYABLE_REPORT_OPTIONS = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'sessionDefaultChannelGroup' ],
	metrics: [ { name: 'eventCount' } ],
};

const RETRYABLE_ERROR = {
	code: 400,
	message: 'Data loading failed',
	data: {
		status: 400,
		reason: 'badRequest',
	},
};

interface GoalDriverTilesStoryProps {
	drivers: GoalDriverTilesDriver[];
	hasExpandableRows: boolean;
	goalType: GoalType;
	setupRegistry?: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => Promise< void > | void;
	errorSelectorArgs?: Record< string, unknown >;
	useRetryableError?: boolean;
}

const drivers: GoalDriverTilesDriver[] = [
	{
		id: 'topTrafficChannels',
		Component: TopTrafficChannelsGoalDriver,
		rows: [
			{ label: 'Direct', value: '30.5%' },
			{ label: 'Organic search', value: '24.7%' },
			{ label: 'Organic social', value: '16.2%' },
			{ label: 'Referral', value: '12.1%' },
			{ label: 'Email', value: '8.7%' },
			{ label: 'Paid search', value: '5.2%' },
		],
		loading: false,
	},
	{
		id: 'topTrafficChannelsRate',
		Component: TopTrafficChannelsRateGoalDriver,
		rows: [
			{ label: 'Direct', value: '7.5%' },
			{ label: 'Organic search', value: '4.7%' },
			{ label: 'Organic social', value: '1.2%' },
		],
		loading: false,
	},
	{
		id: 'topPages',
		Component: TopPagesGoalDriver,
		rows: [
			{
				label: 'What do "L" or "N" car stickers mean?',
				value: '408',
				url: 'https://analytics.google.com/',
			},
			{
				label: '6 pubs in Sao Paulo',
				value: '392',
				url: 'https://analytics.google.com/',
			},
			{
				label: 'Brazilian bar guide',
				value: '392',
				url: 'https://analytics.google.com/',
			},
			{
				label: 'How to plan your first trip',
				value: '280',
				url: 'https://analytics.google.com/',
			},
			{
				label: 'City nightlife tips',
				value: '199',
				url: 'https://analytics.google.com/',
			},
			{
				label: 'Weekend itinerary',
				value: '160',
				url: 'https://analytics.google.com/',
			},
		],
		loading: false,
	},
	{
		id: 'visitorType',
		Component: VisitorTypeGoalDriver,
		rows: [
			{ label: 'Returning visitors', value: '60.5%' },
			{ label: 'New visitors', value: '39.5%' },
		],
		loading: false,
	},
	{
		id: 'cities',
		Component: CitiesGoalDriver,
		rows: [
			{ label: 'London', value: '30.5%' },
			{ label: 'New York', value: '24.7%' },
			{ label: 'Berlin', value: '16.2%' },
		],
		loading: false,
	},
	{
		id: 'countries',
		Component: CountriesGoalDriver,
		rows: [
			{ label: 'Germany', value: '30.5%' },
			{ label: 'France', value: '24.7%' },
			{ label: 'Poland', value: '16.2%' },
		],
		loading: false,
	},
	{
		id: 'deviceType',
		Component: DeviceTypeGoalDriver,
		rows: [
			{ label: 'Mobile', value: '56.5%' },
			{ label: 'Tablet', value: '41.3%' },
			{ label: 'Desktop', value: '2.2%' },
		],
		loading: false,
	},
];

export default {
	title: 'Modules/Analytics4/Components/Site Goals/GoalDriverTiles',
	component: GoalDriverTiles,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{ args }: { args: GoalDriverTilesStoryProps }
		) => {
			const wrappedStory = (
				<div className="googlesitekit-widget">
					<div className="googlesitekit-widget__body">
						<StoryComponent />
					</div>
				</div>
			);

			if ( ! args.setupRegistry ) {
				return wrappedStory;
			}

			return (
				<WithRegistrySetup func={ args.setupRegistry }>
					{ wrappedStory }
				</WithRegistrySetup>
			);
		},
	],
};

function Template( {
	errorSelectorArgs,
	useRetryableError = false,
	...args
}: GoalDriverTilesStoryProps ) {
	const retryableError = useSelect(
		( select: Select ) => {
			if ( ! useRetryableError || ! errorSelectorArgs ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[ errorSelectorArgs ]
			);
		},
		[ errorSelectorArgs, useRetryableError ]
	);

	const driversWithError = useRetryableError
		? args.drivers.map( ( driver ) => ( {
				...driver,
				error: retryableError || RETRYABLE_ERROR,
				loading: false,
				rows: [],
		  } ) )
		: args.drivers;
	const driversWithTitles = driversWithError.map( ( driver ) => ( {
		...driver,
		title: driver.title || getGoalDriverTitle( args.goalType, driver.id ),
	} ) );

	return (
		<TilesGroup
			className="googlesitekit-site-goals-goal-drivers-group"
			title={ __(
				'What’s helping you reach your goals?',
				'google-site-kit'
			) }
		>
			<GoalDriverTiles { ...args } drivers={ driversWithTitles } />
		</TilesGroup>
	);
}

export const Ready = Template.bind( {} ) as Story< GoalDriverTilesStoryProps >;
Ready.args = {
	drivers: drivers.slice( 0, 3 ),
	hasExpandableRows: true,
	goalType: 'lead',
};
Ready.scenario = {};

export const ReadyFourDrivers = Template.bind(
	{}
) as Story< GoalDriverTilesStoryProps >;
ReadyFourDrivers.args = {
	...Ready.args,
	drivers: drivers.slice( 0, 4 ),
};

export const ReadyFiveDrivers = Template.bind(
	{}
) as Story< GoalDriverTilesStoryProps >;
ReadyFiveDrivers.args = {
	...Ready.args,
	drivers: drivers.slice( 0, 5 ),
};

export const ReadySixDrivers = Template.bind(
	{}
) as Story< GoalDriverTilesStoryProps >;
ReadySixDrivers.args = {
	...Ready.args,
	drivers: drivers.slice( 0, 6 ),
};

export const NoShowMore = Template.bind(
	{}
) as Story< GoalDriverTilesStoryProps >;
NoShowMore.args = {
	drivers: drivers.slice( 0, 3 ).map( ( driver ) => ( {
		...driver,
		rows: ( driver.rows || [] ).slice( 0, 3 ),
	} ) ),
	hasExpandableRows: false,
	goalType: 'lead',
};

export const Loading = Template.bind(
	{}
) as Story< GoalDriverTilesStoryProps >;
Loading.args = {
	...Ready.args,
	drivers: drivers.slice( 0, 6 ).map( ( driver ) => ( {
		...driver,
		rows: [],
		loading: true,
	} ) ),
	hasExpandableRows: false,
};

export const NoData = Template.bind( {} ) as Story< GoalDriverTilesStoryProps >;
NoData.args = {
	...Ready.args,
	drivers: drivers.slice( 0, 6 ).map( ( driver ) => ( {
		...driver,
		rows: [],
		loading: false,
	} ) ),
	hasExpandableRows: false,
};

export const Error = Template.bind( {} ) as Story< GoalDriverTilesStoryProps >;
Error.args = {
	...Ready.args,
	drivers: drivers.slice( 0, 6 ),
	hasExpandableRows: false,
	useRetryableError: true,
	errorSelectorArgs: RETRYABLE_REPORT_OPTIONS,
	setupRegistry: async (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( RETRYABLE_ERROR, 'getReport', [
				RETRYABLE_REPORT_OPTIONS,
			] );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ RETRYABLE_REPORT_OPTIONS ] );
	},
};
