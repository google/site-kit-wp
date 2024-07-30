/**
 * Reader Revenue Manager SetupMain component.
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
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import ReaderRevenueManagerIcon from '../../../../../svg/graphics/reader-revenue-manager.svg';
import { useRefocus } from '../../../../hooks/useRefocus';
import { PublicationSelect } from '../common';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';

export default function SetupMain() {
	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const { resetPublications } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const reset = useCallback( () => {
		// Do not reset if the publication ID is already set.
		if ( publicationID !== '' ) {
			return;
		}

		resetPublications();
	}, [ publicationID, resetPublications ] );

	// Reset publication data when user re-focuses window.
	useRefocus( reset, 15000 );

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--reader-revenue-manager">
			<div className="googlesitekit-setup-module__logo">
				<ReaderRevenueManagerIcon width="33" height="33" />
			</div>

			<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
				{ _x(
					'Reader Revenue Manager',
					'Service name',
					'google-site-kit'
				) }
			</h2>

			<div>
				<p>
					{ __(
						'Select your preferred publication to connect with Site Kit',
						'google-site-kit'
					) }
				</p>
				<PublicationSelect />
			</div>
			<div className="googlesitekit-setup-module__action">
				<SpinnerButton>
					{ __( 'Complete setup', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</div>
	);
}
