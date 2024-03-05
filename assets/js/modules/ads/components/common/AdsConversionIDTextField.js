/**
 * Ads Module Ads Conversion ID component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { TextField } from 'googlesitekit-components';
import { MODULES_ADS } from '../../datastore/constants';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { isValidAdsConversionID } from '../../utils/validation';
import WarningIcon from '../../../../../svg/icons/warning-v2.svg';
const { useSelect, useDispatch } = Data;

export default function AdsConversionIDTextField() {
	const adsConversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getAdsConversionID()
	);

	const { setAdsConversionID } = useDispatch( MODULES_ADS );
	const onChange = useCallback(
		( { currentTarget } ) => {
			let newValue = currentTarget.value.trim().toUpperCase();
			// Automatically add the AW- prefix if not provided.
			if ( 'AW-'.length < newValue.length && ! /^AW-/.test( newValue ) ) {
				newValue = `AW-${ newValue }`;
			}

			if ( newValue !== adsConversionID ) {
				setAdsConversionID( newValue );
			}
		},
		[ adsConversionID, setAdsConversionID ]
	);

	const isValidValue = Boolean( isValidAdsConversionID( adsConversionID ) );

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<h4 className="googlesitekit-settings-module__fields-group-title">
				{ __( 'Ads Conversion ID', 'google-site-kit' ) }
			</h4>
			<TextField
				label={ __( 'Ads Conversion ID', 'google-site-kit' ) }
				className={ classnames( {
					'mdc-text-field--error': ! isValidValue,
				} ) }
				helperText={
					! isValidValue &&
					__(
						'Tracking for your Ads campaigns won’t work until you insert a valid ID',
						'google-site-kit'
					)
				}
				trailingIcon={
					! isValidValue && (
						<span className="googlesitekit-text-field-icon--error">
							<VisuallyHidden>
								{ __( 'Error', 'google-site-kit' ) }
							</VisuallyHidden>
							<WarningIcon width={ 14 } height={ 12 } />
						</span>
					)
				}
				outlined
				value={ adsConversionID }
				onChange={ onChange }
			/>

			<p>
				{ __(
					'The Ads conversion ID will help track the performance of ad campaigns for the corresponding account',
					'google-site-kit'
				) }
			</p>
		</div>
	);
}
