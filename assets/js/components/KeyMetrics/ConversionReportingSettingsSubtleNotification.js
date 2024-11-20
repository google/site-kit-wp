/**
 * ConversionReportingSettingsSubtleNotification component.
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
import { useSelect } from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import StarFill from '../../../svg/icons/star-fill.svg';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

export default function ConversionReportingSettingsSubtleNotification() {
	const [ isNavigating, setIsNavigating ] = useState( false );

	const userInputURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);

	const handleCTAClick = useCallback( () => {
		setIsNavigating( true );
	}, [ setIsNavigating ] );

	return (
		<SubtleNotification
			className="googlesitekit-acr-subtle-notification"
			title={ __( 'Personalize your metrics', 'google-site-kit' ) }
			description={ __(
				'Set up your goals by answering 3 quick questions to help us show the most relevant data for your site',
				'google-site-kit'
			) }
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
