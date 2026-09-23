/**
 * FeatureCTA component.
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
import { FC, useCallback } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import FeatureCTAButton from '@/js/components/feature-discovery/FeatureCTAButton';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

export interface FeatureCTAProps {
	slug: string;
	isTertiary?: boolean;
}

const FeatureCTA: FC< FeatureCTAProps > = ( { slug, isTertiary = false } ) => {
	const [ isBusy, setIsBusy ] = useState( false );

	const feature = useSelect(
		( select: Select ): Feature | null =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug ),
		[ slug ]
	);

	// Only a setup that activates a module can be blocked by that module's
	// requirements.
	const setupModuleSlug =
		feature?.setup?.type === FEATURE_SETUP_TYPES.SETUP_FLOW
			? feature.setup.moduleSlug
			: undefined;

	const canActivateModule = useSelect(
		( select: Select ) =>
			setupModuleSlug
				? select( CORE_MODULES ).canActivateModule( setupModuleSlug )
				: undefined,
		[ setupModuleSlug ]
	);

	const meetsRequirements = useSelect(
		( select: Select ) =>
			typeof feature?.checkRequirements === 'function'
				? feature.checkRequirements( select )
				: undefined,
		[ feature ]
	);

	const { triggerSurvey } = useDispatch( CORE_USER );
	const { setupFeature } = useDispatch( CORE_FEATURE_DISCOVERY );

	const onClick = useCallback( async () => {
		setIsBusy( true );

		// Awaited first, so the record lands before a setup that navigates away.
		await triggerSurvey( `setup:feature_setup_${ slug }` );

		await setupFeature( slug );

		setIsBusy( false );
	}, [ setupFeature, slug, triggerSurvey ] );

	if ( ! feature?.setup?.ctaLabel ) {
		return null;
	}

	// Tri-state: `undefined` is still loading, not unavailable.
	if ( canActivateModule === false || meetsRequirements === false ) {
		return null;
	}

	return (
		<FeatureCTAButton
			isBusy={ isBusy }
			isTertiary={ isTertiary }
			onClick={ onClick }
		>
			{ feature.setup.ctaLabel }
		</FeatureCTAButton>
	);
};

export default FeatureCTA;
