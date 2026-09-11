<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Remove_Site_Goals_Widget
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Site_Settings;
use WP_Error;

/**
 * Class for the Site Goals widget removal datapoint.
 *
 * The daily cron adds a removed widget back when its plugin is active again
 * and Site Kit finds its events.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Remove_Site_Goals_Widget extends Site_Goals_Settings_Datapoint {

	/**
	 * Site_Goals_Site_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Site_Goals_Site_Settings
	 */
	private $site_goals_site_settings;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->site_goals_site_settings = $definition['site_goals_site_settings'];
		$this->context                  = $definition['context'];
	}

	/**
	 * Builds the callback that takes one Site Goals widget off the dashboard.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Closure that removes the widget, or an error while an event provider plugin is active.
	 * @throws Missing_Required_Param_Exception Thrown when the request has no `widget` parameter.
	 * @throws Invalid_Param_Exception Thrown when `widget` is neither `ecommerce` nor `lead`.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request['widget'] ) ) {
			throw new Missing_Required_Param_Exception( 'widget' );
		}

		$widget = $data_request['widget'];

		if ( ! in_array( $widget, Site_Goals_Site_Settings::ALLOWED_WIDGETS, true ) ) {
			throw new Invalid_Param_Exception( 'widget' );
		}

		$active_categories = ( new Conversion_Tracking( $this->context ) )->get_active_provider_categories();

		if ( in_array( $widget, $active_categories, true ) ) {
			return new WP_Error(
				'site_goals_widget_provider_active',
				__( 'This Site Goals widget can’t be removed while a plugin that tracks its events is active.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		return function () use ( $widget ) {
			return $this->site_goals_site_settings->remove_widget( $widget );
		};
	}
}
