/**
 * FeatureCTAButton component.
 *
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
import { FC, MouseEvent } from 'react';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';

export interface FeatureCTAButtonProps {
	isBusy?: boolean;
	isTertiary?: boolean;
	onClick?: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
}

const FeatureCTAButton: FC< FeatureCTAButtonProps > = ( {
	isBusy = false,
	isTertiary = false,
	onClick,
	children,
} ) => (
	// @ts-expect-error `SpinnerButton` component is not yet typed.
	<SpinnerButton
		disabled={ isBusy }
		isSaving={ isBusy }
		onClick={ onClick }
		tertiary={ isTertiary }
	>
		{ children }
	</SpinnerButton>
);

export default FeatureCTAButton;
