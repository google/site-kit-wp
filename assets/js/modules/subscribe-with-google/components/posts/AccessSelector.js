/**
 * Subscribe with Google Access Selector component.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
const { useDispatch, useSelect } = Data;

const FORM_NAME = 'swg-access-selector';

export default function AccessSelector() {
	const { products, selectedProduct } = useSelect( ( select ) => ( {
		products: select( STORE_NAME ).getProducts(),
		selectedProduct: select( CORE_FORMS ).getValue(
			FORM_NAME,
			'selectedProduct'
		),
	} ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const handleChange = useCallback(
		( event ) => {
			setValues( FORM_NAME, { selectedProduct: event.target.value } );
		},
		[ setValues ]
	);

	// Free (openaccess) is always an option.
	const options = [ 'openaccess' ];
	if ( products ) {
		options.push( ...products );
	}

	const optionElements = options.map( ( option ) => (
		<option key={ option } value={ option }>
			{ option === 'openaccess' ? '— Free —' : option }
		</option>
	) );

	return (
		<select
			value={ selectedProduct }
			name="sitekit-swg-access-selector"
			className="sitekit-swg-access-selector"
			onBlur={ handleChange }
			onChange={ handleChange }
		>
			{ optionElements }
		</select>
	);
}
