/**
 * Site Goals breakdown tabs.
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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import InfoTooltip from '@/js/components/InfoTooltip';
import { SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID } from '@/js/modules/analytics-4/components/site-goals/constants';

export interface BreakdownTab {
	id: string;
	label: string;
	tooltip?: ReactNode;
}

interface BreakdownTabsProps {
	tabs: BreakdownTab[];
	activeTabID: string;
	onTabChange: ( tabID: string ) => void;
	showOtherSources?: boolean;
	otherSourcesLabel?: string;
}

const BreakdownTabs: FC< BreakdownTabsProps > = ( {
	tabs,
	activeTabID,
	onTabChange,
	showOtherSources = true,
	otherSourcesLabel,
} ) => {
	// The trailing "Other sources" tab aggregates every event without a value
	// for the breakdown dimension; only appended when such events exist.
	const allTabs: BreakdownTab[] = [
		...tabs,
		...( showOtherSources
			? [
					{
						id: SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID,
						label:
							otherSourcesLabel ||
							__( 'Other sources', 'google-site-kit' ),
					},
			  ]
			: [] ),
	];

	const activeIndex = allTabs.findIndex( ( tab ) => tab.id === activeTabID );

	return (
		<div className="googlesitekit-site-goals-breakdown-tabs">
			<TabBar
				activeIndex={ activeIndex < 0 ? 0 : activeIndex }
				handleActiveIndexUpdate={ ( index: number ) => {
					const tab = allTabs[ index ];

					if ( tab ) {
						onTabChange( tab.id );
					}
				} }
			>
				{ allTabs.map( ( tab ) => (
					<Tab
						key={ tab.id }
						className="mdc-tab--min-width"
						focusOnActivate={ false }
					>
						<span className="mdc-tab__text-label">
							{ tab.label }
						</span>
						{ tab.tooltip && <InfoTooltip title={ tab.tooltip } /> }
					</Tab>
				) ) }
			</TabBar>
		</div>
	);
};

export default BreakdownTabs;
