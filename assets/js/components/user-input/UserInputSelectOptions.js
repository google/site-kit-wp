/**
 * User Input Select Options.
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

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Checkbox, Radio } from 'googlesitekit-components';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { Cell } from '../../material-components';
const { useSelect, useDispatch } = Data;

export default function UserInputSelectOptions( {
	slug,
	options,
	max,
	next,
	isActive,
	showInstructions,
	alignLeftOptions,
} ) {
	const values = useSelect(
		( select ) => select( CORE_USER ).getUserInputSetting( slug ) || []
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingUserInputSettings( values )
	);
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const { setUserInputSetting } = useDispatch( CORE_USER );
	const optionsRef = useRef();

	useEffect( () => {
		if ( ! optionsRef?.current || ! isActive ) {
			return;
		}

		const focusOption = ( element ) => {
			if ( element ) {
				setTimeout( () => {
					element.focus();
				}, 50 );
			}
		};

		const optionType = max === 1 ? 'radio' : 'checkbox';
		const checkedEl = optionsRef.current.querySelector(
			`input[type="${ optionType }"]:checked`
		);

		if ( checkedEl ) {
			focusOption( checkedEl );
		} else {
			const el = optionsRef.current.querySelector(
				`input[type="${ optionType }"]`
			);
			focusOption( el );
		}
	}, [ isActive, max ] );

	const onClick = useCallback(
		( event ) => {
			const { target } = event;
			const { value, checked } = target;

			const newValues = new Set( [ value, ...values ] );
			if ( ! checked ) {
				newValues.delete( value );
			}

			setUserInputSetting(
				slug,
				Array.from( newValues ).slice( 0, max )
			);
		},
		[ max, setUserInputSetting, slug, values ]
	);

	const onKeyDown = useCallback(
		( event ) => {
			if (
				event.keyCode === ENTER &&
				values.length > 0 &&
				values.length <= max &&
				! values.includes( '' ) &&
				next &&
				typeof next === 'function'
			) {
				next();
			}
		},
		[ values, next, max ]
	);

	const onClickProps = {
		[ max > 1 ? 'onChange' : 'onClick' ]: onClick,
	};

	const ListComponent = max === 1 ? Radio : Checkbox;

	const items = Object.keys( options ).map( ( optionSlug ) => {
		const props = {
			id: `${ slug }-${ optionSlug }`,
			value: optionSlug,
			checked: values.includes( optionSlug ),
			tabIndex: ! isActive ? '-1' : undefined,
			onKeyDown,
			alignLeft: alignLeftOptions,
			...onClickProps,
		};

		if ( max > 1 ) {
			props.disabled =
				values.length >= max && ! values.includes( optionSlug );
			props.name = `${ slug }-${ optionSlug }`;
		} else {
			props.name = slug;
		}

		if ( isSavingSettings || isNavigating ) {
			props.disabled = true;
		}

		return (
			<div
				key={ optionSlug }
				className="googlesitekit-user-input__select-option"
			>
				<ListComponent { ...props }>
					{ options[ optionSlug ] }
				</ListComponent>
			</div>
		);
	} );

	return (
		<Cell
			className="googlesitekit-user-input__select-options-wrapper"
			lgStart={ 6 }
			lgSize={ 6 }
			mdSize={ 8 }
			smSize={ 4 }
		>
			{ showInstructions && (
				<p className="googlesitekit-user-input__select-instruction">
					<span>
						{ sprintf(
							/* translators: %s: number of answers allowed. */
							_n(
								'Select only %d answer',
								'Select up to %d answers',
								max,
								'google-site-kit'
							),
							max
						) }
					</span>
				</p>
			) }
			<div
				className="googlesitekit-user-input__select-options"
				ref={ optionsRef }
			>
				{ items }
			</div>
		</Cell>
	);
}

UserInputSelectOptions.propTypes = {
	slug: PropTypes.string.isRequired,
	options: PropTypes.shape( {} ).isRequired,
	max: PropTypes.number,
	next: PropTypes.func,
	isActive: PropTypes.bool,
	showInstructions: PropTypes.bool,
	alignLeftOptions: PropTypes.bool,
};

UserInputSelectOptions.defaultProps = {
	max: 1,
	showInstructions: false,
	alignLeftOptions: false,
};
