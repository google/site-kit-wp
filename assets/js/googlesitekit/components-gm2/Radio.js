/**
 * Radio component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MDCFormField, MDCRadio } from '../../material-components';

export default function Radio( props ) {
	const {
		id,
		name,
		value,
		checked = false,
		disabled = false,
		children,
		tabIndex,
		onKeyDown = null,
		onClick = null,
		onChange = null,
		alignLeft = false,
		description,
	} = props;

	const formFieldRef = useCallback( ( el ) => {
		if ( el !== null ) {
			const formField = new MDCFormField( el );
			const radioEl = el.querySelector( '.mdc-radio' );

			if ( radioEl ) {
				formField.input = new MDCRadio( radioEl );
			}
		}
	}, [] );

	return (
		<div className="mdc-form-field" ref={ formFieldRef }>
			<div
				className={ classnames( 'mdc-radio', {
					'mdc-radio--disabled': disabled,
					'mdc-radio--align-left': alignLeft,
				} ) }
			>
				<input
					className="mdc-radio__native-control"
					onClick={ onClick }
					onKeyDown={ onKeyDown }
					type="radio"
					id={ id }
					name={ name }
					value={ value }
					checked={ checked }
					disabled={ disabled }
					tabIndex={ tabIndex }
					onChange={ onChange }
					readOnly
				/>
				<div className="mdc-radio__background">
					<div className="mdc-radio__outer-circle"></div>
					<div className="mdc-radio__inner-circle"></div>
				</div>
			</div>

			{ ! description && <label htmlFor={ id }>{ children }</label> }

			{ description && (
				<div className="mdc-radio__content">
					<label htmlFor={ id }>{ children }</label>
					<div className="mdc-radio__description">
						{ description }
					</div>
				</div>
			) }
		</div>
	);
}

Radio.propTypes = {
	onClick: PropTypes.func,
	onKeyDown: PropTypes.func,
	onChange: PropTypes.func,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	disabled: PropTypes.bool,
	children: PropTypes.string.isRequired,
	tabIndex: PropTypes.oneOfType( [ PropTypes.number, PropTypes.string ] ),
	description: PropTypes.node,
};
