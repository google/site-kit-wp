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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useRegistry } from 'googlesitekit-data';
import { TextField } from 'googlesitekit-components';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import { isValidClientID } from '../../utils/validation';
import { useDebounce } from '../../../../hooks/useDebounce';

export default function ClientIDTextField() {
	const registry = useRegistry();

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

	// Prefill the clientID field with a value from a previous module connection, if it exists.
	useMount( async () => {
		// Allow default `settings` and `savedSettings` to load before updating
		// the `clientID` setting again.
		await registry
			.resolveSelect( MODULES_SIGN_IN_WITH_GOOGLE )
			.getSettings();

		// The clientID is fetched again as useMount does not receive the
		// updated clientID.
		const currentClientID = registry
			.select( MODULES_SIGN_IN_WITH_GOOGLE )
			.getClientID();

		if (
			currentClientID === '' &&
			global._googlesitekitModulesData?.[ 'sign-in-with-google' ][
				'existingClientID'
			]
		) {
			setClientID(
				global._googlesitekitModulesData[ 'sign-in-with-google' ]
					.existingClientID
			);
		}
	} );

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
						'A valid Client ID is required to use Sign in with Google',
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
