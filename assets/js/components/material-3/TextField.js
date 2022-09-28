// TODO: Check if the TextField approach works for text input.
/**
 * TextField component.
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
import '@material/web/textfield/outlined-text-field';
// import { ActionElement } from '@material/web/actionelement/action-element.js';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */

export default function TextField( {
	checked,
	indeterminate,
	disabled,
	readOnly,
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
	console.log( 'TextField render. value:', value );

	const ref = useRef( null );

	// This is a reference to the Hackathon approach, which forced a rerender of the web component
	// by setting a new key for each change. For production it's preferable to avoid this rendering overhead.
	// Anyhow while this may be needed for the Checkbox component, it doesn't appear to work here for the TextField component.
	// const [ index, setIndex ] = useState( 0 );

	const controlledState = useRef( {} );
	controlledState.current.value = value;

	useEffect( () => {
		const { current } = ref;

		const change = ( event ) => {
			console.log( 'change', event );

			// Preventing default behaviour has no effect here.
			// event.preventDefault();
			// event.stopPropagation();

			onChange?.( event );

			// Need to maintain/restore state to use as a controlled input.
			// Update: Not quite working yet.
			// current.value = value;

			// setIndex( index + 1 );
		};

		current?.addEventListener( 'change', change );
		// The 'action' event is dispatched by the ActionElement base class of the Material textfield. See ActionElement source for details.
		// current?.addEventListener( 'action', cancelEvent );

		const input = ( event ) => {
			console.log( 'input', event );

			// event.preventDefault();
			// event.stopPropagation();

			// Could simply invoke onChange here, forgoing the event bubbling etc.
			current.dispatchEvent(
				new Event( 'change', {
					bubbles: true,
					composed: true,
				} )
			);

			console.log(
				'restoring value. current.value, value',
				current.value,
				// value
				controlledState.current.value
			);
			// current.value = value;
			current.value = controlledState.current.value;
		};

		current?.addEventListener( 'input', input );

		return () => {
			current?.removeEventListener( 'change', change );
			current?.removeEventListener( 'input', change );
		};
	}, [ disabled, onChange, value ] );

	// TODO: Change theme colour to match expected ?

	return (
		<md-outlined-text-field
			// key={ `textfield-${ name }-${ index }` }
			ref={ ref }
			// checked={ checked }
			// indeterminate={ indeterminate }
			disabled={ disabled }
			readonly={ readOnly }
			name={ name }
			value={ value }
			// aria-label={ ariaLabel }
			// aria-labelledby={ ariaLabelledBy }
			// aria-describedby={ ariaDescribedBy }
			// reducedtouchtarget={ reducedTouchTarget }
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
		></md-outlined-text-field>
	);
}

/**
 * Props determined by examining the Material 3 web component's source code.
 *
 * See @property definitions and event handlers in the source to identify which props are needed.
 */

TextField.propTypes = {
	// Fundamental textfield attributes.
	disabled: PropTypes.bool,
	readOnly: PropTypes.bool,
	name: PropTypes.string,
	value: PropTypes.string,

	// Event handlers.
	onChange: PropTypes.func,
	// onFocus: PropTypes.func,
	// onBlur: PropTypes.func,
	// onPointerDown: PropTypes.func,
	// onPointerEnter: PropTypes.func,
	// onPointerUp: PropTypes.func,
	// onPointerCancel: PropTypes.func,
	// onPointerLeave: PropTypes.func,
	// onClick: PropTypes.func,
	// onContextMenu: PropTypes.func,
};
