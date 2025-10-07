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
import ScrollEffect from './ScrollEffect';
import MetricsSelectionPanel from './KeyMetrics/MetricsSelectionPanel';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import OfflineNotification from './notifications/OfflineNotification';
import ModuleDashboardEffects from './ModuleDashboardEffects';
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

export default function DashboardMainApp() {
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

	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);

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

	useMonitorInternetConnection();

	let lastWidgetAnchor = null;

	if ( isMonetizationActive ) {
		lastWidgetAnchor = ANCHOR_ID_MONETIZATION;
	} else if ( isSpeedActive ) {
		lastWidgetAnchor = ANCHOR_ID_SPEED;
	} else if ( isContentActive ) {
		lastWidgetAnchor = ANCHOR_ID_CONTENT;
	} else if ( isTrafficActive ) {
		lastWidgetAnchor = ANCHOR_ID_TRAFFIC;
	} else if ( isKeyMetricsActive ) {
		lastWidgetAnchor = ANCHOR_ID_KEY_METRICS;
	}

	return (
		<Fragment>
			<ScrollEffect />
			<ModuleDashboardEffects />

			<AdminScreenTooltip />

			<Header showNavigation>
				<EntitySearchInput />
				<DateRangeSelector />
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

				<Notifications
					areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
					groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
				/>

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
				<OfflineNotification />
			</div>

			<SurveyViewTrigger
				triggerID="view_dashboard"
				ttl={ DAY_IN_SECONDS }
			/>

			{ showSurveyPortal && <CurrentSurveyPortal /> }

			{ showKeyMetricsSelectionPanel && <MetricsSelectionPanel /> }

			{ configuredAudiences && <AudienceSelectionPanel /> }

			<OfflineNotification />
		</Fragment>
	);
}
