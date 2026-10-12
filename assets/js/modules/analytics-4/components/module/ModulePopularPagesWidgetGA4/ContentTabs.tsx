/**
 * ContentTabs component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import ScrollableTabs from '@/js/components/ScrollableTabs';

export const TOP_CONTENT_TAB_ID = 'googlesitekit-top-content-tab';
export const LATEST_CONTENT_TAB_ID = 'googlesitekit-latest-content-tab';

const TABS = [
	{
		id: TOP_CONTENT_TAB_ID,
		label: __( 'Top content', 'google-site-kit' ),
	},
	{
		id: LATEST_CONTENT_TAB_ID,
		label: __( 'Latest content', 'google-site-kit' ),
	},
];

interface ContentTabsProps {
	/** The `id` of the selected tab. */
	activeTabID: string;
	/** The tab bar calls this handler with the `id` of the tab the user selects. */
	onTabChange: ( tabID: string ) => void;
}

const ContentTabs: FC< ContentTabsProps > = ( {
	activeTabID,
	onTabChange,
} ) => {
	const activeIndex = TABS.findIndex( ( tab ) => tab.id === activeTabID );

	return (
		<ScrollableTabs className="googlesitekit-analytics-popular-pages-widget__tabs">
			<TabBar
				activeIndex={ activeIndex < 0 ? 0 : activeIndex }
				handleActiveIndexUpdate={ ( index: number ) => {
					const tab = TABS[ index ];

					if ( tab ) {
						onTabChange( tab.id );
					}
				} }
			>
				{ TABS.map( ( tab ) => (
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

export default ContentTabs;
