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

	// This is a reference to the Hackathon approach, which forced a rerender of the web component
	// by setting a new key for each change. For production it's preferable to avoid this rendering overhead.
	// const [ index, setIndex ] = useState( 0 );

	useEffect( () => {
		const { current } = ref;

		const change = ( event ) => {
			console.log( 'change', event );

			// Preventing default behaviour has no effect here.
			// event.preventDefault();
			// event.stopPropagation();

			onChange?.( event );

			// Need to maintain/restore state to use as a controlled input.
			// This works for a regular checkbox, but not (yet?) for a Material checkbox.
			// current.checked = checked;
			// current.indeterminate = indeterminate;

			// setIndex( index + 1 );
		};

		current?.addEventListener( 'change', change );
		// The 'action' event is dispatched by the ActionElement base class of the Material checkbox. See ActionElement source for details.
		// current?.addEventListener( 'action', cancelEvent );

		const click = ( event ) => {
			console.log( 'click', event );

			// Prevent default and manually dispatch a change event, in order to retain checkbox state and use as a controlled input.
			event.preventDefault();

			if ( disabled ) {
				return;
			}

			// Could simply invoke onChange here, forgoing the event bubbling etc.
			current.dispatchEvent(
				new Event( 'change', {
					bubbles: true,
					composed: true,
				} )
			);
		};

		// The click event is triggered by both mouse and keyboard entry (space key) on Chrome, need to confirm other browsers.
		current?.addEventListener( 'click', click );

		return () => {
			current?.removeEventListener( 'change', change );
			current?.removeEventListener( 'click', click );
		};
	}, [ onChange ] );

	// TODO: Change theme colour to match expected ?

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
