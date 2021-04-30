/**
 * Analytics ads conversion ID component.
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

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { TextField, HelperText, Input } from '../../../../material-components';
import { STORE_NAME } from '../../datastore/constants';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { isValidAdsConversionID } from '../../util';
const { useSelect, useDispatch } = Data;

export default function AdsConversionIDTextField() {
	const adsConversionID = useSelect( ( select ) => select( STORE_NAME ).getAdsConversionID() );

	const { setAdsConversionID } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( { currentTarget } ) => {
		let newValue = currentTarget.value.trim().toUpperCase();
		// Automatically add the AW- prefix if not provided.
		if ( 'AW-'.length < newValue.length && ! /^AW-/.test( newValue ) ) {
			newValue = `AW-${ newValue }`;
		}

		if ( newValue !== adsConversionID ) {
			setAdsConversionID( newValue );
		}
	}, [ adsConversionID, setAdsConversionID ] );

	const invalidValue = adsConversionID && ! isValidAdsConversionID( adsConversionID );

	return (
		<div>
			<TextField
				label={ __( 'Ads Conversion ID', 'google-site-kit' ) }
				className={ classnames( { 'mdc-text-field--error': invalidValue } ) }
				helperText={ invalidValue && (
					<HelperText persistent>
						{ __( 'Conversion IDs must be in the format: AW-XXXXX', 'google-site-kit' ) }
					</HelperText>
				) }
				trailingIcon={ invalidValue && (
					<span className="googlesitekit-text-field-icon--error">
						<VisuallyHidden>
							{ __( 'Error', 'google-site-kit' ) }
						</VisuallyHidden>
					</span>
				) }
				outlined
			>
				<Input
					value={ adsConversionID }
					onChange={ onChange }
				/>
			</TextField>

			<p>
				{ __( 'Insert your Ads Conversion ID here if you want Site Kit to place the snippet on your site', 'google-site-kit' ) }
			</p>
		</div>
	);
}
