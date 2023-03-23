/**
 * ImageRadio component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { MDCFormField, MDCRadio } from '../material-components';

export default function ImageRadio( props ) {
	const {
		onChange = null,
		id,
		name,
		value,
		checked = false,
		checkedBorderColor,
		tabIndex = undefined,
		onKeyDown = null,
		image,
		label = '',
		children,
		description,
		ariaLabel,
		...otherProps
	} = props;

	const formFieldRef = useCallback( ( element ) => {
		if ( element !== null ) {
			const formField = new MDCFormField( element );
			const radioElement = element.querySelector(
				'.image-radio.mdc-radio'
			);

			if ( radioElement ) {
				formField.input = new MDCRadio( radioElement );
			}
		}
	}, [] );

	return (
		<div
			className="mdc-form-field googlesitekit-image-radio"
			ref={ formFieldRef }
		>
			<div className="image-radio mdc-radio">
				<input
					aria-label={ ariaLabel ? ariaLabel : label }
					className="mdc-radio__native-control"
					onChange={ onChange }
					onKeyDown={ onKeyDown }
					type="radio"
					id={ id }
					name={ name }
					value={ value }
					checked={ checked }
					tabIndex={ tabIndex }
				/>
				<div
					className={ classnames( 'mdc-image-radio__background', {
						'mdc-image-radio__background--checked': checked,
					} ) }
					style={ { '--border-color': checkedBorderColor } }
				>
					<div
						role="radio"
						aria-checked={ checked }
						className={ classnames( 'mdc-image-radio__content', {
							'mdc-image-radio__content--no-image': ! image,
						} ) }
						{ ...otherProps }
					>
						{ image ? image : label }
					</div>
				</div>
			</div>
			<label htmlFor={ id }>
				{ image && label && <span>{ label }</span> }
				{ description ? description : children }
			</label>
		</div>
	);
}

ImageRadio.propTypes = {
	onChange: PropTypes.func,
	onKeyDown: PropTypes.func,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	checkedBorderColor: PropTypes.string,
	tabIndex: PropTypes.oneOfType( [ PropTypes.number, PropTypes.string ] ),
	label: PropTypes.string,
	children: PropTypes.string,
	image: PropTypes.element,
	description: PropTypes.string,
	ariaLabel: PropTypes.string,
};
