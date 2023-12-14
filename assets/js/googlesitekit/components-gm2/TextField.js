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
import PropTypes from 'prop-types';
import MaterialTextField, {
	HelperText,
	Input,
} from '@material/react-text-field';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

function TextField( {
	className,
	name,
	label,
	noLabel,
	outlined,
	textarea,
	trailingIcon,
	helperText,
	id,
	inputType,
	value,
	size,
	maxLength,
	tabIndex,
	disabled,
	onChange,
	onKeyDown,
} ) {
	// For accessibility, provide a generated id fallback if an id
	// is not supplied. Adding an id is mandatory because otherwise the label
	// is not able to associate with the input.
	const idFallback = useInstanceId( TextField, 'googlesitekit-textfield' );

	return (
		<MaterialTextField
			className={ className }
			name={ name }
			label={ label }
			noLabel={ noLabel }
			outlined={ outlined }
			textarea={ textarea }
			trailingIcon={ trailingIcon }
			helperText={
				helperText && <HelperText persistent>{ helperText }</HelperText>
			}
		>
			<Input
				id={ id || idFallback }
				inputType={ inputType }
				value={ value }
				size={ size }
				maxLength={ maxLength }
				tabIndex={ tabIndex }
				disabled={ disabled }
				onChange={ onChange }
				onKeyDown={ onKeyDown }
			/>
		</MaterialTextField>
	);
}

TextField.propTypes = {
	className: PropTypes.string,
	name: PropTypes.string,
	label: PropTypes.string,
	noLabel: PropTypes.bool,
	outlined: PropTypes.bool,
	textarea: PropTypes.bool,
	trailingIcon: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.element ] ),
	helperText: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.string ] ),
	id: PropTypes.string,
	inputType: PropTypes.string,
	value: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	size: PropTypes.number,
	maxLength: PropTypes.number,
	tabIndex: PropTypes.oneOfType( [ PropTypes.number, PropTypes.string ] ),
	disabled: PropTypes.bool,
	onChange: PropTypes.func,
	onKeyDown: PropTypes.func,
};

/**
 * The HelperText component is exported as a named export here because
 * it is being used as a standalone component in the
 * SurveyQuestionMultiSelect component.
 */
export { HelperText };

export default TextField;
