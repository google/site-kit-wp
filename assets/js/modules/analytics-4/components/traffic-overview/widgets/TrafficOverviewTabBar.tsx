/**
 * Traffic Overview tab bar.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import ScrollableTabs from '@/js/components/ScrollableTabs';

export interface TrafficOverviewTab {
	/** The tab's identifier, which becomes the tab element's DOM `id`. */
	id: string;
	/** The text the tab shows. */
	label: string;
}

interface TrafficOverviewTabBarProps {
	/** The tabs the tab bar renders, in the order given. */
	tabs: TrafficOverviewTab[];
	/**
	 * The `id` of the selected tab. The tab bar selects the first tab when no
	 * tab has this `id`.
	 */
	activeTabID: string;
	/** The tab bar calls this handler with the `id` of the tab the user selects. */
	onTabChange: ( tabID: string ) => void;
}

const TrafficOverviewTabBar: FC< TrafficOverviewTabBarProps > = ( {
	tabs,
	activeTabID,
	onTabChange,
} ) => {
	const activeIndex = tabs.findIndex( ( tab ) => tab.id === activeTabID );

	return (
		<ScrollableTabs className="googlesitekit-traffic-overview__tabs">
			<TabBar
				activeIndex={ activeIndex < 0 ? 0 : activeIndex }
				handleActiveIndexUpdate={ ( index: number ) => {
					const tab = tabs[ index ];

					if ( tab ) {
						onTabChange( tab.id );
					}
				} }
			>
				{ tabs.map( ( tab ) => (
					<Tab
						key={ tab.id }
						id={ tab.id }
						className="mdc-tab--min-width"
						focusOnActivate={ false }
					>
						<span className="mdc-tab__text-label">
							{ tab.label }
						</span>
					</Tab>
				) ) }
			</TabBar>
		</ScrollableTabs>
	);
};

export default TrafficOverviewTabBar;
