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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import GA4SuccessGreenSVG from '../../../../../svg/graphics/ga4-success-green.svg';
import BannerNotification from '../../../../components/notifications/BannerNotification';
const { useSelect } = Data;

export default function AdBlockerRecoveryWidget( { Widget } ) {
	const pageURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-ad-blocking-recovery' )
	);

	return (
		<Widget>
			<BannerNotification
				id="switched-ga4-dashboard-view"
				title={ __(
					'Recover revenue lost to ad blockers',
					'google-site-kit'
				) }
				ctaLabel={ __( 'Set up now', 'google-site-kit' ) }
				ctaLink={ pageURL }
				onDismiss={ () => {} }
				dismiss={ __( 'Maybe later', 'google-site-kit' ) }
				WinImageSVG={ () => (
					<Fragment>
						<GA4SuccessGreenSVG />
						<p>
							{ __(
								'* Average for publishers showing non-dismissible ad blocking recovery messages placed at the center of the page on desktop',
								'google-site-kit'
							) }
						</p>
					</Fragment>
				) }
			>
				<p>
					{ __(
						'Display a message to give site visitors with an ad blocker the option to allow ads on your site. Site Kit will place an ad blocking recovery tag on your site.',
						'google-site-kit'
					) }{ ' ' }
					<a href={ pageURL }>
						{ __( 'Learn more', 'google-site-kit' ) }
					</a>
				</p>
				<p>
					{ __(
						'Publishers see up to 1 in 5 users choose to allow ads once they encounter an ad blocking recovery message*',
						'google-site-kit'
					) }
				</p>
			</BannerNotification>
		</Widget>
	);
}

AdBlockerRecoveryWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
