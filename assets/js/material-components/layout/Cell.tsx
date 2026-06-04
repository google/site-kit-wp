/**
 * Material UI > Layout > Cell component.
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

export interface CellProps {
	smSize?: number;
	smStart?: number;
	smOrder?: number;
	mdSize?: number;
	mdStart?: number;
	mdOrder?: number;
	lgSize?: number;
	lgStart?: number;
	lgOrder?: number;
	size?: number;
	alignTop?: boolean;
	alignMiddle?: boolean;
	alignBottom?: boolean;
	alignRight?: boolean;
	alignLeft?: boolean;
	smAlignRight?: boolean;
	mdAlignRight?: boolean;
	lgAlignRight?: boolean;
	className?: string;
}

const Cell: FC< CellProps > = ( {
	className = '',
	alignTop = false,
	alignMiddle = false,
	alignBottom = false,
	alignRight = false,
	alignLeft = false,
	smAlignRight = false,
	mdAlignRight = false,
	lgAlignRight = false,
	smSize = 0,
	smStart = 0,
	smOrder = 0,
	mdSize = 0,
	mdStart = 0,
	mdOrder = 0,
	lgSize = 0,
	lgStart = 0,
	lgOrder = 0,
	size = 0,
	children,
	...otherProps
} ) => {
	return (
		<div
			{ ...otherProps }
			className={ classnames( className, 'mdc-layout-grid__cell', {
				'mdc-layout-grid__cell--align-top': alignTop,
				'mdc-layout-grid__cell--align-middle': alignMiddle,
				'mdc-layout-grid__cell--align-bottom': alignBottom,
				'mdc-layout-grid__cell--align-right': alignRight,
				'mdc-layout-grid__cell--align-left': alignLeft,
				'mdc-layout-grid__cell--align-right-phone': smAlignRight,
				'mdc-layout-grid__cell--align-right-tablet': mdAlignRight,
				'mdc-layout-grid__cell--align-right-desktop': lgAlignRight,
				[ `mdc-layout-grid__cell--span-${ size }` ]:
					12 >= size && size > 0,
				[ `mdc-layout-grid__cell--span-${ lgSize }-desktop` ]:
					12 >= lgSize && lgSize > 0,
				[ `mdc-layout-grid__cell--start-${ lgStart }-desktop` ]:
					12 >= lgStart && lgStart > 0,
				[ `mdc-layout-grid__cell--order-${ lgOrder }-desktop` ]:
					12 >= lgOrder && lgOrder > 0,
				[ `mdc-layout-grid__cell--span-${ mdSize }-tablet` ]:
					8 >= mdSize && mdSize > 0,
				[ `mdc-layout-grid__cell--start-${ mdStart }-tablet` ]:
					8 >= mdStart && mdStart > 0,
				[ `mdc-layout-grid__cell--order-${ mdOrder }-tablet` ]:
					8 >= mdOrder && mdOrder > 0,
				[ `mdc-layout-grid__cell--span-${ smSize }-phone` ]:
					4 >= smSize && smSize > 0,
				[ `mdc-layout-grid__cell--start-${ smStart }-phone` ]:
					4 >= smStart && smStart > 0,
				[ `mdc-layout-grid__cell--order-${ smOrder }-phone` ]:
					4 >= smOrder && smOrder > 0,
			} ) }
		>
			{ children }
		</div>
	);
};

export default Cell;
