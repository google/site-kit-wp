/**
 * Analytics Account Creation Error Notices component.
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
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import { useFeature } from '@/js/hooks/useFeature';

export default function AnalyticsAccountCreationErrorNotices() {
	const viewContext = useViewContext();
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const hasTrackedRef = useRef( new Set() );

	const errors = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrors()
	);

	const showProgress = getQueryArg( location.href, 'showProgress' );
	const isInitialSetupFlow = !! showProgress && setupFlowRefreshEnabled;

	// Check if any error is related to account creation
	const accountCreationErrors = errors.filter( ( error ) => {
		if ( ! error?.code ) {
			return false;
		}
		// Check for account creation related error codes
		return error.code.includes( 'account' ) || 
			   error.code.includes( 'create' ) ||
			   error.message?.includes( 'account creation' ) ||
			   error.message?.includes( 'create account' );
	} );

	useEffect( () => {
		if ( accountCreationErrors.length === 0 ) {
			return;
		}

		accountCreationErrors.forEach( ( error ) => {
			const errorKey = `${ error.code }-${ isInitialSetupFlow ? 'initial' : 'module' }`;
			
			// Only track each error once
			if ( hasTrackedRef.current.has( errorKey ) ) {
				return;
			}

			hasTrackedRef.current.add( errorKey );

			const category = isInitialSetupFlow 
				? `${ viewContext }_setup` 
				: viewContext;

			trackEvent(
				category,
				'analytics_account_creation_error',
				error.code
			);
		} );
	}, [ accountCreationErrors, isInitialSetupFlow, viewContext ] );

	return (
		<StoreErrorNotices
			moduleSlug="analytics-4"
			storeName={ MODULES_ANALYTICS_4 }
		/>
	);
}
