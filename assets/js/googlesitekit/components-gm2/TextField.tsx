/**
 * TextField component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import MaterialTextField, {
	HelperText,
	Input,
} from '@material/react-text-field';
import classnames from 'classnames';
import { ChangeEvent, FC, KeyboardEvent, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import AccessibleWarningIcon from '@/js/components/AccessibleWarningIcon';

interface TextFieldBaseProps {
	className?: string;
	name?: string;
	label?: string;
	noLabel?: boolean;
	outlined?: boolean;
	textarea?: boolean;
	leadingIcon?: ReactElement;
	trailingIcon?: ReactElement;
	helperText?: string;
	id?: string;
	inputType?: 'input' | 'textarea';
	value?: string | number;
	size?: number;
	maxLength?: number;
	tabIndex?: number;
	disabled?: boolean;
	onChange?: ( event: ChangeEvent< HTMLInputElement > ) => void;
	onKeyDown?: ( event: KeyboardEvent< HTMLInputElement > ) => void;
}

interface TextFieldNoErrorProps extends TextFieldBaseProps {
	hasError?: false;
	errorMessage?: string;
	ariaErrorMessage?: string;
}

interface TextFieldHasErrorWithMessageProps extends TextFieldBaseProps {
	hasError: boolean;
	errorMessage: string | undefined;
	ariaErrorMessage?: string | undefined;
}

interface TextFieldHasErrorWithAriaMessageProps extends TextFieldBaseProps {
	hasError: boolean;
	errorMessage?: undefined;
	ariaErrorMessage: string | undefined;
}

/**
 * `hasError` alone gives screen reader users no indication of what the
 * error is, so whenever it's set, either `errorMessage` (rendered as
 * visible helper text) or `ariaErrorMessage` (the id of a description
 * rendered elsewhere, e.g. a visually-hidden one) must also be supplied.
 *
 * `hasError` is typed `boolean` (not the `true` literal) in the two
 * "with message" variants because callers almost always compute it from a
 * runtime condition (e.g. `hasError={ ! value }`), which TypeScript widens
 * to `boolean` rather than narrowing to `true`. Since a widened `boolean`
 * can't be statically known to be `false`, passing one requires the
 * `errorMessage`/`ariaErrorMessage` prop to at least be present (its value
 * may itself resolve to `undefined` when there's no error) — only a
 * literal `hasError={ false }` (or omitting `hasError` entirely) is exempt.
 */
export type TextFieldProps =
	| TextFieldNoErrorProps
	| TextFieldHasErrorWithMessageProps
	| TextFieldHasErrorWithAriaMessageProps;

const TextField: FC< TextFieldProps > = ( {
	className,
	name,
	label,
	noLabel,
	outlined,
	textarea,
	leadingIcon,
	trailingIcon,
	helperText,
	errorMessage,
	hasError,
	ariaErrorMessage,
	id,
	inputType,
	value,
	size,
	maxLength,
	tabIndex,
	disabled,
	onChange,
	onKeyDown,
} ) => {
	// For accessibility, provide a generated id fallback if an id
	// is not supplied. Adding an id is mandatory because otherwise the label
	// is not able to associate with the input.
	const idFallback = useInstanceId( TextField, 'googlesitekit-textfield' );
	const inputID = id || String( idFallback );
	const errorMessageID = `${ inputID }-error-message`;
	const isErrorState = !! ( errorMessage || hasError );

	return (
		<MaterialTextField
			className={ classnames( className, {
				'mdc-text-field--error': isErrorState,
			} ) }
			name={ name }
			label={ label }
			noLabel={ noLabel }
			outlined={ outlined }
			textarea={ textarea }
			leadingIcon={ leadingIcon }
			trailingIcon={
				isErrorState ? (
					<span className="googlesitekit-text-field-icon--error">
						<AccessibleWarningIcon />
					</span>
				) : (
					trailingIcon
				)
			}
			helperText={
				errorMessage || helperText ? (
					<HelperText persistent>
						{ errorMessage ? (
							<span id={ errorMessageID }>{ errorMessage }</span>
						) : (
							helperText
						) }
					</HelperText>
				) : undefined
			}
		>
			<Input
				id={ inputID }
				inputType={ inputType }
				value={ value }
				size={ size }
				maxLength={ maxLength }
				tabIndex={ tabIndex }
				disabled={ disabled }
				onChange={ onChange }
				onKeyDown={ onKeyDown }
				aria-invalid={ isErrorState ? true : undefined }
				aria-errormessage={
					errorMessage ? errorMessageID : ariaErrorMessage
				}
			/>
		</MaterialTextField>
	);
};

/**
 * The HelperText component is exported as a named export here because
 * it is being used as a standalone component in the
 * SurveyQuestionMultiSelect component.
 */
export { HelperText };

export default TextField;
