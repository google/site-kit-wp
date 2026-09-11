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
	CharacterCounter,
	HelperText,
	Input,
} from '@material/react-text-field';
import classnames from 'classnames';
import { ChangeEvent, FC, KeyboardEvent, ReactElement, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AccessibleWarningIcon from '@/js/components/AccessibleWarningIcon';
import VisuallyHidden from '@/js/components/VisuallyHidden';

export interface TextFieldProps {
	/** The extra class names for the field's outer element. */
	className?: string;
	/** The `name` attribute. The field sets it on the outer element, not on the input. */
	name?: string;
	/** The field's label, such as "Client ID". */
	label?: string;
	/** Whether the field leaves out the label. */
	noLabel?: boolean;
	/** Whether the field draws a border around the input. */
	outlined?: boolean;
	/** Whether the field takes the multi-line style. Set `inputType` to `textarea` as well. */
	textarea?: boolean;
	/** The icon shown before the input. */
	leadingIcon?: ReactElement;
	/** The icon shown after the input. The warning icon replaces it while the field holds an error. */
	trailingIcon?: ReactElement;
	/** The text shown under the input. A visible `errorMessage` replaces it. */
	helperText?: ReactNode;
	/**
	 * The error message the field shows under the input, with the error outline
	 * and the warning icon. If `hasError` is true as well, only a screen reader
	 * reads the message. The input points at the message with `aria-errormessage`
	 * and `aria-describedby`.
	 */
	errorMessage?: ReactNode;
	/**
	 * Whether the field holds an error. The field draws the error outline and the
	 * warning icon. It also moves any `errorMessage` off the screen, where only a
	 * screen reader reads the message.
	 */
	hasError?: boolean;
	/** The input's `id`, which also starts the error message's id. Without one, the field generates an id. */
	id?: string;
	/** The element the field renders for the input, either `input` or `textarea`. */
	inputType?: 'input' | 'textarea';
	/** The input's current value. */
	value?: string | number;
	/** The input's `size` attribute, which sets how wide the input is in characters. */
	size?: number;
	/** The largest number of characters the input accepts. */
	maxLength?: number;
	/** Whether the field shows a character counter. The counter needs `maxLength` as well. */
	showCharacterCounter?: boolean;
	/** The input's `tabindex` attribute, which sets its place in the keyboard order. */
	tabIndex?: number;
	/** Whether the input is disabled, so nobody can focus it or type in it. */
	disabled?: boolean;
	/** Called when the input's value changes, so the caller can store the new value. */
	onChange?: ( event: ChangeEvent< HTMLInputElement > ) => void;
	/** Called when a key goes down in the input, before the value changes. */
	onKeyDown?: ( event: KeyboardEvent< HTMLInputElement > ) => void;
}

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
	id,
	inputType,
	value,
	size,
	maxLength,
	showCharacterCounter,
	tabIndex,
	disabled,
	onChange,
	onKeyDown,
} ) => {
	// For accessibility, provide a generated id fallback if an id
	// is not supplied. Adding an id is mandatory because otherwise the label
	// is not able to associate with the input.
	const idFallback = useInstanceId( TextField, 'googlesitekit-textfield' );
	const inputID = id || `${ idFallback }`;
	const errorMessageID = `${ inputID }-error-message`;
	const linkedErrorMessageID = errorMessage ? errorMessageID : undefined;

	const isInvalid = !! hasError || !! errorMessage;
	// `isInvalid` draws the error outline and the warning icon. The two values
	// below decide where the error message goes. `errorMessage` on its own shows
	// the message under the field. `hasError` as well moves the message off the
	// screen.
	const isErrorMessageVisible = !! errorMessage && ! hasError;
	const isErrorMessageHidden = !! errorMessage && !! hasError;

	let helperTextToShow;
	if ( isErrorMessageVisible ) {
		helperTextToShow = (
			<HelperText persistent>
				<span id={ errorMessageID }>{ errorMessage }</span>
			</HelperText>
		);
	} else if ( helperText ) {
		helperTextToShow = <HelperText persistent>{ helperText }</HelperText>;
	}

	return (
		<Fragment>
			<MaterialTextField
				className={ classnames( className, {
					'mdc-text-field--error': isInvalid,
				} ) }
				name={ name }
				label={ label }
				noLabel={ noLabel }
				outlined={ outlined }
				textarea={ textarea }
				leadingIcon={ leadingIcon }
				trailingIcon={
					isInvalid ? (
						<span className="googlesitekit-text-field-icon--error">
							<AccessibleWarningIcon />
						</span>
					) : (
						trailingIcon
					)
				}
				helperText={ helperTextToShow }
				characterCounter={
					showCharacterCounter && maxLength ? (
						<CharacterCounter />
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
					aria-invalid={ isInvalid || undefined }
					aria-errormessage={ linkedErrorMessageID }
					aria-describedby={ linkedErrorMessageID }
				/>
			</MaterialTextField>
			{ isErrorMessageHidden && (
				<VisuallyHidden id={ errorMessageID }>
					{ errorMessage }
				</VisuallyHidden>
			) }
		</Fragment>
	);
};

/**
 * The HelperText component is exported as a named export here because
 * it is being used as a standalone component in the
 * SurveyQuestionMultiSelect component.
 */
export { HelperText };

export default TextField;
