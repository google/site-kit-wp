/**
 * FeatureDiscoverySetupFailureNotification component.
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import FeatureSetupErrorNotice from '@/js/components/feature-discovery/FeatureSetupErrorNotice';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { ErrorObject } from '@/js/util/errors';

interface FeatureDiscoverySetupFailureNotificationProps {
	id: string;
	Notification: ElementType;
}

const FeatureDiscoverySetupFailureNotification: FC<
	FeatureDiscoverySetupFailureNotificationProps
> = ( { id, Notification } ) => {
	const [ isRetrying, setIsRetrying ] = useState( false );

	const slug = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).getPendingSetup()?.featureSlug,
		[]
	);

	const error = useSelect( ( select: Select ): ErrorObject | undefined => {
		const code = select( CORE_SITE ).getSetupErrorCode();

		if ( ! code ) {
			return undefined;
		}

		return {
			code,
			message: select( CORE_SITE ).getSetupErrorMessage(),
		};
	}, [] );

	const { receivePendingSetup, setupFeature } = useDispatch(
		CORE_FEATURE_DISCOVERY
	) as {
		receivePendingSetup: ( pendingSetup: null ) => void;
		setupFeature: ( featureSlug: string ) => Promise< unknown >;
	};
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const handleRetry = useCallback( async () => {
		if ( ! slug ) {
			return;
		}

		setIsRetrying( true );

		try {
			await setupFeature( slug );
		} finally {
			setIsRetrying( false );
		}
	}, [ setupFeature, slug ] );

	// Removing the notification from the queue lets the next notice in the
	// area take its place, and clearing the pending setup ends the
	// return-from-setup visit, so the notice is shown only once.
	const handleDismiss = useCallback( () => {
		dismissNotification( id );
		receivePendingSetup( null );
	}, [ dismissNotification, receivePendingSetup, id ] );

	if ( ! slug || ! error ) {
		return null;
	}

	return (
		<Notification>
			<FeatureSetupErrorNotice
				slug={ slug }
				error={ error }
				isRetrying={ isRetrying }
				onRetry={ handleRetry }
				onDismiss={ handleDismiss }
			/>
		</Notification>
	);
};

export default FeatureDiscoverySetupFailureNotification;
