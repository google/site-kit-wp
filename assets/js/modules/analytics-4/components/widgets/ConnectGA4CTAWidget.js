/**
 * ConnectGA4CTA component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import KeyMetricsCTAContent from '../../../../components/KeyMetrics/KeyMetricsCTAContent';
import KeyMetricsCTAFooter from '../../../../components/KeyMetrics/KeyMetricsCTAFooter';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../../../googlesitekit/widgets/default-areas';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { KM_CONNECT_GA4_CTA_WIDGET_DISMISSED_ITEM_KEY } from '../../constants';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import useCompleteModuleActivationCallback from '../../../../hooks/useCompleteModuleActivationCallback';
import { useDebounce } from '../../../../hooks/useDebounce';

export default function ConnectGA4CTAWidget( { Widget, WidgetNull } ) {
	const ga4DependantKeyMetrics = useSelect( ( select ) => {
		const keyMetrics = select( CORE_USER ).getKeyMetrics();
		const widgets = select( CORE_WIDGETS ).getWidgets(
			AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
		);

		if ( ! keyMetrics || ! widgets ) {
			return [];
		}

		return widgets.filter(
			( { slug, modules } ) =>
				keyMetrics.includes( slug ) && modules.includes( 'analytics-4' )
		);
	} );
	const isAnalyticsActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
	);
	const isNavigatingToReauthURL = useSelect( ( select ) => {
		const adminReauthURL =
			select( MODULES_ANALYTICS_4 ).getAdminReauthURL();

		if ( ! adminReauthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );
	const isActivatingAnalytics = useSelect( ( select ) =>
		select( CORE_MODULES ).isFetchingSetModuleActivation(
			'analytics-4',
			true
		)
	);
	const connectGA4URL = useSelect( ( select ) => {
		const settingsURL = select( CORE_SITE ).getAdminURL(
			'googlesitekit-settings'
		);

		return `${ settingsURL }#connected-services/analytics-4/edit`;
	} );
	const isNavigatingToGA4URL = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigatingTo( connectGA4URL )
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const activateAnalytics = useActivateModuleCallback( 'analytics-4' );
	const completeAnalyticsActivation =
		useCompleteModuleActivationCallback( 'analytics-4' );

	const handleCTAClick = useCallback( () => {
		if ( isAnalyticsActive ) {
			return completeAnalyticsActivation();
		}

		activateAnalytics();
	}, [ activateAnalytics, completeAnalyticsActivation, isAnalyticsActive ] );

	const [ inProgress, setInProgress ] = useState( false );

	/*
	 * Using debounce here because the spinner has to render across two separate calls.
	 * Rather than risk it flickering on and off in between the activation call completing and
	 * the navigate call starting, we will just set a debounce to keep the spinner for 3 seconds.
	 */
	const debouncedSetInProgress = useDebounce( setInProgress, 3000 );

	useEffect( () => {
		if (
			isActivatingAnalytics ||
			isNavigatingToReauthURL ||
			isNavigatingToGA4URL
		) {
			setInProgress( true );
		} else {
			debouncedSetInProgress( false );
		}
	}, [
		isActivatingAnalytics,
		isNavigatingToReauthURL,
		debouncedSetInProgress,
		isNavigatingToGA4URL,
	] );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			KM_CONNECT_GA4_CTA_WIDGET_DISMISSED_ITEM_KEY
		)
	);

	if ( isDismissed !== false || ga4DependantKeyMetrics.length < 4 ) {
		return <WidgetNull />;
	}

	return (
		<Widget
			noPadding
			Footer={ () => (
				<KeyMetricsCTAFooter
					onActionClick={ () =>
						dismissItem(
							KM_CONNECT_GA4_CTA_WIDGET_DISMISSED_ITEM_KEY
						)
					}
					showDismiss
				/>
			) }
		>
			<KeyMetricsCTAContent
				className="googlesitekit-km-connect-ga4-cta"
				title={ __( 'Analytics is disconnected', 'google-site-kit' ) }
				description={ __(
					'Metrics cannot be displayed without Analytics',
					'google-site-kit'
				) }
				actions={
					<SpinnerButton
						onClick={ handleCTAClick }
						isSaving={ inProgress }
						disabled={ inProgress }
					>
						{ __( 'Connect Analytics', 'google-site-kit' ) }
					</SpinnerButton>
				}
			/>
		</Widget>
	);
}
