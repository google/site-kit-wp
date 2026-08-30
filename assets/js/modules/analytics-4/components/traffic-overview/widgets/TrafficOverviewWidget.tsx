/**
 * Traffic Overview widget.
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
import { ComponentType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { WidgetProps } from '@/js/googlesitekit/widgets/components/Widget';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { TRAFFIC_OVERVIEW_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import TrafficOverviewPanel from '@/js/modules/analytics-4/components/traffic-overview/tabs/TrafficOverviewPanel';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import whenActive from '@/js/util/when-active';
import TrafficOverviewSourceLink from './TrafficOverviewSourceLink';
import TrafficOverviewTabBar, {
	TrafficOverviewTab,
} from './TrafficOverviewTabBar';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface TrafficOverviewTabDescriptor extends TrafficOverviewTab {
	/** The panel the widget renders while the tab is active. */
	PanelComponent: ComponentType;
}

/** The tabs the widget shows, in the order it shows them. */
const TABS: TrafficOverviewTabDescriptor[] = [
	{
		id: TRAFFIC_OVERVIEW_TAB_ID,
		label: __( 'Traffic Overview', 'google-site-kit' ),
		PanelComponent: TrafficOverviewPanel,
	},
];

const TrafficOverviewWidget: FC< WidgetComponentProps > = ( { Widget } ) => {
	// `getWidgetComponentProps` is plain JavaScript, so TypeScript infers a
	// component that takes no props. That helper already scopes `Widget` to
	// the widget's slug, so the cast omits `widgetSlug`.
	const WidgetComponent = Widget as FC< Omit< WidgetProps, 'widgetSlug' > >;

	const [ activeTabID, setActiveTabID ] = useState( TRAFFIC_OVERVIEW_TAB_ID );

	const { PanelComponent } =
		TABS.find( ( tab ) => tab.id === activeTabID ) ?? TABS[ 0 ];

	return (
		<WidgetComponent
			className="googlesitekit-widget--footer-v2"
			Footer={ TrafficOverviewSourceLink }
			noPadding
		>
			<TrafficOverviewTabBar
				tabs={ TABS }
				activeTabID={ activeTabID }
				onTabChange={ setActiveTabID }
			/>
			<PanelComponent />
		</WidgetComponent>
	);
};

export default whenActive( { moduleName: MODULE_SLUG_ANALYTICS_4 } )(
	TrafficOverviewWidget
);
