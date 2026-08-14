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
	/** Class names merged onto the field's outer element, along with `mdc-text-field`. */
	className?: string;
	/** The `name` attribute the field writes onto its outer element rather than the input. */
	name?: string;
	/** The field's label, such as "Client ID". */
	label?: string;
	/** Whether the field leaves out its label. */
	noLabel?: boolean;
	/** Whether the field takes the outlined style, with a border around the input. */
	outlined?: boolean;
	/** Whether the field takes the `textarea` style, so the input renders as a multi-line box rather than a single line. */
	textarea?: boolean;
	/** Element shown before the input, which the field marks with the `mdc-text-field__icon` class. */
	leadingIcon?: ReactElement;
	/** Icon element shown after the input. The warning icon takes its place while the field holds an error. */
	trailingIcon?: ReactElement;
	/** Text shown under the field. A visible `errorMessage` replaces it. */
	helperText?: ReactNode;
	/**
	 * Error the field shows under the input, with the error outline and the
	 * warning icon. With `hasError` set too, only a screen reader reads the
	 * message. The input names the message in `aria-errormessage` and
	 * `aria-describedby`.
	 */
	errorMessage?: ReactNode;
	/**
	 * Whether the field holds an error. The field adds the error outline and the
	 * warning icon, and moves any `errorMessage` off the screen, where only a
	 * screen reader reads it.
	 */
	hasError?: boolean;
	/** The input's `id`, which also builds the error message's id. Defaults to a generated one. */
	id?: string;
	/** Which element the field renders for the input, an `input` or a `textarea`. */
	inputType?: 'input' | 'textarea';
	/** The input's current value. */
	value?: string | number;
	/** The input's `size` attribute, which sets its visible width in characters. */
	size?: number;
	/** The input's `maxlength` attribute, counted in characters. */
	maxLength?: number;
	/** The input's `tabindex` attribute, which sets its place in the keyboard order. */
	tabIndex?: number;
	/** Whether the input is disabled, so nobody can type in it or focus it. */
	disabled?: boolean;
	/** Called when the input's value changes, so the caller can store the new value. */
	onChange?: ( event: ChangeEvent< HTMLInputElement > ) => void;
	/** Called when the input fires `keydown`, so the caller can act on that key before the input's value changes. */
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
	// The error outline and the warning icon come from `isInvalid`, so `errorMessage`
	// and `hasError` only decide where the error message goes: under the field when
	// `errorMessage` is set on its own, and off screen when `hasError` is set too.
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
