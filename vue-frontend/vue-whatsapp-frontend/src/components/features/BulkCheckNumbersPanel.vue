<template>
  <div class="p-4 md:p-6 bg-white dark:bg-slate-800 shadow-lg rounded-lg feature-panel">
    <h2 class="text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
      Bulk Check WhatsApp Numbers
    </h2>

    <div class="space-y-6">
      <div class="mb-4">
        <label for="countryCodeSelect" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Default Country Code (for numbers without '+' or national prefix like '0')
        </label>
        <select id="countryCodeSelect" v-model="selectedCountryCode" class="form-select w-full md:w-1/2">
          <option v-for="country in countries" :key="country.code" :value="country.code">
            {{ country.name }} {{ country.code ? `(+${country.code})` : '' }}
          </option>
        </select>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Select a country if your numbers list uses local formats (e.g., starting with '0' or without any country code).
        </p>
      </div>
      <div>
        <label for="numbersToCheckBulk" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Numbers to Check (comma/newline separated)
        </label>
        <textarea
          id="numbersToCheckBulk"
          v-model="numbersInput"
          rows="8"
          class="form-textarea custom-scrollbar"
          placeholder="e.g., +14155552671, 08123456789 (select country)&#10;8123456789 (select country)"
          :disabled="isChecking"
        ></textarea>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter phone numbers separated by commas or newlines.</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          @click="performBulkCheck"
          :disabled="isChecking || !sessionStore.selectedSessionData?.isReady || !numbersInput.trim()"
          class="btn btn-teal w-full sm:w-auto flex-grow sm:flex-grow-0"
        >
          <span v-if="isChecking">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking...
          </span>
          <span v-else-if="resumeIndex > 0 && !isChecking">Resume Check (from #{{ resumeIndex + 1 }})</span>
          <span v-else>Start Number Check</span>
        </button>

        <button
          v-if="isChecking"
          @click="handleStopCheck"
          class="btn w-full sm:w-auto flex-grow sm:flex-grow-0 bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 text-white"
        >
          Stop Check
        </button>
      </div>
      <div class="mt-2">
        <p v-if="!sessionStore.selectedSessionData?.isReady && sessionStore.currentSelectedSessionId" class="text-sm text-orange-500 dark:text-orange-400">
          Selected session ({{ sessionStore.currentSelectedSessionId }}) is not ready.
        </p>
        <p v-else-if="!sessionStore.currentSelectedSessionId" class="text-sm text-orange-500 dark:text-orange-400">
          No session selected. Please select or initialize a session first.
        </p>
      </div>
    </div>
    <p v-if="overallStatus" class="mt-4 text-sm text-slate-600 dark:text-slate-300">{{ overallStatus }}</p>

    <div class="mt-6 flex flex-col md:flex-row gap-6">
      <div class="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 flex-1">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Registered Numbers ({{ bulkCheckStore.registeredNumbers.length }})
        </h3>
        <div class="max-h-60 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-slate-700 rounded-md p-3">
          <ul v-if="bulkCheckStore.registeredNumbers.length > 0" class="list-disc pl-5 space-y-1 text-sm text-gray-800 dark:text-gray-200">
            <li v-for="number in bulkCheckStore.registeredNumbers" :key="number">{{ number }}</li>
          </ul>
          <p v-else class="text-center py-2 text-gray-500 dark:text-gray-400">
            No registered numbers from the last bulk check.
          </p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 flex-1">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Unregistered / Error ({{ bulkCheckStore.unregisteredNumbers.length }})
        </h3>
        <div class="max-h-60 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-slate-700 rounded-md p-3">
          <ul v-if="bulkCheckStore.unregisteredNumbers.length > 0" class="list-disc pl-5 space-y-1 text-sm text-gray-800 dark:text-gray-200">
            <li v-for="item in bulkCheckStore.unregisteredNumbers" :key="item.number">
              {{ item.number }} (Reason: {{ item.reason || 'Unknown error' }})
            </li>
          </ul>
          <p v-else class="text-center py-2 text-gray-500 dark:text-gray-400">
            No unregistered numbers or errors from the last bulk check.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useBulkCheckStore } from '@/stores/bulkCheckStore';
import { checkWhatsAppNumberApi } from '@/services/api';

const sessionStore = useSessionStore();
const bulkCheckStore = useBulkCheckStore();

const numbersInput = ref('');
const isChecking = ref(false);
const overallStatus = ref('');
const stopRequested = ref(false);
const resumeIndex = ref(0);

const countries = ref([
  { name: 'No Default Country Code', code: '' },
  { name: 'Afghanistan (AF)', code: '93' },
  { name: 'Albania (AL)', code: '355' },
  { name: 'Algeria (DZ)', code: '213' },
  { name: 'American Samoa (AS)', code: '1684' },
  { name: 'Andorra (AD)', code: '376' },
  { name: 'Angola (AO)', code: '244' },
  { name: 'Anguilla (AI)', code: '1264' },
  { name: 'Antarctica (AQ)', code: '672' },
  { name: 'Antigua and Barbuda (AG)', code: '1268' },
  { name: 'Argentina (AR)', code: '54' },
  { name: 'Armenia (AM)', code: '374' },
  { name: 'Aruba (AW)', code: '297' },
  { name: 'Australia (AU)', code: '61' },
  { name: 'Austria (AT)', code: '43' },
  { name: 'Azerbaijan (AZ)', code: '994' },
  { name: 'Bahamas (BS)', code: '1242' },
  { name: 'Bahrain (BH)', code: '973' },
  { name: 'Bangladesh (BD)', code: '880' },
  { name: 'Barbados (BB)', code: '1246' },
  { name: 'Belarus (BY)', code: '375' },
  { name: 'Belgium (BE)', code: '32' },
  { name: 'Belize (BZ)', code: '501' },
  { name: 'Benin (BJ)', code: '229' },
  { name: 'Bermuda (BM)', code: '1441' },
  { name: 'Bhutan (BT)', code: '975' },
  { name: 'Bolivia (BO)', code: '591' },
  { name: 'Bosnia and Herzegovina (BA)', code: '387' },
  { name: 'Botswana (BW)', code: '267' },
  { name: 'Brazil (BR)', code: '55' },
  { name: 'British Indian Ocean Territory (IO)', code: '246' },
  { name: 'British Virgin Islands (VG)', code: '1284' },
  { name: 'Brunei (BN)', code: '673' },
  { name: 'Bulgaria (BG)', code: '359' },
  { name: 'Burkina Faso (BF)', code: '226' },
  { name: 'Burundi (BI)', code: '257' },
  { name: 'Cambodia (KH)', code: '855' },
  { name: 'Cameroon (CM)', code: '237' },
  { name: 'Canada (CA)', code: '1' },
  { name: 'Cape Verde (CV)', code: '238' },
  { name: 'Cayman Islands (KY)', code: '1345' },
  { name: 'Central African Republic (CF)', code: '236' },
  { name: 'Chad (TD)', code: '235' },
  { name: 'Chile (CL)', code: '56' },
  { name: 'China (CN)', code: '86' },
  { name: 'Christmas Island (CX)', code: '61' },
  { name: 'Cocos Islands (CC)', code: '61' },
  { name: 'Colombia (CO)', code: '57' },
  { name: 'Comoros (KM)', code: '269' },
  { name: 'Cook Islands (CK)', code: '682' },
  { name: 'Costa Rica (CR)', code: '506' },
  { name: 'Croatia (HR)', code: '385' },
  { name: 'Cuba (CU)', code: '53' },
  { name: 'Curacao (CW)', code: '599' },
  { name: 'Cyprus (CY)', code: '357' },
  { name: 'Czech Republic (CZ)', code: '420' },
  { name: 'Democratic Republic of the Congo (CD)', code: '243' },
  { name: 'Denmark (DK)', code: '45' },
  { name: 'Djibouti (DJ)', code: '253' },
  { name: 'Dominica (DM)', code: '1767' },
  { name: 'Dominican Republic (DO)', code: '1809' }, // Note: DR has multiple 1809, 1829, 1849. Using primary.
  { name: 'East Timor (TL)', code: '670' },
  { name: 'Ecuador (EC)', code: '593' },
  { name: 'Egypt (EG)', code: '20' },
  { name: 'El Salvador (SV)', code: '503' },
  { name: 'Equatorial Guinea (GQ)', code: '240' },
  { name: 'Eritrea (ER)', code: '291' },
  { name: 'Estonia (EE)', code: '372' },
  { name: 'Ethiopia (ET)', code: '251' },
  { name: 'Falkland Islands (FK)', code: '500' },
  { name: 'Faroe Islands (FO)', code: '298' },
  { name: 'Fiji (FJ)', code: '679' },
  { name: 'Finland (FI)', code: '358' },
  { name: 'France (FR)', code: '33' },
  { name: 'French Polynesia (PF)', code: '689' },
  { name: 'Gabon (GA)', code: '241' },
  { name: 'Gambia (GM)', code: '220' },
  { name: 'Georgia (GE)', code: '995' },
  { name: 'Germany (DE)', code: '49' },
  { name: 'Ghana (GH)', code: '233' },
  { name: 'Gibraltar (GI)', code: '350' },
  { name: 'Greece (GR)', code: '30' },
  { name: 'Greenland (GL)', code: '299' },
  { name: 'Grenada (GD)', code: '1473' },
  { name: 'Guam (GU)', code: '1671' },
  { name: 'Guatemala (GT)', code: '502' },
  { name: 'Guernsey (GG)', code: '44' }, // Uses UK's +44, often followed by specific area codes
  { name: 'Guinea (GN)', code: '224' },
  { name: 'Guinea-Bissau (GW)', code: '245' },
  { name: 'Guyana (GY)', code: '592' },
  { name: 'Haiti (HT)', code: '509' },
  { name: 'Honduras (HN)', code: '504' },
  { name: 'Hong Kong (HK)', code: '852' },
  { name: 'Hungary (HU)', code: '36' },
  { name: 'Iceland (IS)', code: '354' },
  { name: 'India (IN)', code: '91' },
  { name: 'Indonesia (ID)', code: '62' },
  { name: 'Iran (IR)', code: '98' },
  { name: 'Iraq (IQ)', code: '964' },
  { name: 'Ireland (IE)', code: '353' },
  { name: 'Isle of Man (IM)', code: '44' }, // Uses UK's +44
  { name: 'Israel (IL)', code: '972' },
  { name: 'Italy (IT)', code: '39' },
  { name: 'Ivory Coast (CI)', code: '225' },
  { name: 'Jamaica (JM)', code: '1876' },
  { name: 'Japan (JP)', code: '81' },
  { name: 'Jersey (JE)', code: '44' }, // Uses UK's +44
  { name: 'Jordan (JO)', code: '962' },
  { name: 'Kazakhstan (KZ)', code: '7' },
  { name: 'Kenya (KE)', code: '254' },
  { name: 'Kiribati (KI)', code: '686' },
  { name: 'Kosovo (XK)', code: '383' },
  { name: 'Kuwait (KW)', code: '965' },
  { name: 'Kyrgyzstan (KG)', code: '996' },
  { name: 'Laos (LA)', code: '856' },
  { name: 'Latvia (LV)', code: '371' },
  { name: 'Lebanon (LB)', code: '961' },
  { name: 'Lesotho (LS)', code: '266' },
  { name: 'Liberia (LR)', code: '231' },
  { name: 'Libya (LY)', code: '218' },
  { name: 'Liechtenstein (LI)', code: '423' },
  { name: 'Lithuania (LT)', code: '370' },
  { name: 'Luxembourg (LU)', code: '352' },
  { name: 'Macau (MO)', code: '853' },
  { name: 'Madagascar (MG)', code: '261' },
  { name: 'Malawi (MW)', code: '265' },
  { name: 'Malaysia (MY)', code: '60' },
  { name: 'Maldives (MV)', code: '960' },
  { name: 'Mali (ML)', code: '223' },
  { name: 'Malta (MT)', code: '356' },
  { name: 'Marshall Islands (MH)', code: '692' },
  { name: 'Mauritania (MR)', code: '222' },
  { name: 'Mauritius (MU)', code: '230' },
  { name: 'Mayotte (YT)', code: '262' },
  { name: 'Mexico (MX)', code: '52' },
  { name: 'Micronesia (FM)', code: '691' },
  { name: 'Moldova (MD)', code: '373' },
  { name: 'Monaco (MC)', code: '377' },
  { name: 'Mongolia (MN)', code: '976' },
  { name: 'Montenegro (ME)', code: '382' },
  { name: 'Montserrat (MS)', code: '1664' },
  { name: 'Morocco (MA)', code: '212' },
  { name: 'Mozambique (MZ)', code: '258' },
  { name: 'Myanmar (MM)', code: '95' },
  { name: 'Namibia (NA)', code: '264' },
  { name: 'Nauru (NR)', code: '674' },
  { name: 'Nepal (NP)', code: '977' },
  { name: 'Netherlands (NL)', code: '31' },
  { name: 'New Caledonia (NC)', code: '687' },
  { name: 'New Zealand (NZ)', code: '64' },
  { name: 'Nicaragua (NI)', code: '505' },
  { name: 'Niger (NE)', code: '227' },
  { name: 'Nigeria (NG)', code: '234' },
  { name: 'Niue (NU)', code: '683' },
  { name: 'North Korea (KP)', code: '850' },
  { name: 'North Macedonia (MK)', code: '389' },
  { name: 'Northern Mariana Islands (MP)', code: '1670' },
  { name: 'Norway (NO)', code: '47' },
  { name: 'Oman (OM)', code: '968' },
  { name: 'Pakistan (PK)', code: '92' },
  { name: 'Palau (PW)', code: '680' },
  { name: 'Palestine (PS)', code: '970' },
  { name: 'Panama (PA)', code: '507' },
  { name: 'Papua New Guinea (PG)', code: '675' },
  { name: 'Paraguay (PY)', code: '595' },
  { name: 'Peru (PE)', code: '51' },
  { name: 'Philippines (PH)', code: '63' },
  { name: 'Poland (PL)', code: '48' },
  { name: 'Portugal (PT)', code: '351' },
  { name: 'Puerto Rico (PR)', code: '1787' }, // and 1939
  { name: 'Qatar (QA)', code: '974' },
  { name: 'Republic of the Congo (CG)', code: '242' },
  { name: 'Reunion (RE)', code: '262' },
  { name: 'Romania (RO)', code: '40' },
  { name: 'Russia (RU)', code: '7' },
  { name: 'Rwanda (RW)', code: '250' },
  { name: 'Saint Barthelemy (BL)', code: '590' },
  { name: 'Saint Helena (SH)', code: '290' },
  { name: 'Saint Kitts and Nevis (KN)', code: '1869' },
  { name: 'Saint Lucia (LC)', code: '1758' },
  { name: 'Saint Martin (MF)', code: '590' },
  { name: 'Saint Pierre and Miquelon (PM)', code: '508' },
  { name: 'Saint Vincent and the Grenadines (VC)', code: '1784' },
  { name: 'Samoa (WS)', code: '685' },
  { name: 'San Marino (SM)', code: '378' },
  { name: 'Sao Tome and Principe (ST)', code: '239' },
  { name: 'Saudi Arabia (SA)', code: '966' },
  { name: 'Senegal (SN)', code: '221' },
  { name: 'Serbia (RS)', code: '381' },
  { name: 'Seychelles (SC)', code: '248' },
  { name: 'Sierra Leone (SL)', code: '232' },
  { name: 'Singapore (SG)', code: '65' },
  { name: 'Sint Maarten (SX)', code: '1721' },
  { name: 'Slovakia (SK)', code: '421' },
  { name: 'Slovenia (SI)', code: '386' },
  { name: 'Solomon Islands (SB)', code: '677' },
  { name: 'Somalia (SO)', code: '252' },
  { name: 'South Africa (ZA)', code: '27' },
  { name: 'South Korea (KR)', code: '82' },
  { name: 'South Sudan (SS)', code: '211' },
  { name: 'Spain (ES)', code: '34' },
  { name: 'Sri Lanka (LK)', code: '94' },
  { name: 'Sudan (SD)', code: '249' },
  { name: 'Suriname (SR)', code: '597' },
  { name: 'Svalbard and Jan Mayen (SJ)', code: '47' },
  { name: 'Sweden (SE)', code: '46' },
  { name: 'Switzerland (CH)', code: '41' },
  { name: 'Syria (SY)', code: '963' },
  { name: 'Taiwan (TW)', code: '886' },
  { name: 'Tajikistan (TJ)', code: '992' },
  { name: 'Tanzania (TZ)', code: '255' },
  { name: 'Thailand (TH)', code: '66' },
  { name: 'Togo (TG)', code: '228' },
  { name: 'Tokelau (TK)', code: '690' },
  { name: 'Tonga (TO)', code: '676' },
  { name: 'Trinidad and Tobago (TT)', code: '1868' },
  { name: 'Tunisia (TN)', code: '216' },
  { name: 'Turkey (TR)', code: '90' },
  { name: 'Turkmenistan (TM)', code: '993' },
  { name: 'Turks and Caicos Islands (TC)', code: '1649' },
  { name: 'Tuvalu (TV)', code: '688' },
  { name: 'U.S. Virgin Islands (VI)', code: '1340' },
  { name: 'Uganda (UG)', code: '256' },
  { name: 'Ukraine (UA)', code: '380' },
  { name: 'United Arab Emirates (AE)', code: '971' },
  { name: 'United Kingdom (GB)', code: '44' },
  { name: 'United States (US)', code: '1' },
  { name: 'Uruguay (UY)', code: '598' },
  { name: 'Uzbekistan (UZ)', code: '998' },
  { name: 'Vanuatu (VU)', code: '678' },
  { name: 'Vatican City (VA)', code: '379' }, // or 3906 for Vatican City
  { name: 'Venezuela (VE)', code: '58' },
  { name: 'Vietnam (VN)', code: '84' },
  { name: 'Wallis and Futuna (WF)', code: '681' },
  { name: 'Western Sahara (EH)', code: '212' },
  { name: 'Yemen (YE)', code: '967' },
  { name: 'Zambia (ZM)', code: '260' },
  { name: 'Zimbabwe (ZW)', code: '263' }
]);
const selectedCountryCode = ref('');

const parseNumbers = (input) => {
  if (!input) return [];
  return input
    .split(/[,;\n]+/)
    .map(num => num.trim())
    .filter(num => num.length > 0);
};

watch(numbersInput, (newVal, oldVal) => {
  if (newVal.trim() !== oldVal.trim() && !isChecking.value) {
    resumeIndex.value = 0;
    overallStatus.value = 'Number list changed. Any new check will start from the beginning.';
    bulkCheckStore.clearBulkCheckResults();
    console.log('Numbers input changed, resumeIndex reset.');
  }
});

const handleStopCheck = () => {
  stopRequested.value = true;
  overallStatus.value = 'Stop signal received. Finishing current number and pausing...';
};

const performBulkCheck = async () => {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) {
    overallStatus.value = 'Session not selected or not ready for checking numbers.';
    return;
  }
  const allParsedNumbers = parseNumbers(numbersInput.value);
  if (allParsedNumbers.length === 0) {
    overallStatus.value = 'No valid numbers to check.';
    resumeIndex.value = 0;
    bulkCheckStore.clearBulkCheckResults();
    return;
  }

  isChecking.value = true;
  stopRequested.value = false;

  if (resumeIndex.value === 0) {
    bulkCheckStore.startNewBulkCheck();
    overallStatus.value = `Starting new check for ${allParsedNumbers.length} numbers...`;
  } else {
    overallStatus.value = `Resuming check from number ${resumeIndex.value + 1} of ${allParsedNumbers.length}...`;
  }
  
  for (let i = resumeIndex.value; i < allParsedNumbers.length; i++) {
    const number = allParsedNumbers[i];

    if (stopRequested.value) {
      overallStatus.value = `Check paused. Processed ${bulkCheckStore.registeredNumbers.length + bulkCheckStore.unregisteredNumbers.length} of ${allParsedNumbers.length}. Ready to resume from number ${i + 1}.`;
      resumeIndex.value = i;
      break;
    }

    if (!sessionStore.currentSelectedSessionId) {
      overallStatus.value = 'Session changed or removed during checks. Aborting.';
      resumeIndex.value = i;
      break;
    }

    let currentStatusUpdate = `Checking ${i + 1}/${allParsedNumbers.length}: ${number}...`;
    overallStatus.value = currentStatusUpdate;

    try {
      const response = await checkWhatsAppNumberApi(
        sessionStore.currentSelectedSessionId,
        number,
        selectedCountryCode.value
      );
      
      const displayNum = response.numId ? response.numId.replace('@c.us', '') : number;

      if (stopRequested.value && i < allParsedNumbers.length -1 ) {    
        resumeIndex.value = i;    
      } else if (stopRequested.value && i === allParsedNumbers.length -1) {    
        resumeIndex.value = 0;    
        overallStatus.value = `Check stopped after processing all numbers. Processed ${bulkCheckStore.registeredNumbers.length + bulkCheckStore.unregisteredNumbers.length} of ${allParsedNumbers.length}.`;
      } else {    
        if (response.success && response.isRegistered) {
          bulkCheckStore.addRegisteredNumber(displayNum);    
          overallStatus.value = `${currentStatusUpdate} Registered (${displayNum}).`;
        } else if (response.success && !response.isRegistered) {
          bulkCheckStore.addUnregisteredNumber({ number: displayNum, reason: 'Not registered' });
          overallStatus.value = `${currentStatusUpdate} Not Registered (${displayNum}).`;
        } else {
          bulkCheckStore.addUnregisteredNumber({ number, reason: response.error || 'Failed to check (API error)' });
          overallStatus.value = `${currentStatusUpdate} Error: ${response.error || 'API Error'}.`;
        }
      }
    } catch (error) {
        if (!stopRequested.value) {
          bulkCheckStore.addUnregisteredNumber({ number, reason: error.message || 'Network error' });
          overallStatus.value = `${currentStatusUpdate} Error: ${error.message || 'Network Error'}.`;
        } else {
          resumeIndex.value = i;
        }
    }
  }    

  isChecking.value = false;
    
  if (!stopRequested.value) {
    overallStatus.value = `Bulk check complete. Processed ${allParsedNumbers.length} numbers.`;
    resumeIndex.value = 0;
  }
    
  bulkCheckStore.setBulkCheckComplete();
};

onMounted(() => {
  bulkCheckStore.setIsCheckingActive(true);
});

onUnmounted(() => {
  bulkCheckStore.setIsCheckingActive(false);
  if (isChecking.value) {
    stopRequested.value = true;
  }
});

</script>

<style scoped>
/* Add any specific styles for this panel if needed */
.feature-panel {
  /* You might want to ensure it can accommodate the new dropdown gracefully */
}
</style>
