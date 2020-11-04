/**
 * Page Header Stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import AnalyticsIcon from '../assets/svg/analytics.svg';
import PageHeader from '../assets/js/components/page-header';

storiesOf( 'Global', module )
	.add( 'Page Headers', () => {
		removeAllFilters( 'googlesitekit.showDateRangeSelector-analytics' );
		return <div>
			<p>
				<PageHeader
					title="Module Page Title"
					status="connected"
					statusText="Analytics is connected"
				/>
			</p>
			<p>
				<PageHeader
					title="Module Page Title with Icon"
					icon={
						<AnalyticsIcon
							className="googlesitekit-page-header__icon"
							width={ 23 }
							height={ 26 }
						/>
					}
					status="not-connected"
					statusText="Analytics is not connected"
				/>
			</p>
		</div>;
	} );
