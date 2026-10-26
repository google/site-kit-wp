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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DESIGN_DAILY_VISITORS } from '@/js/modules/analytics-4/components/traffic-overview/__fixtures__';
import { createDailyTrafficRows } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import TypicalTrafficChart, {
	TypicalTrafficChartProps,
} from './TypicalTrafficChart';

/**
 * Sets the reference date to `2026-09-15`, the last day each story plots.
 *
 * The selected date range stays the default `last-28-days`, from `2026-08-19`
 * to `2026-09-15`, and `GoogleChart` draws a date marker only for a day of it.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 * @return {void}
 */
function setupRegistry( registry: WPDataRegistry ) {
	registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-15' );
}

function Template( props: TypicalTrafficChartProps ) {
	// The chart's styles apply only inside the widget and its panel, so the
	// story renders inside both.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-widget googlesitekit-widget--analyticsTrafficOverview googlesitekit-widget--no-padding">
				<div className="googlesitekit-widget__body">
					<div className="googlesitekit-traffic-overview__panel">
						<TypicalTrafficChart { ...props } />
					</div>
				</div>
			</div>
		</WithRegistrySetup>
	);
}

/**
 * A 28-day range, with the daily visitors of the design's line. The value axis
 * ends at `150`, a round number above the busiest day of `140`.
 */
export const Last28Days = Template.bind(
	{}
) as Story< TypicalTrafficChartProps >;
Last28Days.storyName = 'Last 28 Days';
Last28Days.args = {
	dailyTraffic: createDailyTrafficRows(
		28,
		'2026-09-15',
		( dayIndex ) => DESIGN_DAILY_VISITORS[ dayIndex ]
	),
	daysInSelectedRange: 28,
};
Last28Days.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

/**
 * A 90-day range. No frame of the design shows one, so the story repeats the
 * design's 28 days. The date labels sit more days apart than on a 28-day range.
 */
export const Last90Days = Template.bind(
	{}
) as Story< TypicalTrafficChartProps >;
Last90Days.storyName = 'Last 90 Days';
Last90Days.args = {
	dailyTraffic: createDailyTrafficRows(
		90,
		'2026-09-15',
		( dayIndex ) =>
			DESIGN_DAILY_VISITORS[ dayIndex % DESIGN_DAILY_VISITORS.length ]
	),
	daysInSelectedRange: 90,
};
Last90Days.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

/**
 * A range with no visitors on any day. The value axis ends at `100`, and the
 * line runs flat along the bottom.
 */
export const NoVisitors = Template.bind(
	{}
) as Story< TypicalTrafficChartProps >;
NoVisitors.storyName = 'No Visitors';
NoVisitors.args = {
	dailyTraffic: createDailyTrafficRows( 28, '2026-09-15', () => 0 ),
	daysInSelectedRange: 28,
};
NoVisitors.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

/**
 * A 28-day range with the day the Analytics property was created inside it,
 * `2026-08-26`. The chart marks that day with a dotted line, whose icon shows
 * "Google Analytics property created", and the days before it have no
 * visitors.
 */
export const PropertyCreatedInRange = Template.bind(
	{}
) as Story< TypicalTrafficChartProps >;
PropertyCreatedInRange.storyName = 'Property Created In Range';
PropertyCreatedInRange.args = {
	dailyTraffic: createDailyTrafficRows( 28, '2026-09-15', ( dayIndex ) =>
		dayIndex < 7 ? 0 : DESIGN_DAILY_VISITORS[ dayIndex ]
	),
	daysInSelectedRange: 28,
	propertyCreateDate: '2026-08-26',
};
PropertyCreatedInRange.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TypicalTrafficChart',
	component: TypicalTrafficChart,
};
