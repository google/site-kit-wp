<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager\Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\Tag_Manager
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Tag_Manager;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the Tag Manager tag guard.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {

	/**
	 * Determines AMP mode.
	 *
	 * @since 1.24.0
	 * @var bool
	 */
	protected $is_amp;

	/**
	 * Constructor.
	 *
	 * @since 1.24.0
	 *
	 * @param Module_Settings $settings Module settings.
	 * @param bool            $is_amp   AMP mode.
	 */
	public function __construct( Module_Settings $settings, $is_amp ) {
		parent::__construct( $settings );
		$this->is_amp = $is_amp;
	}

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.24.0
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		$settings     = $this->settings->get();
		$container_id = $this->is_amp ? $settings['ampContainerID'] : $settings['containerID'];
		return ! empty( $settings['useSnippet'] ) && ! empty( $container_id );
	}

}
