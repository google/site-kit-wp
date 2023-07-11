/**
 * OptimizeIDField component.
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
import { TextField } from 'googlesitekit-components';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { isValidOptimizeID } from '../../util';

const { useSelect, useDispatch } = Data;

export default function OptimizeIDField() {
	const optimizeID = useSelect( ( select ) =>
		select( MODULES_OPTIMIZE ).getOptimizeID()
	);

	const { setOptimizeID } = useDispatch( MODULES_OPTIMIZE );
	const onChange = useCallback(
		( event ) => {
			setOptimizeID( event.target.value );
		},
		[ setOptimizeID ]
	);

	const isInvalidValue = ! isValidOptimizeID( optimizeID ) && optimizeID;

	return (
		<div className="googlesitekit-optimize__container-id">
			<TextField
				className={ classnames( 'mdc-text-field', {
					'mdc-text-field--error': isInvalidValue,
				} ) }
				label={ __( 'Optimize Container ID', 'google-site-kit' ) }
				name="optimizeID"
				onChange={ onChange }
				helperText={
					isInvalidValue &&
					__(
						'Format: GTM-XXXXXXX or OPT-XXXXXXX',
						'google-site-kit'
					)
				}
				outlined
				value={ optimizeID }
			/>
		</div>
	);
}
