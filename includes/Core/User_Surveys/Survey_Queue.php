<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\Survey_Queue
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Storage\User_Setting;
use Google\Site_Kit\Core\Storage\Setting\List_Setting;

/**
 * Class for handling surveys queue.
 *
 * @since 1.98.0
 * @access private
 * @ignore
 */
class Survey_Queue extends User_Setting {

	use List_Setting;

	const OPTION = 'googlesitekit_survey_queue';

	/**
	 * Adds a new survey to the queue.
	 *
	 * @since 1.98.0
	 *
	 * @param array $survey {
	 *     The survey object to add to the queue.
	 *
	 *     @type string $survey_id      Survey ID.
	 *     @type array  $survey_payload Survey payload that describe survey questions and available completions.
	 *     @type array  $session        Session object that contains session ID and session token.
	 * }
	 * @return bool TRUE if the survey has been added to the queue, otherwise FALSE.
	 */
	public function enqueue( $survey ) {
		$surveys = $this->get();

		// Do not add the survey if it is already in the queue.
		foreach ( $surveys as $item ) {
			if ( $item['survey_id'] === $survey['survey_id'] ) {
				return false;
			}
		}

		$surveys[] = $survey;
		$this->set( $surveys );

		return true;
	}

	/**
	 * Dequeues a survey that has the provided survey ID.
	 *
	 * @since 1.98.0
	 *
	 * @param string $survey_id The survey ID to dequeue.
	 * @return array|null A survey object if it has been found, otherwise NULL.
	 */
	public function dequeue( $survey_id ) {
		$survey = null;

		// Search for the requested survey_id.
		$old_surveys = $this->get();
		$new_surveys = array();
		foreach ( $old_surveys as $item ) {
			if ( $item['survey_id'] === $survey_id ) {
				$survey = $item;
			} else {
				$new_surveys[] = $item;
			}
		}

		// Update existing surveys list if we have found the survey we need to dequeue.
		if ( ! is_null( $survey ) ) {
			$this->set( $new_surveys );
		}

		return $survey;
	}

	/**
	 * Gets the first survey in the queue without removing it from the queue.
	 *
	 * @since 1.98.0
	 *
	 * @return array|null A survey object if at least one survey exists in the queue, otherwise NULL.
	 */
	public function front() {
		$surveys = $this->get();
		return reset( $surveys ) ?: null;
	}

	/**
	 * Gets the survey for the provided session.
	 *
	 * @since 1.98.0
	 *
	 * @param array $session {
	 *     The current session object.
	 *
	 *     @type string $session_id    Session ID.
	 *     @type string $session_token Session token.
	 * }
	 * @return array|null A survey object if it has been found for the session, otherwise NULL.
	 */
	public function find_by_session( $session ) {
		$surveys = $this->get();

		foreach ( $surveys as $survey ) {
			if (
				! empty( $survey['session']['session_id'] ) &&
				! empty( $session['session_id'] ) &&
				$survey['session']['session_id'] === $session['session_id']
			) {
				return $survey;
			}
		}

		return null;
	}

	/**
	 * Sanitizes array items.
	 *
	 * @since 1.98.0
	 *
	 * @param array $items The original array items.
	 * @return array Filtered items.
	 */
	protected function sanitize_list_items( $items ) {
		return $items;
	}
}
