/**
 * ACRSubtleNotification component.
 *
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
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import StarFill from '../../../svg/icons/star-fill.svg';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { ACR_SUBTLE_NOTIFICATION_SLUG } from './constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

export default function ACRSubtleNotification() {
	const [ isNavigating, setIsNavigating ] = useState( false );

	const { dismissItem } = useDispatch( CORE_USER );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( ACR_SUBTLE_NOTIFICATION_SLUG )
	);

	const onDismiss = useCallback( async () => {
		await dismissItem( ACR_SUBTLE_NOTIFICATION_SLUG );
	}, [ dismissItem ] );

	const userInputURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);

	const handleCTAClick = useCallback( () => {
		setIsNavigating( true );
	}, [ setIsNavigating ] );

	if ( isDismissed ) {
		return null;
	}

	return (
		<SubtleNotification
			className="googlesitekit-acr-subtle-notification"
			title={ __( 'Personalize your metrics', 'google-site-kit' ) }
			description={ __(
				'Set up your goals by answering 3 quick questions to help us show the most relevant data for your site',
				'google-site-kit'
			) }
			dismissCTA={
				<Button tertiary onClick={ onDismiss }>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>
			}
			additionalCTA={
				<SpinnerButton
					onClick={ handleCTAClick }
					href={ userInputURL }
					isSaving={ isNavigating }
				>
					{ __( 'Get tailored metrics', 'google-site-kit' ) }
				</SpinnerButton>
			}
			icon={ <StarFill width={ 24 } height={ 24 } /> }
		/>
	);
}
