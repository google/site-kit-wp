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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { TypographySize, TypographyType } from './constants';

const DEFAULT_TAG_NAME = 'span';

interface TypographyOwnProps {
	className?: string;
	size: TypographySize;
	type: TypographyType;
}

type PropsOf< E extends React.ElementType > =
	React.ComponentPropsWithoutRef< E >;

type UnderlyingProp<
	E extends React.ElementType,
	K extends PropertyKey
> = K extends keyof PropsOf< E > ? PropsOf< E >[ K ] : never;

export type TypographyProps< E extends React.ElementType > = {
	as?: E;
	asType?: UnderlyingProp< E, 'type' >;
	asSize?: UnderlyingProp< E, 'size' >;
} & TypographyOwnProps &
	Omit< PropsOf< E >, keyof TypographyOwnProps | 'as' | 'asType' | 'asSize' >;

function Typography< E extends React.ElementType = typeof DEFAULT_TAG_NAME >( {
	as,
	asType,
	asSize,
	className,
	size,
	type,
	...props
}: TypographyProps< E > ) {
	const Component = as || DEFAULT_TAG_NAME;

	return (
		<Component
			className={ classnames(
				'googlesitekit-typography',
				className,
				type && `googlesitekit-typography--${ type }`,
				size && `googlesitekit-typography--${ size }`
			) }
			size={ asSize }
			type={ asType }
			{ ...props }
		/>
	);
}

export default Typography;
