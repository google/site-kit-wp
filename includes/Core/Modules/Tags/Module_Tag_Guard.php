<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tags;

use Google\Site_Kit\Core\Guards\Guard_Interface;
use Google\Site_Kit\Core\Modules\Module_Settings;
use WP_Error;

/**
 * Base class for a module tag guard.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Module_Tag_Guard implements Guard_Interface {

	/**
	 * Module settings.
	 *
	 * @since n.e.x.t
	 * @var Module_Settings
	 */
	protected $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Module_Settings $settings Module settings.
	 */
	public function __construct( Module_Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	abstract public function can_activate();

}
