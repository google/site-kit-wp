/**
 * Ads Main setup component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdsIcon from '../../../../../svg/graphics/ads.svg';
import SetupForm from './SetupForm';

export default function SetupMain( { finishSetup } ) {
	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--ads">
			<div className="googlesitekit-setup-module__logo">
				<AdsIcon width="33" height="33" />
			</div>

			<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
				{ _x( 'Ads', 'Service name', 'google-site-kit' ) }
			</h2>

			<div className="googlesitekit-setup-module__description">
				{ __(
					'Add your conversion ID below. Site Kit will place it on your site so you can track the performance of your Google Ads campaigns.',
					'google-site-kit'
				) }
				<br />
				{ __(
					'You can always change this later in Site Kit Settings.',
					'google-site-kit'
				) }
			</div>

			<SetupForm finishSetup={ finishSetup } />
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
