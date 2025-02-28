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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaEventMapping extends \Google\Model
{
  /**
   * @var string
   */
  public $eventName;
  /**
   * @var string
   */
  public $maxEventCount;
  public $maxEventValue;
  /**
   * @var string
   */
  public $minEventCount;
  public $minEventValue;

  /**
   * @param string
   */
  public function setEventName($eventName)
  {
    $this->eventName = $eventName;
  }
  /**
   * @return string
   */
  public function getEventName()
  {
    return $this->eventName;
  }
  /**
   * @param string
   */
  public function setMaxEventCount($maxEventCount)
  {
    $this->maxEventCount = $maxEventCount;
  }
  /**
   * @return string
   */
  public function getMaxEventCount()
  {
    return $this->maxEventCount;
  }
  public function setMaxEventValue($maxEventValue)
  {
    $this->maxEventValue = $maxEventValue;
  }
  public function getMaxEventValue()
  {
    return $this->maxEventValue;
  }
  /**
   * @param string
   */
  public function setMinEventCount($minEventCount)
  {
    $this->minEventCount = $minEventCount;
  }
  /**
   * @return string
   */
  public function getMinEventCount()
  {
    return $this->minEventCount;
  }
  public function setMinEventValue($minEventValue)
  {
    $this->minEventValue = $minEventValue;
  }
  public function getMinEventValue()
  {
    return $this->minEventValue;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaEventMapping::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaEventMapping');
