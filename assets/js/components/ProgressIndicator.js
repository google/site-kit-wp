/**
 * ProgressIndicator component.
 *
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

export default function ProgressIndicator( {
	currentSegment = 0,
	totalSegments = 0,
	className,
} ) {
	return (
		<div
			style={ {
				// The first segment is the initial stub segment with a fixed width of 46px.
				gridTemplateColumns: `46px repeat(${
					totalSegments || 1
				}, 1fr)`,
			} }
			className={ classnames(
				'googlesitekit-progress-indicator',
				className
			) }
		>
			{ /* Initial stub segment. */ }
			<div
				className={ classnames(
					'googlesitekit-progress-indicator__segment'
				) }
			></div>
			{ /* Active segments. */ }
			{ totalSegments > 0 &&
				Array.from( Array( currentSegment + 1 ).keys() ).map(
					( segmentIndex ) => (
						<div
							key={ segmentIndex }
							className={ classnames(
								'googlesitekit-progress-indicator__segment',
								{
									// 'googlesitekit-progress-indicator__segment--in-progress':
									// 	currentSegment + 1 !== totalSegments,
									'googlesitekit-progress-indicator__segment--final':
										currentSegment + 1 === totalSegments,
								}
							) }
						></div>
					)
				) }
		</div>
	);
}

ProgressIndicator.propTypes = {
	currentSegment: PropTypes.number, // Index of the current segment.
	totalSegments: PropTypes.number,
	className: PropTypes.string,
};
