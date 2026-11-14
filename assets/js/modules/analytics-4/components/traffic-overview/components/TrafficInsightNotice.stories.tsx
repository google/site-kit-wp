/**
 * Traffic insight notice stories.
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
import { Story } from '@/js/types/Story';
import { PLACEHOLDER_TRAFFIC_INSIGHT } from './placeholderTrafficInsight';
import TrafficInsightNotice, {
	TrafficInsightNoticeProps,
} from './TrafficInsightNotice';

function Template( { text }: TrafficInsightNoticeProps ) {
	// The notice's styles are scoped to the widget and the panel, so the story
	// renders inside both.
	return (
		<div className="googlesitekit-widget--analyticsTrafficOverview">
			<div className="googlesitekit-traffic-overview__panel">
				<TrafficInsightNotice text={ text } />
			</div>
		</div>
	);
}

/**
 * This story runs no visual check, because the `TrafficOverviewWidget` Typical
 * Traffic With Insights scenario already captures the notice above the visitor
 * figures.
 */
export const Default = Template.bind(
	{}
) as Story< TrafficInsightNoticeProps >;
Default.storyName = 'Default';
Default.args = {
	text: PLACEHOLDER_TRAFFIC_INSIGHT,
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TrafficInsightNotice',
	component: TrafficInsightNotice,
};
