import { Fragment } from '@wordpress/element';

import AuthError from './AuthError';
import UnsatisfiedScopesAlert from './UnsatisfiedScopesAlert';

export default function ErrorNotifications() {
	return (
		<Fragment>
			<AuthError />
			<UnsatisfiedScopesAlert />
		</Fragment>
	);
}
