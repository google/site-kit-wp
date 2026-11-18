/**
 * RecentActivityAccessError Component Stories.
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import { provideSiteInfo, provideUserInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import RecentActivityAccessError from './RecentActivityAccessError';

interface RecentActivityAccessErrorStoryProps {
	/** Sets the registry state before the story renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
}

function Template( { setupRegistry }: RecentActivityAccessErrorStoryProps ) {
	// The message's styles apply only inside the widget and the Recent
	// activity panel.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-widget googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity">
					<RecentActivityAccessError />
				</div>
			</div>
		</WithRegistrySetup>
	);
}

/**
 * The user can't view the Analytics data. So the orange illustration, "No
 * recent activity data found" and two sentences take the place of the tab's
 * sections. The Analytics settings have no account, property or web data
 * stream, so there is no access URL and "Request access" is plain text next
 * to the "get help" link.
 */
export const Default = Template.bind(
	{}
) as Story< RecentActivityAccessErrorStoryProps >;
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideSiteInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	},
};
Default.scenario = {};

/**
 * The Analytics settings have an account, property and web data stream, so
 * "Request access" is a link to the web data stream in Analytics.
 */
export const WithAccessURL = Template.bind(
	{}
) as Story< RecentActivityAccessErrorStoryProps >;
WithAccessURL.storyName = 'With access URL';
WithAccessURL.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideSiteInfo( registry );
		provideUserInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			webDataStreamID: '78901',
		} );
	},
};
WithAccessURL.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/RecentActivityAccessError',
	component: RecentActivityAccessError,
};
