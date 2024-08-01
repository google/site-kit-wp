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
} from '../googlesitekit/widgets/default-contexts';
import { DAY_IN_SECONDS } from '../util';
import Header from './Header';
import DashboardSharingSettingsButton from './dashboard-sharing/DashboardSharingSettingsButton';
import WidgetContextRenderer from '../googlesitekit/widgets/components/WidgetContextRenderer';
import {
	AudienceSegmentationSetupCTAWidget,
	AudienceSelectionPanel,
} from '../modules/analytics-4/components/audience-segmentation/dashboard';
import ReaderRevenueManagerSetupCTABanner from '../modules/reader-revenue-manager/components/ReaderRevenueManagerSetupCTABanner';
import EntitySearchInput from './EntitySearchInput';
import DateRangeSelector from './DateRangeSelector';
import HelpMenu from './help/HelpMenu';
import BannerNotifications from './notifications/BannerNotifications';
import SurveyViewTrigger from './surveys/SurveyViewTrigger';
import CurrentSurveyPortal from './surveys/CurrentSurveyPortal';
import ConsentModeSetupCTAWidget from './consent-mode/ConsentModeSetupCTAWidget';
import ScrollEffect from './ScrollEffect';
import MetricsSelectionPanel from './KeyMetrics/MetricsSelectionPanel';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
} from '../googlesitekit/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../googlesitekit/widgets/datastore/constants';
import useViewOnly from '../hooks/useViewOnly';
import { CORE_FORMS } from '../googlesitekit/datastore/forms/constants';
import OfflineNotification from './notifications/OfflineNotification';
import OverlayNotificationsRenderer from './OverlayNotification/OverlayNotificationsRenderer';
import ModuleDashboardEffects from './ModuleDashboardEffects';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useFeature } from '../hooks/useFeature';
import { useMonitorInternetConnection } from '../hooks/useMonitorInternetConnection';
import useQueryArg from '../hooks/useQueryArg';
import { getContextScrollTop } from '../util/scroll';

export default function DashboardMainApp() {
	const audienceSegmentationEnabled = useFeature( 'audienceSegmentation' );
	const readerRevenueManagerEnabled = useFeature( 'rrmModule' );

	const [ showSurveyPortal, setShowSurveyPortal ] = useState( false );

	const viewOnlyDashboard = useViewOnly();

	const breakpoint = useBreakpoint();

	const [ widgetArea, setWidgetArea ] = useQueryArg( 'widgetArea' );

	const { setValues } = useDispatch( CORE_FORMS );

	const grantedScopes = useSelect( ( select ) =>
		select( CORE_USER ).getGrantedScopes()
	);
	const temporaryPersistedPermissionsError = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
			'permissionsError'
		)
	);
	const hasReceivedGrantedScopes =
		grantedScopes !== undefined &&
		temporaryPersistedPermissionsError?.data?.scopes?.some( ( scope ) =>
			grantedScopes.includes( scope )
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
				global.scrollTo( {
					top: getContextScrollTop( widgetClass, breakpoint ),
					behavior: 'smooth',
				} );

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

			<Header subHeader={ <BannerNotifications /> } showNavigation>
				<EntitySearchInput />
				<DateRangeSelector />
				{ ! viewOnlyDashboard && <DashboardSharingSettingsButton /> }
				<HelpMenu />
			</Header>

			{ ! viewOnlyDashboard && (
				<Fragment>
					{ audienceSegmentationEnabled && (
						<AudienceSegmentationSetupCTAWidget />
					) }
					<ConsentModeSetupCTAWidget />
				</Fragment>
			) }

			{ ! viewOnlyDashboard && (
				<Fragment>
					{ readerRevenueManagerEnabled && (
						<ReaderRevenueManagerSetupCTABanner />
					) }
				</Fragment>
			) }

			<OverlayNotificationsRenderer />

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

			<SurveyViewTrigger
				triggerID="view_dashboard"
				ttl={ DAY_IN_SECONDS }
			/>

			{ showSurveyPortal && <CurrentSurveyPortal /> }

			<MetricsSelectionPanel />

			{ audienceSegmentationEnabled && <AudienceSelectionPanel /> }

			<OfflineNotification />
		</Fragment>
	);
}
