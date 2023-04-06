/**
 * Optimize Anti Flicker Switch component.
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
 * WordPress dependencies
 */
import { useCallback, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import SupportLink from '../../../../components/SupportLink';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function PlaceAntiFlickerSwitch() {
	const placeAntiFlickerSnippet = useSelect( ( select ) =>
		select( MODULES_OPTIMIZE ).getPlaceAntiFlickerSnippet()
	);
	const { setPlaceAntiFlickerSnippet } = useDispatch( MODULES_OPTIMIZE );

	let message;
	if ( placeAntiFlickerSnippet ) {
		message = __(
			'Site Kit will add the code automatically. <a>Learn more</a>.',
			'google-site-kit'
		);
	} else {
		message = __(
			'Site Kit will not add the code to your site. <a>Learn more</a>.',
			'google-site-kit'
		);
	}

	const handleOnClick = useCallback( () => {
		setPlaceAntiFlickerSnippet( ! placeAntiFlickerSnippet );
	}, [ placeAntiFlickerSnippet, setPlaceAntiFlickerSnippet ] );

	if ( placeAntiFlickerSnippet === undefined ) {
		return null;
	}

	return (
		<fieldset className="googlesitekit-optimize-anti-flicker">
			<div className="googlesitekit-settings-module__inline-items">
				<div className="googlesitekit-settings-module__inline-item">
					<Switch
						label={ __(
							'Place anti-flicker snippet on your site',
							'google-site-kit'
						) }
						checked={ placeAntiFlickerSnippet }
						onClick={ handleOnClick }
						hideLabel={ false }
					/>
				</div>
			</div>
			<p>
				{ createInterpolateElement( message, {
					a: (
						<SupportLink
							path="/optimize/answer/7100284"
							external
							aria-label={ __(
								'Learn more about the anti-flicker snippet.',
								'google-site-kit'
							) }
						/>
					),
				} ) }
			</p>
		</fieldset>
	);
}
