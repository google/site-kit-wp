/**
 * Traffic Overview breakdown stories.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { createBreakdownValues } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { TrafficBreakdownValue } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import TrafficBreakdown from './TrafficBreakdown';

const CHANNELS = createBreakdownValues( [
	[ 'Direct', 1200 ],
	[ 'Organic Search', 900 ],
	[ 'Organic Social', 700 ],
	[ 'Referral', 400 ],
] );
const LOCATIONS = createBreakdownValues( [
	[ 'Singapore', 1100 ],
	[ 'Brazil', 800 ],
	[ 'China', 600 ],
	[ 'United States', 400 ],
] );
const DEVICES = createBreakdownValues( [
	[ 'desktop', 1800 ],
	[ 'mobile', 900 ],
	[ 'tablet', 400 ],
] );

interface TrafficBreakdownStoryProps {
	/** The values of each column, keyed by the column's `id`. */
	values: Record< string, TrafficBreakdownValue[] | undefined >;
	/** Whether the values have arrived. */
	loaded?: boolean;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
}

function Template( {
	values,
	loaded,
	gatheringData,
}: TrafficBreakdownStoryProps ) {
	// The section's styles are scoped to the widget and the panel, so the
	// story renders inside both.
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => provideSiteInfo( registry ) }
		>
			<div className="googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel">
					<TrafficBreakdown
						values={ values }
						loaded={ loaded }
						gatheringData={ gatheringData }
					/>
				</div>
			</div>
		</WithRegistrySetup>
	);
}

export const ThreeColumns = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
ThreeColumns.storyName = 'Three Columns';
ThreeColumns.args = {
	values: {
		channels: CHANNELS,
		locations: LOCATIONS,
		devices: DEVICES,
	},
};
ThreeColumns.scenario = {};

/** More than five values in a column, so the tail folds into "Others". */
export const WithOthers = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
WithOthers.storyName = 'With Others Row';
WithOthers.args = {
	values: {
		channels: createBreakdownValues( [
			[ 'Direct', 1200 ],
			[ 'Organic Search', 900 ],
			[ 'Organic Social', 700 ],
			[ 'Referral', 400 ],
			[ 'Paid Search', 300 ],
			[ 'Email', 200 ],
		] ),
		locations: LOCATIONS,
		devices: DEVICES,
	},
};
WithOthers.scenario = {};

/**
 * Shares that would add up to 99% or 101% if each were rounded on its own,
 * and an "Others" row below one percent.
 */
export const LongTail = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
LongTail.storyName = 'Long Tail';
LongTail.args = {
	values: {
		channels: createBreakdownValues( [
			[ 'Direct', 4630 ],
			[ 'Organic Search', 3040 ],
			[ 'Organic Social', 1560 ],
			[ 'Referral', 730 ],
			[ 'Paid Search', 25 ],
			[ 'Email', 15 ],
		] ),
		locations: createBreakdownValues( [
			[ 'Singapore', 334 ],
			[ 'Brazil', 333 ],
			[ 'China', 333 ],
		] ),
		devices: createBreakdownValues( [
			[ 'desktop', 505 ],
			[ 'mobile', 305 ],
			[ 'tablet', 190 ],
		] ),
	},
};
LongTail.scenario = {};

/** The other two columns must keep their widths beside an empty one. */
export const EmptyColumn = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
EmptyColumn.storyName = 'Empty Column';
EmptyColumn.args = {
	values: {
		channels: CHANNELS,
		locations: createBreakdownValues( [] ),
		devices: DEVICES,
	},
};
EmptyColumn.scenario = {};

/** The longest channel and country names GA4 returns, which have to wrap. */
export const LongestNames = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
LongestNames.storyName = 'Longest Names';
LongestNames.args = {
	values: {
		channels: createBreakdownValues( [
			[ 'Cross-network', 1200 ],
			[ 'Organic Shopping', 900 ],
			[ 'Mobile Push Notifications', 700 ],
			[ 'Organic Video', 400 ],
		] ),
		locations: createBreakdownValues( [
			[ 'South Georgia & South Sandwich Islands', 1100 ],
			[ 'United States Minor Outlying Islands', 800 ],
			[ 'Bonaire, Sint Eustatius and Saba', 600 ],
			[ '(not set)', 400 ],
		] ),
		devices: DEVICES,
	},
};
LongestNames.scenario = {};

/**
 * After "Show more" is clicked, a column shows up to nine rows, and the ninth
 * adds up the rest as "Others".
 */
export const Expanded = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
Expanded.storyName = 'Expanded';
Expanded.args = {
	values: {
		channels: createBreakdownValues( [
			[ 'Direct', 3200 ],
			[ 'Organic Search', 1600 ],
			[ 'Referral', 1200 ],
			[ 'Display', 1100 ],
			[ 'Organic Video', 1000 ],
			[ 'Organic Social', 900 ],
			[ 'Paid Search', 500 ],
			[ 'Email', 300 ],
			[ 'Unassigned', 200 ],
		] ),
		locations: createBreakdownValues( [
			[ 'Singapore', 4200 ],
			[ 'Brazil', 2200 ],
			[ 'China', 900 ],
			[ 'United States', 800 ],
			[ 'United Kingdom', 700 ],
			[ 'France', 500 ],
			[ 'Spain', 300 ],
			[ 'Italy', 200 ],
			[ 'Germany', 150 ],
			[ 'Japan', 50 ],
		] ),
		devices: DEVICES,
	},
};
Expanded.scenario = {
	clickSelector: '.googlesitekit-traffic-overview__breakdown-toggle',
	postInteractionWait: 200,
};

export const Loading = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	values: {
		channels: CHANNELS,
		locations: LOCATIONS,
		devices: DEVICES,
	},
	loaded: false,
};

/** Every column says it is still collecting data, and nothing expands. */
export const GatheringData = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	values: {
		channels: CHANNELS,
		locations: LOCATIONS,
		devices: DEVICES,
	},
	gatheringData: true,
};
GatheringData.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TrafficBreakdown',
	component: TrafficBreakdown,
};
