/**
 * FeatureServiceIdentity component.
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
import { Select, useSelect } from 'googlesitekit-data';
import ModuleIcon from '@/js/components/ModuleIcon';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import SiteKitIcon from '@/svg/graphics/logo-g.svg';

interface FeatureServiceIdentityProps {
	slug: string;
}

const FeatureServiceIdentity: FC< FeatureServiceIdentityProps > = ( {
	slug,
} ) => {
	const moduleSlug = useSelect(
		( select: Select ): string | undefined =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug )?.moduleSlug,
		[ slug ]
	);
	const moduleName = useSelect(
		( select: Select ): string | undefined =>
			moduleSlug
				? select( CORE_MODULES ).getModule( moduleSlug )?.name
				: undefined,
		[ moduleSlug ]
	);

	return (
		<div className="googlesitekit-feature-card__service">
			{ moduleSlug && moduleName ? (
				<ModuleIcon
					slug={ moduleSlug }
					size={ 24 }
					aria-hidden="true"
				/>
			) : (
				<SiteKitIcon width={ 24 } height={ 24 } aria-hidden="true" />
			) }
			<span>
				{ moduleName || __( 'Site Kit feature', 'google-site-kit' ) }
			</span>
		</div>
	);
};

export default FeatureServiceIdentity;
