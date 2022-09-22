/**
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_THANK_WITH_GOOGLE,
	COLOR_RADIO_DEFAULT,
} from '../../datastore/constants';
import ImageRadio from '../../../../components/ImageRadio';
import { getColorThemes } from '../../util/settings';
const { useSelect, useDispatch } = Data;

export default function ColorRadio() {
	const { setColorTheme } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const currentColor = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getColorTheme()
	);

	const onChange = useCallback(
		( { target } = {} ) => {
			const { value: color = COLOR_RADIO_DEFAULT } = target || {};
			setColorTheme( color );
		},
		[ setColorTheme ]
	);

	const colors = getColorThemes()?.map(
		( { colorThemeID, name, svg: SVG, colorCode } ) => (
			<ImageRadio
				key={ colorThemeID }
				id={ colorThemeID }
				name="color-theme"
				value={ colorThemeID }
				description={ name }
				image={ <SVG /> }
				onChange={ onChange }
				checked={ currentColor === colorThemeID }
				style={ { outlineColor: colorCode } }
			/>
		)
	);

	return (
		<div className="googlesitekit-twg-setting-field googlesitekit-twg-color-radio">
			<h4>{ __( 'Color', 'google-site-kit' ) }</h4>
			<p>
				{ __(
					'Choose the color of the Thank button, counter, supporter wall, and other components',
					'google-site-kit'
				) }
			</p>
			<div className="googlesitekit-twg-color-radio__options googlesitekit-image-radio-options">
				{ colors }
			</div>
		</div>
	);
}
