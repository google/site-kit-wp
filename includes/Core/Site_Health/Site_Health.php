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
 * @since 1.119.0
 * @access private
 * @ignore
 */
class Site_Health {

	/**
	 * Debug_Data instance.
	 *
	 * @since 1.119.0
	 * @var Debug_Data
	 */
	private $debug_data;

	/**
	 * Tag_Placement instance.
	 *
	 * @since 1.119.0
	 * @var Tag_Placement
	 */
	private $tag_placement;

	/**
	 * REST_Site_Health_Controller instance.
	 *
	 * @since 1.119.0
	 * @var REST_Site_Health_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.119.0
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
		$this->debug_data      = new Debug_Data( $context, $options, $user_options, $authentication, $modules, $permissions );
		$this->tag_placement   = new Tag_Placement( $modules );
		$this->rest_controller = new REST_Site_Health_Controller( $this->tag_placement );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.119.0
	 */
	public function register() {
		$this->debug_data->register();
		$this->tag_placement->register();
		$this->rest_controller->register();
	}

}
