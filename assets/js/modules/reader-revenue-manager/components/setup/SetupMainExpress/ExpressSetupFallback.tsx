/**
 * Reader Revenue Manager express setup `ExpressSetupFallback` component.
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
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { Select, useSelect } from 'googlesitekit-data';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import ExpressSetupLayout from './ExpressSetupLayout';

interface ExpressSetupFallbackProps {
	showErrors: boolean;
	errorTitle: string;
}

const ExpressSetupFallback: FC< ExpressSetupFallbackProps > = ( {
	showErrors,
	errorTitle,
} ) => {
	const hasErrors = useSelect(
		( select: Select ): boolean =>
			select( MODULES_READER_REVENUE_MANAGER ).hasErrors(),
		[]
	);

	return (
		<ExpressSetupLayout>
			{ showErrors && hasErrors ? (
				<div className="googlesitekit-rrm-express-setup__error">
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ errorTitle }
					</ExpressSetupStepHeadline>
					<StoreErrorNotices
						moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
						storeName={ MODULES_READER_REVENUE_MANAGER }
						hasButton
					/>
				</div>
			) : (
				<ProgressBar />
			) }
		</ExpressSetupLayout>
	);
};

export default ExpressSetupFallback;
