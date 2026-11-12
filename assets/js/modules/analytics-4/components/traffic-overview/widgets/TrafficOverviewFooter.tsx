/**
 * Traffic Overview footer.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import DocumentationLink from '@/js/components/DocumentationLink';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { useFeature } from '@/js/hooks/useFeature';
import AIDisclosure from '@/js/modules/analytics-4/components/ai-insight/AIDisclosure';
import SourcesLinks from '@/js/modules/analytics-4/components/traffic-overview/components/SourcesLinks';
import { useBenchmarkingInsight } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingInsight';
import { useKeyFactorsVisibility } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useKeyFactorsVisibility';
import TrafficOverviewSourceLink from './TrafficOverviewSourceLink';

const TrafficOverviewFooter: FC = () => {
	const { isAvailable: hasKeyFactors, isShown: showKeyFactors } =
		useKeyFactorsVisibility();
	const trafficInsightsEnabled = useFeature( 'trafficInsights' );

	const { insight } = useBenchmarkingInsight( {
		isEnabled: showKeyFactors && trafficInsightsEnabled,
	} );

	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: true } ),
		[]
	);

	// Without the key factors, the tab shows Analytics reports only.
	if ( ! hasKeyFactors ) {
		return <TrafficOverviewSourceLink />;
	}

	// The key factors' search keywords come from Search Console, so the footer
	// names it too. The disclosure covers the generated insight, so it shows
	// only while the panel shows one.
	return (
		<div className="googlesitekit-traffic-overview__footer">
			{ !! insight && (
				<AIDisclosure>
					{ createInterpolateElement(
						__(
							'Some insights on this page are created using AI and may contain mistakes. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: <DocumentationLink slug="ai-insights" />,
						}
					) }
				</AIDisclosure>
			) }
			<SourcesLinks
				startDate={ startDate }
				endDate={ endDate }
				compareStartDate={ compareStartDate }
				compareEndDate={ compareEndDate }
			/>
		</div>
	);
};

export default TrafficOverviewFooter;
