<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the AdSense Ad Blocking Recovery tag guard.
 *
 * @since 1.105.0
 * @access private
 * @ignore
 */
class Ad_Blocking_Recovery_Tag_Guard extends Module_Tag_Guard {

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.105.0
	 *
	 * @return bool TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		$settings = $this->settings->get();

		return ! empty( $settings['adBlockingRecoverySetupStatus'] ) && $settings['useAdBlockingRecoverySnippet'];
	}
}
