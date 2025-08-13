/**
 * Ads Module Conversion Tracking ID component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDebounce } from '../../../../hooks/useDebounce';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { TextField } from 'googlesitekit-components';
import { MODULES_ADS } from '../../datastore/constants';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { isValidConversionID } from '../../utils/validation';
import WarningIcon from '../../../../../svg/icons/warning-v2.svg';
import Typography from '../../../../components/Typography';

export default function ConversionIDTextField( {
	helperText,
	hideHeading = false,
} ) {
	const conversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getConversionID()
	);

	// Don't show a validation error before user interacts with the field
	// in setup. When editing show validation error immediately if the value
	// is invalid.
	const [ isValid, setIsValid ] = useState(
		! conversionID || isValidConversionID( conversionID )
	);
	const debounceSetIsValid = useDebounce( setIsValid, 500 );

	const { setConversionID } = useDispatch( MODULES_ADS );
	const onChange = useCallback(
		( { currentTarget } ) => {
			let newValue = currentTarget.value.trim().toUpperCase();
			// Automatically add the AW- prefix if not provided, unless the field is empty.
			if ( newValue !== '' && ! /^AW-/.test( newValue ) ) {
				newValue = `AW-${ newValue }`;
			}

			if ( newValue !== conversionID ) {
				setConversionID( newValue );
			}

			debounceSetIsValid( isValidConversionID( newValue ) );
		},
		[ debounceSetIsValid, conversionID, setConversionID ]
	);

	return (
		<div className="googlesitekit-settings-module__fields-group">
			{ ! hideHeading && (
				<Typography
					as="h4"
					size="small"
					type="title"
					className="googlesitekit-settings-module__fields-group-title"
				>
					{ __( 'Conversion ID', 'google-site-kit' ) }
				</Typography>
			) }

			{ helperText && (
				<Typography
					as="p"
					type="body"
					size="medium"
					className="googlesitekit-settings-module__fields-group-helper-text"
				>
					{ helperText }
				</Typography>
			) }

			<TextField
				label={ __( 'Conversion ID', 'google-site-kit' ) }
				className={ classnames(
					'googlesitekit-text-field-conversion-tracking-id',
					{
						'mdc-text-field--error': ! isValid,
					}
				) }
				helperText={
					! isValid &&
					__(
						'Tracking for your Ads campaigns won’t work until you insert a valid ID',
						'google-site-kit'
					)
				}
				// The "AW-" prefix is constant throughout all Conversion Tracking IDs,
				// so we don't localize it.
				leadingIcon={
					<span className="googlesitekit-text-field-conversion-tracking-id-prefix">
						AW-
					</span>
				}
				trailingIcon={
					! isValid && (
						<span className="googlesitekit-text-field-icon--error">
							<VisuallyHidden>
								{ __( 'Error', 'google-site-kit' ) }
							</VisuallyHidden>
							<WarningIcon width={ 14 } height={ 12 } />
						</span>
					)
				}
				value={ conversionID?.replace( /^(AW)?-?/, '' ) }
				onChange={ onChange }
				maxLength={ 20 }
				outlined
			/>
		</div>
	);
}
