/**
 * Radio component.
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
import { MDCFormField, MDCRadio } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';

import { Component, createRef } from '@wordpress/element';

class Radio extends Component {
	constructor( props ) {
		super( props );
		this.formFieldRef = createRef();
		this.radioRef = createRef();
	}

	componentDidMount() {
		const formField = new MDCFormField( this.formFieldRef.current );
		formField.input = new MDCRadio( this.radioRef.current );
	}

	render() {
		const { onClick, id, name, value, checked, disabled, children } = this.props;

		return (
			<div className="mdc-form-field" ref={ this.formFieldRef }>
				<div
					className={ `
						mdc-radio
						${ disabled ? 'mdc-radio--disabled' : '' }
					` }
					ref={ this.radioRef }
				>
					<input
						className="mdc-radio__native-control"
						onClick={ onClick }
						type="radio"
						id={ id }
						name={ name }
						value={ value }
						checked={ checked }
						disabled={ disabled }
						onChange={ () => {} }
					/>
					<div className="mdc-radio__background">
						<div className="mdc-radio__outer-circle"></div>
						<div className="mdc-radio__inner-circle"></div>
					</div>
				</div>
				<label htmlFor={ id }>{ children }</label>
			</div>
		);
	}
}

Radio.propTypes = {
	onClick: PropTypes.func,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	disabled: PropTypes.bool,
	children: PropTypes.string.isRequired,
};

Radio.defaultProps = {
	onClick: null,
	checked: false,
	disabled: false,
};

export default Radio;
