// Interface copy for <AddressForm>, Thai and English, from the design brief
// on issue #1. Placeholders: {pc} postal code, {n} a count, {k} the
// level label for the current kind, {p} provinces, {d} districts, {note} the
// dataset note, {s} the search text, {f} a field label, {addr} an address.

export type Locale = "th" | "en"

const th = {
  legendShip: "ที่อยู่จัดส่ง",
  legendTax: "ที่อยู่ใบกำกับภาษี",
  postal: "รหัสไปรษณีย์",
  postalPh: "เช่น 10200",
  postalDesc: "พิมพ์ 5 หลัก ระบบจะเติมที่อยู่ให้",
  province: "จังหวัด",
  provincePh: "เลือกจังหวัด",
  district: "อำเภอ/เขต",
  districtPh: "เลือกอำเภอ/เขต",
  amphoe: "อำเภอ",
  khet: "เขต",
  subdistrict: "ตำบล/แขวง",
  subdistrictPh: "เลือกตำบล/แขวง",
  tambon: "ตำบล",
  khwaeng: "แขวง",
  pick: "เลือก{k}",
  chooseProvinceFirst: "เลือกจังหวัดก่อน",
  chooseDistrictFirst: "เลือก{k}ก่อน",
  searchHere: "ค้นหา{k}…",
  autofilled: "เติมจากรหัสไปรษณีย์ {pc}",
  undo: "ล้าง",
  pickOne: "รหัส {pc} ใช้ได้ {n} {k} เลือก{k}ของคุณ",
  pickArea: "รหัส {pc} ใช้ได้ {n} พื้นที่ใน {p} จังหวัด เลือกพื้นที่ของคุณ",
  pickAreaOneProvince:
    "รหัส {pc} ใช้ได้ {n} พื้นที่ใน {d} อำเภอ เลือกพื้นที่ของคุณ",
  areaChoice: "พื้นที่ของรหัส {pc}",
  facilityTitle: "{pc} เป็นรหัสไปรษณีย์ของหน่วยงาน",
  facilityBody:
    "{note} ใช้กับที่อยู่ทั่วไปไม่ได้ ตรวจรหัสอีกครั้ง หรือเลือกพื้นที่ด้านล่าง",
  facilityBodyNoNote:
    "ใช้กับที่อยู่ทั่วไปไม่ได้ ตรวจรหัสอีกครั้ง หรือเลือกพื้นที่ด้านล่าง",
  facilityUse: "ใช้รหัสนี้ต่อ",
  notFoundTitle: "ไม่พบรหัสไปรษณีย์ {pc}",
  notFoundBody:
    "ตรวจตัวเลขอีกครั้ง หรือเลือกจังหวัด อำเภอ และตำบลด้านล่างได้เลย",
  postalFix: "{k}{s}ใช้รหัส {pc}",
  postalFixUse: "ใช้ {pc}",
  postalForArea: "รหัสไปรษณีย์ของพื้นที่นี้",
  postalChoice:
    "พื้นที่นี้มีรหัสไปรษณีย์ {n} รหัส เลือกรหัสที่ใช้กับที่อยู่ของคุณ",
  postalNone: "ไม่มีข้อมูลรหัสไปรษณีย์ของพื้นที่นี้",
  search: "ค้นหาที่อยู่",
  searchPh: "พิมพ์ตำบล อำเภอ จังหวัด หรือรหัสไปรษณีย์",
  searchDesc: "พิมพ์ไทยหรืออังกฤษก็ได้ ไม่ต้องพิมพ์ ต./อ./จ.",
  searchMore: "พิมพ์เพิ่มเพื่อให้ผลแคบลง",
  searchEmpty: "ไม่พบ “{s}”",
  searchEmptyBody:
    "ลองพิมพ์ชื่ออำเภอ ชื่อจังหวัด หรือรหัสไปรษณีย์ หรือกรอกเองด้านล่าง",
  fillManually: "กรอกเอง",
  noOptions: "ไม่พบรายการ",
  sameAs: "ใช้ที่อยู่เดียวกับที่อยู่จัดส่ง",
  sameAsDesc:
    "เลิกเลือกเพื่อกรอกที่อยู่ใบกำกับภาษีแยก ระบบจะคัดลอกที่อยู่จัดส่งมาให้แก้ต่อ",
  sameAsConfirm: "ใช้ที่อยู่จัดส่งแทนที่อยู่ที่แก้ไว้ใช่ไหม",
  sameAsEmpty: "ยังไม่ได้กรอกที่อยู่จัดส่ง",
  sameAsReplace: "ใช้ที่อยู่จัดส่ง",
  sameAsKeep: "เก็บที่แก้ไว้",
  loading: "กำลังโหลดข้อมูลที่อยู่…",
  errorTitle: "โหลดข้อมูลที่อยู่ไม่สำเร็จ",
  errorBody: "ตรวจการเชื่อมต่อแล้วลองอีกครั้ง ข้อมูลที่กรอกไว้ยังอยู่ครบ",
  retry: "ลองอีกครั้ง",
  errMismatch: "รหัสไปรษณีย์นี้ไม่ตรงกับตำบล/แขวงที่เลือก",
  errRequired: "กรุณาเลือก{f}",
  errRequiredPostal: "กรุณากรอกรหัสไปรษณีย์",
  errChecking: "กำลังตรวจรหัสไปรษณีย์ ลองส่งอีกครั้งในอีกครู่",
  showFacility: "แสดงรหัสไปรษณีย์ของหน่วยงาน",
  // Live-region announcements.
  liveFilled: "เติมที่อยู่แล้ว: {addr}",
  liveNarrowed: "รหัส {pc} ใช้ได้ {n} {k} ในเขต{d}",
  liveNarrowedAmphoe: "รหัส {pc} ใช้ได้ {n} {k} ในอำเภอ{d}",
  liveCleared: "ล้างที่อยู่แล้ว",
  liveClearedBelow: "ล้าง{f}แล้ว",
  livePostalSwitched: "เปลี่ยนรหัสไปรษณีย์เป็น {pc}",
  livePostalCleared: "ล้างรหัสไปรษณีย์ เพราะไม่ตรงกับพื้นที่ที่เลือก",
  liveResults: "พบ {n} รายการ",
}

export type CopyKey = keyof typeof th

const en: Record<CopyKey, string> = {
  legendShip: "Shipping address",
  legendTax: "Tax invoice address",
  postal: "Postal code",
  postalPh: "e.g. 10200",
  postalDesc: "Type 5 digits and we fill in the rest",
  province: "Province",
  provincePh: "Select province",
  district: "District",
  districtPh: "Select district",
  amphoe: "District",
  khet: "District (khet)",
  subdistrict: "Subdistrict",
  subdistrictPh: "Select subdistrict",
  tambon: "Subdistrict",
  khwaeng: "Subdistrict (khwaeng)",
  pick: "Select {k}",
  chooseProvinceFirst: "Select a province first",
  chooseDistrictFirst: "Select a district first",
  searchHere: "Search {k}…",
  autofilled: "Filled from postal code {pc}",
  undo: "Clear",
  pickOne: "{pc} covers {n} subdistricts. Pick yours.",
  pickArea: "{pc} covers {n} areas in {p} provinces. Pick yours.",
  pickAreaOneProvince: "{pc} covers {n} areas in {d} districts. Pick yours.",
  areaChoice: "Areas for {pc}",
  facilityTitle: "{pc} is a facility postal code",
  facilityBody:
    "{note}. It isn't used for ordinary addresses. Check the code, or pick the area below.",
  facilityBodyNoNote:
    "It isn't used for ordinary addresses. Check the code, or pick the area below.",
  facilityUse: "Use this code anyway",
  notFoundTitle: "No postal code {pc}",
  notFoundBody:
    "Check the digits, or pick the province, district and subdistrict below.",
  postalFix: "{s} uses {pc}",
  postalFixUse: "Use {pc}",
  postalForArea: "Postal code for this area",
  postalChoice:
    "This area has {n} postal codes. Pick the one for your address.",
  postalNone: "No postal code is known for this area",
  search: "Find your address",
  searchPh: "Type a subdistrict, district, province or postal code",
  searchDesc: "Thai or English. No need to type ต./อ./จ.",
  searchMore: "Keep typing to narrow the list",
  searchEmpty: "No match for “{s}”",
  searchEmptyBody:
    "Try a district, a province or a postal code, or fill the fields below yourself.",
  fillManually: "Fill in manually",
  noOptions: "No matches",
  sameAs: "Same as shipping address",
  sameAsDesc:
    "Untick to enter a separate tax invoice address. We copy the shipping address in for you to edit.",
  sameAsConfirm: "Replace your edits with the shipping address?",
  sameAsEmpty: "No shipping address yet",
  sameAsReplace: "Use the shipping address",
  sameAsKeep: "Keep my edits",
  loading: "Loading address data…",
  errorTitle: "Couldn't load address data",
  errorBody: "Check your connection and try again. What you entered is kept.",
  retry: "Try again",
  errMismatch: "This postal code doesn't serve the selected subdistrict",
  errRequired: "Select a {f}",
  errRequiredPostal: "Enter a postal code",
  errChecking: "Still checking the postal code. Submit again in a moment.",
  showFacility: "Show facility postal codes",
  liveFilled: "Address filled: {addr}",
  liveNarrowed: "{pc} covers {n} subdistricts in {d}",
  liveNarrowedAmphoe: "{pc} covers {n} subdistricts in {d}",
  liveCleared: "Address cleared",
  liveClearedBelow: "{f} cleared",
  livePostalSwitched: "Postal code changed to {pc}",
  livePostalCleared:
    "Postal code cleared because it doesn't serve the selected area",
  liveResults: "{n} results",
}

const tables: Record<Locale, Record<CopyKey, string>> = { th, en }

export type Translate = (
  key: CopyKey,
  vars?: Record<string, string | number>
) => string

// In English a level label sits mid-sentence ("Select district"), so {k}
// and {f} start lower case there; Thai has no case.
const midSentence = new Set(["k", "f"])

export function createTranslator(locale: Locale): Translate {
  const table = tables[locale]
  const fit = (name: string, v: string) =>
    locale === "en" && midSentence.has(name)
      ? v.charAt(0).toLowerCase() + v.slice(1)
      : v
  return (key, vars) =>
    table[key].replace(/\{(\w+)\}/g, (m, k: string) =>
      vars && k in vars ? fit(k, String(vars[k])) : m
    )
}
