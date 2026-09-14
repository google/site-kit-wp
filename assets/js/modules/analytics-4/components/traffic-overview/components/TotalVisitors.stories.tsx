/**
 * Traffic Overview total visitors stories.
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
 * Internal dependencies
 */
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { Story } from '@/js/types/Story';
import TotalVisitors from './TotalVisitors';

interface TotalVisitorsStoryProps {
	/** Visitors over the selected range. */
	currentValue: number;
	/** Visitors over the range before it. */
	previousValue: number;
}

/**
 * Builds a totals report holding the selected range then the range before it.
 *
 * The values are strings, the way the API returns them.
 *
 * @since n.e.x.t
 *
 * @param {number} currentValue  Visitors over the selected range.
 * @param {number} previousValue Visitors over the range before it.
 * @return {Object} The totals report.
 */
function createTotalsReport(
	currentValue: number,
	previousValue: number
): Report {
	return {
		totals: [
			{ metricValues: [ { value: String( currentValue ) } ] },
			{ metricValues: [ { value: String( previousValue ) } ] },
		],
	};
}

function Template( { currentValue, previousValue }: TotalVisitorsStoryProps ) {
	// The section's styles are scoped to the widget and the panel, so the
	// story renders inside both.
	return (
		<div className="googlesitekit-widget--analyticsTrafficOverview">
			<div className="googlesitekit-traffic-overview__panel">
				<TotalVisitors
					report={ createTotalsReport( currentValue, previousValue ) }
				/>
			</div>
		</div>
	);
}

export const Rise = Template.bind( {} ) as Story< TotalVisitorsStoryProps >;
Rise.storyName = 'Rise';
Rise.args = {
	currentValue: 1200,
	previousValue: 1000,
};
Rise.scenario = {};

export const Fall = Template.bind( {} ) as Story< TotalVisitorsStoryProps >;
Fall.storyName = 'Fall';
Fall.args = {
	currentValue: 1000,
	previousValue: 1200,
};
Fall.scenario = {};

export const NoChange = Template.bind( {} ) as Story< TotalVisitorsStoryProps >;
NoChange.storyName = 'No Change';
NoChange.args = {
	currentValue: 1000,
	previousValue: 1000,
};
NoChange.scenario = {};

/**
 * The comparison range has no visitors, so there is no change to report and
 * the badge and its label both drop out.
 */
export const MissingPreviousFigure = Template.bind(
	{}
) as Story< TotalVisitorsStoryProps >;
MissingPreviousFigure.storyName = 'Missing Previous Figure';
MissingPreviousFigure.args = {
	currentValue: 1000,
	previousValue: 0,
};
MissingPreviousFigure.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TotalVisitors',
	component: TotalVisitors,
};
