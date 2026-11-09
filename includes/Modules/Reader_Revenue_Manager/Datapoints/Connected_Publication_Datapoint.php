<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Connected_Publication_Datapoint
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Setting_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;

/**
 * Base class for the datapoints that act on the connected publication.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Connected_Publication_Datapoint extends Datapoint implements Executable_Datapoint {

	/**
	 * Reader Revenue Manager settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Settings
	 */
	protected $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->settings = $definition['settings'];
	}

	/**
	 * Gets the identifiers of the connected publication.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Connected organization ID and publication ID, keyed by setting name.
	 * @throws Missing_Required_Setting_Exception Thrown if either setting is empty.
	 */
	protected function get_connected_publication() {
		$settings = $this->settings->get();

		if ( empty( $settings['organizationID'] ) ) {
			throw new Missing_Required_Setting_Exception( 'organizationID' );
		}

		if ( empty( $settings['publicationID'] ) ) {
			throw new Missing_Required_Setting_Exception( 'publicationID' );
		}

		return array(
			'organizationID' => $settings['organizationID'],
			'publicationID'  => $settings['publicationID'],
		);
	}
}
