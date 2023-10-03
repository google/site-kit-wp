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
import { MdCheckbox } from '@material/web/checkbox/checkbox';
import { createComponent } from '@lit-labs/react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import * as WordPressElement from '@wordpress/element';
const { useCallback, useEffect, useRef } = WordPressElement;

/**
 * Internal dependencies
 */
import { getLabelFromChildren } from '../../util/react-children-to-text';
import Spinner from '../../components/Spinner';

const MdCheckboxComponent = createComponent( {
	tagName: 'md-checkbox',
	elementClass: MdCheckbox,
	react: WordPressElement,
	events: {
		onKeyDown: 'keydown',
		onChange: 'change',
	},
} );

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
	alignLeft,
	label,
} ) {
	const ref = useRef( null );

	const updateCheckedState = useCallback( () => {
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

	function handleChange( event ) {
		onChange?.( event );

		// Restore current checked state for controlled component behaviour.
		updateCheckedState();
	}

	useEffect( () => {
		updateCheckedState();
	}, [ updateCheckedState ] );

	const labelID = `${ id }-label`;

	return (
		<div
			className={ classnames( 'googlesitekit-component-gm3_checkbox', {
				'googlesitekit-component-gm3_checkbox--align-left': alignLeft,
			} ) }
		>
			{ loading && (
				<div className="googlesitekit-component-gm3_checkbox--loading">
					<Spinner isSaving />
				</div>
			) }
			{ ! loading && (
				<MdCheckboxComponent
					id={ id }
					ref={ ref }
					aria-label={ getLabelFromChildren( children ) }
					aria-labelledby={ labelID }
					// `Lit` boolean attributes treat anything non-null/undefined as true.
					// Coerce to null if false.
					// See https://lit.dev/docs/v1/components/properties/#attributes
					checked={ checked || null }
					disabled={ disabled || null }
					name={ name }
					value={ value }
					tabIndex={ tabIndex }
					onChange={ handleChange }
					onKeyDown={ onKeyDown }
				/>
			) }
			{ label && (
				<div className="googlesitekit-component-gm3_checkbox__content">
					<label id={ labelID } htmlFor={ id }>
						{ label }
					</label>
					<div className="googlesitekit-component-gm3_checkbox__description">
						{ children }
					</div>
				</div>
			) }
			{ ! label && (
				<label id={ labelID } htmlFor={ id }>
					{ children }
				</label>
			) }
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
	alignLeft: PropTypes.bool,
	label: PropTypes.string,
};

Checkbox.defaultProps = {
	checked: false,
	disabled: false,
	tabIndex: undefined,
	onKeyDown: null,
	loading: false,
	alignLeft: false,
	label: '',
};
