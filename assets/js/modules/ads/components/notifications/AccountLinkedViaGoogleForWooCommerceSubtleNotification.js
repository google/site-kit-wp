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
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY } from '../../datastore/constants';
import { MINUTE_IN_SECONDS } from '../../../../util';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import NoticeNotification from '../../../../googlesitekit/notifications/components/layout/NoticeNotification';

export default function AccountLinkedViaGoogleForWooCommerceSubtleNotification( {
	id,
	Notification,
} ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const onSetupCallback = useActivateModuleCallback( 'ads' );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const { setCacheItem } = useDispatch( CORE_SITE );

	const dismissWooCommerceRedirectModal = useCallback( async () => {
		await setCacheItem( ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY, true, {
			ttl: 5 * MINUTE_IN_SECONDS,
		} );
	}, [ setCacheItem ] );

	const onCTAClick = useCallback( async () => {
		setIsSaving( true );
		await dismissNotification( id, { skipHidingFromQueue: true } );
		await dismissWooCommerceRedirectModal();
		await onSetupCallback();
	}, [
		setIsSaving,
		dismissWooCommerceRedirectModal,
		dismissNotification,
		id,
		onSetupCallback,
	] );

	const onDismissClick = useCallback( async () => {
		setIsSaving( true );
		await dismissNotification( id );
		await dismissWooCommerceRedirectModal();
	}, [
		setIsSaving,
		dismissNotification,
		dismissWooCommerceRedirectModal,
		id,
	] );

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type="new"
				description={ __(
					'We’ve detected an existing Ads account via the Google for WooCommerce plugin. You can still create a new Ads account using Site Kit.',
					'google-site-kit'
				) }
				dismissButton={ {
					label: __( 'Create new account', 'google-site-kit' ),
					onClick: onCTAClick,
					disabled: isSaving,
				} }
				ctaButton={ {
					label: __( 'Keep existing account', 'google-site-kit' ),
					onClick: onDismissClick,
					disabled: isSaving,
				} }
			/>
		</Notification>
	);
}

AccountLinkedViaGoogleForWooCommerceSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
