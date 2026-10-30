/**
 * FeatureListItem component.
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
import { Suspense, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { ErrorObject } from '@/js/util/errors';
import { FEATURE_DISCOVERY_SETUP_REQUEST_KEY } from './constants';
import FeatureCard, { FeatureCardProps } from './FeatureCard';
import FeatureCTAButton from './FeatureCTAButton';
import FeatureSetupErrorNotice from './FeatureSetupErrorNotice';

const FeatureListItem: FC< FeatureCardProps > = ( { slug, ...props } ) => {
	const [ isRetrying, setIsRetrying ] = useState( false );

	const { clearActionError, setupFeature } = useDispatch(
		CORE_FEATURE_DISCOVERY
	) as {
		clearActionError: ( actionName: string, args?: unknown[] ) => void;
		setupFeature: ( featureSlug: string ) => Promise< unknown >;
	};

	const setupError = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).getErrorForAction(
				'setupFeature',
				[ slug ]
			) as ErrorObject | undefined,
		[ slug ]
	);

	const handleRetry = useCallback( async () => {
		setIsRetrying( true );

		try {
			await setupFeature( slug );
		} finally {
			setIsRetrying( false );
		}
	}, [ setupFeature, slug ] );

	const handleDismiss = useCallback( () => {
		clearActionError( 'setupFeature', [ slug ] );
	}, [ clearActionError, slug ] );

	const feature = useSelect(
		( select: Select ): Feature | null =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug ),
		[ slug ]
	);

	const isSetupRequested = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue(
				FEATURE_DISCOVERY_SETUP_REQUEST_KEY
			) === slug,
		[ slug ]
	);

	const { setValue } = useDispatch( CORE_UI );

	const onSetupRequestHandled = useCallback( () => {
		setValue( FEATURE_DISCOVERY_SETUP_REQUEST_KEY, undefined );
	}, [ setValue ] );

	const renderBusyCTA = useCallback(
		() => (
			<FeatureCTAButton isBusy isTertiary>
				{ feature?.setup?.ctaLabel }
			</FeatureCTAButton>
		),
		[ feature?.setup?.ctaLabel ]
	);

	// A feature that brings its own setup UI owns the whole item, including
	// how its setup errors are reported.
	const SetupComponent = feature?.setup?.SetupComponent;

	if ( SetupComponent ) {
		return (
			<Suspense
				fallback={
					<FeatureCard
						slug={ slug }
						{ ...props }
						renderCTA={ renderBusyCTA }
					/>
				}
			>
				<SetupComponent
					slug={ slug }
					{ ...props }
					isSetupRequested={ isSetupRequested }
					onSetupRequestHandled={ onSetupRequestHandled }
				/>
			</Suspense>
		);
	}

	if ( setupError ) {
		return (
			<FeatureSetupErrorNotice
				error={ setupError }
				isRetrying={ isRetrying }
				onDismiss={ handleDismiss }
				onRetry={ handleRetry }
				slug={ slug }
			/>
		);
	}

	return <FeatureCard slug={ slug } { ...props } />;
};

export default FeatureListItem;
