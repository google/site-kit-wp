/**
 * ActivateAnalyticsCTA component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import ErrorCTAContent from '@/js/components/ActivateAnalyticsCTA/ErrorCTAContent';
import NormalCTAContent from '@/js/components/ActivateAnalyticsCTA/NormalCTAContent';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import useCompleteModuleActivationCallback from '@/js/hooks/useCompleteModuleActivationCallback';
import { useDebounce } from '@/js/hooks/useDebounce';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';
import {
	ANALYTICS_SETUP_ERROR,
	MODULE_SLUG_ANALYTICS_4,
} from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';

const ErrorCTAWithObserver = withIntersectionObserver( ErrorCTAContent );
const NormalCTAWithObserver = withIntersectionObserver( NormalCTAContent );

export default function ActivateAnalyticsCTA( {
	children,
	dismissedItemSlug,
	analyticsEventLabel,
} ) {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const setupFlowRefreshPhase4Enabled = useFeature(
		'setupFlowRefreshPhase4'
	);
	const viewContext = useViewContext();

	const trackEvents = useNotificationEvents(
		'activate-analytics-cta',
		undefined,
		{
			viewAction: 'view_cta',
			confirmAction: 'confirm_cta',
			dismissAction: 'dismiss_cta',
			clickLearnMoreAction: 'click_learn_more_link',
		}
	);

	const trackErrorEvents = useNotificationEvents(
		'analytics-setup-cta-error',
		viewContext,
		{
			viewAction: 'analytics_setup_cta_error',
			confirmAction: 'analytics_setup_cta_error_retry',
			dismissAction: 'analytics_setup_cta_error_dismiss',
		}
	);

	const isDismissed = useSelect( ( select ) => {
		if ( ! setupFlowRefreshEnabled ) {
			return false;
		}
		return select( CORE_USER ).isItemDismissed( dismissedItemSlug );
	} );

	const activateModuleCallback = useActivateModuleCallback(
		MODULE_SLUG_ANALYTICS_4
	);
	const completeModuleActivationCallback =
		useCompleteModuleActivationCallback( MODULE_SLUG_ANALYTICS_4 );
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( MODULE_SLUG_ANALYTICS_4 )
	);

	const analyticsModuleAvailable = useSelect( ( select ) => {
		const { isModuleAvailable } = select( CORE_MODULES );
		return (
			isModuleAvailable( MODULE_SLUG_ANALYTICS_4 ) &&
			!! select( MODULES_ANALYTICS_4 )
		);
	} );

	const documentationURL = useSelect( ( select ) => {
		if ( ! setupFlowRefreshEnabled ) {
			return null;
		}
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	const hasActivationError = useSelect( ( select ) => {
		if ( ! setupFlowRefreshEnabled || ! setupFlowRefreshPhase4Enabled ) {
			return false;
		}

		const internalServerError =
			select( CORE_SITE ).getInternalServerError();

		return (
			! analyticsModuleActive &&
			internalServerError?.id === ANALYTICS_SETUP_ERROR
		);
	} );

	const [ inProgress, setInProgress ] = useState( false );

	const isNavigatingToReauthURL = useSelect( ( select ) => {
		if ( ! analyticsModuleAvailable ) {
			return false;
		}

		const adminReauthURL =
			select( MODULES_ANALYTICS_4 ).getAdminReauthURL();

		if ( ! adminReauthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );

	const isActivating = useSelect( ( select ) => {
		if ( ! analyticsModuleAvailable ) {
			return false;
		}

		return select( CORE_MODULES ).isFetchingSetModuleActivation(
			MODULE_SLUG_ANALYTICS_4,
			true
		);
	} );

	/*
	 * Using debounce here because the spinner has to render across two separate calls.
	 * Rather than risk it flickering on and off in between the activation call completing and
	 * the navigate call starting, we will just set a debounce to keep the spinner for 3 seconds.
	 */
	const debouncedSetInProgress = useDebounce( setInProgress, 3000 );

	useEffect( () => {
		if ( isActivating || isNavigatingToReauthURL ) {
			setInProgress( true );
		} else if ( hasActivationError ) {
			setInProgress( false );
		} else {
			debouncedSetInProgress( false );
		}
	}, [
		isActivating,
		isNavigatingToReauthURL,
		debouncedSetInProgress,
		hasActivationError,
	] );

	const { dismissItem } = useDispatch( CORE_USER );
	const { clearInternalServerError } = useDispatch( CORE_SITE );

	function handleDismiss() {
		trackEvents.dismiss( analyticsEventLabel );
		dismissItem( dismissedItemSlug );
	}

	function handleActivationRetry() {
		clearInternalServerError();
		activateModuleCallback();
		trackErrorEvents.confirm( analyticsEventLabel );
	}

	function handleActivationErrorDismiss() {
		clearInternalServerError();
		trackErrorEvents.dismiss( analyticsEventLabel );
	}

	const onClickCallback = analyticsModuleActive
		? completeModuleActivationCallback
		: activateModuleCallback;

	if ( ! analyticsModuleAvailable || ! onClickCallback ) {
		return null;
	}

	if ( setupFlowRefreshEnabled && isDismissed ) {
		return null;
	}

	if ( ! setupFlowRefreshEnabled ) {
		return (
			<div className="googlesitekit-analytics-cta">
				<div className="googlesitekit-analytics-cta__preview-graphs">
					{ children }
				</div>
				<div className="googlesitekit-analytics-cta__details">
					<p className="googlesitekit-analytics-cta--description">
						{ __(
							'See how many people visit your site from Search and track how you’re achieving your goals',
							'google-site-kit'
						) }
					</p>
					<SpinnerButton
						onClick={ onClickCallback }
						isSaving={ inProgress }
						disabled={ inProgress }
					>
						{ analyticsModuleActive
							? __( 'Complete setup', 'google-site-kit' )
							: __(
									'Set up Google Analytics',
									'google-site-kit'
							  ) }
					</SpinnerButton>
				</div>
			</div>
		);
	}

	if ( hasActivationError ) {
		return (
			<ErrorCTAWithObserver
				handleActivationErrorDismiss={ handleActivationErrorDismiss }
				handleActivationRetry={ handleActivationRetry }
				inProgress={ inProgress }
				onInView={ () => trackErrorEvents.view( analyticsEventLabel ) }
			/>
		);
	}

	return (
		<NormalCTAWithObserver
			documentationURL={ documentationURL }
			analyticsEventLabel={ analyticsEventLabel }
			handleDismiss={ handleDismiss }
			inProgress={ inProgress }
			onClickCallback={ onClickCallback }
			analyticsModuleActive={ analyticsModuleActive }
			trackEvents={ trackEvents }
			onInView={ () => trackEvents.view( analyticsEventLabel ) }
		/>
	);
}

ActivateAnalyticsCTA.propTypes = {
	children: PropTypes.node,
	dismissedItemSlug: PropTypes.string.isRequired,
	analyticsEventLabel: PropTypes.string,
};
