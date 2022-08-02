/**
 * Checkbox component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import '@material/mwc-checkbox/mwc-checkbox';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Spinner from '../components/Spinner';

export default function Checkbox( props ) {
	const {
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
	} = props;

	const mwcProps = {};

	if ( checked ) {
		mwcProps.checked = true;
	}

	if ( disabled ) {
		mwcProps.disabled = true;
	}

	const ref = useRef( null );

	useEffect( () => {
		const { current } = ref;
		const change = ( ...params ) => onChange?.( ...params );

		current?.addEventListener( 'change', change );
		return () => current?.removeEventListener( 'change', change );
	}, [ ref.current, onChange ] );

	useEffect( () => {
		const { current } = ref;
		const keydown = ( ...params ) => onKeyDown?.( ...params );

		current?.addEventListener( 'keydown', keydown );
		return () => current?.removeEventListener( 'keydown', keydown );
	}, [ ref.current, onKeyDown ] );

	return (
		<div className="mdc-form-field">
			{ loading ? (
				<Spinner isSaving style={ { margin: '0' } } />
			) : (
				<mwc-checkbox
					ref={ ref }
					id={ id }
					name={ name }
					value={ value }
					tabIndex={ tabIndex }
					{ ...mwcProps }
				/>
			) }

			<label htmlFor={ id } className="mdc-label">
				{ children }
			</label>
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
