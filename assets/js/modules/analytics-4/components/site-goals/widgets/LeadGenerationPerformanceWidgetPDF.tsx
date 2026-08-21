/**
 * LeadGenerationPerformanceWidget PDF component for `@react-pdf/renderer`.
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
 * Internal dependencies
 */
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { SITE_GOALS_LEAD_GENERATION_WIDGET_TITLE } from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	LEAD_RATE_LABEL,
	LEAD_TOTAL_LABEL,
	getLeadEventsSubtitle,
} from '@/js/modules/analytics-4/components/site-goals/utils/keyActionText';
import { LeadGenerationPerformancePDFData } from './getLeadGenerationPerformancePDFData';
import SiteGoalsSectionPDF from './pdf/SiteGoalsSectionPDF';

const LeadGenerationPerformanceWidgetPDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const sectionData = data as
		| LeadGenerationPerformancePDFData[ 'data' ]
		| undefined;

	if ( ! sectionData ) {
		return null;
	}

	const { groups, dateRangeLength, leadEvents } = sectionData;

	return (
		<SiteGoalsSectionPDF
			heading={ SITE_GOALS_LEAD_GENERATION_WIDGET_TITLE }
			groups={ groups }
			rateLabel={ LEAD_RATE_LABEL }
			totalLabel={ LEAD_TOTAL_LABEL }
			totalSubtitle={ getLeadEventsSubtitle( leadEvents ) }
			dateRangeLength={ dateRangeLength }
		/>
	);
};

export default LeadGenerationPerformanceWidgetPDF;
