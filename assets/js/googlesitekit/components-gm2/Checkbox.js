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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Spinner from '../../components/Spinner';

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
		alignLeft,
		description,
	} = props;

	return (
		<div className="mdc-form-field">
			<div
				className={ classnames( 'mdc-checkbox', {
					'mdc-checkbox--disabled': disabled,
					'mdc-checkbox--align-left': alignLeft,
				} ) }
			>
				{ loading ? (
					<Spinner isSaving style={ { margin: '0' } } />
				) : (
					<Fragment>
						<input
							className="mdc-checkbox__native-control"
							type="checkbox"
							id={ id }
							name={ name }
							value={ value }
							checked={ checked }
							disabled={ disabled }
							onChange={ onChange }
							tabIndex={ tabIndex }
							onKeyDown={ onKeyDown }
						/>

						<div className="mdc-checkbox__background">
							<svg
								className="mdc-checkbox__checkmark"
								viewBox="0 0 24 24"
							>
								<path
									className="mdc-checkbox__checkmark-path"
									fill="none"
									d="M1.73,12.91 8.1,19.28 22.79,4.59"
								/>
							</svg>
							<div className="mdc-checkbox__mixedmark" />
						</div>
					</Fragment>
				) }
			</div>

			<div className="mdc-checkbox__content">
				<label htmlFor={ id }>{ children }</label>
				{ description && (
					<div className="mdc-checkbox__description">
						{ description }
					</div>
				) }
			</div>
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
	description: PropTypes.node,
};

Checkbox.defaultProps = {
	checked: false,
	disabled: false,
	tabIndex: undefined,
	onKeyDown: null,
	loading: false,
	alignLeft: false,
	description: '',
};
