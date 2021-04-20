/**
 * User Input Keywords.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ENTER, BACKSPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Cell, Input, TextField } from '../../material-components';
import Button from '../Button';
import CloseIcon from '../../../svg/close.svg';
import { COMMA } from '../../util/key-codes';
import VisuallyHiden from '../VisuallyHidden';
const { useSelect, useDispatch } = Data;

export default function UserInputKeywords( { slug, max } ) {
	const keywordsContainer = useRef();
	const [ canDeleteKeyword, setCanDeleteKeyword ] = useState( false );

	const values = useSelect( ( select ) => select( CORE_USER ).getUserInputSetting( slug ) || [] );
	const { setUserInputSetting } = useDispatch( CORE_USER );

	// Add an empty string if the values array is empty.
	if ( values.length === 0 ) {
		values.push( '' );
	}

	// Store values in local state to prevent
	// https://github.com/google/site-kit-wp/issues/2900#issuecomment-814843972.
	const [ localValues, setLocalValues ] = useState( values );

	const focusInput = ( querySelector ) => {
		const input = keywordsContainer.current.querySelector( querySelector );
		if ( input ) {
			input.focus();
		}
	};

	const deleteKeyword = useCallback( ( index ) => {
		updateKeywords( [
			...values.slice( 0, index ),
			...values.slice( index + 1 ),
		] );
		// After deleting a keyword, hitting backspace will delete the next keyword.
		setCanDeleteKeyword( true );
	}, [ updateKeywords, values ], canDeleteKeyword );

	const onKeywordDelete = useCallback( ( index ) => {
		deleteKeyword( index );
	}, [ deleteKeyword ] );

	const updateKeywords = useCallback( ( keywords ) => {
		const EOT = String.fromCharCode( 4 );
		let newKeywords = keywords
			// Trim keywords to allow no empty spaces at the beginning and at max one space at the end.
			.map( ( keyword ) => keyword.replace( /(\S)\s+$/, '$1 ' ).replace( /^\s+/, '' ) )
			// EOT is added to the end to properly combine two sequential empty spaces at the end.
			.concat( [ '', EOT ] )
			.join( EOT )
			.replace( new RegExp( `${ EOT }{3,}`, 'g' ), EOT ); // Combine two sequential empty spaces into one.

		if ( newKeywords === EOT ) {
			newKeywords = [ '' ];
		} else {
			newKeywords = newKeywords.split( EOT ).slice( 0, max );
		}

		setLocalValues( newKeywords );
		setUserInputSetting( slug, newKeywords );
	}, [ slug, max, setUserInputSetting ] );

	const onKeywordChange = useCallback( ( index, { target } ) => {
		if ( target.value[ target.value.length - 1 ] === ',' ) {
			return;
		}

		updateKeywords( [
			...values.slice( 0, index ),
			target.value,
			...values.slice( index + 1 ),
		] );
	}, [ updateKeywords, values ] );

	const onKeyDown = useCallback( ( index, { keyCode, target } ) => {
		const nonEmptyValues = values.filter( ( value ) => value.length > 0 );
		const nonEmptyValuesLength = nonEmptyValues.length;

		if ( ( keyCode === ENTER || keyCode === COMMA ) && nonEmptyValues.length < max ) {
			updateKeywords( [
				...values.slice( 0, index + 1 ),
				'',
				...values.slice( index + 1 ),
			] );

			// A new keyword has been added. Pressing backspace now will remove the entire keyword.
			setCanDeleteKeyword( true );
			setTimeout( () => {
				focusInput( `#${ slug }-keyword-${ index + 1 }` );
			}, 50 );
		}

		if ( target.value.length === 0 && keyCode === BACKSPACE ) {
			// The input is empty, so pressing backspace should delete the last keyword.
			deleteKeyword( nonEmptyValuesLength - 1 );
			setTimeout( () => {
				focusInput( `#${ slug }-keyword-${ nonEmptyValuesLength - 1 }` );
			}, 50 );
			// After deleting a keyword, pressing backspace again should continue to delete keywords.
			setCanDeleteKeyword( true );
		} else {
			// User is typing, so pressing backspace should delete the last character rather than the keyword.
			setCanDeleteKeyword( false );
		}
	}, [ deleteKeyword, max, slug, updateKeywords, values ] );

	return (
		<Cell lgStart={ 6 } lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
			<div ref={ keywordsContainer } className="googlesitekit-user-input__text-options">
				{ localValues.map( ( value, i ) => (
					<div
						key={ i }
						className={ classnames( {
							'googlesitekit-user-input__text-option': localValues.length > i + 1 || value.length > 0,
						} ) }
					>
						<VisuallyHiden>
							<label htmlFor={ `${ slug }-keyword-${ i }` } >
								{ sprintf(
									/* translators: %s is the keyword number; 1, 2, or 3 */
									__( 'Keyword %s', 'google-site-kit' ),
									i + 1, // Keys are zero-indexed; this starts keyword at "1".
								) }
							</label>
						</VisuallyHiden>
						<TextField
							label={ __( 'Enter minimum one (1), maximum three (3) terms', 'google-site-kit' ) }
							noLabel
						>
							<Input
								id={ `${ slug }-keyword-${ i }` }
								value={ value }
								size={ value.length > 0 ? value.length : undefined }
								onChange={ onKeywordChange.bind( null, i ) }
								onKeyDown={ onKeyDown.bind( null, i ) }
							/>
						</TextField>

						{ ( value.length > 0 || i + 1 < localValues.length ) && (
							<Button
								text
								icon={ <CloseIcon width="11" height="11" /> }
								onClick={ onKeywordDelete.bind( null, i ) }
							/>
						) }
					</div>
				) ) }
			</div>

			<p className="googlesitekit-user-input__note">
				{ __( 'Separate with commas or the Enter key', 'google-site-kit' ) }
			</p>
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
