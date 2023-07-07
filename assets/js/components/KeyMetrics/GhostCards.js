/**
 * GhostCards component.
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
import {
	BREAKPOINT_TABLET,
	BREAKPOINT_XLARGE,
	useBreakpoint,
} from '../../hooks/useBreakpoint';
import GhostCardGreenSVG from './GhostCardGreenSVG';
import GhostCardRedSVG from './GhostCardRedSVG';

export default function GhostCards() {
	const breakpoint = useBreakpoint();

	if ( breakpoint === BREAKPOINT_XLARGE ) {
		return (
			<div className="googlesitekit-ghost-cards googlesitekit-ghost-cards--three-horizontal">
				<GhostCardGreenSVG />
				<GhostCardGreenSVG />
				<GhostCardRedSVG />
			</div>
		);
	} else if ( breakpoint === BREAKPOINT_TABLET ) {
		return (
			<div className="googlesitekit-ghost-cards googlesitekit-ghost-cards--two-vertical">
				<GhostCardGreenSVG />
				<GhostCardRedSVG />
			</div>
		);
	}

	return (
		<div className="googlesitekit-ghost-cards googlesitekit-ghost-cards--two-horizontal">
			<GhostCardGreenSVG />
			<GhostCardRedSVG />
		</div>
	);
}
