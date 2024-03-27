/**
 * Analytics 4 Conversion Tracking ID component.
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
import AccessibleWarningIcon from '../../../../components/AccessibleWarningIcon';
import { TextField } from 'googlesitekit-components';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { isValidAdsConversionID } from '../../../ads/utils/validation';
const { useSelect, useDispatch } = Data;

export default function AdsConversionIDTextField() {
	const adsConversionID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdsConversionID()
	);
	const snippetEnabled = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getUseSnippet();
	} );

	const { setAdsConversionID } = useDispatch( MODULES_ANALYTICS_4 );
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

	const isValidValue = Boolean(
		! adsConversionID || isValidAdsConversionID( adsConversionID )
	);

	// Only show the field if the snippet is enabled for output,
	// but only hide it if the value is valid otherwise the user will be blocked.
	if ( isValidValue && ! snippetEnabled ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<h4 className="googlesitekit-settings-module__fields-group-title">
				{ __( 'Google Ads', 'google-site-kit' ) }
			</h4>
			<TextField
				label={ __( 'Conversion Tracking ID', 'google-site-kit' ) }
				className={ classnames( {
					'mdc-text-field--error': ! isValidValue,
				} ) }
				helperText={
					! isValidValue &&
					__(
						'Conversion IDs must be in the format: AW-XXXXX',
						'google-site-kit'
					)
				}
				trailingIcon={
					! isValidValue && (
						<span className="googlesitekit-text-field-icon--error">
							<AccessibleWarningIcon />
						</span>
					)
				}
				outlined
				value={ adsConversionID }
				onChange={ onChange }
			/>

			<p>
				{ __(
					'If you’re using Google Ads, insert your Conversion Tracking ID if you’d like Site Kit to place the snippet on your site',
					'google-site-kit'
				) }
			</p>
		</div>
	);
}
