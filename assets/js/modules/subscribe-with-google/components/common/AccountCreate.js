/**
 * Subscribe with Google Account Create component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import Button from '../../../../components/Button';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { FORM_SETUP, STORE_NAME } from '../../datastore/constants';
import { TextField, Input } from '../../../../material-components';
const { useDispatch, useSelect } = Data;

export default function AccountCreate( { finishSetup } ) {
	// Get products from either the temporary form state or the saved settings.
	const formProducts = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'products' ) );
	const settingsProducts = useSelect( ( select ) => select( STORE_NAME ).getProducts() );
	const products = formProducts ?? settingsProducts;

	// Get publication ID from either the temporary form state or the saved settings.
	const formPublicationID = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'publicationID' ) );
	const settingsPublicationID = useSelect( ( select ) => select( STORE_NAME ).getPublicationID() );
	const publicationID = formPublicationID ?? settingsPublicationID;

	// Update input fields.
	const { setValues } = useDispatch( CORE_FORMS );
	const onChangeProducts = useCallback( ( { currentTarget } ) => {
		setValues( FORM_SETUP, { products: currentTarget.value } );
	}, [] );
	const onChangePublicationID = useCallback( ( { currentTarget } ) => {
		setValues( FORM_SETUP, { publicationID: currentTarget.value } );
	}, [] );

	// Save changes.
	const { setProducts, setPublicationID, submitChanges } = useDispatch( STORE_NAME );
	const doneHandler = useCallback( () => {
		setProducts( products.trim() );
		setPublicationID( publicationID.trim() );
		submitChanges();
		finishSetup?.();
	}, [ products, publicationID ] );

	return (
		<div>
			<StoreErrorNotices moduleSlug="tagmanager" storeName={ STORE_NAME } />

			<TextField
				className={ classnames( { 'mdc-text-field--error': ! publicationID } ) }
				label={ 'Publication ID' }
				outlined
			>
				<Input
					id={ 'publicationID' }
					name={ 'publicationID' }
					value={ publicationID }
					onChange={ onChangePublicationID }
				/>
			</TextField>

			<br />
			<br />

			<TextField
				className={ classnames( { 'mdc-text-field--error': ! products } ) }
				label={ 'Products' }
				textarea
				outlined
			>
				<Input
					id={ 'products' }
					name={ 'products' }
					value={ products }
					onChange={ onChangeProducts }
				/>
			</TextField>

			<div className="googlesitekit-setup-module__action">
				<Button onClick={ doneHandler } disabled={ ! publicationID || ! products }>
					{ __( 'Done', 'google-site-kit' ) }
				</Button>
			</div>

		</div>
	);
}
