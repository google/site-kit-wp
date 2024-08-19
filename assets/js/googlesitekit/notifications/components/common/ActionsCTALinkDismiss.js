/**
 * Site Kit by Google, Copyright 2024 Google LLC
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

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import { CORE_LOCATION } from '../../../datastore/location/constants';
import useNotificationEvents from '../../hooks/useNotificationEvents';
import { SpinnerButton } from 'googlesitekit-components';
import Dismiss from './Dismiss';

export default function ActionsCTALinkDismiss( {
	id,
	ctaLink,
	ctaLabel,
	dismissLabel = __( 'OK, Got it!', 'google-site-kit' ),
	dismissExpires = 0,
} ) {
	const trackEvents = useNotificationEvents( id );

	const isNavigatingToCTALink = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigatingTo( ctaLink )
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const handleCTAClick = async ( event ) => {
		event.persist();
		if ( ! event.defaultPrevented ) {
			event.preventDefault();
		}

		await Promise.all( [
			trackEvents.confirm(),
			dismissNotification( id, { expiresInSeconds: dismissExpires } ),
		] );

		navigateTo( ctaLink );
	};

	return (
		<div className="googlesitekit-publisher-win__actions">
			<SpinnerButton
				className="googlesitekit-notification__cta"
				href={ ctaLink }
				onClick={ handleCTAClick }
				disabled={ isNavigatingToCTALink }
			>
				{ ctaLabel }
			</SpinnerButton>

			<Dismiss
				id={ id }
				primary={ false }
				dismissLabel={ dismissLabel }
				dismissExpires={ dismissExpires }
				disabled={ isNavigatingToCTALink }
			/>
		</div>
	);
}
