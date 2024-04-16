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
import Link from '../../../../../components/Link';

export default function AudienceTooltipMessage( { audienceName } ) {
	// TODO: audienceName is used temporarily here, however, the user will be able to rename
	// the audience which will break this function. After #8486 and #8487 are resolved, this
	// function should be updated to use the audienceSlug instead.
	const tooltipMessage = useMemo( () => {
		switch ( audienceName ) {
			case 'New visitors':
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
								// TODO: The link must be updated here to the correct support URL once written.
								href="https://sitekit.withgoogle.com/documentation/"
								external
								hideExternalIndicator
							/>
						),
					}
				);
			case 'Returning visitors':
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
								// TODO: The link must be updated here to the correct support URL once written.
								href="https://sitekit.withgoogle.com/documentation/"
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
								// TODO: The link must be updated here to the correct support URL once written.
								href="https://sitekit.withgoogle.com/documentation/"
								external
								hideExternalIndicator
							/>
						),
					}
				);
		}
	}, [ audienceName ] );

	return tooltipMessage;
}

AudienceTooltipMessage.propTypes = {
	audienceName: PropTypes.string.isRequired,
};
