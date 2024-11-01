/**
 * Sign in with Google Module Client ID component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { TextField } from 'googlesitekit-components';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import { isValidClientID } from '../../utils/validation';
import { useDebounce } from '../../../../hooks/useDebounce';

export default function ClientIDTextField() {
	const clientID = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getClientID()
	);

	const [ isValid, setIsValid ] = useState(
		! clientID || isValidClientID( clientID )
	);
	const debounceSetIsValid = useDebounce( setIsValid, 500 );

	const { setClientID } = useDispatch( MODULES_SIGN_IN_WITH_GOOGLE );
	const onChange = useCallback(
		( { currentTarget } ) => {
			const newValue = currentTarget.value;

			if ( newValue !== clientID ) {
				setClientID( newValue );
			}

			debounceSetIsValid( isValidClientID( newValue ) );
		},
		[ clientID, setClientID, debounceSetIsValid ]
	);

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<TextField
				label={ __( 'Client ID', 'google-site-kit' ) }
				className={ classnames( 'googlesitekit-text-field-client-id', {
					'mdc-text-field--error': ! isValid,
				} ) }
				helperText={
					! isValid &&
					__(
						'The Sign in with Google button won’t be displayed until you insert a valid Client ID',
						'google-site-kit'
					)
				}
				outlined
				value={ clientID }
				onChange={ onChange }
				maxLength={ 120 }
			/>
		</div>
	);
}
