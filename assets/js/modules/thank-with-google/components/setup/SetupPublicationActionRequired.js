/**
 * Thank with Google SetupPublicationActionRequired component.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../../../../components/Button';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import SetupPublicationScreen from './SetupPublicationScreen';
const { useSelect } = Data;

export default function SetupPublicationActionRequired() {
	const currentPublication = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCurrentPublication()
	);
	const currentPublicationURL = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getServicePublicationURL(
			// eslint-disable-next-line sitekit/acronym-case
			currentPublication.publicationId
		)
	);

	const viewContext = useViewContext();

	const handleCompleteSetup = useCallback( () => {
		trackEvent(
			`${ viewContext }_thank-with-google`,
			'complete_publication_setup'
		);
	}, [ viewContext ] );

	return (
		<SetupPublicationScreen
			title={ __( 'Complete your account setup', 'google-site-kit' ) }
			description={ __(
				'Finish the setup to customize and add Thank with Google on your site.',
				'google-site-kit'
			) }
		>
			<Button
				href={ currentPublicationURL }
				onClick={ handleCompleteSetup }
				target="_blank"
				aria-label={ __(
					'Complete your Thank with Google account setup',
					'google-site-kit'
				) }
			>
				{ __( 'Complete setup', 'google-site-kit' ) }
			</Button>
		</SetupPublicationScreen>
	);
}
