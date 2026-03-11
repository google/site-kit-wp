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
import {
	createInterpolateElement,
	useEffect,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton, Button } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import useCompleteModuleActivationCallback from '@/js/hooks/useCompleteModuleActivationCallback';
import { useDebounce } from '@/js/hooks/useDebounce';
import { useFeature } from '@/js/hooks/useFeature';
import Link from '@/js/components/Link';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';

export default function ActivateAnalyticsCTA( {
	children,
	dismissedItemSlug,
} ) {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

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
		} else {
			debouncedSetInProgress( false );
		}
	}, [ isActivating, isNavigatingToReauthURL, debouncedSetInProgress ] );

	const { dismissItem } = useDispatch( CORE_USER );

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

	return (
		<div className="googlesitekit-activate-analytics-cta">
			<div className="googlesitekit-activate-analytics-cta__top">
				<div className="googlesitekit-activate-analytics-cta__icon">
					<AnalyticsIcon width={ 28 } height={ 31 } />
				</div>
				<p className="googlesitekit-activate-analytics-cta__description">
					{ createInterpolateElement(
						__(
							'See how many people visit your site from Search and track how you’re achieving your goals. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: <Link href={ documentationURL } external />,
						}
					) }
				</p>
			</div>
			<div className="googlesitekit-activate-analytics-cta__actions">
				<Button
					className="googlesitekit-activate-analytics-cta__button--secondary"
					onClick={ () => dismissItem( dismissedItemSlug ) }
					tertiary
				>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>
				<SpinnerButton
					className="googlesitekit-activate-analytics-cta__button--primary"
					onClick={ onClickCallback }
					isSaving={ inProgress }
					disabled={ inProgress }
				>
					{ analyticsModuleActive
						? __( 'Complete setup', 'google-site-kit' )
						: __( 'Set up Analytics', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</div>
	);
}

ActivateAnalyticsCTA.propTypes = {
	children: PropTypes.node,
	dismissedItemSlug: PropTypes.string.isRequired,
};
