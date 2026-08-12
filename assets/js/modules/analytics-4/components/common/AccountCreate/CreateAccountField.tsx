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
import { ChangeEvent, FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { TextField } from 'googlesitekit-components';

export interface CreateAccountFieldProps {
	/** Whether the field is empty, which shows the error outline and the warning icon. */
	hasError?: boolean;
	/** Error only a screen reader reads, since an account creation field shows no message on the screen. */
	errorMessage?: ReactNode;
	/** The field's current value. The component renders nothing while this is `undefined`. */
	value?: string;
	/** Called when the input's value changes, with the new value and the field's name. */
	setValue: ( value: string, name: string ) => void;
	/** The field's name, such as `account`, which also builds the input's id. */
	name: string;
	/** The field's label, such as "Account". */
	label: string;
}

const CreateAccountField: FC< CreateAccountFieldProps > = ( {
	hasError,
	errorMessage,
	value,
	setValue,
	name,
	label,
} ) => {
	// Ensure field doesn't render until default value is available, fixing a potential render bug.
	if ( value === undefined ) {
		return null;
	}

	return (
		<TextField
			label={ label }
			name={ name }
			onChange={ ( event: ChangeEvent< HTMLInputElement > ) => {
				setValue( event.target.value, name );
			} }
			value={ value }
			id={ `googlesitekit_analytics_account_create_${ name }` }
			hasError={ hasError }
			errorMessage={ hasError ? errorMessage : undefined }
			outlined
		/>
	);
};

export default CreateAccountField;
