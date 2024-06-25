/**
 * NoAudienceBanner component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import NoAudienceBannerGraphic from '../../../../../../../svg/graphics/no-audience-banner-graphic.svg';
import Link from '../../../../../../components/Link';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import LeanCTABanner from '../../../../../../components/LeanCTABanner';
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '../AudienceSelectionPanel/constants';

export default function NoAudienceBanner( { hasConfigurableAudiences } ) {
	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( 'analytics-4' )
	);
	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const audienceLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12799087',
		} )
	);

	const { setValue } = useDispatch( CORE_UI );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	return (
		<LeanCTABanner
			className="googlesitekit-no-audience-banner"
			Icon={ Icon }
			SVGGraphic={ NoAudienceBannerGraphic }
		>
			<p className="googlesitekit-lean-cta-banner--body__text">
				{ hasConfigurableAudiences &&
					createInterpolateElement(
						__(
							'It looks like your visitor groups aren’t available anymore. <a>Select other groups</a>.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									secondary
									onClick={ () =>
										setValue(
											AUDIENCE_SELECTION_PANEL_OPENED_KEY,
											true
										)
									}
								/>
							),
						}
					) }
				{ ! hasConfigurableAudiences &&
					createInterpolateElement(
						__(
							'It looks like your visitor groups aren’t available anymore. Learn more about how to group site visitors in <a>Analytics</a>.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									secondary
									href={ audienceLearnMoreURL }
									external
									hideExternalIndicator
								/>
							),
						}
					) }
			</p>
			<p className="googlesitekit-lean-cta-banner--body__text">
				{ createInterpolateElement(
					__(
						'You can deactivate this widget in <a>Settings</a>.',
						'google-site-kit'
					),
					{
						a: (
							<Link
								secondary
								onClick={ () =>
									navigateTo(
										`${ settingsURL }#/admin-settings`
									)
								}
							/>
						),
					}
				) }
			</p>
		</LeanCTABanner>
	);
}

NoAudienceBanner.propTypes = {
	hasConfigurableAudiences: PropTypes.bool.isRequired,
};
