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
import { BenchmarkingVisits } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { Story } from '@/js/types/Story';
import TotalVisitors from './TotalVisitors';

interface TotalVisitorsStoryProps {
	/** Visits over the selected range and over the range before it. */
	totalVisits: BenchmarkingVisits;
	/** Unique visitors over the selected range. */
	uniqueVisitors: number;
}

/**
 * Builds a totals report whose selected range holds the unique visitors.
 *
 * The value is a string, the way the API returns it.
 *
 * @since 1.188.0
 * @since n.e.x.t Takes the unique visitors of the selected range only.
 *
 * @param {number} uniqueVisitors Unique visitors over the selected range.
 * @return {Object} The totals report.
 */
function createTotalsReport( uniqueVisitors: number ): Report {
	return {
		totals: [ { metricValues: [ { value: String( uniqueVisitors ) } ] } ],
	};
}

function Template( { totalVisits, uniqueVisitors }: TotalVisitorsStoryProps ) {
	// The section's styles are scoped to the widget and the panel, so the
	// story renders inside both.
	return (
		<div className="googlesitekit-widget--analyticsTrafficOverview">
			<div className="googlesitekit-traffic-overview__panel">
				<TotalVisitors
					report={ createTotalsReport( uniqueVisitors ) }
					totalVisits={ totalVisits }
				/>
			</div>
		</div>
	);
}

export const Rise = Template.bind( {} ) as Story< TotalVisitorsStoryProps >;
Rise.storyName = 'Rise';
Rise.args = {
	totalVisits: { current: 1200, previous: 1000 },
	uniqueVisitors: 234,
};
Rise.scenario = {};

export const Fall = Template.bind( {} ) as Story< TotalVisitorsStoryProps >;
Fall.storyName = 'Fall';
Fall.args = {
	totalVisits: { current: 1000, previous: 1200 },
	uniqueVisitors: 234,
};
Fall.scenario = {};

export const NoChange = Template.bind( {} ) as Story< TotalVisitorsStoryProps >;
NoChange.storyName = 'No Change';
NoChange.args = {
	totalVisits: { current: 1000, previous: 1000 },
	uniqueVisitors: 234,
};
NoChange.scenario = {};

/**
 * The comparison range has no visits, so there is no change to report and
 * the badge and its label both drop out.
 */
export const MissingPreviousFigure = Template.bind(
	{}
) as Story< TotalVisitorsStoryProps >;
MissingPreviousFigure.storyName = 'Missing Previous Figure';
MissingPreviousFigure.args = {
	totalVisits: { current: 1000, previous: 0 },
	uniqueVisitors: 234,
};
MissingPreviousFigure.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TotalVisitors',
	component: TotalVisitors,
};
