/**
 * Analytics useAllTrafficWidgetReport custom hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS_4 } from '../datastore/constants';
import useViewOnly from '../../../hooks/useViewOnly';

/**
 * Gets report information for the Dashboard All Traffic GA4 widget.
 *
 * @since n.e.x.t
 *
 * @param {Object} reportOptions Report options.
 * @return {Object} Report data.
 */
export default function useAllTrafficWidgetReport( reportOptions = {} ) {
	const viewOnly = useViewOnly();

	const canViewSharedAnalytics4 = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics-4' );
	} );

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const entityURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const args = {
		startDate,
		endDate,
		metrics: [ { name: 'totalUsers' } ],
		...reportOptions,
	};

	if ( entityURL ) {
		args.url = entityURL;
	}

	const loaded = useSelect(
		( select ) =>
			canViewSharedAnalytics4 &&
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				args,
			] )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			args,
		] )
	);

	const report = useInViewSelect(
		( select ) => {
			return (
				canViewSharedAnalytics4 &&
				select( MODULES_ANALYTICS_4 ).getReport( args )
			);
		},
		[ canViewSharedAnalytics4, args ]
	);

	return {
		error,
		loaded,
		report,
	};
}
