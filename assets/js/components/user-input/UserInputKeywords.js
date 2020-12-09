/**
 * User Input Keywords.
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
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Cell, Input, TextField } from '../../material-components';
import Button from '../Button';
import { COMMA } from '../../util/key-codes';
const { useSelect, useDispatch } = Data;

export default function UserInputKeywords( { slug, max } ) {
	const values = useSelect( ( select ) => select( CORE_USER ).getUserInputSetting( slug ) || [] );
	const [ keyword, setKeyword ] = useState( '' );
	const { setUserInputSetting } = useDispatch( CORE_USER );

	// Need to make sure that dependencies list always has the same number of elements.
	const dependencies = values.concat( Array( max ) ).slice( 0, max );

	const onKeywordChange = useCallback( ( { target } ) => {
		if ( target.value[ target.value.length - 1 ] !== ',' ) {
			setKeyword( target.value );
		}
	}, dependencies );

	const onKeyDown = useCallback( ( { keyCode } ) => {
		if ( keyCode === ENTER || keyCode === COMMA ) {
			const value = keyword.trim();
			if ( value ) {
				setUserInputSetting( slug, [ ...values, value ] );
				setKeyword( '' );
			}
		}
	}, [ keyword, ...dependencies ] );

	const onKeywordDelete = useCallback( ( keywordToDelete ) => {
		setUserInputSetting( slug, values.filter( ( value ) => value !== keywordToDelete ) );
	}, dependencies );

	return (
		<Cell lgStart={ 6 } lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
			<div className="googlesitekit-user-input__text-options">
				{ values.map( ( value ) => (
					<div key={ value } className="googlesitekit-user-input__text-option">
						{ value }
						<Button text onClick={ onKeywordDelete.bind( null, value ) }>x</Button>
					</div>
				) ) }

				{ values.length !== max && (
					<TextField
						label={ __( 'Minimum one (1), maximum three (3) keywords', 'google-site-kit' ) }
						noLabel
					>
						<Input
							id={ `${ slug }-keywords` }
							value={ keyword }
							onChange={ onKeywordChange }
							onKeyDown={ onKeyDown }
						/>
					</TextField>
				) }
			</div>
			<p className="googlesitekit-user-input__note">{ __( 'Separate with commas or the Enter key', 'google-site-kit' ) }</p>
		</Cell>
	);
}

UserInputKeywords.propTypes = {
	slug: PropTypes.string.isRequired,
	max: PropTypes.number,
};

UserInputKeywords.defaultProps = {
	max: 1,
};
