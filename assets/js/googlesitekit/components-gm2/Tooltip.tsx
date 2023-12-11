/**
 * Tooltip component.
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
 * External dependencies
 */
import classnames from 'classnames';
import { Tooltip as MuiTooltip } from '@material-ui/core';

type TooltipProps = {
	children: React.ReactElement;
	popperClassName?: string;
	tooltipClassName?: string;
	[ key: string ]: any;
};

const Tooltip: React.FC< TooltipProps > = ( {
	children,
	popperClassName,
	tooltipClassName,
	...props
} ) => {
	return (
		<MuiTooltip
			classes={ {
				popper: classnames(
					'googlesitekit-tooltip-popper',
					popperClassName
				),
				tooltip: classnames(
					'googlesitekit-tooltip',
					tooltipClassName
				),
			} }
			arrow
			{ ...props }
		>
			{ children }
		</MuiTooltip>
	);
};

export default Tooltip;
