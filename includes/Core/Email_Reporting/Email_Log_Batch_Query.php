<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use WP_Query;

/**
 * Helper for querying and updating email log batches.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Email_Log_Batch_Query {

	const MAX_ATTEMPTS = 3;

	/**
	 * Retrieves IDs for pending logs within a batch.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id     Batch identifier.
	 * @param int    $max_attempts Maximum delivery attempts allowed.
	 * @return array Pending post IDs that still require processing.
	 */
	public function get_pending_ids( $batch_id, $max_attempts = self::MAX_ATTEMPTS ) {
		$batch_id     = (string) $batch_id;
		$max_attempts = (int) $max_attempts;

		$query = $this->get_batch_query( $batch_id );

		$pending_ids = array();

		foreach ( $query->posts as $post_id ) {
			$status = get_post_status( $post_id );

			if ( Email_Log::STATUS_SENT === $status ) {
				continue;
			}

			if ( Email_Log::STATUS_FAILED === $status ) {
				$attempts = (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true );

				if ( $attempts >= $max_attempts ) {
					continue;
				}
			}

			$pending_ids[] = (int) $post_id;
		}

		return $pending_ids;
	}

	/**
	 * Builds a batch query object limited to a specific batch ID.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id Batch identifier.
	 * @return WP_Query Query returning IDs only.
	 */
	private function get_batch_query( $batch_id ) {
		return new WP_Query(
			array(
				'post_type'              => Email_Log::POST_TYPE,
				'post_status'            => array(
					Email_Log::STATUS_SCHEDULED,
					Email_Log::STATUS_SENT,
					Email_Log::STATUS_FAILED,
				),
				// phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
				'posts_per_page'         => 10000,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'             => array(
					array(
						'key'   => Email_Log::META_BATCH_ID,
						'value' => $batch_id,
					),
				),
			)
		);
	}

	/**
	 * Determines whether all posts in the batch completed delivery.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id     Batch identifier.
	 * @param int    $max_attempts Maximum delivery attempts allowed.
	 * @return bool True if the batch has no remaining pending posts.
	 */
	public function is_complete( $batch_id, $max_attempts = self::MAX_ATTEMPTS ) {
		return empty( $this->get_pending_ids( $batch_id, $max_attempts ) );
	}

	/**
	 * Increments the send attempt counter for a log post.
	 *
	 * @since 1.167.0
	 *
	 * @param int $post_id Log post ID.
	 * @return void Nothing returned.
	 */
	public function increment_attempt( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post || Email_Log::POST_TYPE !== $post->post_type ) {
			return;
		}

		$current_attempts = (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true );

		update_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, $current_attempts + 1 );
	}

	/**
	 * Updates the post status for a log post.
	 *
	 * @since 1.167.0
	 *
	 * @param int    $post_id Log post ID.
	 * @param string $status  New status slug.
	 * @return void Nothing returned.
	 */
	public function update_status( $post_id, $status ) {
		$post = get_post( $post_id );

		if ( ! $post || Email_Log::POST_TYPE !== $post->post_type ) {
			return;
		}

		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_status' => $status,
			)
		);
	}
}
