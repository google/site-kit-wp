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
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MDCFormField, MDCRadio } from '../material-components';

const Radio = ( {
	onClick,
	id,
	name,
	value,
	checked,
	disabled,
	children,
} ) => {
	const formFieldRef = useRef( null );
	const radioRef = useRef( null );

	useEffect( () => {
		const formField = new MDCFormField( formFieldRef.current );
		formField.input = new MDCRadio( radioRef.current );
	}, [ formFieldRef.current, radioRef.current ] );

	return (
		<div className="mdc-form-field" ref={ formFieldRef }>
			<div
				className={ classnames(
					'mdc-radio',
					{ 'mdc-radio--disabled': disabled }
				) }
				ref={ radioRef }
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
};

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
