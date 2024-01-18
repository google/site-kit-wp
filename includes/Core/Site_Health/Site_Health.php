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
	 * Tag_Placement instance.
	 *
	 * @since n.e.x.t
	 * @var Tag_Placement
	 */
	private $tag_placement;

	/**
	 * REST_Tag_Placement_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Tag_Placement_Controller
	 */
	protected $rest_controller;

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

		$this->general_data    = new General_Data( $context, $options, $user_options, $authentication, $modules, $permissions );
		$this->tag_placement   = new Tag_Placement( $modules );
		$this->rest_controller = new REST_Tag_Placement_Controller( $this->tag_placement );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->general_data->register();
		$this->tag_placement->register();
		$this->rest_controller->register();
	}

}
