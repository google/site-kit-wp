/**
 * User Input Select Options.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import Radio from '../radio';
import Checkbox from '../checkbox';
import { Input, TextField } from '../../material-components';
const { useSelect, useDispatch } = Data;

export default function UserInputSelectOptions( { slug, options, max } ) {
	const values = useSelect( ( select ) => select( CORE_USER ).getUserInputSetting( slug ) || [] );
	const [ other, setOther ] = useState( values.filter( ( value ) => ! options[ value ] )[ 0 ] || '' );

	const { setUserInputSetting } = useDispatch( CORE_USER );

	const onClick = useCallback( ( event ) => {
		const { target } = event;
		const { value, checked } = target;

		const newValues = new Set( [ value, ...values ] );
		if ( ! checked ) {
			newValues.delete( value );
		}

		setUserInputSetting( slug, Array.from( newValues ).slice( 0, max ) );
	}, values.concat( Array( max ) ).slice( 0, max ) );

	const onOtherChange = useCallback( ( { target } ) => {
		const newValues = [
			target.value,
			...values.filter( ( value ) => !! options[ value ] ),
		];

		setOther( target.value );
		setUserInputSetting( slug, newValues.slice( 0, max ) );
	}, values.concat( Array( max ) ).slice( 0, max ) );

	const onClickProps = {
		[ max > 1 ? 'onChange' : 'onClick' ]: onClick,
	};

	const ListComponent = max === 1 ? Radio : Checkbox;
	const items = Object.keys( options ).map( ( optionSlug ) => {
		const props = {
			id: `${ slug }-${ optionSlug }`,
			value: optionSlug,
			checked: values.includes( optionSlug ),
			...onClickProps,
		};

		if ( max > 1 ) {
			props.disabled = values.length >= max && ! values.includes( optionSlug );
			props.name = `${ slug }-${ optionSlug }`;
		} else {
			props.name = slug;
		}

		return (
			<div key={ optionSlug }>
				<ListComponent { ...props }>
					{ options[ optionSlug ] }
				</ListComponent>
			</div>
		);
	} );

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-6-desktop
			mdc-layout-grid__cell--span-8-tablet
			mdc-layout-grid__cell--span-4-phone
		">
			{ items }

			<div>
				<ListComponent
					id={ `${ slug }-other` }
					name={ max === 1 ? slug : `${ slug }-other` }
					value={ other }
					checked={ values.includes( other ) }
					disabled={ max > 1 && values.length >= max && ! values.includes( other ) }
					{ ...onClickProps }
				>
					{ __( 'Other:', 'google-site-kit' ) }
				</ListComponent>

				<TextField>
					<Input value={ other } onChange={ onOtherChange } />
				</TextField>
			</div>

			<p>
				{ max === 1 && __( 'Choose only one (1) answer', 'google-site-kit' ) }
				{ max === 2 && __( 'Choose only two (2) answers', 'google-site-kit' ) }
				{ max === 3 && __( 'Choose only three (3) answers', 'google-site-kit' ) }
			</p>
		</div>
	);
}

UserInputSelectOptions.propTypes = {
	slug: PropTypes.string.isRequired,
	options: PropTypes.shape( {} ).isRequired,
	max: PropTypes.number,
};

UserInputSelectOptions.defaultProps = {
	max: 1,
};
