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
import { ComponentType, FC, Ref } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import WidgetTabBar, { WidgetTab } from '@/js/components/WidgetTabBar';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { WidgetProps } from '@/js/googlesitekit/widgets/components/Widget';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
} from '@/js/hooks/useDashboardType';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';
import {
	RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG,
	RECENT_ACTIVITY_TAB_ID,
	TRAFFIC_OVERVIEW_TAB_ID,
	TYPICAL_TRAFFIC_TAB_ID,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { useHasTypicalTrafficTab } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useHasTypicalTrafficTab';
import RecentActivityFooter from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/RecentActivityFooter';
import RecentActivityPanel from '@/js/modules/analytics-4/components/traffic-overview/tabs/RecentActivityPanel';
import TrafficOverviewPanel from '@/js/modules/analytics-4/components/traffic-overview/tabs/TrafficOverviewPanel';
import TypicalTrafficPanel from '@/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { trackEvent } from '@/js/util';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import SparkleIcon from '@/svg/icons/sparkle.svg';
import TrafficOverviewSourceLink from './TrafficOverviewSourceLink';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

interface TrafficOverviewWidgetProps extends WidgetComponentProps {
	/** Set by `withIntersectionObserver` once the widget is in view. */
	hasBeenInView?: boolean;
}

interface TrafficOverviewTabDescriptor extends WidgetTab {
	/** The panel the widget renders while the tab is active. */
	PanelComponent: ComponentType;
	/** The footer the widget renders while the tab is active. */
	FooterComponent: ComponentType;
}

const TrafficOverviewWidget = forwardRef<
	HTMLDivElement,
	TrafficOverviewWidgetProps
>( ( { Widget, WidgetNull, hasBeenInView }, ref ) => {
	// `getWidgetComponentProps` lives in a JavaScript file, so TypeScript reads
	// `Widget` as a component that takes no props. The cast leaves `widgetSlug`
	// out, because `getWidgetComponentProps` already sets it, and adds the
	// `ref` that `Widget` passes to its root element.
	const WidgetComponent = Widget as FC<
		Omit< WidgetProps, 'widgetSlug' > & { ref?: Ref< HTMLDivElement > }
	>;

	const viewContext = useViewContext();
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

	const hasTypicalTrafficTab = useHasTypicalTrafficTab();

	const [ activeTabID, setActiveTabID ] = useState( TRAFFIC_OVERVIEW_TAB_ID );
	const [ hasTrackedView, setHasTrackedView ] = useState( false );

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

	if ( hasTypicalTrafficTab ) {
		tabs.push( {
			id: TYPICAL_TRAFFIC_TAB_ID,
			label: __( 'Typical traffic', 'google-site-kit' ),
			Icon: SparkleIcon,
			isBeta: true,
			PanelComponent: TypicalTrafficPanel,
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

	// When Analytics is not connected, Recent activity is the only tab, so the
	// widget shows it while `activeTabID` is still the Traffic overview tab.
	const shownTab: TrafficOverviewTabDescriptor | undefined =
		tabs.find( ( tab ) => tab.id === activeTabID ) ?? tabs[ 0 ];
	const shownTabID = shownTab?.id;

	// `hasBeenInView` stays `true` once the card has been in view, so
	// `hasTrackedView` keeps a change of the shown tab from sending
	// `view_widget` again.
	useEffect( () => {
		if ( hasBeenInView && ! hasTrackedView ) {
			trackEvent(
				`${ viewContext }_traffic-insights`,
				'view_widget',
				shownTabID
			);
			setHasTrackedView( true );
		}
	}, [ hasBeenInView, hasTrackedView, shownTabID, viewContext ] );

	// While the modules or the dismissed items load, the widget returns
	// `null` rather than `WidgetNull`, which would mark the widget as
	// inactive until they load.
	if (
		isAnalyticsConnected === undefined ||
		shouldShowRecentActivityTab === undefined
	) {
		return null;
	}

	if ( ! shownTab ) {
		return <WidgetNull />;
	}

	// Only the selected tab's panel mounts, so the Typical Traffic request is
	// not sent until a reader selects its tab.
	const { PanelComponent, FooterComponent } = shownTab;

	// When Analytics is not connected, the widget shows no report, so it has
	// no source to name in a footer.
	const Footer = isAnalyticsConnected ? FooterComponent : undefined;

	function handleTabChange( tabID: string ) {
		// The tab bar also calls this for a click on the tab already shown.
		if ( tabID !== shownTabID ) {
			trackEvent(
				`${ viewContext }_traffic-insights`,
				'change_tab',
				tabID
			);
		}

		setActiveTabID( tabID );
	}

	return (
		<WidgetComponent
			ref={ ref }
			className="googlesitekit-widget--footer-v2"
			Footer={ Footer }
			noPadding
		>
			<WidgetTabBar
				tabs={ tabs }
				activeTabID={ activeTabID }
				onTabChange={ handleTabChange }
			/>
			<PanelComponent />
		</WidgetComponent>
	);
} );

// The card counts as in view as soon as one pixel of it shows.
export default withIntersectionObserver( TrafficOverviewWidget, {
	threshold: 0,
} );
