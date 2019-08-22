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
import { MDCFormField, MDCCheckbox } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';

import { Component, createRef } from '@wordpress/element';

class Checkbox extends Component {
	constructor( props ) {
		super( props );
		this.formFieldRef = createRef();
		this.checkboxRef = createRef();
	}

	componentDidMount() {
		const formField = new MDCFormField( this.formFieldRef.current );
		formField.input = new MDCCheckbox( this.checkboxRef.current );
	}

	render() {
		const {
			onChange,
			id,
			name,
			value,
			checked,
			disabled,
			children,
		} = this.props;

		return (
			<div className="mdc-form-field" ref={ this.formFieldRef }>
				<div
					className={ `
						mdc-checkbox
						${ disabled ? 'mdc-checkbox--disabled' : '' }
					` }
					ref={ this.checkboxRef }
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
	}
}

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
