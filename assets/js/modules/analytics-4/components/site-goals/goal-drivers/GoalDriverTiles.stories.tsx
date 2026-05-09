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
import type { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import { Story } from '@/js/types/Story';
import GoalDriverTiles from './GoalDriverTiles';
import TopTrafficChannelsGoalDriver from './TopTrafficChannelsGoalDriver';
import TopPagesGoalDriver from './TopPagesGoalDriver';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';
import type { GoalDriverTilesDriver, GoalType } from './types';

interface GoalDriverTilesStoryProps {
	drivers: GoalDriverTilesDriver[];
	hasExpandableRows: boolean;
	goalType: GoalType;
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
		totalRows: 6,
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
	},
	{
		id: 'visitorType',
		Component: VisitorTypeGoalDriver,
		rows: [
			{ label: 'Returning visitors', value: '60.5%' },
			{ label: 'New visitors', value: '39.5%' },
		],
		totalRows: 2,
	},
];

export default {
	title: 'Modules/Analytics4/Components/Site Goals/GoalDriverTiles',
	component: GoalDriverTiles,
	decorators: [
		( StoryComponent: () => ReactElement ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<StoryComponent />
				</div>
			</div>
		),
	],
};

function Template( args: GoalDriverTilesStoryProps ) {
	return (
		<TilesGroup
			className="googlesitekit-site-goals-goal-drivers-group"
			title={ __(
				'What’s helping you reach your goals?',
				'google-site-kit'
			) }
		>
			<GoalDriverTiles { ...args } />
		</TilesGroup>
	);
}

export const Ready = Template.bind( {} ) as Story< GoalDriverTilesStoryProps >;
Ready.args = {
	drivers,
	hasExpandableRows: true,
	goalType: 'lead',
};
Ready.scenario = {};

export const NoShowMore = Template.bind(
	{}
) as Story< GoalDriverTilesStoryProps >;
NoShowMore.args = {
	drivers: drivers.map( ( driver ) => ( {
		...driver,
		totalRows: 3,
		rows: driver.rows.slice( 0, 3 ),
	} ) ),
	hasExpandableRows: false,
	goalType: 'lead',
};

export const NoData = Template.bind( {} ) as Story< GoalDriverTilesStoryProps >;
NoData.args = {
	...Ready.args,
	drivers: drivers.map( ( driver ) => ( {
		...driver,
		rows: [],
	} ) ),
	hasExpandableRows: false,
};
