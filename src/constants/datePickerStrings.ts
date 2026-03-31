// ============================================================
// constants/datePickerStrings.ts
// Single Dutch (nl-BE) DatePicker strings object.
// Previously duplicated in VerlengModal and TeRugActiefModal.
// ============================================================
import { IDatePickerStrings } from '@fluentui/react';

export const NL_DATEPICKER_STRINGS: IDatePickerStrings = {
  months: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
           'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
  shortMonths: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun',
                'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
  days: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
  shortDays: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
  goToToday: 'Vandaag',
  prevMonthAriaLabel: 'Vorige maand',
  nextMonthAriaLabel: 'Volgende maand',
  prevYearAriaLabel:  'Vorig jaar',
  nextYearAriaLabel:  'Volgend jaar',
};

/** Minimal strings used in AanmaakAfwezigheidModal (lower-case months). */
export const NL_DATEPICKER_STRINGS_COMPACT: IDatePickerStrings = {
  months: ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
           'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  shortMonths: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
                'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
  days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
  shortDays: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
  goToToday: 'Naar vandaag',
};
