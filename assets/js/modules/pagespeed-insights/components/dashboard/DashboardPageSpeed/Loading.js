/**
 * Dashboard PageSpeed Loading component.
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
 * Internal dependencies
 */
import PreviewBlocks from '../../../../../components/PreviewBlocks';
import PreviewBlock from '../../../../../components/PreviewBlock';

export default function Loading() {
	return (
		<div className="googlesitekit-pagespeed-widget__content">
			<header className="googlesitekit-pagespeed-widget__header">
				<div className="googlesitekit-pagespeed-widget__data-src-tabs">
					<PreviewBlocks
						count={ 3 }
						smallWidth="70px"
						smallHeight="48px"
						width="120px"
						height="48px"
					/>
				</div>
				<div className="googlesitekit-pagespeed-widget__device-size-tab-bar-wrapper">
					<PreviewBlocks count={ 2 } width="56px" height="32px" />
				</div>
			</header>

			<section className="googlesitekit-pagespeed-widget__values">
				<PreviewBlocks
					count={ 5 }
					smallWidth="100%"
					smallHeight="90px"
					width="100%"
					height="78px"
				/>
			</section>

			<div className="googlesitekit-pagespeed-report__row">
				<PreviewBlock width="130px" height="40px" />
			</div>

			<div className="googlesitekit-pagespeed-report__footer">
				<PreviewBlock width="224px" height="40px" />
			</div>
		</div>
	);
}
