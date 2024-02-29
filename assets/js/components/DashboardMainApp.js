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
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
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
import EntitySearchInput from './EntitySearchInput';
import DateRangeSelector from './DateRangeSelector';
import HelpMenu from './help/HelpMenu';
import BannerNotifications from './notifications/BannerNotifications';
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
} from '../googlesitekit/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../googlesitekit/widgets/datastore/constants';
import useViewOnly from '../hooks/useViewOnly';
import { CORE_FORMS } from '../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../modules/analytics-4/datastore/constants';
import { EDIT_SCOPE } from '../modules/analytics/datastore/constants';
import OfflineNotification from './notifications/OfflineNotification';
import OverlayRenderer from './OverlayNotification/OverlayRenderer';
import { useMonitorInternetConnection } from '../hooks/useMonitorInternetConnection';
const { useSelect, useDispatch } = Data;

export default function DashboardMainApp() {
	const [ showSurveyPortal, setShowSurveyPortal ] = useState( false );

	const viewOnlyDashboard = useViewOnly();

	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const hasAnalyticsEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_CUSTOM_DIMENSIONS_CREATE,
			'autoSubmit'
		)
	);

	const { createCustomDimensions } = useDispatch( MODULES_ANALYTICS_4 );
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
		if ( ! viewOnlyDashboard ) {
			// Render the current survey portal in 5 seconds after the initial rendering.
			setTimeout( () => setShowSurveyPortal( true ), 5000 );
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

	const createDimensionsAndUpdateForm = useCallback( async () => {
		await createCustomDimensions();
		setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
			isAutoCreatingCustomDimensions: false,
		} );
	}, [ createCustomDimensions, setValues ] );

	useEffect( () => {
		if (
			isKeyMetricsSetupCompleted &&
			isGA4Connected &&
			hasAnalyticsEditScope &&
			autoSubmit
		) {
			setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: false,
				isAutoCreatingCustomDimensions: true,
			} );
			createDimensionsAndUpdateForm();
		}
	}, [
		autoSubmit,
		createCustomDimensions,
		hasAnalyticsEditScope,
		isKeyMetricsSetupCompleted,
		isGA4Connected,
		setValues,
		createDimensionsAndUpdateForm,
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

			<Header subHeader={ <BannerNotifications /> } showNavigation>
				<EntitySearchInput />
				<DateRangeSelector />
				{ ! viewOnlyDashboard && <DashboardSharingSettingsButton /> }
				<HelpMenu />
			</Header>
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

			<OverlayRenderer />

			<OfflineNotification />
		</Fragment>
	);
}
