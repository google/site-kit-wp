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

namespace Google\Service\WebContentPublisher;

class ContentPolicyStatus extends \Google\Model
{
  /**
   * State is unspecified.
   */
  public const STATE_STATE_UNSPECIFIED = 'STATE_UNSPECIFIED';
  /**
   * Content policy is in a good state; no violations.
   */
  public const STATE_OK = 'OK';
  /**
   * The publication has a content policy violation but is within a grace
   * period.
   */
  public const STATE_VIOLATION_GRACE_PERIOD = 'VIOLATION_GRACE_PERIOD';
  /**
   * The publication has an active content policy violation.
   */
  public const STATE_VIOLATION_ACTIVE = 'VIOLATION_ACTIVE';
  /**
   * The organization has a content policy violation but is within a grace
   * period.
   */
  public const STATE_ORGANIZATION_VIOLATION_GRACE_PERIOD = 'ORGANIZATION_VIOLATION_GRACE_PERIOD';
  /**
   * The organization has an active content policy violation.
   */
  public const STATE_ORGANIZATION_VIOLATION_ACTIVE = 'ORGANIZATION_VIOLATION_ACTIVE';
  /**
   * The organization has an active content policy violation requiring immediate
   * action.
   */
  public const STATE_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE = 'ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE';
  /**
   * Output only. URL pointing to more details about the policy violation or
   * status.
   *
   * @var string
   */
  public $policyInfoUrl;
  /**
   * Output only. The current policy state.
   *
   * @var string
   */
  public $state;

  /**
   * Output only. URL pointing to more details about the policy violation or
   * status.
   *
   * @param string $policyInfoUrl
   */
  public function setPolicyInfoUrl($policyInfoUrl)
  {
    $this->policyInfoUrl = $policyInfoUrl;
  }
  /**
   * @return string
   */
  public function getPolicyInfoUrl()
  {
    return $this->policyInfoUrl;
  }
  /**
   * Output only. The current policy state.
   *
   * Accepted values: STATE_UNSPECIFIED, OK, VIOLATION_GRACE_PERIOD,
   * VIOLATION_ACTIVE, ORGANIZATION_VIOLATION_GRACE_PERIOD,
   * ORGANIZATION_VIOLATION_ACTIVE, ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
   *
   * @param self::STATE_* $state
   */
  public function setState($state)
  {
    $this->state = $state;
  }
  /**
   * @return self::STATE_*
   */
  public function getState()
  {
    return $this->state;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(ContentPolicyStatus::class, 'Google_Service_WebContentPublisher_ContentPolicyStatus');
