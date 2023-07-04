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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import KeyMetricsCTAContent from './KeyMetricsCTAContent';
import KeyMetricsCTAFooter from './KeyMetricsCTAFooter';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import useActivateModuleCallback from '../../hooks/useActivateModuleCallback';
import useCompleteModuleActivationCallback from '../../hooks/useCompleteModuleActivationCallback';
import { useDebounce } from '../../hooks/useDebounce';
const { useSelect, useDispatch } = Data;

export default function ConnectGA4CTAWidget( { Widget, WidgetNull } ) {
	const DISMISSED_ITEM_KEY = 'key-metrics-connect-ga4-cta-widget';

	const activateModuleCallback = useActivateModuleCallback( 'analytics' );
	const completeModuleActivationCallback =
		useCompleteModuleActivationCallback( 'analytics' );

	const [ inProgress, setInProgress ] = useState( false );

	/*
	 * Using debounce here because the spinner has to render across two separate calls.
	 * Rather than risk it flickering on and off in between the activation call completing and
	 * the navigate call starting, we will just set a debounce to keep the spinner for 3 seconds.
	 */
	const debouncedSetInProgress = useDebounce( setInProgress, 3000 );

	const isCTADismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( DISMISSED_ITEM_KEY )
	);
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
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
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const isNavigatingToReauthURL = useSelect( ( select ) => {
		const adminReauthURL = select( MODULES_ANALYTICS ).getAdminReauthURL();

		if ( ! adminReauthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );
	const isActivating = useSelect( ( select ) =>
		select( CORE_MODULES ).isFetchingSetModuleActivation(
			'analytics',
			true
		)
	);

	const { dismissItem } = useDispatch( CORE_USER );

	useEffect( () => {
		if ( isActivating || isNavigatingToReauthURL ) {
			setInProgress( true );
		} else {
			debouncedSetInProgress( false );
		}
	}, [ isActivating, isNavigatingToReauthURL, debouncedSetInProgress ] );

	const onClickCallback = analyticsModuleActive
		? completeModuleActivationCallback
		: activateModuleCallback;

	if (
		isCTADismissed ||
		! isUserInputCompleted ||
		isGA4Connected ||
		ga4DependantKeyMetrics.length < 3
	) {
		return <WidgetNull />;
	}

	return (
		<Widget
			noPadding
			Footer={ () => (
				<KeyMetricsCTAFooter
					onActionClick={ () => dismissItem( DISMISSED_ITEM_KEY ) }
				/>
			) }
		>
			<KeyMetricsCTAContent
				className="googlesitekit-km-connect-ga4-cta"
				title={ __(
					'Google Analytics is disconnected',
					'google-site-kit'
				) }
				description={ __(
					'Metrics cannot be displayed without Google Analytics',
					'google-site-kit'
				) }
				actions={
					<SpinnerButton
						onClick={ onClickCallback }
						isSaving={ inProgress }
					>
						{ __( 'Connect Google Analytics', 'google-site-kit' ) }
					</SpinnerButton>
				}
			/>
		</Widget>
	);
}
