/**
 * DashboardMainApp component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classnames from 'classnames';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { WELCOME_TOUR } from '@/js/feature-tours/constants';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SITE_GOALS,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
	INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import WidgetContextRenderer from '@/js/googlesitekit/widgets/components/WidgetContextRenderer';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SITE_GOALS,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import { useFeature } from '@/js/hooks/useFeature';
import useFormValue from '@/js/hooks/useFormValue';
import { useMonitorInternetConnection } from '@/js/hooks/useMonitorInternetConnection';
import useQueryArg from '@/js/hooks/useQueryArg';
import useViewOnly from '@/js/hooks/useViewOnly';
import { AudienceSelectionPanel } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard';
import SiteGoalsIntroModalBanner from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import SiteGoalsSelectionPanel from '@/js/modules/analytics-4/components/site-goals/selection-panel';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import { getNavigationalScrollTop } from '@/js/util/scroll';
import { isInitialWelcomeModalActive } from '@/js/util/welcome-modal';
import { AdminScreenTooltip } from './AdminScreenTooltip';
import CoreDashboardEffects from './CoreDashboardEffects';
import DashboardSharingSettingsButton from './dashboard-sharing/DashboardSharingSettingsButton';
import DateRangeSelector from './DateRangeSelector';
import PUESurveyTriggers from './email-reporting/PUESurveyTriggers';
import UserSettingsSelectionPanel from './email-reporting/UserSettingsSelectionPanel';
import EntitySearchInput from './EntitySearchInput';
import Header from './Header';
import HelpMenu from './help/HelpMenu';
import useDisplayCTAWidget from './KeyMetrics/hooks/useDisplayCTAWidget';
import MetricsSelectionPanel from './KeyMetrics/MetricsSelectionPanel';
import ModuleDashboardEffects from './ModuleDashboardEffects';
import Notifications from './notifications/Notifications';
import OfflineNotification from './notifications/OfflineNotification';
import PDFExportRoot from './pdf-export/PDFExportRoot';
import PDFDownloadButton from './pdf-generation/PDFDownloadButton';
import PDFSectionsSelectionPanel from './pdf-generation/PDFSectionsSelectionPanel';
import CurrentSurveyPortal from './surveys/CurrentSurveyPortal';
import SurveyViewTrigger from './surveys/SurveyViewTrigger';
import WelcomeModal from './WelcomeModal';

function getLastWidgetAnchor( {
	isMonetizationActive,
	isSpeedActive,
	isContentActive,
	isSiteGoalsActive,
	isTrafficActive,
	isKeyMetricsActive,
} ) {
	if ( isMonetizationActive ) {
		return ANCHOR_ID_MONETIZATION;
	}
	if ( isSpeedActive ) {
		return ANCHOR_ID_SPEED;
	}
	if ( isContentActive ) {
		return ANCHOR_ID_CONTENT;
	}
	if ( isSiteGoalsActive ) {
		return ANCHOR_ID_SITE_GOALS;
	}
	if ( isTrafficActive ) {
		return ANCHOR_ID_TRAFFIC;
	}
	if ( isKeyMetricsActive ) {
		return ANCHOR_ID_KEY_METRICS;
	}
	return null;
}

export default function DashboardMainApp() {
	const siteGoalsEnabled = useFeature( 'siteGoals' );

	const [ showSurveyPortal, setShowSurveyPortal ] = useState( false );

	const viewOnlyDashboard = useViewOnly();

	const breakpoint = useBreakpoint();

	const [ widgetArea, setWidgetArea ] = useQueryArg( 'widgetArea' );

	const grantedScopes = useSelect( ( select ) =>
		select( CORE_USER ).getGrantedScopes()
	);
	const [
		temporaryPersistedPermissionsError,
		setTemporaryPersistedPermissionsError,
	] = useFormValue(
		FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
		'permissionsError'
	);
	const hasReceivedGrantedScopes =
		grantedScopes !== undefined &&
		temporaryPersistedPermissionsError?.data?.scopes?.some( ( scope ) =>
			grantedScopes.includes( scope )
		);

	const hasAnalyticsAccess = useSelect( ( select ) =>
		select( CORE_USER ).hasAccessToShareableModule(
			MODULE_SLUG_ANALYTICS_4
		)
	);

	const configuredAudiences = useSelect( ( select ) => {
		if ( ! hasAnalyticsAccess ) {
			return null;
		}

		return select( CORE_USER ).getConfiguredAudiences();
	} );

	useMount( () => {
		// Render the current survey portal in 5 seconds after the initial rendering.
		if ( ! viewOnlyDashboard ) {
			setTimeout( () => setShowSurveyPortal( true ), 5000 );
		}

		// Scroll to a widget area if specified in the URL.
		if ( widgetArea ) {
			const widgetClass = `.googlesitekit-widget-area--${ widgetArea }`;

			setTimeout( () => {
				function scrollToWidgetArea() {
					global.scrollTo( {
						top: getNavigationalScrollTop(
							widgetClass,
							breakpoint
						),
						behavior: 'smooth',
					} );
				}

				function handleScrollEnd() {
					scrollToWidgetArea();
					global.removeEventListener( 'scrollend', handleScrollEnd );
				}

				global.addEventListener( 'scrollend', handleScrollEnd );

				scrollToWidgetArea();

				setWidgetArea( undefined );
			}, 100 );
		}
	} );

	useEffect( () => {
		if (
			temporaryPersistedPermissionsError !== undefined &&
			hasReceivedGrantedScopes
		) {
			setTemporaryPersistedPermissionsError( {} );
		}
	}, [
		hasReceivedGrantedScopes,
		setTemporaryPersistedPermissionsError,
		temporaryPersistedPermissionsError,
	] );

	const viewableModules = useSelect( ( select ) => {
		if ( ! viewOnlyDashboard ) {
			return null;
		}

		return select( CORE_USER ).getViewableModules();
	} );

	const widgetContextOptions = {
		modules: viewableModules,
	};

	const isKeyMetricsActive = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
			widgetContextOptions
		)
	);

	const isTrafficActive = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			CONTEXT_MAIN_DASHBOARD_TRAFFIC,
			widgetContextOptions
		)
	);

	const isSiteGoalsActive = useSelect( ( select ) =>
		siteGoalsEnabled
			? select( CORE_WIDGETS ).isWidgetContextActive(
					CONTEXT_MAIN_DASHBOARD_SITE_GOALS,
					widgetContextOptions
			  )
			: false
	);

	const isContentActive = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			CONTEXT_MAIN_DASHBOARD_CONTENT,
			widgetContextOptions
		)
	);

	const isSpeedActive = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			CONTEXT_MAIN_DASHBOARD_SPEED,
			widgetContextOptions
		)
	);

	const isMonetizationActive = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			CONTEXT_MAIN_DASHBOARD_MONETIZATION,
			widgetContextOptions
		)
	);

	const isKeyMetricsWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isKeyMetricsWidgetHidden()
	);

	const displayCTAWidget = useDisplayCTAWidget();

	const showKeyMetricsSelectionPanel = useSelect( ( select ) => {
		if (
			select( CORE_SITE ).isKeyMetricsSetupCompleted() === true &&
			isKeyMetricsWidgetHidden === false
		) {
			return true;
		}

		return (
			select( CORE_USER ).isAuthenticated() &&
			select( CORE_SITE ).isKeyMetricsSetupCompleted() === false &&
			displayCTAWidget
		);
	} );

	const emailReportingEnabled = useFeature( 'proactiveUserEngagement' );
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const pdfGenerationEnabled = useFeature( 'pdfGeneration' );

	const hasAccessToFeatureTour = useSelect( ( select ) =>
		select( CORE_USER ).hasAccessToFeatureTour()
	);

	const showWelcomeModal = useSelect( ( select ) => {
		if ( ! setupFlowRefreshEnabled || ! hasAccessToFeatureTour ) {
			return false;
		}

		return (
			select( CORE_USER ).isDataGatheringCompleteModalActive() ||
			isInitialWelcomeModalActive()
		);
	} );

	const hideSetupCTAs = useSelect( ( select ) => {
		if ( ! setupFlowRefreshEnabled ) {
			return false;
		}

		const initialSetupNotificationTimeoutDismissed = select(
			CORE_USER
		).isItemDismissed( INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG );
		const queuedHeaderNotifications = select(
			CORE_NOTIFICATIONS
		).getQueuedNotifications(
			VIEW_CONTEXT_MAIN_DASHBOARD,
			NOTIFICATION_GROUPS.DEFAULT
		);
		const firstHeaderNotificationID =
			queuedHeaderNotifications?.[ 0 ]?.id || null;

		return (
			initialSetupNotificationTimeoutDismissed ||
			firstHeaderNotificationID === 'activate-analytics-notification' ||
			firstHeaderNotificationID === 'connect-more-services-notification'
		);
	} );

	useMonitorInternetConnection();

	const showSetupOverlays = useSelect( ( select ) => {
		if ( hideSetupCTAs ) {
			return false;
		}

		const currentTour = select( CORE_USER ).getCurrentTour();

		return ! [
			WELCOME_TOUR.WITHOUT_ANALYTICS,
			WELCOME_TOUR.WITH_ANALYTICS,
		].includes( currentTour?.slug );
	} );

	const lastWidgetAnchor = getLastWidgetAnchor( {
		isMonetizationActive,
		isSpeedActive,
		isContentActive,
		isSiteGoalsActive,
		isTrafficActive,
		isKeyMetricsActive,
	} );

	return (
		<Fragment>
			<CoreDashboardEffects />
			<ModuleDashboardEffects />

			<AdminScreenTooltip />

			<Header showNavigation>
				<EntitySearchInput />
				<DateRangeSelector />
				{ pdfGenerationEnabled && <PDFDownloadButton /> }
				{ ! viewOnlyDashboard && <DashboardSharingSettingsButton /> }
				<HelpMenu showFeatureTour={ !! hasAccessToFeatureTour } />
			</Header>

			<div className="googlesitekit-page-content">
				{ /*
					These notifications are rendered at the top of the dashboard,
					but are not attached to the header. The first component renders the
					default queue which mainly contains setup success notices. The
					second renders the Setup CTA Widgets.
				*/ }
				<Notifications areaSlug={ NOTIFICATION_AREAS.DASHBOARD_TOP } />
				{ ! hideSetupCTAs && (
					<Notifications
						areaSlug={ NOTIFICATION_AREAS.DASHBOARD_TOP }
						groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
					/>
				) }

				{ showSetupOverlays && (
					<Notifications
						areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
						groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
					/>
				) }

				{ isKeyMetricsWidgetHidden !== true && (
					<WidgetContextRenderer
						id={ ANCHOR_ID_KEY_METRICS }
						slug={ CONTEXT_MAIN_DASHBOARD_KEY_METRICS }
						className={ classnames( {
							'googlesitekit-widget-context--last':
								lastWidgetAnchor === ANCHOR_ID_KEY_METRICS,
						} ) }
					/>
				) }
				<WidgetContextRenderer
					id={ ANCHOR_ID_TRAFFIC }
					slug={ CONTEXT_MAIN_DASHBOARD_TRAFFIC }
					className={ classnames( {
						'googlesitekit-widget-context--last':
							lastWidgetAnchor === ANCHOR_ID_TRAFFIC,
					} ) }
				/>
				{ siteGoalsEnabled && (
					<WidgetContextRenderer
						id={ ANCHOR_ID_SITE_GOALS }
						slug={ CONTEXT_MAIN_DASHBOARD_SITE_GOALS }
						className={ classnames( {
							'googlesitekit-widget-context--last':
								lastWidgetAnchor === ANCHOR_ID_SITE_GOALS,
						} ) }
					/>
				) }
				<WidgetContextRenderer
					id={ ANCHOR_ID_CONTENT }
					slug={ CONTEXT_MAIN_DASHBOARD_CONTENT }
					className={ classnames( {
						'googlesitekit-widget-context--last':
							lastWidgetAnchor === ANCHOR_ID_CONTENT,
					} ) }
				/>
				<WidgetContextRenderer
					id={ ANCHOR_ID_SPEED }
					slug={ CONTEXT_MAIN_DASHBOARD_SPEED }
					className={ classnames( {
						'googlesitekit-widget-context--last':
							lastWidgetAnchor === ANCHOR_ID_SPEED,
					} ) }
				/>
				<WidgetContextRenderer
					id={ ANCHOR_ID_MONETIZATION }
					slug={ CONTEXT_MAIN_DASHBOARD_MONETIZATION }
					className={ classnames( {
						'googlesitekit-widget-context--last':
							lastWidgetAnchor === ANCHOR_ID_MONETIZATION,
					} ) }
				/>
			</div>

			<SurveyViewTrigger
				triggerID="view_dashboard"
				ttl={ DAY_IN_SECONDS }
			/>

			{ showSurveyPortal && <CurrentSurveyPortal /> }

			{ showKeyMetricsSelectionPanel && <MetricsSelectionPanel /> }

			{ pdfGenerationEnabled && (
				<Fragment>
					<PDFSectionsSelectionPanel />
					<PDFExportRoot />
				</Fragment>
			) }

			{ emailReportingEnabled && (
				<Fragment>
					<UserSettingsSelectionPanel />
					<PUESurveyTriggers />
				</Fragment>
			) }

			{ configuredAudiences && <AudienceSelectionPanel /> }
			{ siteGoalsEnabled && (
				<Fragment>
					<SiteGoalsSelectionPanel />
					<SiteGoalsIntroModalBanner />
				</Fragment>
			) }

			{ showWelcomeModal && <WelcomeModal /> }

			<OfflineNotification />
		</Fragment>
	);
}
