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

namespace Google\Service\Webcontentpublisher;

class ContentPolicyStatus extends \Google\Model
{
  public const STATE_STATE_UNSPECIFIED = 'STATE_UNSPECIFIED';
  public const STATE_OK = 'OK';
  public const STATE_VIOLATION_GRACE_PERIOD = 'VIOLATION_GRACE_PERIOD';
  public const STATE_VIOLATION_ACTIVE = 'VIOLATION_ACTIVE';
  public const STATE_ORGANIZATION_VIOLATION_GRACE_PERIOD = 'ORGANIZATION_VIOLATION_GRACE_PERIOD';
  public const STATE_ORGANIZATION_VIOLATION_ACTIVE = 'ORGANIZATION_VIOLATION_ACTIVE';
  public const STATE_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE = 'ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE';

  /**
   * The current policy details URL.
   *
   * @var string
   */
  public $policyInfoUrl;
  /**
   * The current policy state.
   *
   * @var string
   */
  public $state;

  /**
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

class_alias(ContentPolicyStatus::class, 'Google_Service_Webcontentpublisher_ContentPolicyStatus');
