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

class GoogleAnalyticsAdminV1alphaConversionValues extends \Google\Collection
{
  protected $collection_key = 'eventMappings';
  /**
   * @var string
   */
  public $coarseValue;
  /**
   * @var string
   */
  public $displayName;
  protected $eventMappingsType = GoogleAnalyticsAdminV1alphaEventMapping::class;
  protected $eventMappingsDataType = 'array';
  /**
   * @var int
   */
  public $fineValue;
  /**
   * @var bool
   */
  public $lockEnabled;

  /**
   * @param string
   */
  public function setCoarseValue($coarseValue)
  {
    $this->coarseValue = $coarseValue;
  }
  /**
   * @return string
   */
  public function getCoarseValue()
  {
    return $this->coarseValue;
  }
  /**
   * @param string
   */
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  /**
   * @return string
   */
  public function getDisplayName()
  {
    return $this->displayName;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaEventMapping[]
   */
  public function setEventMappings($eventMappings)
  {
    $this->eventMappings = $eventMappings;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaEventMapping[]
   */
  public function getEventMappings()
  {
    return $this->eventMappings;
  }
  /**
   * @param int
   */
  public function setFineValue($fineValue)
  {
    $this->fineValue = $fineValue;
  }
  /**
   * @return int
   */
  public function getFineValue()
  {
    return $this->fineValue;
  }
  /**
   * @param bool
   */
  public function setLockEnabled($lockEnabled)
  {
    $this->lockEnabled = $lockEnabled;
  }
  /**
   * @return bool
   */
  public function getLockEnabled()
  {
    return $this->lockEnabled;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaConversionValues::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaConversionValues');
