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
import {
	default as MaterialTextField,
	HelperText,
	Input,
} from '@material/react-text-field';

export default function TextField( {
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
	return (
		<MaterialTextField
			className={ className }
			name={ name }
			label={ label }
			noLabel={ noLabel }
			outlined={ outlined }
			textarea={ textarea }
			trailingIcon={ trailingIcon }
			helperText={ <HelperText>{ helperText }</HelperText> }
		>
			<Input
				id={ id }
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
	trailingIcon: PropTypes.element,
	helperText: PropTypes.string,
	id: PropTypes.string,
	inputType: PropTypes.string,
	value: PropTypes.string,
	size: PropTypes.number,
	maxLength: PropTypes.number,
	tabIndex: PropTypes.oneOfType( [ PropTypes.number, PropTypes.string ] ),
	disabled: PropTypes.bool,
	onChange: PropTypes.func,
	onKeyDown: PropTypes.func,
};
