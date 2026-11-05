/**
 * RecentActivityErrorNotice Component Stories.
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
 * Internal dependencies
 */
import {
	INTERNAL_SERVER_ERROR,
	RATE_LIMIT_ERROR,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import RecentActivityErrorNotice, {
	RecentActivityErrorNoticeProps,
} from './RecentActivityErrorNotice';

function Template( args: RecentActivityErrorNoticeProps ) {
	return (
		<WithRegistrySetup func={ provideSiteInfo }>
			<RecentActivityErrorNotice { ...args } />
		</WithRegistrySetup>
	);
}

/**
 * A section's report failed with an internal server error, so the notice
 * shows "Retry".
 */
export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.args = {
	error: INTERNAL_SERVER_ERROR,
	onRetry: () => {},
};
Default.scenario = {
	viewport: 'large',
};

/**
 * A section's report failed with a rate limit error, which comes back until
 * the quota recovers, so the notice shows no "Retry".
 */
export const RateLimitError = Template.bind( {} ) as Story;
RateLimitError.storyName = 'Rate Limit Error';
RateLimitError.args = {
	error: RATE_LIMIT_ERROR,
	onRetry: () => {},
};
RateLimitError.scenario = {
	viewport: 'large',
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/RecentActivityErrorNotice',
	component: RecentActivityErrorNotice,
};
