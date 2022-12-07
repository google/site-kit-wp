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
import { useEffect, useRef } from '@wordpress/element';
import Spinner from '../../components/Spinner';

export default function Checkbox( {
	onChange,
	id,
	name,
	value,
	checked,
	disabled,
	children,
	tabIndex,
	onKeyDown,
	loading,
} ) {
	const ref = useRef( null );

	const controlledState = useRef( {} );
	controlledState.current.checked = checked;

	useEffect( () => {
		const { current } = ref;

		if ( ! current ) {
			return;
		}

		const change = ( event ) => {
			onChange?.( event );

			current.checked = controlledState.current.checked;

			// The checked property doesn't get reflected to the inner input element checked state,
			// so we need to set it manually.
			current.shadowRoot.querySelector( 'input' ).checked =
				controlledState.current.checked;
		};

		current.addEventListener( 'change', change );

		if ( onKeyDown ) {
			current.addEventListener( 'keydown', onKeyDown );
		}

		return () => {
			current.removeEventListener( 'change', change );

			if ( onKeyDown ) {
				current.removeEventListener( 'keydown', onKeyDown );
			}
		};
	}, [ checked, disabled, onChange, onKeyDown ] );

	useEffect( () => {
		const { current } = ref;

		if ( ! current ) {
			return;
		}

		current.checked = checked;

		// The checked property doesn't get reflected to the inner input element checked state,
		// so we need to set it manually.
		const innerInput = current.shadowRoot.querySelector( 'input' );
		if ( innerInput ) {
			innerInput.checked = checked;
		}
	}, [ checked ] );

	return (
		<div className="googlesitekit-component-gm3__checkbox">
			{ loading && (
				<div className="googlesitekit-component-gm3__checkbox--loading">
					<Spinner isSaving />
				</div>
			) }
			{ ! loading && (
				<md-checkbox
					id={ id }
					ref={ ref }
					role="checkbox"
					// Lit boolean attributes treat anything non-null|undefined as true. Coerce to null if false.
					// See https://lit.dev/docs/v1/components/properties/#attributes
					checked={ checked || null }
					disabled={ disabled || null }
					name={ name }
					value={ value }
					tabIndex={ tabIndex }
				></md-checkbox>
			) }
			<label htmlFor={ id }>{ children }</label>
		</div>
	);
}

Checkbox.propTypes = {
	onChange: PropTypes.func.isRequired,
	onKeyDown: PropTypes.func,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	disabled: PropTypes.bool,
	children: PropTypes.node.isRequired,
	tabIndex: PropTypes.oneOfType( [ PropTypes.number, PropTypes.string ] ),
	loading: PropTypes.bool,
};

Checkbox.defaultProps = {
	checked: false,
	disabled: false,
	tabIndex: undefined,
	onKeyDown: null,
	loading: false,
};
