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
import Typography from '@/js/components/Typography';
import { SIZE_LARGE, TYPE_BODY } from '@/js/components/Typography/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import SiteKitIcon from '@/svg/graphics/logo-g.svg';

export interface FeatureServiceIdentityProps {
	feature: Feature;
}

const FeatureServiceIdentity: FC< FeatureServiceIdentityProps > = ( {
	feature,
} ) => {
	const module = useSelect(
		( select: Select ) =>
			feature?.moduleSlug
				? select( CORE_MODULES ).getModule( feature.moduleSlug )
				: undefined,
		[ feature?.moduleSlug ]
	);

	const ModuleIcon = module?.Icon || SiteKitIcon;

	const moduleName =
		module?.name || __( 'Site Kit feature', 'google-site-kit' );

	if ( ! feature ) {
		return null;
	}

	return (
		<div className="googlesitekit-feature-service-identity">
			<ModuleIcon
				aria-hidden="true"
				className="googlesitekit-feature-service-identity__icon"
				height={ 36 }
				width={ 36 }
			/>

			<Typography
				className="googlesitekit-feature-service-identity__text"
				size={ SIZE_LARGE }
				type={ TYPE_BODY }
			>
				{ moduleName }
			</Typography>
		</div>
	);
};

export default FeatureServiceIdentity;
