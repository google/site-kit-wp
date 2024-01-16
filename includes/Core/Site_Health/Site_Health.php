<?php
/**
 * Class Google\Site_Kit\Core\Site_Health\Site_Health
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Site_Health;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Class for integrating information with Site Health.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Health {

	/**
	 * General_Data instance.
	 *
	 * @since n.e.x.t
	 * @var General_data
	 */
	private $general_data;

	/**
	 * Tags_Placement instance.
	 *
	 * @since n.e.x.t
	 * @var Tags_Placement
	 */
	private $tags_placement;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context        $context        Context instance.
	 * @param Options        $options        Options instance.
	 * @param User_Options   $user_options   User_Options instance.
	 * @param Authentication $authentication Authentication instance.
	 * @param Modules        $modules        Modules instance.
	 * @param Permissions    $permissions    Permissions instance.
	 */
	public function __construct(
		Context $context,
		Options $options,
		User_Options $user_options,
		Authentication $authentication,
		Modules $modules,
		Permissions $permissions
	) {
		$context        = $context;
		$options        = $options;
		$user_options   = $user_options;
		$authentication = $authentication;
		$modules        = $modules;
		$permissions    = $permissions;

		$this->general_data   = new General_Data( $context, $options, $user_options, $authentication, $modules, $permissions );
		$this->tags_placement = new Tags_Placement( $modules );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->general_data->register();
		$this->tags_placement->register();
	}

}
