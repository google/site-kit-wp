/**
 * Checkbox component.
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
import '@material/web/checkbox/checkbox';
import { Checkbox as MaterialCheckbox } from '@material/web/checkbox/lib/checkbox.js';
// import { ActionElement } from '@material/web/actionelement/action-element.js';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */

global.MaterialCheckbox = MaterialCheckbox;
// console.log( 'MaterialCheckbox', MaterialCheckbox );
// delete MaterialCheckbox.prototype.handleChange;
// MaterialCheckbox.prototype.handleChange = function () {
// 	this.dispatchEvent(
// 		new Event( 'change', {
// 			bubbles: true,
// 			composed: true,
// 		} )
// 	);
// };

export default function Checkbox( {
	checked,
	indeterminate,
	disabled,
	name,
	value,

	ariaLabel,
	ariaLabelledBy,
	ariaDescribedBy,

	reducedTouchTarget,

	onChange,
	onFocus,
	onBlur,
	onPointerDown,
	onPointerEnter,
	onPointerUp,
	onPointerCancel,
	onPointerLeave,
	onClick,
	onContextMenu,
} ) {
	const ref = useRef( null );
	const [ index, setIndex ] = useState( 0 );

	useEffect( () => {
		const { current } = ref;

		// current.handleChange;

		const change = ( event ) => {
			console.log( 'change', event );
			event.preventDefault();
			event.stopPropagation();
			onChange?.( event );
			setIndex( index + 1 );
		};

		const cancelEvent = ( event ) => {
			console.log( 'cancelEvent', event );
			// event.preventDefault();

			// event.stopPropagation();
		};

		current?.addEventListener( 'change', change );
		current?.addEventListener( 'click', cancelEvent );
		// current?.addEventListener( 'pointerdown', cancelEvent );
		// current?.addEventListener( 'pointerup', cancelEvent );
		return () => {
			current?.removeEventListener( 'change', change );
			current?.removeEventListener( 'click', cancelEvent );
		};
	}, [ onChange, index, setIndex ] );
	// }, [ ref.current, onChange, index, setIndex ] );

	return (
		<md-checkbox
			// key={ `checkbox-${ name }-${ index }` }
			ref={ ref }
			checked={ checked }
			indeterminate={ indeterminate }
			disabled={ disabled }
			name={ name }
			value={ value }
			aria-label={ ariaLabel }
			aria-labelledby={ ariaLabelledBy }
			aria-describedby={ ariaDescribedBy }
			reducedtouchtarget={ reducedTouchTarget }
			// onchange={ onChange }
			// onfocus={ onFocus }
			// onblur={ onBlur }
			// onpointerdown={ onPointerDown }
			// onpointerenter={ onPointerEnter }
			// onpointerup={ onPointerUp }
			// onpointercancel={ onPointerCancel }
			// onpointerleave={ onPointerLeave }
			// onclick={ onClick }
			// oncontextmenu={ onContextMenu }
		></md-checkbox>
	);
}

/**
 * Props determined by examining the Material 3 web component's source code.
 *
 * See @property definitions and event handlers in the source to identify which props are needed.
 */

Checkbox.propTypes = {
	// Fundamental checkbox attributes.
	checked: PropTypes.bool,
	indeterminate: PropTypes.bool,
	disabled: PropTypes.bool,
	name: PropTypes.string,
	value: PropTypes.string,

	// Accessibility attributes.
	ariaLabel: PropTypes.string,
	ariaLabelledBy: PropTypes.string,
	ariaDescribedBy: PropTypes.string,
	reducedTouchTarget: PropTypes.bool,

	// Event handlers.
	onChange: PropTypes.func,
	onFocus: PropTypes.func,
	onBlur: PropTypes.func,
	onPointerDown: PropTypes.func,
	onPointerEnter: PropTypes.func,
	onPointerUp: PropTypes.func,
	onPointerCancel: PropTypes.func,
	onPointerLeave: PropTypes.func,
	onClick: PropTypes.func,
	onContextMenu: PropTypes.func,
};
