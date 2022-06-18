/**
 * Thank with Google Revenue Model Input component.
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
import { REVENUE_MODELS } from '../../constants';
import { STORE_NAME } from '../../datastore/constants';
import { Option, Select } from '../../../../material-components';
import { isValidRevenueModel } from '../../util/validation';
const { useDispatch, useSelect } = Data;

export default function RevenueModelDropdown() {
	// Get value.
	const revenueModel = useSelect( ( select ) =>
		select( STORE_NAME ).getRevenueModel()
	);

	// Handle form input.
	const { setRevenueModel } = useDispatch( STORE_NAME );
	const onChange = useCallback(
		( index ) => {
			setRevenueModel( REVENUE_MODELS[ index ].value );
		},
		[ setRevenueModel ]
	);

	// Bail if the value isn't ready.
	if ( revenueModel === undefined ) {
		return null;
	}

	return (
		<Select
			className={ classnames( {
				'mdc-text-field--error':
					revenueModel && ! isValidRevenueModel( revenueModel ),
			} ) }
			label="Revenue Model"
			value={ revenueModel }
			onEnhancedChange={ onChange }
			enhanced
			outlined
		>
			{ REVENUE_MODELS.map( ( { displayName, value } ) => (
				<Option key={ value } value={ value }>
					{ displayName }
				</Option>
			) ) }
		</Select>
	);
}
