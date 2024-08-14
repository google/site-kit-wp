/**
 * PlaceholderTile component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import Link from '../../../../../../components/Link';
import NoAudienceBannerGraphic from '../../../../../../../svg/graphics/no-audience-banner-graphic.svg';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '../AudienceSelectionPanel/constants';

export default function PlaceholderTile( { Widget } ) {
	const hasConfigurableNonDefaultAudiences = useSelect( ( select ) => {
		const configurableAudiences =
			select( MODULES_ANALYTICS_4 ).getConfigurableAudiences();

		return configurableAudiences.some(
			( audience ) => audience.audienceType !== 'DEFAULT_AUDIENCE'
		);
	} );

	const audienceLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12799087',
		} )
	);

	const { setValue } = useDispatch( CORE_UI );

	const AnalyticsLink = (
		<Link
			secondary
			href={ audienceLearnMoreURL }
			external
			hideExternalIndicator
		/>
	);

	return (
		<Widget className="googlesitekit-audience-segmentation-tile-placeholder">
			<div
				className={ classnames(
					'googlesitekit-audience-segmentation-tile-placeholder__container',
					{
						'googlesitekit-audience-segmentation-tile-placeholder__container--with-selectable-audiences':
							hasConfigurableNonDefaultAudiences,
						'googlesitekit-audience-segmentation-tile-placeholder__container--without-selectable-audiences':
							! hasConfigurableNonDefaultAudiences,
					}
				) }
			>
				<NoAudienceBannerGraphic className="googlesitekit-audience-segmentation-tile-placeholder__image" />
				<div className="googlesitekit-audience-segmentation-tile-placeholder__body">
					<h3 className="googlesitekit-audience-segmentation-tile-placeholder__title">
						{ hasConfigurableNonDefaultAudiences
							? __(
									'Compare your group to other groups',
									'google-site-kit'
							  )
							: __(
									'Create more visitor groups',
									'google-site-kit'
							  ) }
					</h3>
					<p className="googlesitekit-audience-segmentation-tile-placeholder__description">
						{ hasConfigurableNonDefaultAudiences
							? createInterpolateElement(
									__(
										'<SelectGroupLink>Select</SelectGroupLink> another group to compare with your current group or learn more about how to group site visitors in <AnalyticsLink>Analytics</AnalyticsLink>',
										'google-site-kit'
									),
									{
										AnalyticsLink,
										SelectGroupLink: (
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
							  )
							: createInterpolateElement(
									__(
										'Learn more about how to group site visitors in <AnalyticsLink>Analytics</AnalyticsLink>',
										'google-site-kit'
									),
									{
										AnalyticsLink,
									}
							  ) }
					</p>
				</div>
			</div>
		</Widget>
	);
}
