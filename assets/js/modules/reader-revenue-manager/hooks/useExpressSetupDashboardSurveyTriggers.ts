/**
 * Reader Revenue Manager `useExpressSetupDashboardSurveyTriggers` hook.
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
import { useEffect } from 'react';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_SETUP_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { DAY_IN_SECONDS } from '@/js/util/dates';

// Maps each express setup CTA with a survey to the notification that invites
// the user to set it up.
const CTA_NOTIFICATION_IDS: Record< string, string > = {
	[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: RRM_SETUP_NOTIFICATION_ID,
};

/**
 * Triggers the express setup survey matching the user's progress.
 *
 * On the main dashboard, selects at most one survey trigger per CTA, in order:
 * published, incomplete, then not interacted. The trigger is sent at most once
 * a day.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export default function useExpressSetupDashboardSurveyTriggers(): void {
	const isExpressSetupEnabled = useFeature( 'rrmExpressSetup' );
	const viewContext = useViewContext();
	const isEnabled =
		isExpressSetupEnabled && viewContext === VIEW_CONTEXT_MAIN_DASHBOARD;

	const { triggerSurvey } = useDispatch( CORE_USER );

	const triggerIDs: ( string | undefined | null )[] = useSelect(
		( select: Select ) => {
			if ( ! isEnabled ) {
				return [];
			}

			const isRRMActive = select( CORE_MODULES ).isModuleActive(
				MODULE_SLUG_READER_REVENUE_MANAGER
			);

			if ( isRRMActive === undefined ) {
				return [ null ];
			}

			const userSettings = isRRMActive
				? select( MODULES_READER_REVENUE_MANAGER ).getUserSettings()
				: undefined;

			// While the user settings are loading, nothing can be selected.
			if ( isRRMActive && userSettings === undefined ) {
				return [ null ];
			}

			return Object.entries( CTA_NOTIFICATION_IDS ).map(
				( [ cta, notificationID ] ) => {
					if (
						Object.keys(
							userSettings?.completedExpressSetups || {}
						).some( ( key ) => key.startsWith( `${ cta }:` ) )
					) {
						return `view_rrm_${ cta }_published`;
					}

					if (
						userSettings?.lastActionedExpressSetups?.[
							`${ cta }:new`
						] !== undefined
					) {
						return `view_rrm_${ cta }_incomplete`;
					}

					const isDismissedPermanently =
						select( CORE_USER ).isPromptDismissedPermanently(
							notificationID
						);

					if ( isDismissedPermanently === undefined ) {
						return null;
					}

					return isDismissedPermanently
						? `view_rrm_${ cta }_not_interacted`
						: undefined;
				}
			);
		},
		[ isEnabled ]
	);

	const triggerKey = triggerIDs.join( ',' );

	useEffect( () => {
		triggerKey
			.split( ',' )
			.filter( Boolean )
			.forEach( ( triggerID ) => {
				triggerSurvey( triggerID, { ttl: DAY_IN_SECONDS } );
			} );
	}, [ triggerKey, triggerSurvey ] );
}
