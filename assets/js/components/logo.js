/**
 * Logo component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import SvgIcon from 'GoogleUtil/svg-icon';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const Logo = () => {
	return (
		<div className="googlesitekit-logo" aria-hidden="true">
			<SvgIcon
				id="logo-g"
				className="googlesitekit-logo__logo-g"
				height="34"
				width="32"
			/>
			<SvgIcon
				id="logo-sitekit"
				className="googlesitekit-logo__logo-sitekit"
				height="26"
				width="99"
			/>
			<span className="screen-reader-text">
				{ __( 'Site Kit by Google Logo', 'google-site-kit' ) }
			</span>
		</div>
	);
};

export default Logo;
