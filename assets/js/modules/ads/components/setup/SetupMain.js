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
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdsIcon from '../../../../../svg/graphics/ads.svg';
import SetupForm from './SetupForm';
import SupportLink from '../../../../components/SupportLink';
import AdBlockerWarning from '../../../../components/notifications/AdBlockerWarning';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

export default function SetupMain( { finishSetup } ) {
	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--ads">
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<AdsIcon width="40" height="40" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x( 'Ads', 'Service name', 'google-site-kit' ) }
				</h2>
			</div>
			<div className="googlesitekit-setup-module__step">
				<AdBlockerWarning moduleSlug="ads" />

				{ ! isAdBlockerActive && (
					<Fragment>
						<p>
							{ createInterpolateElement(
								__(
									'Add your conversion ID below. Site Kit will place it on your site so you can track the performance of your Google Ads campaigns. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<SupportLink
											path="/google-ads/thread/108976144/where-i-can-find-google-conversion-id-begins-with-aw"
											external
										/>
									),
								}
							) }
							<br />
							{ __(
								'You can always change this later in Site Kit Settings.',
								'google-site-kit'
							) }
						</p>

						<SetupForm finishSetup={ finishSetup } />
					</Fragment>
				) }
			</div>
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
