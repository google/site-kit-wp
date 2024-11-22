/**
 * Sign in with Google Module Button Shape component.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	MODULES_SIGN_IN_WITH_GOOGLE,
	SIGN_IN_WITH_GOOGLE_SHAPES,
} from '../../datastore/constants';
import { Option, Select } from 'googlesitekit-components';

export default function ButtonShapeSelect() {
	const shape = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getShape()
	);
	const { setShape } = useDispatch( MODULES_SIGN_IN_WITH_GOOGLE );

	const onEnhancedChange = useCallback(
		( i, item ) => {
			const newValue = item.dataset.value;

			if ( newValue !== shape ) {
				setShape( newValue );
			}
		},
		[ shape, setShape ]
	);

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<Select
				className="googlesitekit-sign-in-with-google__select-button-shape"
				label={ __( 'Button shape', 'google-site-kit' ) }
				value={ shape }
				onEnhancedChange={ onEnhancedChange }
				enhanced
				outlined
			>
				{ SIGN_IN_WITH_GOOGLE_SHAPES.map( ( option ) => (
					<Option key={ option.value } value={ option.value }>
						{ option.label }
					</Option>
				) ) }
			</Select>
		</div>
	);
}
