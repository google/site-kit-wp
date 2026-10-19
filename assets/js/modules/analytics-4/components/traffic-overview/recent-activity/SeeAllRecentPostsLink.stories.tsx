/**
 * SeeAllRecentPostsLink component stories.
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
import { provideLatestContent } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { Story } from '@/js/types/Story';
import { provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SeeAllRecentPostsLink from './SeeAllRecentPostsLink';

interface SeeAllRecentPostsLinkStoryProps {
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
}

function Template( { setupRegistry }: SeeAllRecentPostsLinkStoryProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity">
					<SeeAllRecentPostsLink />
				</div>
			</div>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind(
	{}
) as Story< SeeAllRecentPostsLinkStoryProps >;
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideLatestContent( registry );
	},
};
Default.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/SeeAllRecentPostsLink',
	component: SeeAllRecentPostsLink,
};
