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
 * WordPress dependencies
 */
import { createInterpolateElement, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import NoAudienceBannerGraphic from '@/svg/graphics/no-audience-banner-graphic.svg';
import Link from '@/js/components/Link';
import P from '@/js/components/Typography/P';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import LeanCTABanner from '@/js/components/LeanCTABanner';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSelectionPanel/constants';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import { trackEvent } from '@/js/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

const NoAudienceBanner = forwardRef( ( props, ref ) => {
	const viewContext = useViewContext();
	const isViewOnly = useViewOnly();

	const didSetAudiences = useSelect( ( select ) =>
		select( CORE_USER ).didSetAudiences()
	);

	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( MODULE_SLUG_ANALYTICS_4 )
	);
	const adminSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteKitAdminSettingsURL( {
			scrollTo: 'visitor-groups',
		} )
	);

	const { setValue } = useDispatch( CORE_UI );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const eventLabel = didSetAudiences
		? 'no-longer-available'
		: 'none-selected';

	function handleSelectGroups() {
		trackEvent(
			`${ viewContext }_audiences-no-audiences`,
			'select_groups',
			eventLabel
		).finally( () => {
			setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );
		} );
	}

	return (
		<LeanCTABanner
			ref={ ref }
			className="googlesitekit-no-audience-banner"
			Icon={ Icon }
			SVGGraphic={ NoAudienceBannerGraphic }
		>
			<P>
				{ didSetAudiences &&
					createInterpolateElement(
						__(
							'It looks like your visitor groups aren’t available anymore. <a>Select other groups</a>.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									onClick={ handleSelectGroups }
									secondary
								/>
							),
						}
					) }
				{ ! didSetAudiences &&
					createInterpolateElement(
						__(
							'You don’t have any visitor groups selected. <a>Select groups</a>.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									onClick={ handleSelectGroups }
									secondary
								/>
							),
						}
					) }
			</P>
			{ ! isViewOnly && (
				<P>
					{ createInterpolateElement(
						__(
							'You can deactivate this widget in <a>Settings</a>.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									onClick={ () => {
										trackEvent(
											`${ viewContext }_audiences-no-audiences`,
											'change_settings',
											eventLabel
										).finally( () => {
											navigateTo( adminSettingsURL );
										} );
									} }
									secondary
								/>
							),
						}
					) }
				</P>
			) }
		</LeanCTABanner>
	);
} );

export default NoAudienceBanner;
