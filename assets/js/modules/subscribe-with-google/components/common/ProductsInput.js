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

/**
	* Internal dependencies
	*/
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { TextField, Input } from '../../../../material-components';
const { useDispatch, useSelect } = Data;

export default function ProductsInput() {
	// Get value.
	const products = useSelect( ( select ) => select( STORE_NAME ).getProducts() );

	// Handle form input.
	const { setProducts } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( { currentTarget } ) => {
		setProducts( currentTarget.value );
	}, [ setProducts ] );

	return (
		<TextField
			className={ classnames( { 'mdc-text-field--error': ! products } ) }
			label="Products"
			outlined
		>
			<Input
				id="products"
				name="products"
				value={ products }
				onChange={ onChange }
			/>
		</TextField>
	);
}
