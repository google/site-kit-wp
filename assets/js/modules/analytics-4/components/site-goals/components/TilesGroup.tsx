/**
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
import type { FC, ReactNode } from 'react';
import classnames from 'classnames';

export interface TilesGroupProps {
	title: string;
	className?: string;
	children: ReactNode | ReactNode[]; // This will be an array of TileProps components
}

export const TilesGroup: FC< TilesGroupProps > = ( props ) => {
	const { title, className, children } = props;
	return (
		<div
			className={ classnames(
				'googlesitekit-site-goals-tiles-group',
				className
			) }
		>
			<p className="googlesitekit-site-goals-tiles-group__title">
				{ title }
			</p>
			<div className="googlesitekit-site-goals-tiles-group__tiles">
				{ children }
			</div>
		</div>
	);
};
