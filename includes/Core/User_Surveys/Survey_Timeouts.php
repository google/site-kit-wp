<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\Survey_Timeouts
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Storage\User_Setting;
use Google\Site_Kit\Core\Storage\Setting\List_Setting;

/**
 * Class for representing user survey timeouts.
 *
 * @since 1.73.0
 * @access private
 * @ignore
 */
class Survey_Timeouts extends User_Setting {

	use List_Setting;

	const OPTION     = 'googlesitekit_survey_timeouts';
	const GLOBAL_KEY = '__global';

	/**
	 * Adds a timeout for the provided survey.
	 *
	 * @since 1.73.0
	 *
	 * @param string $survey  Survey name.
	 * @param int    $timeout Tiemout for the survey.
	 */
	public function add( $survey, $timeout ) {
		$surveys            = $this->get();
		$surveys[ $survey ] = time() + $timeout;

		$this->set( $surveys );
	}

	/**
	 * Gets survey timeouts.
	 *
	 * @since 1.73.0
	 *
	 * @return array Survey timeouts array.
	 */
	public function get_survey_timeouts() {
		$surveys = $this->get();
		$surveys = $this->sanitize_list_items( $surveys );

		return array_keys( $surveys );
	}

	/**
	 * Sets the global timeout to twelve hours.
	 *
	 * @since 1.98.0
	 */
	public function set_global_timeout() {
		$this->add( self::GLOBAL_KEY, 12 * HOUR_IN_SECONDS );
	}

	/**
	 * Sanitizes survey timeouts.
	 *
	 * @since 1.73.0
	 *
	 * @param array $items Survey timeouts list.
	 * @return array Filtered survey timeouts.
	 */
	protected function sanitize_list_items( $items ) {
		$surveys = array();

		if ( is_array( $items ) ) {
			foreach ( $items as $item => $ttl ) {
				if ( $ttl > time() ) {
					$surveys[ $item ] = $ttl;
				}
			}
		}

		return $surveys;
	}

}
