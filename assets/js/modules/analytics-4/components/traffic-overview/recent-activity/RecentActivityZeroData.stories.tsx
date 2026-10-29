/**
 * RecentActivityZeroData Component Stories.
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
import RecentActivityZeroData from './RecentActivityZeroData';

function Template() {
	// The message's styles apply only inside the widget and the Recent
	// activity panel.
	return (
		<div className="googlesitekit-widget googlesitekit-widget--analyticsTrafficOverview">
			<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity">
				<RecentActivityZeroData />
			</div>
		</div>
	);
}

/**
 * Neither Analytics nor Search Console has recent data. So the green
 * illustration, "No recent activity data found" and two sentences about when
 * to expect data take the place of the tab's sections.
 */
export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/RecentActivityZeroData',
	component: RecentActivityZeroData,
};
