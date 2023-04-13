/**
 * Analytics Anonymize IP Switch component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useCallback, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import SupportLink from '../../../../components/SupportLink';

const { useSelect, useDispatch } = Data;

export default function AnonymizeIPSwitch() {
	const anonymizeIP = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAnonymizeIP()
	);
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const useGA4Snippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUseSnippet()
	);
	const ampMode = useSelect( ( select ) => select( CORE_SITE ).getAMPMode() );
	const isGA4DashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGA4DashboardView()
	);

	const { setAnonymizeIP } = useDispatch( MODULES_ANALYTICS );

	const isDisabled = isGA4DashboardView && useGA4Snippet && ! useSnippet;

	const onChange = useCallback( () => {
		if ( isDisabled ) {
			return;
		}

		setAnonymizeIP( ! anonymizeIP );
	}, [ anonymizeIP, isDisabled, setAnonymizeIP ] );

	if (
		( ! useSnippet && ! useGA4Snippet ) ||
		ampMode === 'primary' ||
		anonymizeIP === undefined
	) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<h4 className="googlesitekit-settings-module__fields-group-title">
				{ __( 'IP addresses', 'google-site-kit' ) }
			</h4>
			<div className="googlesitekit-settings-module__meta-item">
				<div className="googlesitekit-analytics-anonymizeip">
					<Switch
						label={ __(
							'Anonymize IP addresses',
							'google-site-kit'
						) }
						onClick={ onChange }
						checked={ isDisabled ? false : anonymizeIP }
						hideLabel={ false }
						disabled={ isDisabled }
					/>
					<p>
						{ isDisabled &&
							createInterpolateElement(
								__(
									'In Google Analytics 4, IP masking is not necessary since IP addresses are not logged or stored. <LearnMoreLink />',
									'google-site-kit'
								),
								{
									LearnMoreLink: (
										<SupportLink
											path="/analytics/answer/2763052"
											external
											aria-label={ __(
												'Learn more about IP anonymization.',
												'google-site-kit'
											) }
										>
											{ __(
												'Learn more',
												'google-site-kit'
											) }
										</SupportLink>
									),
								}
							) }
						{ ! isDisabled &&
							createInterpolateElement(
								anonymizeIP
									? __(
											'IP addresses will be anonymized. <LearnMoreLink />',
											'google-site-kit'
									  )
									: __(
											'IP addresses will not be anonymized. <LearnMoreLink />',
											'google-site-kit'
									  ),
								{
									LearnMoreLink: (
										<SupportLink
											path="/analytics/answer/2763052"
											external
											aria-label={ __(
												'Learn more about IP anonymization.',
												'google-site-kit'
											) }
										>
											{ __(
												'Learn more',
												'google-site-kit'
											) }
										</SupportLink>
									),
								}
							) }
					</p>
				</div>
			</div>
		</div>
	);
}
