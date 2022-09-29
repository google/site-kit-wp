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
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */

export default function TextField( {
	disabled,
	readOnly,
	name,
	value,

	onChange,
} ) {
	console.log( 'TextField render. value:', value );

	const ref = useRef( null );

	// Taking a different approach to Checkbox here, this is more efficient than forcing rerenders with an incrementing key - plus that approach doesn't seem to work for the text input anyway.
	const controlledState = useRef( {} );
	controlledState.current.value = value;

	useEffect( () => {
		const { current } = ref;

		const input = ( event ) => {
			console.log( 'input', event );

			current.dispatchEvent(
				new Event( 'change', {
					bubbles: true,
					composed: true,
				} )
			);

			console.log(
				'restoring value. current, controlled:',
				current.value,
				controlledState.current.value
			);

			current.value = controlledState.current.value;
		};

		const keydown = ( event ) => {
			console.log( 'keydown', event );

			// This is necessary to prevent keydown events leaking through to ancestor elements.
			// For a practical example, if this is removed, pressing "s" in the input in Storybook will toggle the Storybook sidebar. This does not occur for the existing TextField component.
			// We may need to do the same for other events e.g. keyup.
			event.stopPropagation();
		};

		const change = ( event ) => {
			console.log( 'change', event );

			onChange?.( event );
		};

		current?.addEventListener( 'input', input );
		current?.addEventListener( 'keydown', keydown );
		current?.addEventListener( 'change', change );

		return () => {
			current?.removeEventListener( 'input', change );
			current?.removeEventListener( 'keydown', keydown );
			current?.removeEventListener( 'change', change );
		};
	}, [ onChange ] );

	return (
		<md-outlined-text-field
			ref={ ref }
			// Lit boolean attributes treat anything non-null|undefined as true. Coerce to undefined if false.
			// See https://lit.dev/docs/v1/components/properties/#attributes
			disabled={ disabled || undefined }
			readonly={ readOnly || undefined }
			name={ name }
			value={ value }
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
};
