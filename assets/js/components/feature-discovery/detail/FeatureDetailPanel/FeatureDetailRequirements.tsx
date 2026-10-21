/**
 * FeatureDetailRequirements component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import EffortIndicator from '@/js/components/feature-discovery/EffortIndicator';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	TYPE_BODY,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';

interface FeatureDetailRequirementsProps {
	feature: Feature;
}

const FeatureDetailRequirements: FC< FeatureDetailRequirementsProps > = ( {
	feature,
} ) => {
	const { serviceRequirements, setupList, documentationURL } =
		feature.detail?.requirements || {};

	return (
		<div className="googlesitekit-feature-details-panel__text">
			<section className="googlesitekit-feature-details-panel__section">
				<Typography as="h3" size={ SIZE_LARGE } type={ TYPE_LABEL }>
					{ __( 'Setup Effort', 'google-site-kit' ) }
				</Typography>

				<EffortIndicator effort={ feature.effort } />
			</section>

			{ serviceRequirements ? (
				<section className="googlesitekit-feature-details-panel__section">
					<Typography as="h3" size={ SIZE_LARGE } type={ TYPE_LABEL }>
						{ __( 'Service requirements', 'google-site-kit' ) }
					</Typography>

					<P size={ SIZE_MEDIUM }>{ serviceRequirements }</P>
				</section>
			) : null }

			{ setupList?.length ? (
				<section className="googlesitekit-feature-details-panel__section">
					<Typography as="h3" size={ SIZE_LARGE } type={ TYPE_LABEL }>
						{ __( 'Setup checklist', 'google-site-kit' ) }
					</Typography>

					<ol className="googlesitekit-feature-details-panel__setup-list">
						{ setupList.map( ( step, index ) => (
							<Typography
								as="li"
								key={ index }
								size={ SIZE_MEDIUM }
								type={ TYPE_BODY }
							>
								{ step }
							</Typography>
						) ) }
					</ol>
				</section>
			) : null }

			<P size={ SIZE_MEDIUM }>
				{ createInterpolateElement(
					documentationURL
						? __(
								'You can always get help in our <documentation>documentation</documentation> or <support>support forum</support>.',
								'google-site-kit'
						  )
						: __(
								'You can always get help in our <support>support forum</support>.',
								'google-site-kit'
						  ),
					{
						documentation: (
							<Link
								href={ documentationURL }
								external
								hideExternalIndicator
							/>
						),
						support: (
							<Link
								href="https://wordpress.org/support/plugin/google-site-kit/"
								external
								hideExternalIndicator
							/>
						),
					}
				) }
			</P>
		</div>
	);
};

export default FeatureDetailRequirements;
