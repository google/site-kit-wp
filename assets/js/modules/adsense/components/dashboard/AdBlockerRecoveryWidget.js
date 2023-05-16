/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdsenseAdBlockerRecoverySVG from '../../../../../svg/graphics/adsense-ad-blocker-recovery.svg';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { Cell } from '../../../../material-components';
import BannerTitle from '../../../../components/notifications/BannerNotification/BannerTitle';
import BannerActions from '../../../../components/notifications/BannerNotification/BannerActions';
import Banner from '../../../../components/notifications/BannerNotification/Banner';
const { useSelect } = Data;

export default function AdBlockerRecoveryWidget( { Widget } ) {
	const learnMore = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( '/adsense/answer/11576589' )
	);

	const pageURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-ad-blocking-recovery' )
	);

	return (
		<Widget>
			<Banner>
				<Cell lgSize={ 7 }>
					<BannerTitle
						title={ __(
							'Recover revenue lost to ad blockers',
							'google-site-kit'
						) }
					/>

					<div className="googlesitekit-widget--adBlockerRecovery__content">
						<p>
							{ __(
								'Display a message to give site visitors with an ad blocker the option to allow ads on your site. Site Kit will place an ad blocking recovery tag on your site.',
								'google-site-kit'
							) }{ ' ' }
							<a href={ learnMore }>
								{ __( 'Learn more', 'google-site-kit' ) }
							</a>
						</p>
						<p>
							{ __(
								'Publishers see up to 1 in 5 users choose to allow ads once they encounter an ad blocking recovery message',
								'google-site-kit'
							) }{ ' ' }
							<sup>*</sup>
						</p>
					</div>

					<BannerActions
						ctaLabel={ __( 'Set up now', 'google-site-kit' ) }
						ctaLink={ pageURL }
						dismissCallback={ () => {} }
						dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
					/>
				</Cell>
				<Cell
					className="googlesitekit-widget--adBlockerRecovery__graphics"
					lgSize={ 5 }
				>
					<AdsenseAdBlockerRecoverySVG
						style={ {
							maxHeight: '172px',
						} }
					/>

					<p>
						<sup>*</sup>{ ' ' }
						{ __(
							'Average for publishers showing non-dismissible ad blocking recovery messages placed at the center of the page on desktop',
							'google-site-kit'
						) }
					</p>
				</Cell>
			</Banner>
		</Widget>
	);
}

AdBlockerRecoveryWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
