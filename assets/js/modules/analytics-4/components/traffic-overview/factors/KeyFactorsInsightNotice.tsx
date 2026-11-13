/**
 * Key factors insight notice.
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
import PreviewBlock from '@/js/components/PreviewBlock';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { AIIcon, AIText } from '@/js/modules/analytics-4/components/ai-insight';

export interface KeyFactorsInsightNoticeProps {
	/** The generated summary of the key factors, where `**` pairs mark the names it highlights. */
	text?: string | null;
	/** Whether the summary is still on its way, which shows the notice's placeholder. */
	loading?: boolean;
}

const KeyFactorsInsightNotice: FC< KeyFactorsInsightNoticeProps > = ( {
	text,
	loading = false,
} ) => {
	// The insight arrives seconds after the rest of the panel, so the notice is
	// a polite live region from its placeholder on, and a screen reader reads
	// the insight out once it replaces the placeholder.
	if ( loading ) {
		return (
			<div
				className="googlesitekit-traffic-overview__insight-notice googlesitekit-traffic-overview__key-factors-insight"
				aria-live="polite"
			>
				<PreviewBlock width="100%" height="72px" />
			</div>
		);
	}

	if ( ! text ) {
		return null;
	}

	return (
		// The notice shares its look, and so its classes, with the Recent
		// activity tab's insight notice.
		<div
			className="googlesitekit-traffic-overview__insight-notice googlesitekit-traffic-overview__key-factors-insight"
			aria-live="polite"
		>
			<div className="googlesitekit-traffic-overview__insight-notice-content">
				<div className="googlesitekit-traffic-overview__insight-notice-message">
					<span className="googlesitekit-traffic-overview__insight-notice-icon">
						<AIIcon />
					</span>
					<P
						className="googlesitekit-traffic-overview__insight-notice-text"
						size={ SIZE_MEDIUM }
					>
						<AIText text={ text } />
					</P>
				</div>
			</div>
		</div>
	);
};

export default KeyFactorsInsightNotice;
