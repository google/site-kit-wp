/**
 * Reader Revenue Manager PublicationCreate component.
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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	RESET_PUBLICATIONS,
} from '../../datastore/constants';
import ExternalIcon from '../../../../../svg/icons/external.svg';

export default function PublicationCreate( { onCompleteSetup } ) {
	const publications = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublications()
	);
	const serviceURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL()
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { selectPublication } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const hasPublication = publications && publications.length > 0;

	const handleLinkClick = useCallback( () => {
		setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
			[ RESET_PUBLICATIONS ]: true,
		} );
	}, [ setValues ] );

	const handleCompleteSetupClick = useCallback( async () => {
		if ( ! hasPublication ) {
			return;
		}

		await selectPublication( publications[ 0 ] );

		onCompleteSetup();
	}, [ hasPublication, onCompleteSetup, publications, selectPublication ] );

	if ( publications === undefined ) {
		return null;
	}

	return (
		<div className="googlesitekit-setup-module__publication-create-screen">
			{ ! hasPublication && (
				<Fragment>
					<h3 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
						{ __(
							'To complete your Reader Revenue Manager account setup you will need to create a publication.',
							'google-site-kit'
						) }
					</h3>
					<p className="googlesitekit-setup-module__description">
						{ __(
							'Once you have created your publication, it is submitted for review.',
							'google-site-kit'
						) }
					</p>
					<div className="googlesitekit-setup-module__action">
						<Button
							href={ serviceURL }
							target="_blank"
							trailingIcon={
								<ExternalIcon width={ 14 } height={ 14 } />
							}
							onClick={ handleLinkClick }
						>
							{ __( 'Create publication', 'google-site-kit' ) }
						</Button>
					</div>
				</Fragment>
			) }
			{ hasPublication && (
				<Fragment>
					<h3 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
						{ __(
							'You have successfully created your publication and it is now awaiting review. This might take up to 2 weeks.',
							'google-site-kit'
						) }
					</h3>
					<div className="googlesitekit-setup-module__action">
						<SpinnerButton onClick={ handleCompleteSetupClick }>
							{ __( 'Complete setup', 'google-site-kit' ) }
						</SpinnerButton>
					</div>
				</Fragment>
			) }
		</div>
	);
}

PublicationCreate.propTypes = {
	onCompleteSetup: PropTypes.func.isRequired,
};
