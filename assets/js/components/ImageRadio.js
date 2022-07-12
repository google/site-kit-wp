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

const ImageRadio = ( {
	onClick,
	id,
	name,
	value,
	checked,
	tabIndex,
	onKeyDown,
	image,
	label,
	children,
	description,
	ariaLabel,
} ) => {
	const formFieldRef = useCallback( ( el ) => {
		if ( el !== null ) {
			const formField = new MDCFormField( el );
			const radioEl = el.querySelector( '.mdc-image-radio' );

			if ( radioEl ) {
				formField.input = new MDCRadio( radioEl );
			}
		}
	}, [] );

	return (
		<div
			className="mdc-form-field googlesitekit-image-radio"
			ref={ formFieldRef }
		>
			<div className={ classnames( 'mdc-image-radio mdc-radio' ) }>
				<input
					aria-label={ ariaLabel ? ariaLabel : label }
					className="mdc-radio__native-control"
					onClick={ onClick }
					onKeyDown={ onKeyDown }
					type="radio"
					id={ id }
					name={ name }
					value={ value }
					checked={ checked }
					tabIndex={ tabIndex }
				/>
				<div className="mdc-image-radio__background">
					<div
						role="radio"
						aria-checked={ checked }
						className={ classnames( 'mdc-image-radio__content', {
							'mdc-image-radio__content--no-image': ! image,
						} ) }
					>
						{ image ? image : label }
					</div>
				</div>
			</div>
			<label htmlFor={ id }>
				{ image && <span>{ label }</span> }
				{ description ? description : children }
			</label>
		</div>
	);
};

ImageRadio.propTypes = {
	onClick: PropTypes.func,
	onKeyDown: PropTypes.func,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	tabIndex: PropTypes.oneOfType( [ PropTypes.number, PropTypes.string ] ),
	label: PropTypes.string.isRequired,
	children: PropTypes.string.isRequired,
	image: PropTypes.element,
	description: PropTypes.string,
	ariaLabel: PropTypes.string,
};

ImageRadio.defaultProps = {
	onClick: null,
	onKeyDown: null,
	checked: false,
	disabled: false,
	tabIndex: undefined,
	label: '',
};

export default ImageRadio;
