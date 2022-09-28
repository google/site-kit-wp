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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

export default function Checkbox( {
	checked,
	indeterminate,
	disabled,
	name,
	value,
	onChange,
	onKeyDown,
} ) {
	console.log( 'Checkbox render. checked:', checked );
	const ref = useRef( null );

	// Use this state in a key prop on the web component to force a rerender.
	// This is a workaround for the fact the web component doesn't update visually when the checked property is changed.
	const [ index, setIndex ] = useState( 0 );

	useEffect( () => {
		const { current } = ref;

		const click = ( event ) => {
			console.log( 'click', event );

			// Prevent default and manually dispatch a change event, in order to retain checkbox state and use as a controlled input.
			event.preventDefault();

			if ( disabled ) {
				return;
			}

			current.checked = current.checked ? undefined : true;

			current.dispatchEvent(
				new Event( 'change', {
					bubbles: true,
					composed: true,
				} )
			);
		};

		const change = ( event ) => {
			console.log( 'change', event );

			// Preventing default behaviour has no effect here.
			// event.preventDefault();

			onChange?.( event );

			setIndex( index + 1 );
		};

		// The click event is triggered by both mouse and keyboard entry (space key) on Chrome, need to confirm other browsers.
		current?.addEventListener( 'click', click );
		current?.addEventListener( 'change', change );

		// The 'action' event is dispatched by the ActionElement base class of the Material checkbox. See ActionElement source for details.
		// current?.addEventListener( 'action', cancelEvent );

		return () => {
			current?.removeEventListener( 'click', click );
			current?.removeEventListener( 'change', change );
		};
	}, [ checked, disabled, index, onChange ] );

	// TODO: Change theme colour to match expected ?

	return (
		<md-checkbox
			key={ `checkbox-${ name }-${ index }` }
			ref={ ref }
			checked={ checked }
			indeterminate={ indeterminate }
			disabled={ disabled }
			name={ name }
			value={ value }
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
	onKeyDown: PropTypes.func,
};
