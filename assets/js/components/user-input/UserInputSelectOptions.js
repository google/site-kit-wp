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
import { usePrevious } from '@wordpress/compose';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Checkbox, Radio } from 'googlesitekit-components';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { Cell } from '../../material-components';
import {
	USER_INPUT_CURRENTLY_EDITING_KEY,
	FORM_USER_INPUT_QUESTION_SNAPSHOT,
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_QUESTIONS_PURPOSE,
} from './util/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

export default function UserInputSelectOptions( {
	slug,
	descriptions,
	options,
	max,
	next,
	showInstructions,
	alignLeftOptions,
} ) {
	const viewContext = useViewContext();
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
		if ( ! optionsRef?.current ) {
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
	}, [ max ] );

	const { setValues } = useDispatch( CORE_FORMS );

	const onClick = useCallback(
		( event ) => {
			const { target } = event;
			const { value, checked } = target;

			const newValues = new Set( [ value, ...values ] );
			if ( ! checked ) {
				newValues.delete( value );
			}

			const gaEventName =
				slug === USER_INPUT_QUESTION_POST_FREQUENCY
					? 'content_frequency_question_answer'
					: `site_${ slug }_question_answer`;

			const checkedValues = Array.from( newValues ).slice( 0, max );

			trackEvent(
				`${ viewContext }_kmw`,
				gaEventName,
				checkedValues.join()
			);

			if ( slug === USER_INPUT_QUESTIONS_PURPOSE ) {
				setValues( FORM_USER_INPUT_QUESTION_SNAPSHOT, {
					[ slug ]: values,
				} );
			}

			setUserInputSetting( slug, checkedValues );
		},
		[ max, setUserInputSetting, slug, values, viewContext, setValues ]
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
			description: descriptions?.[ optionSlug ],
			checked:
				USER_INPUT_QUESTIONS_PURPOSE === slug &&
				values.includes( 'sell_products_or_service' ) &&
				'sell_products' === optionSlug
					? true
					: values.includes( optionSlug ),
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
			'sell_products_or_service' !== optionSlug && (
				<div
					key={ optionSlug }
					className="googlesitekit-user-input__select-option"
				>
					<ListComponent { ...props }>
						{ options[ optionSlug ] }
					</ListComponent>
				</div>
			)
		);
	} );

	const currentlyEditingSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_INPUT_CURRENTLY_EDITING_KEY )
	);

	const previousValues = usePrevious( values );

	useEffect( () => {
		if (
			currentlyEditingSlug === USER_INPUT_QUESTIONS_PURPOSE &&
			values.includes( 'sell_products_or_service' ) &&
			'sell_products' in options
		) {
			if (
				undefined !== previousValues &&
				previousValues.includes( 'sell_products_or_service' )
			) {
				setUserInputSetting( slug, [ 'sell_products' ] );
				setValues( FORM_USER_INPUT_QUESTION_SNAPSHOT, {
					[ slug ]: [ 'sell_products' ],
				} );
			} else {
				setUserInputSetting( slug, values );
			}
		}
	}, [
		options,
		slug,
		values,
		currentlyEditingSlug,
		setUserInputSetting,
		previousValues,
	] );

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
	descriptions: PropTypes.shape( {} ),
	options: PropTypes.shape( {} ).isRequired,
	max: PropTypes.number,
	next: PropTypes.func,
	showInstructions: PropTypes.bool,
	alignLeftOptions: PropTypes.bool,
};

UserInputSelectOptions.defaultProps = {
	max: 1,
	showInstructions: false,
	alignLeftOptions: false,
};
