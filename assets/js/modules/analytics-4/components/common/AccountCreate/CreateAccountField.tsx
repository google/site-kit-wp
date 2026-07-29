/**
 * CreateAccountField component.
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
import { ChangeEvent, FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TextField } from 'googlesitekit-components';

interface CreateAccountFieldProps {
	hasError: boolean;
	value?: string;
	setValue: ( value: string, name: string ) => void;
	name: string;
	label: string;
}

const CreateAccountField: FC< CreateAccountFieldProps > = ( {
	hasError,
	value,
	setValue,
	name,
	label,
} ) => {
	// Ensure field doesn't render until default value is available, fixing a potential render bug.
	if ( value === undefined ) {
		return null;
	}

	// `TextField` derives its error state and accessible wiring entirely
	// from `errorMessage`, so no separate `hasError`/`ariaErrorMessage`
	// scaffolding is needed here.
	const errorMessage = hasError
		? sprintf(
				/* translators: %s: field label, e.g. "Account" */
				__( '%s is required', 'google-site-kit' ),
				label
		  )
		: undefined;

	return (
		<TextField
			label={ label }
			name={ name }
			onChange={ ( event: ChangeEvent< HTMLInputElement > ) => {
				setValue( event.target.value, name );
			} }
			value={ value }
			id={ `googlesitekit_analytics_account_create_${ name }` }
			errorMessage={ errorMessage }
			outlined
		/>
	);
};

export default CreateAccountField;
