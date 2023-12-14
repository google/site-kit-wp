/**
 * Logo component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GoogleLogoIcon from '../../svg/graphics/logo-g.svg';
import SiteKitLogoIcon from '../../svg/graphics/logo-sitekit.svg';
import VisuallyHidden from './VisuallyHidden';

function Logo() {
	return (
		<div className="googlesitekit-logo" aria-hidden="true">
			<GoogleLogoIcon
				className="googlesitekit-logo__logo-g"
				height="34"
				width="32"
			/>
			<SiteKitLogoIcon
				className="googlesitekit-logo__logo-sitekit"
				height="26"
				width="99"
			/>
			<VisuallyHidden>
				{ __( 'Site Kit by Google Logo', 'google-site-kit' ) }
			</VisuallyHidden>
		</div>
	);
}

export default Logo;
