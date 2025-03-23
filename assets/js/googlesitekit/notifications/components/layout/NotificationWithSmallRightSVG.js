/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useWindowWidth } from '../../../../hooks/useWindowSize';
import { Cell, Grid, Row } from '../../../../material-components';
import Title from '../common/Title';

export default function NotificationWithSmallRightSVG( {
	actions,
	description,
	title,
	SVG,
} ) {
	// This notification layout (NotificationWithSmallRightSVG) is being used solely by
	// the EnhancedMeasurementActivationBanner component. This notification does not
	// render the SVG on mobile viewports and so requires the use of windowWidth.
	// This notification is being redesigned as part of Banner Notifications Refactoring
	// Phase 3 epic and this logic here will be removed.
	const windowWidth = useWindowWidth();
	// There is a 1px difference between the tablet breakpoint determination in `useBreakpoint`
	// and the `min-width: $bp-tablet` breakpoint the `@mixin googlesitekit-inner-padding` uses,
	// which in turn is used by these notifications. This is why we are using `useWindowWidth` here,
	// instead of the breakpoint returned by `useBreakpoint`.
	const isMinWidthTablet = windowWidth >= 600;

	return (
		<Grid>
			<Row>
				<Cell
					smSize={ 4 }
					mdSize={ 6 }
					lgSize={ 8 }
					className="googlesitekit-publisher-win__content"
				>
					<Title title={ title }></Title>
					{ description }
					{ actions }
				</Cell>
				{ isMinWidthTablet && (
					<Cell
						smSize={ 4 }
						mdSize={ 2 }
						lgSize={ 4 }
						className="googlesitekit-publisher-win__image"
					>
						<div className="googlesitekit-publisher-win__image-small">
							<SVG
								style={ {
									maxWidth: 105,
									maxHeight: 105,
								} }
							/>
						</div>
					</Cell>
				) }
			</Row>
		</Grid>
	);
}
