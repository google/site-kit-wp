/**
 * AccountLinkedViaGoogleForWooCommerceSubtleNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import SubtleNotification from '../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';
import CTALinkSubtle from '../../../../googlesitekit/notifications/components/common/CTALinkSubtle';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';

export default function AccountLinkedViaGoogleForWooCommerceSubtleNotification( {
	id,
	Notification,
} ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const onSetupCallback = useActivateModuleCallback( 'ads' );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const onCTAClick = useCallback( () => {
		setIsSaving( true );
		dismissNotification( id, { skipHidingFromQueue: true } );
		onSetupCallback();
	}, [ onSetupCallback, dismissNotification, id ] );

	return (
		<Notification>
			<SubtleNotification
				type="new-feature"
				description={ __(
					'We’ve detected an existing Ads account via Google for WooCommerce plugin. Now you can also create a new Ads account using Site Kit.',
					'google-site-kit'
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						dismissLabel={ __(
							'Keep existing account',
							'google-site-kit'
						) }
					/>
				}
				additionalCTA={
					<CTALinkSubtle
						id={ id }
						ctaLabel={ __(
							'Create new account',
							'google-site-kit'
						) }
						onCTAClick={ onCTAClick }
						isSaving={ isSaving }
						tertiary
					/>
				}
				reverseCTAs
			/>
		</Notification>
	);
}

AccountLinkedViaGoogleForWooCommerceSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
