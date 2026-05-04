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

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SITE_GOALS,
} from '@/js/googlesitekit/widgets/default-contexts';
import { DAY_IN_SECONDS } from '@/js/util';
import Header from './Header';
import DashboardSharingSettingsButton from './dashboard-sharing/DashboardSharingSettingsButton';
import WidgetContextRenderer from '@/js/googlesitekit/widgets/components/WidgetContextRenderer';
import { AudienceSelectionPanel } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard';
import EntitySearchInput from './EntitySearchInput';
import DateRangeSelector from './DateRangeSelector';
import HelpMenu from './help/HelpMenu';
import SurveyViewTrigger from './surveys/SurveyViewTrigger';
import CurrentSurveyPortal from './surveys/CurrentSurveyPortal';
import MetricsSelectionPanel from './KeyMetrics/MetricsSelectionPanel';
import UserSettingsSelectionPanel from './email-reporting/UserSettingsSelectionPanel';
import PUESurveyTriggers from './email-reporting/PUESurveyTriggers';
import PDFDownloadButton from './pdf-generation/PDFDownloadButton';
import PDFSectionsSelectionPanel from './pdf-generation/PDFSectionsSelectionPanel';
import WelcomeModal from './WelcomeModal';
import SiteGoalsIntroModalBanner from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import { useFeature } from '@/js/hooks/useFeature';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
	ANCHOR_ID_SITE_GOALS,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import OfflineNotification from './notifications/OfflineNotification';
import ModuleDashboardEffects from './ModuleDashboardEffects';
import CoreDashboardEffects from './CoreDashboardEffects';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import { useMonitorInternetConnection } from '@/js/hooks/useMonitorInternetConnection';
import useQueryArg from '@/js/hooks/useQueryArg';
import { getNavigationalScrollTop } from '@/js/util/scroll';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useDisplayCTAWidget from './KeyMetrics/hooks/useDisplayCTAWidget';
import Notifications from './notifications/Notifications';
import {
	NOTIFICATION_GROUPS,
	NOTIFICATION_AREAS,
} from '@/js/googlesitekit/notifications/constants';
import { AdminScreenTooltip } from './AdminScreenTooltip';
import useFormValue from '@/js/hooks/useFormValue';
import { isInitialWelcomeModalActive } from '@/js/util/welcome-modal';
import { WELCOME_TOUR } from '@/js/feature-tours/constants';

export default function DashboardMainApp() {
	const siteGoalsEnabled = useFeature( 'siteGoals' );

	const [ showSurveyPortal, setShowSurveyPortal ] = useState( false );

	const viewOnlyDashboard = useViewOnly();

	const breakpoint = useBreakpoint();

	const [ widgetArea, setWidgetArea ] = useQueryArg( 'widgetArea' );

	const { setValues } = useDispatch( CORE_FORMS );

	const grantedScopes = useSelect( ( select ) =>
		select( CORE_USER ).getGrantedScopes()
	);
	const temporaryPersistedPermissionsError = useFormValue(
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
			setValues( FORM_TEMPORARY_PERSIST_PERMISSION_ERROR, {
				permissionsError: {},
			} );
		}
	}, [
		hasReceivedGrantedScopes,
		setValues,
		temporaryPersistedPermissionsError,
	] );

	const viewableModules = useSelect( ( select ) => {
		if ( ! viewOnlyDashboard ) {
			return null;
		}

		return select( CORE_USER ).getViewableModules();
	} );

	const widgetContextOptions = {
		modules: viewableModules ? viewableModules : undefined,
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
	const showWelcomeModal = useSelect( ( select ) => {
		if ( ! setupFlowRefreshEnabled ) {
			return false;
		}

		return (
			select( CORE_USER ).isDataGatheringCompleteModalActive() ||
			isInitialWelcomeModalActive()
		);
	} );

	useMonitorInternetConnection();

	const isWelcomeTourActive = useSelect( ( select ) => {
		const currentTour = select( CORE_USER ).getCurrentTour();

		return [
			WELCOME_TOUR.WITHOUT_ANALYTICS,
			WELCOME_TOUR.WITH_ANALYTICS,
		].includes( currentTour?.slug );
	} );

	const lastWidgetAnchor = getLastWidgetAnchor();

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
				<HelpMenu />
			</Header>

			<div className="googlesitekit-page-content">
				{ /*
					These notifications are rendered at the top of the dashboard,
					but are not attached to the header. The first component renders the
					default queue which mainly contains setup success notices. The
					second renders the Setup CTA Widgets.
				*/ }
				<Notifications areaSlug={ NOTIFICATION_AREAS.DASHBOARD_TOP } />
				<Notifications
					areaSlug={ NOTIFICATION_AREAS.DASHBOARD_TOP }
					groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
				/>

				{ ! isWelcomeTourActive && (
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

			{ pdfGenerationEnabled && <PDFSectionsSelectionPanel /> }

			{ emailReportingEnabled && (
				<Fragment>
					<UserSettingsSelectionPanel />
					<PUESurveyTriggers />
				</Fragment>
			) }

			{ configuredAudiences && <AudienceSelectionPanel /> }

			{ showWelcomeModal && <WelcomeModal /> }

			{ siteGoalsEnabled && <SiteGoalsIntroModalBanner /> }

			<OfflineNotification />
		</Fragment>
	);

	function getLastWidgetAnchor() {
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
}
