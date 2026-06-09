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
import type { ChangeEvent, FC, KeyboardEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Spinner from '@/js/components/Spinner';

export interface CheckboxProps {
	onChange: ( event: ChangeEvent< HTMLInputElement > ) => void;
	onKeyDown?: ( event: KeyboardEvent< HTMLInputElement > ) => void;
	id: string;
	name: string;
	value: string;
	checked?: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	children: ReactNode;
	tabIndex?: number;
	loading?: boolean;
	alignLeft?: boolean;
	description?: ReactNode;
	badge?: ReactNode;
}

const Checkbox: FC< CheckboxProps > = ( {
	onChange,
	id,
	name,
	value,
	checked = false,
	indeterminate = false,
	disabled = false,
	children,
	tabIndex,
	onKeyDown,
	loading = false,
	alignLeft = false,
	description,
	badge,
} ) => {
	const inputRef = useRef< HTMLInputElement >( null );

	// `indeterminate` is a DOM-only property with no React attribute, so it must
	// be set imperatively on the native input.
	useEffect( () => {
		if ( inputRef.current ) {
			inputRef.current.indeterminate = indeterminate;
		}
	}, [ indeterminate, loading ] );

	const label = !! badge ? (
		<div className="mdc-checkbox__label-wrapper">
			<label htmlFor={ id }>{ children }</label>
			{ badge }
		</div>
	) : (
		<label htmlFor={ id }>{ children }</label>
	);

	return (
		<div className="mdc-form-field">
			<div
				className={ classnames( 'mdc-checkbox', {
					'mdc-checkbox--disabled': disabled,
					'mdc-checkbox--align-left': alignLeft,
				} ) }
			>
				{ loading ? (
					<Spinner style={ { margin: '0' } } isSaving />
				) : (
					<Fragment>
						<input
							ref={ inputRef }
							aria-checked={
								indeterminate
									? 'mixed'
									: `${ checked ? 'true' : 'false' }`
							}
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
								viewBox="0 0 12 9"
							>
								<path
									className="mdc-checkbox__checkmark-path"
									d="M2.08301 5.28834L3.55703 7.29507C4.24647 8.23368 5.5034 8.23368 6.19285 7.29507L10.083 1.99902"
									fill="none"
									stroke="none"
								/>
							</svg>
							<div className="mdc-checkbox__mixedmark" />
						</div>
					</Fragment>
				) }
			</div>

			{ ! description && label }

			{ description && (
				<div className="mdc-checkbox__content">
					{ label }
					<div className="mdc-checkbox__description">
						{ description }
					</div>
				</div>
			) }
		</div>
	);
};

export default Checkbox;
