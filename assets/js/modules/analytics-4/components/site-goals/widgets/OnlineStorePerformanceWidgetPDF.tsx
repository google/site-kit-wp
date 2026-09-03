/**
 * OnlineStorePerformanceWidget PDF component for `@react-pdf/renderer`.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import {
	ECOMMERCE_RATE_LABELS,
	ECOMMERCE_TOTAL_LABELS,
} from '@/js/modules/analytics-4/components/site-goals/utils/keyActionText';
import { OnlineStorePerformancePDFData } from './getOnlineStorePerformancePDFData';
import SiteGoalsSectionPDF from './pdf/SiteGoalsSectionPDF';

const OnlineStorePerformanceWidgetPDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const sectionData = data as
		| OnlineStorePerformancePDFData[ 'data' ]
		| undefined;

	if ( ! sectionData ) {
		return null;
	}

	const { groups, dateRangeLength, primaryEvent } = sectionData;

	return (
		<SiteGoalsSectionPDF
			heading={ __( 'Online store performance', 'google-site-kit' ) }
			groups={ groups }
			rateLabel={ ECOMMERCE_RATE_LABELS[ primaryEvent ] }
			totalLabel={ ECOMMERCE_TOTAL_LABELS[ primaryEvent ] }
			totalSubtitle={ sprintf(
				/* translators: %s: GA4 event name, e.g. "purchase". */
				__( '“%s” events', 'google-site-kit' ),
				primaryEvent
			) }
			dateRangeLength={ dateRangeLength }
		/>
	);
};

export default OnlineStorePerformanceWidgetPDF;
