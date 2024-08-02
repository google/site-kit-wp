/**
 * Reader Revenue Manager Setup form.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	MODULE_SLUG,
	MODULES_READER_REVENUE_MANAGER,
} from '../../datastore/constants';
import { useDispatch, useSelect } from 'googlesitekit-data';
import Link from '../../../../components/Link';
import { PublicationOnboardingStateNotice, PublicationSelect } from '../common';
import { SpinnerButton } from 'googlesitekit-components';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';

export default function SetupForm( { onCompleteSetup } ) {
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).canSubmitChanges()
	);
	const isSaving = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges()
	);
	const publications = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublications()
	);
	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);
	const serviceURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL()
	);

	const { findMatchedPublication, selectPublication } = useDispatch(
		MODULES_READER_REVENUE_MANAGER
	);

	const submitForm = useCallback(
		( event ) => {
			event.preventDefault();
			onCompleteSetup();
		},
		[ onCompleteSetup ]
	);

	// Automatically pre-select a publication.
	useEffect( () => {
		const autoSelectPublication = async () => {
			const matchedPublication = await findMatchedPublication();

			if ( matchedPublication ) {
				selectPublication( matchedPublication );
			}
		};

		if ( ! publicationID ) {
			autoSelectPublication();
		}
	}, [ findMatchedPublication, publicationID, selectPublication ] );

	return (
		<form onSubmit={ submitForm }>
			<StoreErrorNotices
				moduleSlug={ MODULE_SLUG }
				storeName={ MODULES_READER_REVENUE_MANAGER }
			/>
			<p className="googlesitekit-margin-bottom-0">
				{ publications.length === 1
					? __(
							'Site Kit will connect your existing publication',
							'google-site-kit'
					  )
					: __(
							'Select your preferred publication to connect with Site Kit',
							'google-site-kit'
					  ) }
			</p>
			<div className="googlesitekit-setup-module__inputs">
				<PublicationSelect />
			</div>
			<PublicationOnboardingStateNotice />
			<Link external href={ serviceURL }>
				{ __( 'Create new publication', 'google-site-kit' ) }
			</Link>
			<div className="googlesitekit-setup-module__action">
				<SpinnerButton
					disabled={ ! canSubmitChanges || isSaving }
					isSaving={ isSaving }
				>
					{ __( 'Complete setup', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	onCompleteSetup: PropTypes.func.isRequired,
};
