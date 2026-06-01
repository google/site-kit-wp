/**
 * Material UI > Layout > Grid component.
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
 * External dependencies
 */
import classnames from 'classnames';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export interface GridProps {
	alignLeft?: boolean;
	fill?: boolean;
	className?: string;
	collapsed?: boolean;
}

const Grid: FC< GridProps > = forwardRef< HTMLDivElement, GridProps >(
	(
		{
			alignLeft = false,
			fill = false,
			className = '',
			children,
			collapsed = false,
			...otherProps
		},
		ref
	) => {
		return (
			<div
				className={ classnames( 'mdc-layout-grid', className, {
					'mdc-layout-grid--align-left': alignLeft,
					'mdc-layout-grid--collapsed': collapsed,
					'mdc-layout-grid--fill': fill,
				} ) }
				{ ...otherProps }
				ref={ ref }
			>
				{ children }
			</div>
		);
	}
);

export default Grid;
