/**
 * AudienceTooltipMessage component.
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
import { createInterpolateElement, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Link from '../../../../../components/Link';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';

export default function AudienceTooltipMessage( {
	audienceSlug,
	audienceName,
} ) {
	const documentationURL = useSelect( ( select ) =>
		// TODO: The link must be updated here to the correct support URL once written.
		select( CORE_SITE ).getDocumentationLinkURL( 'audience-segmentation' )
	);

	const tooltipMessage = useMemo( () => {
		switch ( audienceSlug ) {
			case 'new-visitors':
				return createInterpolateElement(
					sprintf(
						/* translators: %s: is the audience name */
						__(
							'%s are people who visited your site for the first time. Note that under some circumstances it\'s possible for a visitor to be counted in both the "new" and "returning" groups. <link>Learn more</link>',
							'google-site-kit'
						),
						'<strong>New visitors</strong>'
					),
					{
						strong: <strong />,
						link: (
							<Link
								href={ documentationURL }
								external
								hideExternalIndicator
							/>
						),
					}
				);
			case 'returning-visitors':
				return createInterpolateElement(
					sprintf(
						/* translators: %s: is the audience name */
						__(
							'%s are people who have visited your site at least once before. Note that under some circumstances it\'s possible for a visitor to be counted in both the "new" and "returning" groups. <link>Learn more</link>',
							'google-site-kit'
						),
						'<strong>Returning visitors</strong>'
					),
					{
						strong: <strong />,
						link: (
							<Link
								href={ documentationURL }
								external
								hideExternalIndicator
							/>
						),
					}
				);
			default:
				return createInterpolateElement(
					sprintf(
						/* translators: %s: is the audience name */
						__(
							"%s is an audience that already exists in your Analytics property. Note that it's possible for a visitor to be counted in more than one group. <link>Learn more</link>",
							'google-site-kit'
						),
						`<strong>${ audienceName }</strong>`
					),
					{
						strong: <strong />,
						link: (
							<Link
								href={ documentationURL }
								external
								hideExternalIndicator
							/>
						),
					}
				);
		}
	}, [ audienceSlug, audienceName, documentationURL ] );

	return tooltipMessage;
}

AudienceTooltipMessage.propTypes = {
	audienceSlug: PropTypes.string.isRequired,
};
