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
import { useMount } from 'react-use';

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
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	READER_REVENUE_MANAGER_MODULE_SLUG,
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	RESET_PUBLICATIONS,
} from '../../datastore/constants';
import {
	ProductIDSelect,
	PublicationOnboardingStateNotice,
	PublicationSelect,
} from '../common';
import { useFeature } from '../../../../hooks/useFeature';

export default function SetupForm( { onCompleteSetup } ) {
	const isRRMv2Enabled = useFeature( 'rrmModuleV2' );

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
	const productID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductID()
	);
	const productIDs = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs()
	);
	const serviceURL = useSelect( ( select ) =>
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

	// Auto-select the first custom product ID if none is selected.
	useMount( () => {
		if (
			productIDs?.length > 0 &&
			( ! productID || productID === 'openaccess' )
		) {
			const firstCustomProductID = productIDs.find(
				( id ) => id !== 'openaccess'
			);
			if ( firstCustomProductID ) {
				setProductID( firstCustomProductID );
			}
		}
	} );

	if ( ! publications ) {
		return null;
	}

	return (
		<form onSubmit={ submitForm }>
			<StoreErrorNotices
				moduleSlug={ READER_REVENUE_MANAGER_MODULE_SLUG }
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
				{ isRRMv2Enabled && productIDs?.length > 0 && (
					<ProductIDSelect showHelperText={ false } />
				) }
			</div>
			<PublicationOnboardingStateNotice />
			<Link external href={ serviceURL } onClick={ handleLinkClick }>
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
