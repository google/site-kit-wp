/**
 * Footer component for SearchFunnelWidget.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	MODULES_SEARCH_CONSOLE,
	DATE_RANGE_OFFSET,
} from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { generateDateRangeArgs } from '../../../util';
import { getURLPath, untrailingslashit } from '../../../../../util';
import { DATE_RANGE_OFFSET as DATE_RANGE_OFFSET_ANALYTICS } from '../../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import SourceLink from '../../../../../components/SourceLink';
import Data from 'googlesitekit-data';
import useViewOnly from '../../../../../hooks/useViewOnly';
const { useSelect } = Data;

function SourceLinkAnalytics4() {
	const viewOnlyDashboard = useViewOnly();

	const serviceURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}

		const { getServiceReportURL } = select( MODULES_ANALYTICS_4 );
		const url = select( CORE_SITE ).getCurrentEntityURL();
		const dates = select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET_ANALYTICS,
		} );

		const reportArgs = {
			dates,
			filters: {
				sessionSource: 'google',
			},
			otherArgs: {
				// eslint-disable-next-line sitekit/acronym-case
				collectionId: 'life-cycle',
			},
		};

		if ( isURL( url ) ) {
			reportArgs.filters.unifiedPagePathScreen = getURLPath( url );
		}

		return getServiceReportURL(
			'lifecycle-traffic-acquisition-v2',
			reportArgs
		);
	} );

	return (
		<SourceLink
			href={ serviceURL }
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			external
		/>
	);
}

function SourceLinkSearch( { metric } ) {
	const viewOnlyDashboard = useViewOnly();

	const serviceURL = useSelect(
		( select ) => {
			if ( viewOnlyDashboard ) {
				return null;
			}

			const { getServiceReportURL, getPropertyID, isDomainProperty } =
				select( MODULES_SEARCH_CONSOLE );
			const referenceSiteURL = untrailingslashit(
				select( CORE_SITE ).getReferenceSiteURL()
			);
			const url = select( CORE_SITE ).getCurrentEntityURL();
			const dateRangeDates = select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

			const serviceURLArgs = {
				resource_id: getPropertyID(),
				metrics: metric,
				...generateDateRangeArgs( dateRangeDates ),
			};
			if ( url ) {
				serviceURLArgs.page = `!${ url }`;
			} else if ( isDomainProperty() && referenceSiteURL ) {
				serviceURLArgs.page = `*${ referenceSiteURL }`;
			}

			return getServiceReportURL( serviceURLArgs );
		},
		[ metric ]
	);

	return (
		<SourceLink
			href={ serviceURL }
			name={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
			external
		/>
	);
}

const Footer = ( { metrics, selectedStats } ) => {
	if ( ! metrics?.[ selectedStats ] ) {
		return null;
	}
	const { service, metric } = metrics[ selectedStats ];

	if ( service === 'search-console' ) {
		return <SourceLinkSearch metric={ metric } />;
	}

	// If the service is not Search Console, it must be Analytics.
	return <SourceLinkAnalytics4 />;
};

Footer.propTypes = {
	metrics: PropTypes.arrayOf( PropTypes.object ).isRequired,
	selectedStats: PropTypes.number.isRequired,
};

export default Footer;
