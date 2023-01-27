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

/**
 * Internal dependencies
 */
import { getLabelFromChildren } from '../../util/react-children-to-text';

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

	useEffect( () => {
		const { current } = ref;

		if ( ! current ) {
			return;
		}

		function updateCheckedState() {
			current.checked = checked;

			// The checked property doesn't get reflected to the inner input element checked state,
			// so we need to set it manually.
			const innerInput = current.shadowRoot.querySelector( 'input' );
			if ( innerInput ) {
				innerInput.checked = checked;
			}
		}

		function handleChange( event ) {
			onChange?.( event );

			// Restore current checked state for controlled component behaviour.
			updateCheckedState();
		}

		current.addEventListener( 'change', handleChange );

		if ( onKeyDown ) {
			current.addEventListener( 'keydown', onKeyDown );
		}

		updateCheckedState();

		return () => {
			current.removeEventListener( 'change', handleChange );

			if ( onKeyDown ) {
				current.removeEventListener( 'keydown', onKeyDown );
			}
		};
	}, [ checked, onChange, onKeyDown ] );

	// TODO: Remove `onLabelClick` once the `md-checkbox` component is updated to be a form-associated custom element.
	const onLabelClick = () => {
		const { current } = ref;

		if ( ! current || disabled ) {
			return;
		}

		current.checked = ! current.checked;

		current.dispatchEvent(
			new Event( 'change', { bubbles: true, cancelable: true } )
		);
	};

	return (
		<div className="googlesitekit-component-gm3_checkbox">
			{ loading && (
				<div className="googlesitekit-component-gm3_checkbox--loading">
					<Spinner isSaving />
				</div>
			) }
			{ ! loading && (
				<md-checkbox
					id={ id }
					ref={ ref }
					role="checkbox"
					aria-label={ getLabelFromChildren( children ) }
					// `Lit` boolean attributes treat anything non-null/undefined as true.
					// Coerce to null if false.
					// See https://lit.dev/docs/v1/components/properties/#attributes
					checked={ checked || null }
					disabled={ disabled || null }
					name={ name }
					value={ value }
					tabIndex={ tabIndex }
				></md-checkbox>
			) }
			{
				// These ESLint rules are disabled because we are intentionally adding a click handler to the
				// label to make up for a bug in the `@material/web` component, where the label does not respond to
				// click events for the checkbox. Usually, labels associated with inputs don't respond to
				// keyboard events, but due to our hack this is required.
				/* eslint-disable jsx-a11y/click-events-have-key-events */
				/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
			 }
			<label htmlFor={ id } onClick={ onLabelClick }>
				{ children }
			</label>
			{ /* eslint-enable jsx-a11y/click-events-have-key-events */
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */ }
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
