/**
 * PageFooter component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import HelpLink from './HelpLink';
import { useFeature } from '../hooks/useFeature';

export default function PageFooter() {
	// The `helpVisibility` feature shows help info in the header of Site Kit.
	// If it isn't enabled, show help links in the footer instead.
	const helpVisibilityEnabled = useFeature( 'helpVisibility' );

	return (
		<div className="googlesitekit-page-footer">
			{ ! helpVisibilityEnabled && <HelpLink /> }
		</div>
	);
}
