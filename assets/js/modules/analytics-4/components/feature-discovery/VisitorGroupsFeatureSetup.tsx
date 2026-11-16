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
import type { FC } from 'react';

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
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	getCurrentFeatureDiscoveryTabPath,
	setPendingSetup,
} from '@/js/googlesitekit/feature-discovery/pending-setup';
import AudienceSegmentationSetupErrorWidget from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationSetupErrorWidget';
import { VISITOR_GROUPS_SETUP_FAILURE_KEY } from '@/js/modules/analytics-4/datastore/constants';
import useEnableAudienceGroup from '@/js/modules/analytics-4/hooks/useEnableAudienceGroup';
import type { ErrorObject } from '@/js/util/errors';

interface VisitorGroupsSetupFailure {
	failedAudiences: string[];
	isAudienceCreationError: boolean;
}

interface VisitorGroupsFeatureSetupProps extends FeatureCardProps {
	isSetupRequested?: boolean;
	onSetupRequestHandled?: () => void;
}

const VisitorGroupsFeatureSetup: FC< VisitorGroupsFeatureSetupProps > = ( {
	slug,
	isSetupRequested = false,
	onSetupRequestHandled,
	...cardProps
} ) => {
	const handledRequestRef = useRef( false );
	const wasSavingRef = useRef( false );

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

	// The outcome of the last attempt is kept in the UI store alongside the
	// error, so the matching notice is shown again once this component has been
	// unmounted and remounted.
	const { failedAudiences = [], isAudienceCreationError = false } =
		useSelect(
			( select: Select ) =>
				select( CORE_UI ).getValue(
					VISITOR_GROUPS_SETUP_FAILURE_KEY
				) as VisitorGroupsSetupFailure | undefined,
			[]
		) || {};

	const { setValue } = useDispatch( CORE_UI ) as {
		setValue: ( key: string, value: unknown ) => void;
	};
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
		failedAudiences: hookFailedAudiences,
		isAudienceCreationError: hookIsAudienceCreationError,
		isSaving,
		onEnableGroups,
	} = useEnableAudienceGroup( {
		// Returns the user to the hub, rather than the dashboard.
		redirectURL: global.location.href,
		onOAuthNavigation,
		onSuccess,
		// Lets a retry after a remount create only the audiences that failed.
		initialFailedAudiences: failedAudiences,
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
		if ( ! isSaving && apiErrors.length ) {
			setErrorForAction( apiErrors[ 0 ], 'setupFeature', [ slug ] );
		}
	}, [ apiErrors, isSaving, setErrorForAction, slug ] );

	// The hook's own state starts empty on every mount, so it is only copied to
	// the UI store once an attempt has finished; copying it on mount would wipe
	// the outcome kept from before.
	useEffect( () => {
		const wasSaving = wasSavingRef.current;
		wasSavingRef.current = isSaving;

		if ( ! wasSaving || isSaving ) {
			return;
		}

		setValue( VISITOR_GROUPS_SETUP_FAILURE_KEY, {
			failedAudiences: hookFailedAudiences,
			isAudienceCreationError: hookIsAudienceCreationError,
		} );
	}, [
		hookFailedAudiences,
		hookIsAudienceCreationError,
		isSaving,
		setValue,
	] );

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

		setValue( VISITOR_GROUPS_SETUP_FAILURE_KEY, undefined );
	}, [ clearActionError, setValue, slug ] );

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

	const hasFailedAudiences = failedAudiences.length > 0;

	if ( ( setupError || hasFailedAudiences ) && ! isSaving ) {
		// A failure kept in the error store outlives the hook's own state, so it
		// is the one reported once this component has been remounted.
		const errors =
			apiErrors.length || ! setupError ? apiErrors : [ setupError ];

		return (
			<AudienceSegmentationSetupErrorWidget
				Widget={ ( { children } ) => children }
				errors={ errors }
				isAudienceCreationVariant={ isAudienceCreationError }
				onRetry={ handleRetry }
				onDismiss={ handleDismiss }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			/>
		);
	}

	return (
		<FeatureCard
			slug={ slug }
			{ ...cardProps }
			ctaButton={
				<FeatureCTAButton
					isBusy={ isSaving }
					onClick={ handleClick }
					isTertiary
				>
					{ feature?.setup?.ctaLabel }
				</FeatureCTAButton>
			}
		/>
	);
};

export default VisitorGroupsFeatureSetup;
