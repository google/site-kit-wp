/**
 * FeatureEffects component.
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';

const FeatureEffects: FC = () => {
	const features = useSelect(
		( select: Select ): Feature[] =>
			select( CORE_FEATURE_DISCOVERY ).getFeatures(),
		[]
	);

	return (
		<Fragment>
			{ features.map( ( { slug, EffectComponent } ) =>
				EffectComponent ? <EffectComponent key={ slug } /> : null
			) }
		</Fragment>
	);
};

export default FeatureEffects;
