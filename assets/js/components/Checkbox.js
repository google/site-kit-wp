/**
 * Checkbox component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MDCFormField, MDCCheckbox } from '../material-components';

const Checkbox = ( {
	onChange,
	id,
	name,
	value,
	checked,
	disabled,
	children,
} ) => {
	const formFieldRef = useRef( null );
	const checkboxRef = useRef( null );

	useEffect( () => {
		const formField = new MDCFormField( formFieldRef.current );
		formField.input = new MDCCheckbox( checkboxRef.current );
	}, [ formFieldRef.current, checkboxRef.current ] );

	return (
		<div className="mdc-form-field" ref={ formFieldRef }>
			<div
				className={ classnames(
					'mdc-checkbox',
					{ 'mdc-checkbox--disabled': disabled }
				) }
				ref={ checkboxRef }
			>
				<input
					className="mdc-checkbox__native-control"
					type="checkbox"
					id={ id }
					name={ name }
					value={ value }
					checked={ checked }
					disabled={ disabled }
					onChange={ onChange }
				/>
				<div className="mdc-checkbox__background">
					<svg className="mdc-checkbox__checkmark" viewBox="0 0 24 24">
						<path className="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59" />
					</svg>
					<div className="mdc-checkbox__mixedmark"></div>
				</div>
			</div>
			<label htmlFor={ id }>{ children }</label>
		</div>
	);
};

Checkbox.propTypes = {
	onChange: PropTypes.func.isRequired,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	disabled: PropTypes.bool,
	children: PropTypes.node.isRequired,
};

Checkbox.defaultProps = {
	checked: false,
	disabled: false,
};

export default Checkbox;
