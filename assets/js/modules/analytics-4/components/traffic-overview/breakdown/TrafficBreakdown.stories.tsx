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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import TrafficBreakdown from './TrafficBreakdown';

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * @since n.e.x.t
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Object} The breakdown report.
 */
function createReport( pairs: Array< [ string, number ] > ): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};
}

const CHANNELS = createReport( [
	[ 'Direct', 1200 ],
	[ 'Organic Search', 900 ],
	[ 'Organic Social', 700 ],
	[ 'Referral', 400 ],
] );
const LOCATIONS = createReport( [
	[ 'Singapore', 1100 ],
	[ 'Brazil', 800 ],
	[ 'China', 600 ],
	[ 'United States', 400 ],
] );
const DEVICES = createReport( [
	[ 'desktop', 1800 ],
	[ 'mobile', 900 ],
	[ 'tablet', 400 ],
] );

interface TrafficBreakdownStoryProps {
	/** One report per column, keyed by the column's `id`. */
	reports: Record< string, Report | undefined >;
}

function Template( { reports }: TrafficBreakdownStoryProps ) {
	// The section's styles are scoped to the widget and the panel, so the
	// story renders inside both.
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => provideSiteInfo( registry ) }
		>
			<div className="googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel">
					<TrafficBreakdown reports={ reports } />
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
	reports: {
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
	reports: {
		channels: createReport( [
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

/** The other two columns must keep their widths beside an empty one. */
export const EmptyColumn = Template.bind(
	{}
) as Story< TrafficBreakdownStoryProps >;
EmptyColumn.storyName = 'Empty Column';
EmptyColumn.args = {
	reports: {
		channels: CHANNELS,
		locations: createReport( [] ),
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
	reports: {
		channels: createReport( [
			[ 'Cross-network', 1200 ],
			[ 'Organic Shopping', 900 ],
			[ 'Mobile Push Notifications', 700 ],
			[ 'Organic Video', 400 ],
		] ),
		locations: createReport( [
			[ 'South Georgia & South Sandwich Islands', 1100 ],
			[ 'United States Minor Outlying Islands', 800 ],
			[ 'Bonaire, Sint Eustatius and Saba', 600 ],
			[ '(not set)', 400 ],
		] ),
		devices: DEVICES,
	},
};
LongestNames.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TrafficBreakdown',
	component: TrafficBreakdown,
};
