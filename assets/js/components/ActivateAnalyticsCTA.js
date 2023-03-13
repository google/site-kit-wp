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
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../js/modules/analytics/datastore/constants';
import { CORE_LOCATION } from '../../js/googlesitekit/datastore/location/constants';
import useActivateModuleCallback from '../hooks/useActivateModuleCallback';
import useCompleteModuleActivationCallback from '../hooks/useCompleteModuleActivationCallback';
import { useDebounce } from '../hooks/useDebounce';
const { useSelect } = Data;

export default function ActivateAnalyticsCTA( { children } ) {
	const activateModuleCallback = useActivateModuleCallback( 'analytics' );
	const completeModuleActivationCallback =
		useCompleteModuleActivationCallback( 'analytics' );
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);

	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics' )
	);
	const [ inProgress, setInProgress ] = useState( false );

	const isNavigatingToReauthURL = useSelect( ( select ) => {
		if ( ! analyticsModuleAvailable ) {
			return false;
		}

		const adminReauthURL = select( MODULES_ANALYTICS ).getAdminReauthURL();

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
			'analytics',
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

	const onClickCallback = analyticsModuleActive
		? completeModuleActivationCallback
		: activateModuleCallback;

	if ( ! analyticsModuleAvailable || ! onClickCallback ) {
		return null;
	}

	return (
		<div className="googlesitekit-analytics-cta">
			<div className="googlesitekit-analytics-cta__preview-graphs">
				{ children }
			</div>
			<div className="googlesitekit-analytics-cta__details">
				<p className="googlesitekit-analytics-cta--description">
					{ __(
						'See how many people visit your site from Search and track how you’re achieving your goals.',
						'google-site-kit'
					) }
				</p>
				<SpinnerButton
					onClick={ onClickCallback }
					isSaving={ inProgress }
				>
					{ analyticsModuleActive
						? __( 'Complete setup', 'google-site-kit' )
						: __( 'Set up Google Analytics', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</div>
	);
}

ActivateAnalyticsCTA.propTypes = {
	children: PropTypes.node.isRequired,
};
