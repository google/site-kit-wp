/**
 * VisitorGroupsFeatureSetup component.
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
import type { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import FeatureCard, {
	FeatureCardProps,
} from '@/js/components/feature-discovery/FeatureCard';
import FeatureCTAButton from '@/js/components/feature-discovery/FeatureCTAButton';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureSetupSurveyTriggerID } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	getCurrentFeatureDiscoveryTabPath,
	setPendingSetup,
} from '@/js/googlesitekit/feature-discovery/pending-setup';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import AudienceSegmentationSetupErrorWidget from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationSetupErrorWidget';
import useEnableAudienceGroup from '@/js/modules/analytics-4/hooks/useEnableAudienceGroup';
import type { ErrorObject } from '@/js/util/errors';

// Stands in for the failure of audiences that were not created, which carries
// no error of its own.
const AUDIENCE_CREATION_ERROR: ErrorObject = {
	code: 'audience_creation_failed',
	message: 'Some visitor groups could not be created.',
	data: { status: 500 },
};

interface VisitorGroupsFeatureSetupProps extends FeatureCardProps {
	Widget: ElementType;
	isSetupRequested?: boolean;
	onSetupRequestHandled?: () => void;
}

const VisitorGroupsFeatureSetup: FC< VisitorGroupsFeatureSetupProps > = ( {
	Widget,
	slug,
	isSetupRequested = false,
	onSetupRequestHandled,
	...cardProps
} ) => {
	const handledRequestRef = useRef( false );

	const feature = useSelect(
		( select: Select ): Feature | null =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug ),
		[ slug ]
	);

	const setupError = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).getErrorForAction(
				'setupFeature',
				[ slug ]
			) as ErrorObject | undefined,
		[ slug ]
	);

	const { clearActionError, setErrorForAction } = useDispatch(
		CORE_FEATURE_DISCOVERY
	) as {
		clearActionError: ( actionName: string, args?: unknown[] ) => void;
		setErrorForAction: (
			error: ErrorObject,
			actionName: string,
			args?: unknown[]
		) => void;
	};
	const { triggerSurvey } = useDispatch( CORE_USER );

	// Restores the tab the user set out from once they return from granting
	// permissions.
	const onOAuthNavigation = useCallback(
		() => setPendingSetup( slug, getCurrentFeatureDiscoveryTabPath() ),
		[ slug ]
	);

	const onSuccess = useCallback( () => {
		clearActionError( 'setupFeature', [ slug ] );
	}, [ clearActionError, slug ] );

	const {
		apiErrors,
		failedAudiences,
		isAudienceCreationError,
		isSaving,
		onEnableGroups,
	} = useEnableAudienceGroup( {
		// Returns the user to the hub, rather than the dashboard.
		redirectURL: global.location.href,
		onOAuthNavigation,
		onSuccess,
	} ) as {
		apiErrors: ErrorObject[];
		failedAudiences: string[];
		isAudienceCreationError: boolean;
		isSaving: boolean;
		onEnableGroups: () => Promise< void >;
	};

	// The failure is kept in the feature's error store, so it outlives this
	// component being unmounted and remounted.
	useEffect( () => {
		if ( isSaving ) {
			return;
		}

		if ( apiErrors.length ) {
			setErrorForAction( apiErrors[ 0 ], 'setupFeature', [ slug ] );
		} else if ( failedAudiences.length ) {
			setErrorForAction( AUDIENCE_CREATION_ERROR, 'setupFeature', [
				slug,
			] );
		}
	}, [ apiErrors, failedAudiences, isSaving, setErrorForAction, slug ] );

	const handleClick = useCallback( () => {
		// Not awaited: recording the setup must never block or fail it.
		triggerSurvey( getFeatureSetupSurveyTriggerID( slug ) );

		onEnableGroups();
	}, [ onEnableGroups, slug, triggerSurvey ] );

	const handleRetry = useCallback( () => {
		clearActionError( 'setupFeature', [ slug ] );

		onEnableGroups();
	}, [ clearActionError, onEnableGroups, slug ] );

	const handleDismiss = useCallback( () => {
		clearActionError( 'setupFeature', [ slug ] );
	}, [ clearActionError, slug ] );

	// Setup requested from the detail panel behaves as if the card's CTA had
	// been clicked.
	useEffect( () => {
		if ( ! isSetupRequested ) {
			handledRequestRef.current = false;
			return;
		}

		if ( handledRequestRef.current ) {
			return;
		}

		handledRequestRef.current = true;

		onSetupRequestHandled?.();
		handleClick();
	}, [ handleClick, isSetupRequested, onSetupRequestHandled ] );

	const renderCTA = useCallback(
		() => (
			<FeatureCTAButton
				isBusy={ isSaving }
				onClick={ handleClick }
				isTertiary
			>
				{ feature?.setup?.ctaLabel }
			</FeatureCTAButton>
		),
		[ feature?.setup?.ctaLabel, handleClick, isSaving ]
	);

	if ( setupError && ! isSaving ) {
		return (
			<AudienceSegmentationSetupErrorWidget
				Widget={ Widget }
				errors={ apiErrors }
				isAudienceCreationVariant={ isAudienceCreationError }
				onRetry={ handleRetry }
				onDismiss={ handleDismiss }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			/>
		);
	}

	return (
		<FeatureCard slug={ slug } { ...cardProps } renderCTA={ renderCTA } />
	);
};

export default withWidgetComponentProps( 'visitorGroupsFeatureSetup' )(
	VisitorGroupsFeatureSetup
);
