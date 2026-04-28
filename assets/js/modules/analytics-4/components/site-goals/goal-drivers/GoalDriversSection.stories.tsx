/**
 * GoalDriversSection component stories.
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
import type { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import GoalDriversSection from './GoalDriversSection';
import TopTrafficChannelsGoalDriver from './TopTrafficChannelsGoalDriver';
import TopPagesGoalDriver from './TopPagesGoalDriver';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';
import type { GoalDriversSectionDriver, GoalType } from './types';

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

interface GoalDriversSectionStoryProps {
	drivers: GoalDriversSectionDriver[];
	hasExpandableRows: boolean;
	goalType: GoalType;
	setupRegistry?: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => Promise< void > | void;
	errorSelectorArgs?: Record< string, unknown >;
	useRetryableError?: boolean;
}

const drivers: GoalDriversSectionDriver[] = [
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
		totalRows: 6,
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
		totalRows: 6,
		loading: false,
	},
	{
		id: 'visitorType',
		Component: VisitorTypeGoalDriver,
		rows: [
			{ label: 'Returning visitors', value: '60.5%' },
			{ label: 'New visitors', value: '39.5%' },
		],
		totalRows: 2,
		loading: false,
	},
];

export default {
	title: 'Modules/Analytics4/Site Goals/GoalDriversSection',
	component: GoalDriversSection,
	decorators: [
		(
			Story: () => ReactElement,
			{ args }: { args: GoalDriversSectionStoryProps }
		) => {
			const wrappedStory = (
				<div className="googlesitekit-widget">
					<div className="googlesitekit-widget__body">
						<Story />
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
}: GoalDriversSectionStoryProps ) {
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
				error: retryableError,
				loading: false,
				rows: [],
		  } ) )
		: args.drivers;

	return <GoalDriversSection { ...args } drivers={ driversWithError } />;
}

export const Default = Template.bind( {} );
Default.args = {
	drivers,
	hasExpandableRows: true,
	goalType: 'lead',
};
Default.scenario = {};

export const NoShowMore = Template.bind( {} );
NoShowMore.args = {
	drivers: drivers.map( ( driver ) => ( {
		...driver,
		totalRows: 3,
		rows: driver.rows.slice( 0, 3 ),
	} ) ),
	hasExpandableRows: false,
	goalType: 'lead',
};

export const Loading = Template.bind( {} );
Loading.args = {
	drivers: drivers.map( ( driver ) => ( {
		...driver,
		rows: [],
		loading: true,
	} ) ),
	hasExpandableRows: false,
	goalType: 'lead',
};

export const NoData = Template.bind( {} );
NoData.args = {
	drivers: drivers.map( ( driver ) => ( {
		...driver,
		rows: [],
		loading: false,
	} ) ),
	hasExpandableRows: false,
	goalType: 'lead',
};

export const Error = Template.bind( {} );
Error.args = {
	drivers,
	hasExpandableRows: false,
	goalType: 'lead',
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
			.receiveError( RETRYABLE_ERROR, 'getReport', [
				RETRYABLE_REPORT_OPTIONS,
			] );
	},
};
