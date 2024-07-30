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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	MODULE_SLUG,
	MODULES_READER_REVENUE_MANAGER,
} from '../../datastore/constants';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import { PublicationSelect } from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';

export default function SetupForm( { finishSetup = () => {} } ) {
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).canSubmitChanges()
	);
	const isSaving = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges()
	);

	const { submitChanges } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const submitForm = useCallback(
		async ( event ) => {
			event.preventDefault();

			const { error } = await submitChanges();

			if ( ! error ) {
				finishSetup();
			}
		},
		[ finishSetup, submitChanges ]
	);

	return (
		<form onSubmit={ submitForm }>
			<StoreErrorNotices
				moduleSlug={ MODULE_SLUG }
				storeName={ MODULES_READER_REVENUE_MANAGER }
			/>
			<p className="googlesitekit-setup-module__text">
				{ __(
					'Select your preferred publication to connect with Site Kit',
					'google-site-kit'
				) }
			</p>
			<PublicationSelect />
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
	finishSetup: PropTypes.func,
};
