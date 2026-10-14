/**
 * TypicalTrafficChart stories.
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
import { DESIGN_DAILY_VISITORS } from '@/js/modules/analytics-4/components/traffic-overview/__fixtures__';
import {
	createDailyTrafficRows,
	getPropertyCreateTimeAtMidday,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { Story } from '@/js/types/Story';
import TypicalTrafficChart, {
	TypicalTrafficChartProps,
} from './TypicalTrafficChart';

function Template( props: TypicalTrafficChartProps ) {
	// The chart's styles apply only inside the widget and its panel, so the
	// story renders inside both.
	return (
		<div className="googlesitekit-widget googlesitekit-widget--analyticsTrafficOverview googlesitekit-widget--no-padding">
			<div className="googlesitekit-widget__body">
				<div className="googlesitekit-traffic-overview__panel">
					<TypicalTrafficChart { ...props } />
				</div>
			</div>
		</div>
	);
}

const selectedRange = {
	selectedStartDate: '2026-08-19',
	selectedEndDate: '2026-09-15',
	daysInSelectedRange: 28,
};

/**
 * This story runs no visual check, because the `TrafficOverviewWidget`
 * "Typical Traffic Selected" scenario already captures the chart.
 */
export const Ready = Template.bind( {} ) as Story< TypicalTrafficChartProps >;
Ready.storyName = 'Ready';
Ready.args = {
	...selectedRange,
	dailyTraffic: createDailyTrafficRows(
		'2026-09-15',
		( dayIndex ) => DESIGN_DAILY_VISITORS[ dayIndex ]
	),
};

/**
 * The Analytics property was created six weeks into the window. The chart
 * marks that day, which explains the days at zero before it.
 */
export const PropertyCreatedInWindow = Template.bind(
	{}
) as Story< TypicalTrafficChartProps >;
PropertyCreatedInWindow.storyName = 'Property Created In Window';
PropertyCreatedInWindow.args = {
	...selectedRange,
	dailyTraffic: createDailyTrafficRows( '2026-09-15', ( dayIndex ) =>
		dayIndex < 42 ? 0 : DESIGN_DAILY_VISITORS[ dayIndex ]
	),
	// `2025-09-28` is the first day with visitors.
	propertyCreateTime: getPropertyCreateTimeAtMidday( '2025-09-28' ),
};
// Every viewport, because desktop and smaller screens make room for the
// marker's icon with different styles.
PropertyCreatedInWindow.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
};

/**
 * A site with no visitors on any day of the window. The value axis ends at
 * `100`, and the line runs flat along the bottom.
 */
export const NoVisitors = Template.bind(
	{}
) as Story< TypicalTrafficChartProps >;
NoVisitors.storyName = 'No Visitors';
NoVisitors.args = {
	...selectedRange,
	dailyTraffic: createDailyTrafficRows( '2026-09-15', () => 0 ),
};
NoVisitors.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TypicalTrafficChart',
	component: TypicalTrafficChart,
};
