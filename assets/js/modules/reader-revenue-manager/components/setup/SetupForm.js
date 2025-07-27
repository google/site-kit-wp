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
import { SpinnerButton } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import Link from '../../../../components/Link';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import Typography from '../../../../components/Typography';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	RESET_PUBLICATIONS,
} from '../../datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '../../constants';
import {
	ProductIDSelect,
	PublicationOnboardingStateNotice,
	PublicationSelect,
} from '../common';

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
	const productIDs = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getCurrentProductIDs()
	);
	const managePublicationsURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL()
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { findMatchedPublication, selectPublication, setProductID } =
		useDispatch( MODULES_READER_REVENUE_MANAGER );

	const handleLinkClick = useCallback( () => {
		setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
			[ RESET_PUBLICATIONS ]: true,
		} );
	}, [ setValues ] );

	const submitForm = useCallback(
		( event ) => {
			event.preventDefault();
			onCompleteSetup();
		},
		[ onCompleteSetup ]
	);

	const autoSelectProductID = useCallback(
		( { products } ) => {
			if ( products?.length > 0 && !! products[ 0 ].name ) {
				setProductID( products[ 0 ].name );
			}
		},
		[ setProductID ]
	);

	// Automatically pre-select a publication.
	useEffect( () => {
		const autoSelectPublication = async () => {
			const matchedPublication = await findMatchedPublication();

			if ( matchedPublication ) {
				selectPublication( matchedPublication );
				autoSelectProductID( matchedPublication );
			}
		};

		if ( ! publicationID ) {
			autoSelectPublication();
		}
	}, [
		autoSelectProductID,
		findMatchedPublication,
		publicationID,
		selectPublication,
	] );

	if ( ! publications ) {
		return null;
	}

	return (
		<form onSubmit={ submitForm }>
			<StoreErrorNotices
				moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
				storeName={ MODULES_READER_REVENUE_MANAGER }
			/>
			<Typography
				as="p"
				type="body"
				size="medium"
				className="googlesitekit-margin-bottom-0"
			>
				{ publications.length === 1
					? __(
							'Site Kit will connect your existing publication',
							'google-site-kit'
					  )
					: __(
							'Select your preferred publication to connect with Site Kit',
							'google-site-kit'
					  ) }
			</Typography>
			<div className="googlesitekit-setup-module__inputs">
				<PublicationSelect
					onChange={ ( publication ) =>
						autoSelectProductID( publication )
					}
				/>
				{ productIDs?.length > 0 && (
					<ProductIDSelect showHelperText={ false } />
				) }
			</div>
			<PublicationOnboardingStateNotice />
			<Link
				href={ managePublicationsURL }
				onClick={ handleLinkClick }
				external
			>
				{ __(
					'Manage publications in Publisher Center',
					'google-site-kit'
				) }
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
