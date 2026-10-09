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
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { WidgetProps } from '@/js/googlesitekit/widgets/components/Widget';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
} from '@/js/hooks/useDashboardType';
import { useFeature } from '@/js/hooks/useFeature';
import {
	RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG,
	RECENT_ACTIVITY_TAB_ID,
	TRAFFIC_OVERVIEW_TAB_ID,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import RecentActivityFooter from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/RecentActivityFooter';
import RecentActivityPanel from '@/js/modules/analytics-4/components/traffic-overview/tabs/RecentActivityPanel';
import TrafficOverviewPanel from '@/js/modules/analytics-4/components/traffic-overview/tabs/TrafficOverviewPanel';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import TrafficOverviewSourceLink from './TrafficOverviewSourceLink';
import TrafficOverviewTabBar, {
	TrafficOverviewTab,
} from './TrafficOverviewTabBar';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface TrafficOverviewTabDescriptor extends TrafficOverviewTab {
	/** The panel the widget renders while the tab is active. */
	PanelComponent: ComponentType;
	/** The footer the widget renders while the tab is active. */
	FooterComponent: ComponentType;
}

const TrafficOverviewWidget: FC< WidgetComponentProps > = ( {
	Widget,
	WidgetNull,
} ) => {
	// `getWidgetComponentProps` lives in a JavaScript file, so TypeScript reads
	// `Widget` as a component that takes no props. The cast leaves `widgetSlug`
	// out, because `getWidgetComponentProps` already sets it.
	const WidgetComponent = Widget as FC< Omit< WidgetProps, 'widgetSlug' > >;

	const freshDataEnabled = useFeature( 'freshData' );
	const dashboardType = useDashboardType();

	const isAnalyticsConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);

	const shouldShowRecentActivityTab = useSelect(
		( select: Select ) => {
			if ( ! freshDataEnabled ) {
				return false;
			}

			// The Recent activity tab shows data for the whole site, but the entity
			// dashboard shows data for one page.
			if ( dashboardType === DASHBOARD_TYPE_ENTITY ) {
				return false;
			}

			if ( isAnalyticsConnected ) {
				return true;
			}

			// When Analytics is not connected, the Recent activity tab shows only
			// its Analytics setup CTA, so the widget hides the tab after the user
			// dismisses that CTA.
			const isDismissed = select( CORE_USER ).isItemDismissed(
				RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG
			);

			// When the request for the dismissed items fails, the Recent activity
			// tab stays hidden, because the user may have dismissed the Analytics
			// setup CTA.
			if (
				isDismissed === undefined &&
				select( CORE_USER ).getErrorForSelector( 'getDismissedItems' )
			) {
				return false;
			}

			return isDismissed === undefined ? undefined : ! isDismissed;
		},
		[ freshDataEnabled, dashboardType, isAnalyticsConnected ]
	);

	const [ activeTabID, setActiveTabID ] = useState( TRAFFIC_OVERVIEW_TAB_ID );

	// While the modules or the dismissed items load, the widget returns
	// `null` rather than `WidgetNull`, which would mark the widget as
	// inactive until they load.
	if (
		isAnalyticsConnected === undefined ||
		shouldShowRecentActivityTab === undefined
	) {
		return null;
	}

	const tabs: TrafficOverviewTabDescriptor[] = [];

	// The Traffic overview tab shows Analytics reports only.
	if ( isAnalyticsConnected ) {
		tabs.push( {
			id: TRAFFIC_OVERVIEW_TAB_ID,
			label: __( 'Traffic overview', 'google-site-kit' ),
			PanelComponent: TrafficOverviewPanel,
			FooterComponent: TrafficOverviewSourceLink,
		} );
	}

	if ( shouldShowRecentActivityTab ) {
		tabs.push( {
			id: RECENT_ACTIVITY_TAB_ID,
			label: __( 'Recent activity', 'google-site-kit' ),
			isBeta: true,
			PanelComponent: RecentActivityPanel,
			FooterComponent: RecentActivityFooter,
		} );
	}

	if ( tabs.length === 0 ) {
		return <WidgetNull />;
	}

	const { PanelComponent, FooterComponent } =
		tabs.find( ( tab ) => tab.id === activeTabID ) ?? tabs[ 0 ];

	// When Analytics is not connected, the widget shows no report, so it has
	// no source to name in a footer.
	const Footer = isAnalyticsConnected ? FooterComponent : undefined;

	return (
		<WidgetComponent
			className="googlesitekit-widget--footer-v2"
			Footer={ Footer }
			noPadding
		>
			<TrafficOverviewTabBar
				tabs={ tabs }
				activeTabID={ activeTabID }
				onTabChange={ setActiveTabID }
			/>
			<PanelComponent />
		</WidgetComponent>
	);
};

export default TrafficOverviewWidget;
