/**
 * MetricTileError component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import CTA from '../notifications/CTA';
import InfoTooltip from './InfoTooltip';

export default function MetricTileError( props ) {
	const { children, headerText, infoTooltip, title } = props;

	return (
		<div className="googlesitekit-km-widget-tile--error">
			<CTA
				title={ title }
				headerText={ headerText }
				headerContent={
					infoTooltip && <InfoTooltip title={ infoTooltip } />
				}
				description=""
				error
			>
				{ children }
			</CTA>
		</div>
	);
}
