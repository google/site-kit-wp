/**
 * Reader Revenue Manager express setup completion detail row.
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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';

interface StepSetupCompleteDetailProps {
	title: string;
}

const StepSetupCompleteDetail: FC< StepSetupCompleteDetailProps > = ( {
	title,
	children,
} ) => {
	return (
		<div className="googlesitekit-rrm-express-setup-complete__detail">
			<Typography
				as="h3"
				type="label"
				size="medium"
				className="googlesitekit-rrm-express-setup-complete__detail-title"
			>
				{ title }
			</Typography>
			<Typography
				as="p"
				type="body"
				size="medium"
				className="googlesitekit-rrm-express-setup-complete__detail-description"
			>
				{ children }
			</Typography>
		</div>
	);
};

export default StepSetupCompleteDetail;
