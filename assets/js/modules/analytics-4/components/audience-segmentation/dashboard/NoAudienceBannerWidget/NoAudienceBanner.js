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
import NoAudienceBannerGraphic from '../../../../../../../svg/graphics/no-audience-banner-graphic.svg';
import Link from '../../../../../../components/Link';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import LeanCTABanner from '../../../../../../components/LeanCTABanner';
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '.././../../../../../googlesitekit/datastore/user/constants';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '../AudienceSelectionPanel/constants';
import useViewOnly from '../../../../../../hooks/useViewOnly';
import { trackEvent } from '../../../../../../util';

const NoAudienceBanner = forwardRef( ( props, ref ) => {
	const isViewOnly = useViewOnly();

	const didSetAudiences = useSelect( ( select ) =>
		select( CORE_USER ).didSetAudiences()
	);

	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( 'analytics-4' )
	);
	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const { setValue } = useDispatch( CORE_UI );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const eventLabel = didSetAudiences
		? 'no-longer-available'
		: 'none-selected';

	function handleSelectGroups() {
		trackEvent(
			'${viewContext}_audiences-no-audiences',
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
			<p>
				{ didSetAudiences &&
					createInterpolateElement(
						__(
							'It looks like your visitor groups aren’t available anymore. <a>Select other groups</a>.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									secondary
									onClick={ handleSelectGroups }
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
									secondary
									onClick={ handleSelectGroups }
								/>
							),
						}
					) }
			</p>
			{ ! isViewOnly && (
				<p>
					{ createInterpolateElement(
						__(
							'You can deactivate this widget in <a>Settings</a>.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									secondary
									onClick={ () => {
										trackEvent(
											'${viewContext}_audiences-no-audiences',
											'change_settings',
											eventLabel
										).finally( () => {
											navigateTo(
												`${ settingsURL }#/admin-settings`
											);
										} );
									} }
								/>
							),
						}
					) }
				</p>
			) }
		</LeanCTABanner>
	);
} );

export default NoAudienceBanner;
