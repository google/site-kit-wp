<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class ContentPolicyStatus extends \Google\Model
{
  /**
   * Unspecified; should never be used.
   */
  public const CONTENT_POLICY_STATE_CONTENT_POLICY_STATE_UNSPECIFIED = 'CONTENT_POLICY_STATE_UNSPECIFIED';
  /**
   * No policy violations.
   */
  public const CONTENT_POLICY_STATE_CONTENT_POLICY_STATE_OK = 'CONTENT_POLICY_STATE_OK';
  /**
   * Violation(s) have been discovered at the publication level but are not yet
   * enforced.
   */
  public const CONTENT_POLICY_STATE_CONTENT_POLICY_VIOLATION_GRACE_PERIOD = 'CONTENT_POLICY_VIOLATION_GRACE_PERIOD';
  /**
   * Violation(s) have been discovered at the publication level and are under
   * active enforcement.
   */
  public const CONTENT_POLICY_STATE_CONTENT_POLICY_VIOLATION_ACTIVE = 'CONTENT_POLICY_VIOLATION_ACTIVE';
  /**
   * Violation(s) have been discovered at the organization level but are not yet
   * enforced.
   */
  public const CONTENT_POLICY_STATE_CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD = 'CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD';
  /**
   * Violation(s) have been discovered at the organization level and are under
   * active enforcement.
   */
  public const CONTENT_POLICY_STATE_CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE = 'CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE';
  /**
   * Violation(s) have been discovered at the organization level and are under
   * immediate active enforcement, i.e. without a grace period.
   */
  public const CONTENT_POLICY_STATE_CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE = 'CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE';
  /**
   * Output only. Represents whether or not the publication has any policy
   * violations pending or in active enforcement, and if so, the extent of the
   * violations.
   *
   * @var string
   */
  public $contentPolicyState;
  /**
   * If content_policy_state is not OK, a link that the publisher can follow to
   * see more details about the policy violation.
   *
   * @var string
   */
  public $policyInfoLink;

  /**
   * Output only. Represents whether or not the publication has any policy
   * violations pending or in active enforcement, and if so, the extent of the
   * violations.
   *
   * Accepted values: CONTENT_POLICY_STATE_UNSPECIFIED, CONTENT_POLICY_STATE_OK,
   * CONTENT_POLICY_VIOLATION_GRACE_PERIOD, CONTENT_POLICY_VIOLATION_ACTIVE,
   * CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
   * CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
   * CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
   *
   * @param self::CONTENT_POLICY_STATE_* $contentPolicyState
   */
  public function setContentPolicyState($contentPolicyState)
  {
    $this->contentPolicyState = $contentPolicyState;
  }
  /**
   * @return self::CONTENT_POLICY_STATE_*
   */
  public function getContentPolicyState()
  {
    return $this->contentPolicyState;
  }
  /**
   * If content_policy_state is not OK, a link that the publisher can follow to
   * see more details about the policy violation.
   *
   * @param string $policyInfoLink
   */
  public function setPolicyInfoLink($policyInfoLink)
  {
    $this->policyInfoLink = $policyInfoLink;
  }
  /**
   * @return string
   */
  public function getPolicyInfoLink()
  {
    return $this->policyInfoLink;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(ContentPolicyStatus::class, 'Google_Service_SubscribewithGoogle_ContentPolicyStatus');
