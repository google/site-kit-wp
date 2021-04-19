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
import PropTypes from 'prop-types';

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
import { STORE_NAME } from '../../datastore/constants';
import { TextField, Input } from '../../../../material-components';
const { useDispatch, useSelect } = Data;

export default function PrototypeForm( { doneCallback } ) {
	// Get mutation functions.
	const { setSettings, submitChanges } = useDispatch( STORE_NAME );

	// Get values.
	const products = useSelect( ( select ) => select( STORE_NAME ).getProducts() );
	const publicationID = useSelect( ( select ) => select( STORE_NAME ).getPublicationID() );

	// Handle form input.
	const onChangeProducts = useCallback( ( { currentTarget } ) => {
		setSettings( { products: currentTarget.value } );
	}, [] );
	const onChangePublicationID = useCallback( ( { currentTarget } ) => {
		setSettings( { publicationID: currentTarget.value } );
	}, [] );

	// Handle form completion.
	const doneHandler = useCallback( () => {
		// Trim values before submitting.
		setSettings( {
			products: products.trim(),
			publicationID: publicationID.trim(),
		} );

		submitChanges();
		doneCallback();
	}, [ products, publicationID ] );

	return (
		<div className="googlesitekit-setup-module__inputs">
			<StoreErrorNotices moduleSlug="subscribe-with-google" storeName={ STORE_NAME } />

			<TextField
				className={ classnames( { 'mdc-text-field--error': ! publicationID } ) }
				label="Publication ID"
				outlined
			>
				<Input
					id="publicationID"
					name="publicationID"
					value={ publicationID }
					onChange={ onChangePublicationID }
				/>
			</TextField>

			<TextField
				className={ classnames( { 'mdc-text-field--error': ! products } ) }
				label="Products"
				textarea
				outlined
			>
				<Input
					id="products"
					name="products"
					value={ products }
					onChange={ onChangeProducts }
				/>
			</TextField>

			{ doneCallback &&
			<div className="googlesitekit-setup-module__action">
				<Button onClick={ doneHandler } disabled={ ! publicationID || ! products }>
					{ __( 'Done', 'google-site-kit' ) }
				</Button>
			</div>
			}

		</div>
	);
}

PrototypeForm.propTypes = {
	doneCallback: PropTypes.func,
};

PrototypeForm.defaultProps = {};
