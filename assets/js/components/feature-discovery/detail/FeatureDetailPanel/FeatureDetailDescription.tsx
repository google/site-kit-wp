/**
 * FeatureDetailDescription component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	TYPE_BODY,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';

interface FeatureDetailDescriptionProps {
	feature: Feature;
}

const FeatureDetailDescription: FC< FeatureDetailDescriptionProps > = ( {
	feature,
} ) => {
	const { whatIs, whyUseHeading, whyUseList } =
		feature.detail?.description || {};

	return (
		<div className="googlesitekit-feature-details-panel__text">
			{ whatIs ? (
				<section className="googlesitekit-feature-details-panel__section">
					<Typography as="h3" size={ SIZE_LARGE } type={ TYPE_LABEL }>
						{ __( 'What is this feature?', 'google-site-kit' ) }
					</Typography>

					<P size={ SIZE_MEDIUM }>{ whatIs }</P>
				</section>
			) : null }

			{ whyUseList?.length ? (
				<section className="googlesitekit-feature-details-panel__section">
					{ whyUseHeading ? (
						<Typography
							as="h3"
							className="googlesitekit-feature-details-panel__heading"
							size={ SIZE_LARGE }
							type={ TYPE_LABEL }
						>
							{ whyUseHeading }
						</Typography>
					) : null }

					<dl className="googlesitekit-feature-details-panel__why-use-list">
						{ whyUseList.map( ( { term, description }, index ) => (
							<div key={ index }>
								<Typography
									as="dt"
									size={ SIZE_MEDIUM }
									type={ TYPE_LABEL }
								>
									{ term }
								</Typography>

								<Typography
									as="dd"
									size={ SIZE_MEDIUM }
									type={ TYPE_BODY }
								>
									{ description }
								</Typography>
							</div>
						) ) }
					</dl>
				</section>
			) : null }
		</div>
	);
};

export default FeatureDetailDescription;
