/**
 * DescriptionContent component.
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
import Link from '../../../../../../components/Link';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '../AudienceSelectionPanel/constants';
import useViewOnly from '../../../../../../hooks/useViewOnly';

export default function DescriptionContent( { hasConfigurableAudiences } ) {
	const isViewOnly = useViewOnly();

	const hasConfiguredAudiences = useSelect(
		( select ) => select( CORE_USER ).getConfiguredAudiences().length > 0
	);

	const didSetAudiences = useSelect( ( select ) =>
		select( CORE_USER ).didSetAudiences()
	);

	const audienceLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12799087',
		} )
	);

	const { setValue } = useDispatch( CORE_UI );

	if ( ! hasConfigurableAudiences ) {
		if ( ! hasConfiguredAudiences && ( isViewOnly || ! didSetAudiences ) ) {
			return (
				<p>
					{ createInterpolateElement(
						__(
							'There are no visitor groups available. Learn more about how to group site visitors in <a>Analytics</a>.',
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
			);
		}

		return (
			<p>
				{ createInterpolateElement(
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
		);
	}

	return (
		<p>
			{ createInterpolateElement(
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
		</p>
	);
}

DescriptionContent.propTypes = {
	hasConfigurableAudiences: PropTypes.bool.isRequired,
};
